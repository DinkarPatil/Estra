"""Area-wise intelligence ingestion worker.

Scheduled (cron) job that scrapes per-area signals and upserts one row per
micro-market into the `micro_markets` table. Runs offline — user requests
never touch this code, they read the DB this populates.

Concurrency model:
    - Async I/O across areas and sources via asyncio.gather.
    - HostLimiter vends per-host asyncio.Semaphore instances; each scraper
      declares its own host and gets its own budget.
    - DB writes happen in a sync phase after all scraping completes, so
      SQLAlchemy's sync session doesn't interleave with the event loop.
"""

from __future__ import annotations

import asyncio
from typing import Any

from sqlalchemy.orm import Session

from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.features.area_intelligence import service as area_service
from app.features.area_intelligence.ingestion.derivations import (
    demand as demand_derivation,
    developer_concentration as developer_concentration_derivation,
    geo_signals,
    imputation,
    legal_signals,
    news_summary,
    price_metrics,
    price_trend,
    projections,
    risk as risk_derivation,
    roi as roi_derivation,
    roi_composite,
)
from app.features.area_intelligence.ingestion.scrapers import (
    maharera as maharera_scraper,
    news as news_scraper,
    osm_local,
    risk_local,
)
from app.features.area_intelligence.ingestion.scrapers._http import (
    HostLimiter,
    new_client,
)
from app.features.area_intelligence.ingestion.targets import (
    TargetArea,
    load_target_areas,
)
from app.features.area_intelligence.schemas import MicroMarketCreate
from app.features.property_intelligence.models import PropertyListing

log = get_logger("workers.ingestion")

# Load risk lookup tables once at module import. They're small (~60 rows
# total across three CSVs) and referenced per-area in the inner loop.
_risk_seismic = risk_local.load_seismic()
_risk_crime = risk_local.load_crime()
_risk_flood = risk_local.load_flood()


def _load_99acres_trends() -> dict[str, dict[str, Any]]:
    """Load the latest 99acres trends JSON into a lookup by area name.

    Returns {area_name: {trend_3yr, trend_1yr, latest_psf, data_points, ...}}
    """
    import json
    from pathlib import Path

    trends_dir = Path(__file__).resolve().parents[2] / "data" / "exports" / "99acres"
    # Find the latest trends file
    trend_files = sorted(trends_dir.glob("trends_*.json"), reverse=True)
    if not trend_files:
        log.warning("no 99acres trends files found in %s", trends_dir)
        return {}

    path = trend_files[0]
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        log.error("failed to load 99acres trends from %s: %s", path, exc)
        return {}

    lookup: dict[str, dict[str, Any]] = {}
    for t in raw:
        name = t.get("area_name") or t.get("locality", "")
        if name:
            lookup[name] = t
    log.info("loaded 99acres trends for %d areas from %s", len(lookup), path.name)
    return lookup


_99acres_trends = _load_99acres_trends()


def _quarterly_volatility(data_points: list[dict]) -> float | None:
    """Compute annualised volatility from quarterly psf data points.

    Uses std dev of quarter-over-quarter % returns, then annualises
    by multiplying by sqrt(4) (4 quarters per year).
    """
    import math
    import statistics

    psfs = [dp["psf"] for dp in data_points if dp.get("psf") is not None]
    if len(psfs) < 4:
        return None

    returns = []
    for i in range(1, len(psfs)):
        if psfs[i - 1] > 0:
            returns.append((psfs[i] - psfs[i - 1]) / psfs[i - 1])

    if len(returns) < 3:
        return None

    # Annualised volatility = quarterly std * sqrt(4)
    return round(statistics.stdev(returns) * math.sqrt(4), 4)


def _load_listings(db: Session) -> list[PropertyListing]:
    """Pull the full property_listings table into memory once per run.

    At 27K rows / ~300 bytes each that's ~8 MB — trivial. Saves 18 per-area
    DB round-trips and lets the pure derivation functions work over plain
    lists.
    """
    return db.query(PropertyListing).all()


