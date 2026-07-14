import json
from datetime import datetime
from pathlib import Path

from app.config import settings
from app.database import SessionLocal
from app.models.property import Property
from app.models.user import User
from app.services.auth import hash_password


SEED_DATA_DIR = Path(__file__).resolve().parent / "seed_data"


def seed_users():
    """Create default super_admin and admin on first boot."""
    db = SessionLocal()
    try:
        # Check if any users exist
        count = db.query(User).count()
        if count > 0:
            return  # Already seeded

        print("=" * 50)
        print("  SEEDING DEFAULT USERS")
        print("=" * 50)

        # Super Admin
        super_admin = User(
            email=settings.SEED_SUPER_ADMIN_EMAIL,
            name=settings.SEED_SUPER_ADMIN_NAME,
            country=settings.SEED_SUPER_ADMIN_COUNTRY,
            role="super_admin",
            hashed_password=hash_password(settings.SEED_SUPER_ADMIN_PASSWORD),
        )
        db.add(super_admin)
        print(f"  [+] Super Admin: {settings.SEED_SUPER_ADMIN_EMAIL}")
        print(f"      Password:    {settings.SEED_SUPER_ADMIN_PASSWORD}")

        # Admin
        admin = User(
            email=settings.SEED_ADMIN_EMAIL,
            name=settings.SEED_ADMIN_NAME,
            country=settings.SEED_ADMIN_COUNTRY,
            role="admin",
            hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
        )
        db.add(admin)
        print(f"  [+] Admin:       {settings.SEED_ADMIN_EMAIL}")
        print(f"      Password:    {settings.SEED_ADMIN_PASSWORD}")

        db.commit()
        print("=" * 50)
        print("  SEEDING COMPLETE")
        print("=" * 50)

    finally:
        db.close()


def seed_properties():
    """Load mock properties from JSON on first boot."""
    db = SessionLocal()
    try:
        if db.query(Property).count() > 0:
            return  # Already seeded

        data_file = SEED_DATA_DIR / "properties.json"
        with data_file.open("r", encoding="utf-8") as f:
            rows = json.load(f)

        print("=" * 50)
        print(f"  SEEDING {len(rows)} PROPERTIES")
        print("=" * 50)

        for row in rows:
            db.add(Property(
                id=row["id"],
                title=row["title"],
                description=row.get("description"),
                city=row.get("city"),
                state=row.get("state"),
                country=row.get("country"),
                country_code=row.get("country_code"),
                neighborhood=row.get("neighborhood"),
                lat=row.get("lat"),
                lng=row.get("lng"),
                price=row.get("price"),
                currency=row.get("currency"),
                type=row.get("type"),
                sub_type=row.get("sub_type"),
                bedrooms=row.get("bedrooms"),
                bathrooms=row.get("bathrooms"),
                area=row.get("area"),
                area_unit=row.get("area_unit"),
                year_built=row.get("year_built"),
                developer=row.get("developer"),
                ai_score=row.get("ai_score"),
                rental_yield=row.get("rental_yield"),
                capital_appreciation=row.get("capital_appreciation"),
                risk_score=row.get("risk_score"),
                images=json.dumps(row.get("images", [])),
                features=json.dumps(row.get("features", [])),
                status=row.get("status"),
                is_luxury=bool(row.get("is_luxury", False)),
                is_fractional=bool(row.get("is_fractional", False)),
                created_at=datetime.fromisoformat(
                    row["created_at"].replace("Z", "+00:00")
                ).replace(tzinfo=None),
            ))

        db.commit()
        print("  SEEDING COMPLETE")
        print("=" * 50)

    finally:
        db.close()
