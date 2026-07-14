"""One-shot worker: download + persist the three Pune Kaggle datasets.

Usage:

    # Safe: only loads sources that have zero rows in the DB.
    python -m app.workers.load_kaggle_listings

    # Refresh: wipes rows for each source and reloads from Kaggle.
    python -m app.workers.load_kaggle_listings --force

This worker is never invoked automatically — not by the FastAPI lifespan,
not by API routes, not on server restarts. It's a dev/bootstrap tool.
"""

from __future__ import annotations

import sys

from sqlalchemy import func

import app.features  # noqa: F401 — register all feature models on Base.metadata
from app.core.database import Base, SessionLocal, engine
from app.core.logging import get_logger
from app.features.property_intelligence.models import PropertyListing
from app.features.property_intelligence.pipeline.kaggle_loader import (
    SOURCE_7_CITIES,
    SOURCE_PUNE_HOUSE,
    SOURCE_PUNE_RENTALS,
    download_all,
    parse_7cities_india,
    parse_pune_house,
    parse_pune_rentals,
)

log = get_logger("workers.load_kaggle_listings")


def _count_for_source(db, source: str) -> int:
    return (
        db.query(func.count())
        .select_from(PropertyListing)
        .filter(PropertyListing.source == source)
        .scalar()
    )


def _load_source(db, source: str, rows: list[dict], *, force: bool) -> int:
    existing = _count_for_source(db, source)
    if existing > 0 and not force:
        log.info(
            "skipping %s: %d rows already present. Pass --force to reload.",
            source, existing,
        )
        return 0

    if existing > 0:
        log.info("--force set; deleting %d existing rows for %s", existing, source)
        db.query(PropertyListing).filter(PropertyListing.source == source).delete()
        db.flush()

    for r in rows:
        db.add(PropertyListing(**r))
    db.commit()
    return len(rows)


def run(*, force: bool = False) -> None:
    # Ensure all feature tables exist — workers may be invoked before the
    # FastAPI lifespan has had a chance to run create_all.
    Base.metadata.create_all(bind=engine)

    paths = download_all()
    log.info("datasets ready (force=%s)", force)

    db = SessionLocal()
    try:
        n1 = _load_source(
            db, SOURCE_PUNE_HOUSE,
            list(parse_pune_house(paths.pune_house)), force=force,
        )
        n2 = _load_source(
            db, SOURCE_PUNE_RENTALS,
            list(parse_pune_rentals(paths.pune_rentals)), force=force,
        )
        n3 = _load_source(
            db, SOURCE_7_CITIES,
            list(parse_7cities_india(paths.seven_cities)), force=force,
        )
        # Migration assist: older runs used source "kaggle_7cities_pune".
        # On --force, nuke the legacy rows so there's no stale duplication.
        if force:
            legacy_deleted = (
                db.query(PropertyListing)
                .filter(PropertyListing.source == "kaggle_7cities_pune")
                .delete()
            )
            if legacy_deleted:
                db.commit()
                log.info("dropped %d legacy kaggle_7cities_pune rows", legacy_deleted)
        total = db.query(func.count()).select_from(PropertyListing).scalar()
        log.info(
            "loaded this run: house=%d rentals=%d 7-cities=%d "
            "(property_listings total: %d)",
            n1, n2, n3, total,
        )
    finally:
        db.close()


if __name__ == "__main__":
    run(force="--force" in sys.argv)
