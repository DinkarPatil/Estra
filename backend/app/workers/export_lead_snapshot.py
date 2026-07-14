"""One-shot export for lead review.

Writes:
    backend/data/exports/lead_snapshot.csv       — 1000 property listings
                                                   joined with their area's
                                                   intelligence signals.
    backend/data/exports/schema_status.md        — column-by-column state
                                                   (real / partial / pending
                                                   + reason + owner).

Run:

    python -m app.workers.export_lead_snapshot

Idempotent: overwrites the two files on each run. CSV is ordered city ->
area -> listing_id so the lead can scroll through per city.
"""

from __future__ import annotations

import csv
import json
import random
import sqlite3
from collections import defaultdict
from pathlib import Path

import app.features  # noqa: F401
from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.features.area_intelligence.ingestion.targets import load_target_areas
from app.features.area_intelligence.ingestion.source_policy import is_displayable
from app.features.area_intelligence.models import MicroMarket
from app.features.property_intelligence.models import PropertyListing

log = get_logger("workers.export_lead_snapshot")

TARGET_ROWS = 1000
OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports"


# ─── column layout ──────────────────────────────────────────────────────────

CSV_COLUMNS = [
    # Property identity
    "property_id",
    "source",
    "listing_type",
    "city",
    "locality_text",
    "matched_area",
    # Property details
    "bedrooms",
    "bathrooms",
    "area_sqft",
    "price_inr",
    "price_per_sqft",
    # Area: market / price signals
    "area_median_sale_psf",
    "area_median_rent_psf",
    "roi_trend_pct",
    "volatility_index",
    "rental_demand_strength",
    # Pending historical
    "historical_price_trend_pct",
    "projected_uplift_pct",
    "projected_downside_pct",
    # Developer / supply
    "top_project_name",
    "top_project_share_pct",
    "unique_projects_in_area",
    "supply_pressure",
    "project_score_trend",
    # Legal
    "legal_regulatory_friction",
    "suspended_project_count_in_area",
    "distressed_asset_signals",
    # Risk
    "seismic_zone",
    "crime_per_100k",
    "flood_risk",
    # Livability (OSM)
    "livability_schools",
    "livability_hospitals_or_clinics",
    "livability_restaurants_or_cafes",
    "livability_banks_or_atms",
    "livability_parks_or_gardens",
    # Proximity (OSM)
    "nearest_railway_station_km",
    "nearest_airport_km",
    "nearest_bus_station_km",
    "nearest_highway_km",
    # News / sentiment
    "infra_news_impact",
    "recent_news_sentiment",
    "upcoming_infra_pipeline",
    "transaction_velocity",
]


# ─── helpers ────────────────────────────────────────────────────────────────

def _match_area(target_area_names: list[str], locality: str | None) -> str | None:
    if not locality:
        return None
    low = locality.lower()
    for a in target_area_names:
        if a.lower() in low:
            return a
    return None


def _truncate(s: str | None, n: int = 200) -> str | None:
    if not s:
        return s
    s = s.replace("\n", " ").strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def _parse_risk(text: str | None) -> dict[str, str | None]:
    """Pull the three fields back out of risk_signals for CSV tidiness."""
    out: dict[str, str | None] = {"zone": None, "crime": None, "flood": None}
    if not text:
        return out
    # Format: "Seismic Zone III (...) | IPC crime 292/100K (Pune, NCRB 2022) |
    #          Flood risk: Medium [...]"
    for part in text.split("|"):
        p = part.strip()
        if p.startswith("Seismic Zone "):
            out["zone"] = p.split(" ", 2)[2].split(" ")[0]
        elif p.startswith("IPC crime "):
            try:
                out["crime"] = p.split()[2]  # "292/100K"
            except IndexError:
                pass
        elif p.startswith("Flood risk:"):
            rest = p.removeprefix("Flood risk:").strip()
            out["flood"] = rest.split(" ")[0].rstrip(",:")
    return out


def _first_project(dc: dict | None) -> tuple[str | None, float | None]:
    if not dc:
        return None, None
    top = dc.get("top_projects") or []
    if not top:
        return None, None
    return top[0].get("name"), top[0].get("share_pct")


def _unique_projects(dc: dict | None) -> int | None:
    return dc.get("unique_projects") if dc else None


