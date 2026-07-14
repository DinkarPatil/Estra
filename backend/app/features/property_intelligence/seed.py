import json
from pathlib import Path
from typing import Any

from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.features.property_intelligence.models import Developer, Location, Property

log = get_logger("features.property_intelligence.seed")

SEED_DATA_DIR = Path(__file__).resolve().parents[2] / "seed_data"


def _load_json(filename: str) -> list[dict[str, Any]]:
    with (SEED_DATA_DIR / filename).open("r", encoding="utf-8") as f:
        return json.load(f)


def seed_property_intelligence() -> None:
    """Load developers, locations, and properties from JSON on first boot.

    Order matters: properties reference developer_id + location_id, so those
    tables must exist first. Idempotent: skips if any table already has rows.
    """
    db = SessionLocal()
    try:
        if db.query(Property).count() > 0:
            return

        developers = _load_json("developers.json")
        locations = _load_json("locations.json")
        properties = _load_json("properties.json")

        log.info(
            "seeding property_intelligence developers=%d locations=%d properties=%d",
            len(developers),
            len(locations),
            len(properties),
        )

        for row in developers:
            db.add(Developer(**row))

        for row in locations:
            db.add(Location(**row))

        # Flush so FK lookups from properties can see the just-inserted rows
        # in the same transaction.
        db.flush()

        for row in properties:
            db.add(Property(**row))

        db.commit()
        log.info("property_intelligence seed complete")
    finally:
        db.close()