def _compute_price_roi_demand(
    listings: list[PropertyListing],
    targets: list[TargetArea],
) -> dict[str, dict[str, Any]]:
    """Return per-area metrics keyed by area name.

    KNN imputation is restricted to same-city neighbours: a Mumbai area
    with no direct data must not be imputed from Pune prices. City-wide
    baselines are computed per-city, so Mumbai falls back to the Mumbai
    median and Pune to the Pune median independently.
    """
    area_to_city = {t.name: t.city for t in targets}
    coords = {
        t.name: (t.lat, t.lon)
        for t in targets
        if t.lat is not None and t.lon is not None
    }

    # First pass: direct metrics.
    direct_sale_psf: dict[str, float] = {}
    direct_rent_psf: dict[str, float] = {}
    direct_cv: dict[str, float] = {}
    sample_sizes: dict[str, dict[str, int]] = {}

    for t in targets:
        sale = price_metrics.compute_sale_metrics(listings, t.name)
        rent = price_metrics.compute_rent_metrics(listings, t.name)
        sample_sizes[t.name] = {"sale": sale.sample_size, "rent": rent.sample_size}
        if sale.median_psf is not None:
            direct_sale_psf[t.name] = sale.median_psf
        if rent.median_psf is not None:
            direct_rent_psf[t.name] = rent.median_psf
        if sale.volatility_cv is not None:
            direct_cv[t.name] = sale.volatility_cv

    # Per-city baselines so imputation stays city-scoped.
    cities = {t.city for t in targets}
    city_sale_baselines = {
        c: price_metrics.city_median_sale_psf(listings, c) for c in cities
    }
    city_rent_baselines = {
        c: price_metrics.city_median_rent_psf(listings, c) for c in cities
    }

    # First pass: compute direct historical trend (needs OLD + NEW both present).
    direct_trend_pct: dict[str, float] = {}
    trend_audit: dict[str, price_trend.HistoricalTrend] = {}
    for t in targets:
        trend = price_trend.compute(listings, t.name)
        trend_audit[t.name] = trend
        if trend.cagr_pct is not None:
            direct_trend_pct[t.name] = trend.cagr_pct

    # Overlay with 99acres real trend data where available.
    # 99acres trend_3yr is computed from 52 quarterly data points (2014-2026)
    # — far more reliable than the Kaggle 2-point CAGR.
    _99acres_volatility: dict[str, float] = {}
    for t in targets:
        acres = _99acres_trends.get(t.name)
        if acres and acres.get("trend_3yr") is not None:
            direct_trend_pct[t.name] = acres["trend_3yr"]
            trend_audit[t.name] = price_trend.HistoricalTrend(
                cagr_pct=acres["trend_3yr"],
                old_median_psf=None,
                new_median_psf=acres.get("latest_psf"),
                old_vintage_year=None,
                new_vintage_year=2026,
                old_sample_size=0,
                new_sample_size=0,
                window_years=3,
                provisional=False,
                methodology_note=(
                    "Source: 99acres SSR quarterly trend (2014-2026). "
                    "52 data points, 3yr rolling CAGR."
                ),
            )
        # Volatility from quarterly data points
        if acres and acres.get("data_points"):
            vol = _quarterly_volatility(acres["data_points"])
            if vol is not None:
                _99acres_volatility[t.name] = vol

    out: dict[str, dict[str, Any]] = {}
    for t in targets:
        same_city_sale = {
            k: v for k, v in direct_sale_psf.items()
            if area_to_city.get(k) == t.city
        }
        same_city_rent = {
            k: v for k, v in direct_rent_psf.items()
            if area_to_city.get(k) == t.city
        }
        same_city_cv = {
            k: v for k, v in direct_cv.items()
            if area_to_city.get(k) == t.city
        }
        same_city_trend = {
            k: v for k, v in direct_trend_pct.items()
            if area_to_city.get(k) == t.city
        }

        sale_imp = imputation.knn_weighted_mean(
            same_city_sale, t.name, coords,
            city_baseline=city_sale_baselines.get(t.city),
        )
        rent_imp = imputation.knn_weighted_mean(
            same_city_rent, t.name, coords,
            city_baseline=city_rent_baselines.get(t.city),
        )
        cv_imp = imputation.knn_weighted_mean(
            same_city_cv, t.name, coords, city_baseline=None
        )
        # Trend imputation: only same-city neighbours. If no neighbour in the
        # city has a direct trend, leave None (honest) rather than pick a
        # Pune baseline for Mumbai etc.
        trend_imp = imputation.knn_weighted_mean(
            same_city_trend, t.name, coords, city_baseline=None
        )

        median_sale = sale_imp.value
        median_rent = rent_imp.value
        cv = cv_imp.value
        # Overlay with 99acres quarterly volatility (more reliable than Kaggle CV).
        if t.name in _99acres_volatility:
            cv = _99acres_volatility[t.name]
        yield_pct = roi_derivation.rental_yield_pct(median_sale, median_rent)
        demand = demand_derivation.rental_demand_strength(
            sample_sizes[t.name]["sale"], sample_sizes[t.name]["rent"]
        )
        trend_pct = trend_imp.value
        uplift = projections.projected_uplift_pct(trend_pct, cv)
        downside = projections.projected_downside_pct(trend_pct, cv)

        ta = trend_audit[t.name]
        out[t.name] = {
            "median_sale_psf": round(median_sale, 2) if median_sale else None,
            "median_rent_psf": round(median_rent, 2) if median_rent else None,
            "volatility_index": round(cv, 4) if cv else None,
            "roi_trend_pct": yield_pct,
            "rental_demand_strength": demand,
            "historical_price_trend_pct": trend_pct,
            "projected_uplift_pct": uplift,
            "projected_downside_pct": downside,
            "sample_sizes": sample_sizes[t.name],
            "trend_audit": {
                "old_median_psf": ta.old_median_psf,
                "new_median_psf": ta.new_median_psf,
                "old_vintage_year": ta.old_vintage_year,
                "new_vintage_year": ta.new_vintage_year,
                "old_sample_size": ta.old_sample_size,
                "new_sample_size": ta.new_sample_size,
                "window_years": ta.window_years,
                "provisional": ta.provisional,
                "methodology_note": ta.methodology_note,
            },
            "sources": {
                "median_sale_psf": sale_imp.source,
                "median_rent_psf": rent_imp.source,
                "volatility_index": cv_imp.source,
                "historical_price_trend_pct": trend_imp.source,
            },
            "neighbors": {
                "median_sale_psf": sale_imp.neighbors_used,
                "median_rent_psf": rent_imp.neighbors_used,
                "volatility_index": cv_imp.neighbors_used,
                "historical_price_trend_pct": trend_imp.neighbors_used,
            },
        }
    return out