def _suspended_count(sa: dict | None) -> int | None:
    return sa.get("suspended_project_count") if sa else None


def _li(d: dict | None, key: str) -> int | None:
    return d.get(key) if d else None


def _pm(raw_dump: dict | None, key: str) -> float | None:
    pm = (raw_dump or {}).get("price_metrics") or {}
    return pm.get(key)


# ─── core ───────────────────────────────────────────────────────────────────

def _pick_sample(db, target_area_names: list[str]) -> list[PropertyListing]:
    """Stratified sample of DISPLAYABLE (scraped) listings only.

    Kaggle vintage rows are excluded — they serve as historical baseline for
    trend/imputation but never appear in the lead CSV.

    Targets roughly:
      Pune 500, Mumbai 250, Thane 100, Nashik 80, Nagpur 40, Aurangabad 30.
    Falls back to whatever is available per city.
    """
    per_city = {
        "Pune": 500, "Mumbai": 250, "Thane": 100,
        "Nashik": 80, "Nagpur": 40, "Aurangabad": 30,
    }
    rng = random.Random(42)
    picked: list[PropertyListing] = []
    for city, cap in per_city.items():
        rows = (
            db.query(PropertyListing)
            .filter(PropertyListing.city.ilike(city))
            .all()
        )
        # Filter to displayable sources only (Kaggle excluded).
        rows = [r for r in rows if is_displayable(r.source)]
        # Prefer rows whose locality matches one of our target areas.
        matched = [r for r in rows if _match_area(target_area_names, r.locality_text)]
        other = [r for r in rows if r not in set(matched)]
        rng.shuffle(matched)
        rng.shuffle(other)
        picked.extend((matched + other)[:cap])
    return picked[:TARGET_ROWS]


def run() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    targets = load_target_areas()
    target_area_names = [t.name for t in targets]

    db = SessionLocal()
    try:
        micro_by_area = {m.name: m for m in db.query(MicroMarket).all()}
        sample = _pick_sample(db, target_area_names)
        log.info("sampled %d listings for export", len(sample))

        rows_out: list[dict] = []
        for p in sample:
            matched = _match_area(target_area_names, p.locality_text)
            mm = micro_by_area.get(matched) if matched else None
            dc = mm.developer_concentration if mm else None
            la = mm.legal_approval_signals if mm else None
            lv = mm.livability_indicators if mm else None
            pr = mm.infrastructure_proximity if mm else None
            risk = _parse_risk(mm.risk_signals if mm else None)
            top_name, top_share = _first_project(dc)
            raw_dump = mm.raw_data_dump if mm else None

            rows_out.append({
                "property_id": p.id,
                "source": p.source,
                "listing_type": p.listing_type,
                "city": p.city,
                "locality_text": p.locality_text,
                "matched_area": matched or "",
                "bedrooms": p.bedrooms,
                "bathrooms": p.bathrooms,
                "area_sqft": p.area_sqft,
                "price_inr": p.price_inr,
                "price_per_sqft": p.price_per_sqft,
                "area_median_sale_psf": _pm(raw_dump, "median_sale_psf"),
                "area_median_rent_psf": _pm(raw_dump, "median_rent_psf"),
                "roi_trend_pct": mm.roi_trend_pct if mm else None,
                "volatility_index": mm.volatility_index if mm else None,
                "rental_demand_strength": mm.rental_demand_strength if mm else None,
                "historical_price_trend_pct": mm.historical_price_trend_pct if mm else None,
                "projected_uplift_pct": mm.projected_uplift_pct if mm else None,
                "projected_downside_pct": mm.projected_downside_pct if mm else None,
                "top_project_name": top_name,
                "top_project_share_pct": top_share,
                "unique_projects_in_area": _unique_projects(dc),
                "supply_pressure": mm.supply_pressure if mm else None,
                "project_score_trend": mm.project_score_trend if mm else None,
                "legal_regulatory_friction": _truncate(mm.legal_regulatory_friction if mm else None, 200),
                "suspended_project_count_in_area": _suspended_count(la),
                "distressed_asset_signals": json.dumps(mm.distressed_asset_signals) if (mm and mm.distressed_asset_signals) else None,
                "seismic_zone": risk["zone"],
                "crime_per_100k": risk["crime"],
                "flood_risk": risk["flood"],
                "livability_schools": _li(lv, "schools"),
                "livability_hospitals_or_clinics": _li(lv, "hospitals_or_clinics"),
                "livability_restaurants_or_cafes": _li(lv, "restaurants_or_cafes"),
                "livability_banks_or_atms": _li(lv, "banks_or_atms"),
                "livability_parks_or_gardens": _li(lv, "parks_or_gardens"),
                "nearest_railway_station_km": _li(pr, "nearest_railway_station_km"),
                "nearest_airport_km": _li(pr, "nearest_airport_km"),
                "nearest_bus_station_km": _li(pr, "nearest_bus_station_km"),
                "nearest_highway_km": _li(pr, "nearest_highway_km"),
                "infra_news_impact": _truncate(mm.infra_news_impact if mm else None, 300),
                "recent_news_sentiment": mm.recent_news_sentiment if mm else None,
                "upcoming_infra_pipeline": mm.upcoming_infra_pipeline if mm else None,
                "transaction_velocity": mm.transaction_velocity if mm else None,
            })

        # Sort: displayable scraped rows first (freshest data), then
        # everything else by city/area.  Kaggle rows should not appear
        # but the sort is safe regardless.
        rows_out.sort(
            key=lambda r: (
                0 if is_displayable(r["source"]) else 1,
                r["city"] or "",
                r["matched_area"] or "",
                r["property_id"] or "",
            )
        )

        csv_path = OUT_DIR / "lead_snapshot.csv"
        with csv_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=CSV_COLUMNS)
            w.writeheader()
            w.writerows(rows_out)
        log.info("wrote %s (%d rows)", csv_path, len(rows_out))

        db_path = OUT_DIR / "lead_snapshot.db"
        _write_sqlite(db_path, rows_out)
        log.info("wrote %s (%d rows)", db_path, len(rows_out))

        # Coverage stats for the companion markdown.
        non_null_pct: dict[str, float] = {}
        for col in CSV_COLUMNS:
            filled = sum(1 for r in rows_out if r[col] not in (None, ""))
            non_null_pct[col] = round(filled / max(len(rows_out), 1) * 100, 1)

        _write_schema_status(non_null_pct)
    finally:
        db.close()


