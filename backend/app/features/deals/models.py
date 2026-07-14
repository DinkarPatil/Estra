import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, String

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Deal(Base):
    """Thin deal-workflow record: lead → offer → accepted → closed."""

    __tablename__ = "deals"

    id = Column(String, primary_key=True, default=_uuid)
    property_id = Column(String, nullable=False, index=True)
    buyer_user_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    status = Column(String, nullable=False, default="lead", index=True)
    offer_amount = Column(Float, nullable=True)
    offer_currency = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class DealEvent(Base):
    """Audit trail of status transitions (MVP doc: 'audit trail' under hardening)."""

    __tablename__ = "deal_events"

    id = Column(String, primary_key=True, default=_uuid)
    deal_id = Column(String, ForeignKey("deals.id"), nullable=False, index=True)
    from_status = Column(String, nullable=True)
    to_status = Column(String, nullable=False)
    actor_user_id = Column(String, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=_utcnow)
