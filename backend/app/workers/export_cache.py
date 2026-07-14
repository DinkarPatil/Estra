"""Export normalized area intelligence + properties into JSON cache files.

Reads committed seed files and writes pre-computed JSON caches that
endpoints consume directly (no DB round-trips at runtime).

    backend/data/cache/normalized_areas.json   — NormalizedAreaIntelligence[]
    backend/data/cache/properties.json         — PropertyListing-shaped dicts[]

Run::

    python -m app.workers.export_cache

Both files should be committed to git so teammates can start the server
without running the ingestion pipeline or keeping a working DB.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from typing import Any

from app.features.area_intelligence.normalize import normalize, NormalizedAreaIntelligence

SEED_DIR = Path(__file__).resolve().parents[2] / "data" / "seed"
CACHE_DIR = Path(__file__).resolve().parents[2] / "data" / "cache"
TRENDS_DIR = Path(__file__).resolve().parents[2] / "data" / "exports" / "99acres"

MM_SEED = SEED_DIR / "micro_markets.json"
PL_SEED = SEED_DIR / "property_listings.csv"

MM_CACHE = CACHE_DIR / "normalized_areas.json"
PL_CACHE = CACHE_DIR / "properties.json"

# Columns that must be numeric in the property JSON
_PL_INT_COLS = {"bedrooms", "bathrooms"}
_PL_FLOAT_COLS = {"area_sqft", "price_inr", "price_per_sqft"}


def _coerce_pl_value(key: str, raw: str) -> Any:
    if raw == "" or raw is None:
        return None
    if key in _PL_INT_COLS:
        return int(float(raw))
    if key in _PL_FLOAT_COLS:
        return float(raw)
    return raw


def _load_trends_lookup() -> dict[str, dict[str, Any]]:
    """Load latest 99acres trends into an {area_name: trend_row} lookup."""
    trend_files = sorted(TRENDS_DIR.glob("trends_*.json"), reverse=True)
    if not trend_files:
        return {}
    try:
        raw = json.loads(trend_files[0].read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return {}
    lookup: dict[str, dict[str, Any]] = {}
    for t in raw:
        name = t.get("area_name") or t.get("locality", "")
        if name:
            lookup[name] = t
    return lookup


def export_areas() -> None:
    raw_areas = json.loads(MM_SEED.read_text(encoding="utf-8"))
    trends = _load_trends_lookup()
    normalized: list[dict] = []
    for raw in raw_areas:
        norm = normalize(raw)
        # Overlay 99acres trend breakdown if available
        trend = trends.get(norm.area_name)
        if trend:
            norm.trend_1yr_pct = trend.get("trend_1yr")
            norm.trend_3yr_pct = trend.get("trend_3yr")
            norm.trend_5yr_pct = trend.get("trend_5yr")
            norm.latest_psf = trend.get("latest_psf")
        normalized.append(norm.model_dump(mode="json"))
    MM_CACHE.write_text(
        json.dumps(normalized, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"exported {len(normalized)} normalized areas → {MM_CACHE}")
    if trends:
        matched = sum(1 for a in normalized if a.get("trend_3yr_pct") is not None)
        print(f"  trend overlay: {matched}/{len(normalized)} areas matched")


def export_properties() -> None:
    rows: list[dict[str, Any]] = []
    with PL_SEED.open("r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            typed = {k: _coerce_pl_value(k, v) for k, v in row.items()}
            rows.append(typed)
    PL_CACHE.write_text(
        json.dumps(rows, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"exported {len(rows)} properties → {PL_CACHE}")


def run() -> None:
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    export_areas()
    export_properties()


if __name__ == "__main__":
    run()