_COLUMN_SQL_TYPES: dict[str, str] = {
    "property_id": "TEXT PRIMARY KEY",
    "source": "TEXT",
    "listing_type": "TEXT",
    "city": "TEXT",
    "locality_text": "TEXT",
    "matched_area": "TEXT",
    "bedrooms": "INTEGER",
    "bathrooms": "INTEGER",
    "area_sqft": "REAL",
    "price_inr": "REAL",
    "price_per_sqft": "REAL",
    "area_median_sale_psf": "REAL",
    "area_median_rent_psf": "REAL",
    "roi_trend_pct": "REAL",
    "volatility_index": "REAL",
    "rental_demand_strength": "TEXT",
    "historical_price_trend_pct": "REAL",
    "projected_uplift_pct": "REAL",
    "projected_downside_pct": "REAL",
    "top_project_name": "TEXT",
    "top_project_share_pct": "REAL",
    "unique_projects_in_area": "INTEGER",
    "supply_pressure": "REAL",
    "project_score_trend": "REAL",
    "legal_regulatory_friction": "TEXT",
    "suspended_project_count_in_area": "INTEGER",
    "distressed_asset_signals": "TEXT",
    "seismic_zone": "TEXT",
    "crime_per_100k": "TEXT",
    "flood_risk": "TEXT",
    "livability_schools": "INTEGER",
    "livability_hospitals_or_clinics": "INTEGER",
    "livability_restaurants_or_cafes": "INTEGER",
    "livability_banks_or_atms": "INTEGER",
    "livability_parks_or_gardens": "INTEGER",
    "nearest_railway_station_km": "REAL",
    "nearest_airport_km": "REAL",
    "nearest_bus_station_km": "REAL",
    "nearest_highway_km": "REAL",
    "infra_news_impact": "TEXT",
    "recent_news_sentiment": "TEXT",
    "upcoming_infra_pipeline": "TEXT",
    "transaction_velocity": "REAL",
}


