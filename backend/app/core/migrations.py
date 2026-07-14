from sqlalchemy import text

from app.core.database import engine
from app.core.logging import get_logger

log = get_logger("core.migrations")


def run_migrations() -> None:
    """Lightweight migration runner backed by a schema_version table."""
    with engine.connect() as conn:
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS schema_version (
                    version INTEGER PRIMARY KEY,
                    applied_at TEXT NOT NULL
                )
                """
            )
        )
        conn.commit()

        result = conn.execute(
            text("SELECT version FROM schema_version ORDER BY version DESC LIMIT 1")
        )
        row = result.fetchone()
        current_version = row[0] if row else 0

        if current_version < 1:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS blocked_tokens (
                        id TEXT PRIMARY KEY,
                        jti TEXT NOT NULL,
                        user_id TEXT NOT NULL,
                        expires_at TEXT NOT NULL,
                        blocked_at TEXT NOT NULL,
                        UNIQUE (jti)
                    )
                    """
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_blocked_tokens_jti "
                    "ON blocked_tokens(jti)"
                )
            )
            conn.execute(
                text(
                    "INSERT INTO schema_version (version, applied_at) "
                    "VALUES (1, datetime('now'))"
                )
            )
            conn.commit()
            log.info("applied migration 1 (blocked_tokens)")

        if current_version < 2:
            conn.execute(
                text(
                    """
                    CREATE TABLE IF NOT EXISTS broker_listing_images (
                        id TEXT PRIMARY KEY,
                        listing_id TEXT NOT NULL,
                        url TEXT NOT NULL,
                        display_order INTEGER NOT NULL DEFAULT 0,
                        created_at TEXT NOT NULL,
                        FOREIGN KEY (listing_id) REFERENCES broker_listings(id) ON DELETE CASCADE
                    )
                    """
                )
            )
            conn.execute(
                text(
                    "CREATE INDEX IF NOT EXISTS ix_broker_listing_images_listing_id "
                    "ON broker_listing_images(listing_id)"
                )
            )
            conn.execute(
                text(
                    "INSERT INTO schema_version (version, applied_at) "
                    "VALUES (2, datetime('now'))"
                )
            )
            conn.commit()
            log.info("applied migration 2 (broker_listing_images)")
