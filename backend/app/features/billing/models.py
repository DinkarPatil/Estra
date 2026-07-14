from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class UserPlan(Base):
    """A paid plan record bound to a user. One row per user (PK on user_id)
    — the plan is upserted on every successful payment so the row reflects
    the user's current entitlement.
    """

    __tablename__ = "user_plans"

    user_id = Column(String, ForeignKey("users.id"), primary_key=True)
    plan_id = Column(String, nullable=False)  # 'basic' | 'pro' | 'enterprise'
    payment_id = Column(String, nullable=False)
    order_id = Column(String, nullable=True)
    signature = Column(String, nullable=True)
    amount_paise = Column(Integer, nullable=False)
    currency = Column(String, nullable=False, default="INR")
    paid_at = Column(DateTime, default=_utcnow)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    user = relationship("User")