def _write_sqlite(db_path: Path, rows: list[dict]) -> None:
    """Render the same snapshot into a single-table SQLite DB.

    Lead gets a file they can open in DB Browser for SQLite and run
    arbitrary queries against — same shape as the CSV, proper column
    types so `SELECT AVG(price_inr) GROUP BY matched_area` just works.
    """
    if db_path.exists():
        db_path.unlink()  # overwrite cleanly — no stale schema drift
    conn = sqlite3.connect(db_path)
    try:
        cols_ddl = ",\n        ".join(
            f"{col} {_COLUMN_SQL_TYPES[col]}" for col in CSV_COLUMNS
        )
        conn.execute(f"CREATE TABLE lead_snapshot (\n        {cols_ddl}\n      )")
        placeholders = ",".join(["?"] * len(CSV_COLUMNS))
        insert_sql = (
            f"INSERT INTO lead_snapshot ({','.join(CSV_COLUMNS)}) VALUES ({placeholders})"
        )
        for r in rows:
            conn.execute(insert_sql, [r.get(c) for c in CSV_COLUMNS])
        # Cheap indexes on the fields a reviewer is likely to query.
        conn.execute("CREATE INDEX ix_lead_snapshot_city ON lead_snapshot(city)")
        conn.execute("CREATE INDEX ix_lead_snapshot_area ON lead_snapshot(matched_area)")
        conn.execute("CREATE INDEX ix_lead_snapshot_source ON lead_snapshot(source)")
        conn.commit()
    finally:
        conn.close()


