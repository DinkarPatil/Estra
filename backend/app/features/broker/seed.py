"""Seed broker leads + broker listings for development / demo."""

import json
from datetime import datetime, timezone
from pathlib import Path

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.features.auth.models import User
from app.features.broker.models import BrokerListing, Lead

log = get_logger("broker.seed")

LISTINGS_JSON = Path(__file__).resolve().parents[3] / "data" / "cache" / "properties_db.json"
LISTING_INSERT_CHUNK = 2000


SEED_LEADS = [
    {"name": "Raj Patel", "email": "raj@example.com", "phone": "+91-9876543210", "status": "new", "source": "website", "budget_min": 80_00_000, "budget_max": 1_50_00_000, "property_type": "2 BHK"},
    {"name": "Emma Watson", "email": "emma@example.com", "phone": "+91-9876543211", "status": "contacted", "source": "referral", "budget_min": 2_00_00_000, "budget_max": 5_00_00_000, "property_type": "villa"},
    {"name": "Ahmed Al-Rashid", "email": "ahmed@example.com", "phone": "+91-9876543212", "status": "qualified", "source": "website", "budget_min": 75_00_000, "budget_max": 1_20_00_000, "property_type": "3 BHK"},
    {"name": "Sophie Chen", "email": "sophie@example.com", "phone": "+91-9876543213", "status": "viewing", "source": "agent", "budget_min": 1_50_00_000, "budget_max": 3_00_00_000, "property_type": "penthouse"},
    {"name": "Michael Turner", "email": "michael@example.com", "phone": "+91-9876543214", "status": "negotiation", "source": "referral", "budget_min": 3_00_00_000, "budget_max": 8_00_00_000, "property_type": "villa"},
    {"name": "Priya Sharma", "email": "priya@example.com", "phone": "+91-9876543215", "status": "closed", "source": "website", "budget_min": 60_00_000, "budget_max": 90_00_000, "property_type": "2 BHK"},
    {"name": "Carlos Mendez", "email": "carlos@example.com", "phone": "+91-9876543216", "status": "new", "source": "walk-in", "budget_min": 1_00_00_000, "budget_max": 2_50_00_000, "property_type": "3 BHK"},
    {"name": "Aisha Khan", "email": "aisha@example.com", "phone": "+91-9876543217", "status": "contacted", "source": "website", "budget_min": 90_00_000, "budget_max": 1_80_00_000, "property_type": "apartment"},
]


def seed_leads(db: Session) -> None:
    """Insert seed leads if table is empty."""
    existing = db.query(Lead).first()
    if existing:
        return  # already seeded

    # Pick a broker user to associate leads with (first broker found)
    broker = db.query(User).filter(User.role == "broker").first()
    if not broker:
        return  # no broker user yet, skip

    for data in SEED_LEADS:
        lead = Lead(
            broker_id=broker.id,
            **data,
        )
        db.add(lead)

    db.commit()


def _parse_dt(value: str | None) -> datetime | None:
    """Parse an ISO timestamp into a naive-UTC datetime (the convention used by the model)."""
    if not value:
        return None
    try:
        dt = datetime.fromisoformat(value)
    except ValueError:
        return None
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt


def seed_broker_listings(db: Session) -> None:
    """Bulk-load cleaned property catalogue from ``data/cache/properties_db.json``.

    Idempotent: bails out if any ``broker_listings`` row already exists.
    No-ops if the JSON cache is missing or no broker user has been seeded yet.
    """
    if db.query(BrokerListing.id).first() is not None:
        return

    if not LISTINGS_JSON.exists():
        log.warning("broker_listings seed skipped: %s not found", LISTINGS_JSON)
        return

    broker = db.query(User).filter(User.role == "broker").first()
    if broker is None:
        log.warning("broker_listings seed skipped: no broker user exists yet")
        return

    with LISTINGS_JSON.open("r", encoding="utf-8") as fh:
        rows = json.load(fh)

    batch: list[dict] = []
    inserted = 0
    for row in rows:
        batch.append({
            "id": row["id"],
            "broker_id": broker.id,  # JSON's synthetic broker_id is replaced with a real user
            "title": row["title"],
            "description": row.get("description"),
            "listing_type": row["listing_type"],
            "property_type": row["property_type"],
            "bedrooms": row["bedrooms"],
            "bathrooms": row.get("bathrooms"),
            "area_sqft": row["area_sqft"],
            "price_inr": row["price_inr"],
            "city": row["city"],
            "locality": row["locality"],
            "address": row.get("address"),
            "latitude": row.get("latitude"),
            "longitude": row.get("longitude"),
            "map_url": row.get("map_url"),
            "embedding": row.get("embedding"),
            "status": row.get("status") or "published",
            "created_at": _parse_dt(row.get("created_at")),
            "updated_at": _parse_dt(row.get("updated_at")),
        })
        if len(batch) >= LISTING_INSERT_CHUNK:
            db.bulk_insert_mappings(BrokerListing, batch)
            inserted += len(batch)
            batch.clear()

    if batch:
        db.bulk_insert_mappings(BrokerListing, batch)
        inserted += len(batch)

    db.commit()
    log.info("broker_listings seeded: %s rows", inserted)
