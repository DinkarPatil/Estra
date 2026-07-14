"""Export micro_markets + displayable property_listings as seed files.

Writes two files used by ``app.features.area_intelligence.seed`` to hydrate
a fresh ``glimmora.db`` on first boot:

    backend/data/seed/micro_markets.json       — 43 area rows (nested JSON
                                                 columns stay nested; easier
                                                 to diff/read than CSV-in-CSV).
    backend/data/seed/property_listings.csv    — ~430 scraped listings
                                                 (is_displayable filter:
                                                 99acres_*, nobroker_*).
                                                 Kaggle vintage rows are
                                                 deliberately excluded — they
                                                 are not end-user data.

Run::

    python -m app.workers.export_seed

Idempotent: overwrites both files on each run.
"""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any

import app.features  # noqa: F401
from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.features.area_intelligence.ingestion.source_policy import is_displayable
from app.features.area_intelligence.models import MicroMarket
from app.features.property_intelligence.models import PropertyListing

log = get_logger("workers.export_seed")

OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "seed"

MICRO_MARKET_COLUMNS = [c.name for c in MicroMarket.__table__.columns]
PROPERTY_LISTING_COLUMNS = [c.name for c in PropertyListing.__table__.columns]


def _to_jsonable(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    return value


def _row_to_dict(row: Any, columns: list[str]) -> dict[str, Any]:
    return {col: _to_jsonable(getattr(row, col)) for col in columns}


def run() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    db = SessionLocal()
    try:
        # ─── micro_markets → JSON ─────────────────────────────────────────
        markets = db.query(MicroMarket).order_by(MicroMarket.city, MicroMarket.name).all()
        market_rows = [_row_to_dict(m, MICRO_MARKET_COLUMNS) for m in markets]
        mm_path = OUT_DIR / "micro_markets.json"
        mm_path.write_text(
            json.dumps(market_rows, indent=2, ensure_ascii=False, default=str),
            encoding="utf-8",
        )
        log.info("wrote %s (%d rows)", mm_path, len(market_rows))

        # ─── property_listings → CSV (displayable only) ───────────────────
        listings = (
            db.query(PropertyListing)
            .order_by(PropertyListing.city, PropertyListing.locality_text)
            .all()
        )
        listings = [p for p in listings if is_displayable(p.source)]
        pl_path = OUT_DIR / "property_listings.csv"
        with pl_path.open("w", encoding="utf-8", newline="") as f:
            w = csv.DictWriter(f, fieldnames=PROPERTY_LISTING_COLUMNS)
            w.writeheader()
            for p in listings:
                w.writerow(_row_to_dict(p, PROPERTY_LISTING_COLUMNS))
        log.info("wrote %s (%d rows)", pl_path, len(listings))
    finally:
        db.close()


if __name__ == "__main__":
    run()
