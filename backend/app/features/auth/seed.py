from app.core.config import settings
from app.core.database import SessionLocal
from app.core.logging import get_logger
from app.core.security import hash_password
from app.features.auth.models import User

log = get_logger("features.auth.seed")


def seed_users() -> None:
    """Create default super_admin and admin on first boot."""
    db = SessionLocal()
    try:
        if db.query(User).count() > 0:
            return

        log.info("seeding default users")

        db.add(
            User(
                email=settings.SEED_SUPER_ADMIN_EMAIL,
                name=settings.SEED_SUPER_ADMIN_NAME,
                country=settings.SEED_SUPER_ADMIN_COUNTRY,
                role="super_admin",
                hashed_password=hash_password(settings.SEED_SUPER_ADMIN_PASSWORD),
            )
        )
        db.add(
            User(
                email=settings.SEED_ADMIN_EMAIL,
                name=settings.SEED_ADMIN_NAME,
                country=settings.SEED_ADMIN_COUNTRY,
                role="admin",
                hashed_password=hash_password(settings.SEED_ADMIN_PASSWORD),
            )
        )
        # MVP broker + investor seed users
        db.add(
            User(
                email="broker@glimmora.com",
                name="James Okafor",
                country="India",
                role="broker",
                hashed_password=hash_password("broker123"),
            )
        )
        db.add(
            User(
                email="investor@glimmora.com",
                name="Sarah Chen",
                country="India",
                role="investor",
                hashed_password=hash_password("investor123"),
            )
        )

        db.commit()
        log.info(
            "seeded super_admin=%s admin=%s broker investor",
            settings.SEED_SUPER_ADMIN_EMAIL,
            settings.SEED_ADMIN_EMAIL,
        )
    finally:
        db.close()