async def _scrape_area(
    client,
    limiter: HostLimiter,
    target: TargetArea,
    *,
    complaints: list,
    suspended: list,
    price_metrics_by_area: dict[str, dict[str, Any]],
    listings: list,
) -> dict[str, Any]:
    log.info("scraping %s, %s", target.name, target.city)

    news_items = await news_scraper.fetch_news(
        client, limiter, target.name, target.city
    )

    # OSM signals are local (PBF-backed, offline, instant). Seed-provided
    # coords are required — geocoding fallback isn't needed anymore.
    if target.lat is not None and target.lon is not None:
        osm_elements = osm_local.fetch_osm_signals(
            target.lat, target.lon, radius_m=osm_local.PROXIMITY_RADIUS_M
        )
        livability = geo_signals.livability_indicators(
            target.lat, target.lon, osm_elements
        )
        proximity = geo_signals.infrastructure_proximity(
            target.lat, target.lon, osm_elements
        )
        comm_density = geo_signals.commercial_density(
            target.lat, target.lon, osm_elements
        )
    else:
        log.warning("no coords for %s; skipping OSM signals", target.name)
        osm_elements = []
        livability = None
        proximity = None
        comm_density = None

    pm = price_metrics_by_area.get(target.name, {})

    # Buy-side ROI composite (replaces rental yield for product layer).
    roi_pct = roi_composite.compute_roi_composite(
        historical_trend_pct=pm.get("historical_price_trend_pct"),
        proximity=proximity,
        commercial_density=comm_density,
        news_items=news_items,
    )

    return {
        "name": target.name,
        "city": target.city,
        "state": target.state,
        "historical_price_trend_pct": pm.get("historical_price_trend_pct"),
        "projected_uplift_pct": pm.get("projected_uplift_pct"),
        "projected_downside_pct": pm.get("projected_downside_pct"),
        "roi_trend_pct": roi_pct,
        "volatility_index": pm.get("volatility_index"),
        "rental_demand_strength": pm.get("rental_demand_strength"),
        "infra_news_impact": news_summary.summarize(news_items, area=target.name),
        "legal_regulatory_friction": legal_signals.friction_text(
            complaints, area=target.name
        ),
        "legal_approval_signals": legal_signals.approval_signals(
            suspended, area=target.name
        ),
        "livability_indicators": livability,
        "infrastructure_proximity": proximity,
        "risk_signals": risk_derivation.summarize_risk(
            district=target.district_for_lookup,
            city=target.city,
            seismic=_risk_seismic,
            crime=_risk_crime,
            flood=_risk_flood,
        ),
        "developer_concentration": developer_concentration_derivation.compute(
            listings, target.name
        ),
        # TODO(ritesh): populate from MMRDA/PMRDA announcement scrape in a
        #  dedicated commit. The MahaRERA project-search endpoint that would
        #  cover supply_pressure + developer_concentration is JS-rendered and
        #  waits on a separate attack (XHR reverse-engineering or Playwright).
        "upcoming_infra_pipeline": None,
        "raw_data_dump": {
            "news_items": [
                {
                    "title": n.title,
                    "source": n.source,
                    "published": n.published,
                    "link": n.link,
                }
                for n in news_items
            ],
            "news_source": "google_news_rss",
            "maharera_source": "public_drupal_tables",
            "osm_source": "local_pbf_extract",
            "osm_element_count": len(osm_elements),
            "center_coords": (
                [target.lat, target.lon]
                if target.lat is not None and target.lon is not None
                else None
            ),
            "price_metrics": {
                "median_sale_psf": pm.get("median_sale_psf"),
                "median_rent_psf": pm.get("median_rent_psf"),
                "rental_yield_pct": roi_derivation.rental_yield_pct(
                    pm.get("median_sale_psf"), pm.get("median_rent_psf")
                ),
                "sample_sizes": pm.get("sample_sizes"),
                "sources": pm.get("sources"),  # direct / knn_imputed / ...
                "neighbors_used": pm.get("neighbors"),
                "trend_audit": pm.get("trend_audit"),
            },
            "commercial_density": comm_density,
            "scraped_at_monotonic": asyncio.get_event_loop().time(),
        },
    }


