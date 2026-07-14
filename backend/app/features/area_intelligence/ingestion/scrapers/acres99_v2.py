"""99acres SSR scraper — extracts listings + trends + POIs from __initialData__.

Works with two URL formats:
  1. Slug-based (ffid):  /property-in-baner-pune-ffid
  2. Search-based (ID):  /search/property/buy?city=12&locality=4924

Both embed ~640KB of JSON in window.__initialData__ containing:
  - 25 project listings with price ranges, BHK, builder, coords
  - Quarterly price trend data (2014-present) with 1yr/3yr/5yr changes
  - Nearby POIs (schools, hospitals, metro stations) with distances
  - 95+ locality facets with IDs (for discovering new areas)

Storage: CSV for listings, JSON for trends/POIs. No DB writes — the
kaggle_loader / ingestion worker can pick up the CSV later.
"""

from __future__ import annotations

import asyncio
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import httpx

from app.core.logging import get_pipeline_logger

from ._http import HostLimiter

log = get_pipeline_logger("area.99acres_v2")

HOST = "www.99acres.com"

# ── browser headers (same set that passes 99acres WAF) ──────────────────────

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) "
        "Gecko/20100101 Firefox/121.0"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Referer": "https://www.google.com/",
}

# ── data classes ─────────────────────────────────────────────────────────────

@dataclass
class PropertyCard:
    """One project listing extracted from __initialData__.srp.pageData.properties."""
    name: str
    locality: str
    city: str
    bhk: str               # "2, 3" or "3, 4, 5"
    price_min: float | None
    price_max: float | None
    price_label: str        # "70 - 81 L"
    price_psf: float | None  # if available in configCardTuples
    builder: str | None
    possession: str | None
    url: str | None
    latitude: float | None
    longitude: float | None
    source_url: str = ""
    scraped_at: str = ""


@dataclass
class PriceTrend:
    """Quarterly price trend for one locality."""
    locality: str
    latest_psf: float | None
    trend_1yr: float | None
    trend_3yr: float | None
    trend_5yr: float | None
    data_points: list[dict] = field(default_factory=list)  # [{quarter, psf}]
    budget_range: str | None = None
    scraped_at: str = ""


@dataclass
class NearbyPOI:
    """One nearby point of interest."""
    name: str
    category: str           # Education centre, Hospital, Metro Station, etc.
    distance_km: float
    locality: str = ""
    city: str = ""


@dataclass
class AreaScrapeResult:
    """Complete scrape result for one area."""
    area_name: str
    city: str
    url: str
    properties: list[PropertyCard]
    trend: PriceTrend | None
    pois: list[NearbyPOI]
    locality_facets: list[dict]  # [{id, label, count}] for discovering more areas
    error: str | None = None


# ── extraction ───────────────────────────────────────────────────────────────

def _extract_initdata(html: str) -> dict | None:
    """Parse window.__initialData__ from the page HTML."""
    idx = html.find("__initialData__")
    if idx < 0:
        return None
    start = html.find("{", idx)
    if start < 0:
        return None
    depth = 0
    for i in range(start, min(start + 2_000_000, len(html))):
        if html[i] == "{":
            depth += 1
        elif html[i] == "}":
            depth -= 1
        if depth == 0:
            break
    try:
        return json.loads(html[start : i + 1])
    except json.JSONDecodeError:
        return None


def _safe_float(val) -> float | None:
    try:
        return float(val)
    except (TypeError, ValueError):
        return None


def _parse_price(price_obj: dict) -> tuple[float | None, float | None, str]:
    """Extract (min, max, label) from the price object."""
    if not price_obj:
        return None, None, ""
    return (
        _safe_float(price_obj.get("min")),
        _safe_float(price_obj.get("max")),
        price_obj.get("label", ""),
    )


def _parse_bhk(sub_heading: str) -> str:
    """Extract BHK string from subHeading like '2, 3 BHK Apartment in ...'"""
    m = re.search(r"([\d,\s]+)\s*BHK", sub_heading)
    return m.group(1).strip() if m else ""


def _parse_trend(raw: dict | None) -> PriceTrend | None:
    if not raw:
        return None
    dps = raw.get("dataPoints", [])
    recent_dps = [
        {"quarter": dp["quarterLabel"], "psf": dp["yVal"]}
        for dp in dps
        if dp.get("yVal") is not None
    ]
    return PriceTrend(
        locality=raw.get("name", ""),
        latest_psf=_safe_float(
            raw.get("pricePerSqFt", "").replace("₹", "").replace(",", "").replace("/sq.ft", "").strip()
        ),
        trend_1yr=_safe_float(raw.get("last1year")),
        trend_3yr=_safe_float(raw.get("last3year")),
        trend_5yr=_safe_float(raw.get("last5year")),
        data_points=recent_dps[-8:],  # last 2 years (8 quarters)
        budget_range=raw.get("budgetRange"),
        scraped_at=datetime.now(timezone.utc).isoformat(),
    )


