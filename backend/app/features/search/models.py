import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, String, Text

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class SearchQuery(Base):
    """Audit log of every natural-language search (for replay + observability)."""

    __tablename__ = "search_queries"

    id = Column(String, primary_key=True, default=_uuid)
    user_id = Column(String, nullable=True, index=True)
    raw_query = Column(Text, nullable=False)
    parsed_intent = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