def _write_schema_status(fill_pct: dict[str, float]) -> None:
    md = OUT_DIR / "schema_status.md"
    lines: list[str] = [
        "# Area Intelligence DB — Schema Status",
        "",
        f"Snapshot companion to `lead_snapshot.csv`. 43 micro-market rows + "
        f"38K property listings underpin this CSV; the file itself is a "
        f"stratified 1,000-row sample.",
        "",
        "**Legend:**",
        "- ✅ Real — sourced and computed for every row where the area-join works.",
        "- 🟡 Partial — real for some cities, NULL for others due to data sparsity.",
        "- ⏳ Pending — column exists in the schema, no source yet wired; owner "
        "and unblocker listed.",
        "",
        "## Column state",
        "",
        "| Column | State | Fill % | Source / Why pending |",
        "|---|---|---|---|",
    ]

    status = {
        "property_id": ("✅", "PropertyListing primary key"),
        "source": ("✅", "Scraped sources only (99acres_*, nobroker_*). Kaggle rows excluded from CSV — kept in DB for CAGR trend / baseline imputation."),
        "listing_type": ("✅", "sale or rent"),
        "city": ("✅", "Parsed from dataset"),
        "locality_text": ("✅", "Raw locality from CSV; used for area match"),
        "matched_area": ("✅", "Substring match against target_areas.json"),
        "bedrooms": ("✅", "CSV column"),
        "bathrooms": ("✅", "CSV column"),
        "area_sqft": ("✅", "CSV column"),
        "price_inr": ("✅", "Parsed ₹Cr/₹Lac/₹lakh into rupees"),
        "price_per_sqft": ("✅", "Computed price/area with outlier bounds"),
        "area_median_sale_psf": ("🟡", "Computed from Kaggle sales. NULL for Nagpur/Aurangabad (no Kaggle data)."),
        "area_median_rent_psf": ("🟡", "Computed from Pune rental CSV. NULL for Mumbai/Thane/Nashik/Nagpur/Aurangabad (no rental data)."),
        "roi_trend_pct": ("✅", "Buy-side ROI composite: historical trend + infra proximity + commercial density + dev news. 0–(trend+5) clamp. Rental yield moved to raw_data_dump."),
        "volatility_index": ("🟡", "CV of ₹/sqft. Real for Pune; partial for Mumbai/Thane/Nashik; NULL for Nagpur/Aurangabad."),
        "rental_demand_strength": ("🟡", "Bucket from rent:sale ratio. 'Insufficient rental data' where rent ≤3."),
        "historical_price_trend_pct": ("⏳", "Needs YoY data. Unblocker: RBI RESIDEX CSV (city-level) or Wayback snapshots (per-area). Owner: Ritesh."),
        "projected_uplift_pct": ("⏳", "Needs historical trend + forward model. Blocked by historical data + Harsh's scoring layer."),
        "projected_downside_pct": ("⏳", "Same as uplift."),
        "top_project_name": ("✅", "Top society/project by listing count (developer_concentration derivation)."),
        "top_project_share_pct": ("✅", "Same source."),
        "unique_projects_in_area": ("✅", "Same source."),
        "supply_pressure": ("⏳", "Needs full MahaRERA project registry (JS-rendered; Playwright or XHR reverse-engineering). Owner: Ritesh."),
        "project_score_trend": ("⏳", "Needs Harsh's scoring layer to run first."),
        "legal_regulatory_friction": ("✅", "MahaRERA complaints report. Substring-matched to project names."),
        "suspended_project_count_in_area": ("✅", "MahaRERA suspended/deregistered list."),
        "distressed_asset_signals": ("⏳", "Bank auction portal scrape (IBAPI / SBI auction). Low priority, separate commit."),
        "seismic_zone": ("✅", "IS 1893:2016 per district (Maharashtra CSV)."),
        "crime_per_100k": ("✅", "NCRB 2022, city-level (per 100K population)."),
        "flood_risk": ("✅", "Maharashtra State Disaster Management Authority, district-level."),
        "livability_schools": ("✅", "OSM Overpass → local PBF parse; count within 1.5 km."),
        "livability_hospitals_or_clinics": ("✅", "Same."),
        "livability_restaurants_or_cafes": ("✅", "Same."),
        "livability_banks_or_atms": ("✅", "Same."),
        "livability_parks_or_gardens": ("✅", "Same."),
        "nearest_railway_station_km": ("✅", "OSM haversine from area centroid."),
        "nearest_airport_km": ("✅", "Same."),
        "nearest_bus_station_km": ("✅", "Same."),
        "nearest_highway_km": ("⏳", "OSM local scraper currently indexes nodes only; highways are OSM ways and need node-location-on-ways indexing. Unblocker: switch osm_local.py to osmium.FileProcessor().with_locations(). Owner: Ritesh, small follow-up."),
        "infra_news_impact": ("✅", "Google News RSS headlines, 8 per area, publication-tagged."),
        "recent_news_sentiment": ("⏳", "LLM sentiment pass at query time. Owner: Arnav. Raw headlines are stored in micro_markets.raw_data_dump.news_items for him to consume."),
        "upcoming_infra_pipeline": ("⏳", "MMRDA / PMRDA / PMC announcement scrape. Unblocked by simple HTTP scrape of public project pages. Owner: Ritesh."),
        "transaction_velocity": ("⏳", "Median days-on-market. Needs listing posting dates Kaggle doesn't expose. Unblocker: monthly 99acres/MagicBricks scrape with date fields."),
    }

    for col in CSV_COLUMNS:
        state, note = status.get(col, ("?", "—"))
        pct = fill_pct.get(col, 0.0)
        lines.append(f"| `{col}` | {state} | {pct}% | {note} |")

    lines += [
        "",
        "## Totals",
        "",
        f"- Real (✅): {sum(1 for v in status.values() if v[0] == '✅')} columns",
        f"- Partial (🟡): {sum(1 for v in status.values() if v[0] == '🟡')} columns",
        f"- Pending (⏳): {sum(1 for v in status.values() if v[0] == '⏳')} columns",
        f"- Total columns: {len(CSV_COLUMNS)}",
        "",
        "## Coverage footnotes",
        "",
        "- **Pune** (18 areas): fully populated — roi, volatility, demand all real.",
        "- **Mumbai** (7 areas): sale-side real (volatility); rent data absent → roi NULL.",
        "- **Thane** (4 areas): price metrics imputed from sparse city baseline.",
        "- **Nashik** (5 areas): partial, sparse Kaggle coverage.",
        "- **Nagpur / Aurangabad** (9 areas): price metrics NULL — no Kaggle data.",
        "  OSM, risk, legal, news all populate for every area regardless of Kaggle coverage.",
        "",
        "*Generated by `python -m app.workers.export_lead_snapshot`.*",
    ]
    md.write_text("\n".join(lines), encoding="utf-8")
    log.info("wrote %s", md)


if __name__ == "__main__":
    run()