async def _scrape_all(targets: list[TargetArea]) -> list[dict[str, Any]]:
    limiter = HostLimiter()
    # Google News tolerates more concurrency than govt portals; tune per-host.
    limiter.set_limit(news_scraper.HOST, 6)
    limiter.set_limit(maharera_scraper.HOST, 3)

    # Warm the OSM POI cache once up-front. First call parses the PBF
    # (~2min); subsequent runs read the JSON cache in ~1s.
    osm_local.load_pois()

    # Load property_listings once and compute per-area price / ROI / demand
    # before the async fan-out. Pure CPU work, no DB in the hot path below.
    db_for_listings = SessionLocal()
    try:
        listings = _load_listings(db_for_listings)
    finally:
        db_for_listings.close()
    log.info("loaded %d property listings for derivations", len(listings))
    price_metrics_by_area = _compute_price_roi_demand(listings, targets)

    async with new_client() as client:
        # MahaRERA tables are Maharashtra-wide — fetch once, share across areas.
        complaints, suspended = await asyncio.gather(
            maharera_scraper.fetch_complaints(client, limiter),
            maharera_scraper.fetch_suspended(client, limiter),
        )
        log.info(
            "MahaRERA: %d complaints, %d suspended projects",
            len(complaints),
            len(suspended),
        )

        tasks = [
            _scrape_area(
                client, limiter, t,
                complaints=complaints,
                suspended=suspended,
                price_metrics_by_area=price_metrics_by_area,
                listings=listings,
            )
            for t in targets
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    payloads: list[dict[str, Any]] = []
    for target, result in zip(targets, results):
        if isinstance(result, BaseException):
            log.error("scrape task failed for %s: %s", target.name, result)
            continue
        payloads.append(result)
    return payloads


def _persist(db: Session, payloads: list[dict[str, Any]]) -> None:
    """Sync DB write phase. Runs after all async scraping completes."""
    for payload in payloads:
        try:
            area_service.upsert_area(db, MicroMarketCreate(**payload))
            log.info("upserted %s", payload["name"])
        except Exception as exc:
            log.error("upsert failed for %s: %s", payload.get("name"), exc)


def run() -> None:
    targets = load_target_areas()
    log.info("starting area intelligence ingestion (targets=%d)", len(targets))

    payloads = asyncio.run(_scrape_all(targets))
    log.info("scraped %d/%d areas; writing to DB", len(payloads), len(targets))

    db = SessionLocal()
    try:
        _persist(db, payloads)
    finally:
        db.close()
    log.info("area intelligence ingestion complete")


if __name__ == "__main__":
    run()