def _parse_pois(poi_data: dict, area_name: str, city: str) -> list[NearbyPOI]:
    pois: list[NearbyPOI] = []
    for category, items in poi_data.items():
        for item in items:
            pois.append(NearbyPOI(
                name=item.get("label", ""),
                category=category,
                distance_km=_safe_float(item.get("distance")) or 0.0,
                locality=area_name,
                city=city,
            ))
    return pois


def _parse_locality_facets(facets: dict) -> list[dict]:
    raw = facets.get("LOCALITY_ID", [])
    return [
        {"id": loc["id"], "label": loc["label"], "count": loc["count"]}
        for loc in raw
    ]


def extract_area(data: dict, area_name: str, city: str, url: str) -> AreaScrapeResult:
    """Parse __initialData__ into a structured AreaScrapeResult."""
    srp = data.get("srp", {})
    page = srp.get("pageData", {})

    # Properties
    raw_props = page.get("properties", [])
    properties: list[PropertyCard] = []
    now = datetime.now(timezone.utc).isoformat()

    for p in raw_props:
        heading = p.get("heading")
        if not heading:
            continue  # skip premium/featured placeholders

        sub = p.get("subHeading", "")
        pmin, pmax, plabel = _parse_price(p.get("price"))
        loc_info = p.get("location", {})
        geo = p.get("geoCoordinates", {})

        # Try to get psf from configCardTuples
        psf = None
        for cfg in p.get("configCardTuples", []) or []:
            if cfg.get("pricePerUnit"):
                psf = _safe_float(cfg["pricePerUnit"])
                break

        properties.append(PropertyCard(
            name=heading,
            locality=loc_info.get("localityName") or area_name,
            city=city,
            bhk=_parse_bhk(sub),
            price_min=pmin,
            price_max=pmax,
            price_label=plabel,
            price_psf=psf,
            builder=p.get("builderName"),
            possession=(p.get("possessionStatus") or {}).get("label"),
            url=(p.get("landingPage") or {}).get("url"),
            latitude=_safe_float(geo.get("latitude")),
            longitude=_safe_float(geo.get("longitude")),
            source_url=url,
            scraped_at=now,
        ))

    # Price trend
    trends_list = page.get("ratingReview", {}).get("priceTrend", {}).get("sequenceTrends", [])
    trend = _parse_trend(trends_list[0]) if trends_list else None
    if trend:
        trend.locality = trend.locality or area_name

    # POIs
    pois = _parse_pois(
        page.get("ratingReview", {}).get("poiData", {}),
        area_name, city,
    )

    # Locality facets
    facets = _parse_locality_facets(page.get("facets", {}))

    return AreaScrapeResult(
        area_name=area_name,
        city=city,
        url=url,
        properties=properties,
        trend=trend,
        pois=pois,
        locality_facets=facets,
    )


# ── async fetch ──────────────────────────────────────────────────────────────

async def fetch_area(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    area_name: str,
    city: str,
    url: str,
) -> AreaScrapeResult:
    """Fetch one area page and extract all data."""
    sem = limiter.for_host(HOST)
    async with sem:
        try:
            r = await client.get(url, headers=_BROWSER_HEADERS, timeout=30)
            r.raise_for_status()
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            log.warning("fetch failed for %s (%s): %s", area_name, city, exc)
            return AreaScrapeResult(
                area_name=area_name, city=city, url=url,
                properties=[], trend=None, pois=[], locality_facets=[],
                error=str(exc),
            )

    if len(r.text) < 50_000 or "Security Alert" in r.text:
        msg = f"blocked or empty ({len(r.text)} bytes)"
        log.warning("99acres %s for %s", msg, area_name)
        return AreaScrapeResult(
            area_name=area_name, city=city, url=url,
            properties=[], trend=None, pois=[], locality_facets=[],
            error=msg,
        )

    data = _extract_initdata(r.text)
    if not data:
        return AreaScrapeResult(
            area_name=area_name, city=city, url=url,
            properties=[], trend=None, pois=[], locality_facets=[],
            error="no __initialData__ found",
        )

    result = extract_area(data, area_name, city, url)
    log.info(
        "99acres: %s (%s) — %d listings, trend=%s, %d POIs",
        area_name, city, len(result.properties),
        "yes" if result.trend else "no", len(result.pois),
    )
    return result


# ── city discovery ───────────────────────────────────────────────────────────

async def discover_localities(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    city: str,
    city_id: int,
) -> list[dict]:
    """Fetch a city-level page and return all locality IDs + counts."""
    url = (
        f"https://{HOST}/search/property/buy/{city.lower()}"
        f"?city={city_id}&preference=S&area_unit=1&res_com=R"
    )
    result = await fetch_area(client, limiter, city, city, url)
    if result.error:
        log.error("locality discovery failed for %s: %s", city, result.error)
        return []
    return result.locality_facets
