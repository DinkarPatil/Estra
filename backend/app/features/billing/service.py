import hmac
from hashlib import sha256

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.features.billing.models import UserPlan
from app.features.billing.schemas import VerifyPaymentRequest

log = get_logger("features.billing.service")


def verify_signature(payload: VerifyPaymentRequest, secret: str) -> bool:
    """Validate Razorpay's HMAC SHA256 of ``order_id|payment_id``."""
    expected = hmac.new(
        secret.encode("utf-8"),
        f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode("utf-8"),
        sha256,
    ).hexdigest()
    return hmac.compare_digest(expected, payload.razorpay_signature)


def get_plan_for_user(db: Session, user_id: str) -> UserPlan | None:
    return db.query(UserPlan).filter(UserPlan.user_id == user_id).first()


def upsert_plan(db: Session, user_id: str, payload: VerifyPaymentRequest) -> UserPlan:
    row = db.query(UserPlan).filter(UserPlan.user_id == user_id).first()
    if row is None:
        row = UserPlan(user_id=user_id)
        db.add(row)
    row.plan_id = payload.plan_id
    row.payment_id = payload.razorpay_payment_id
    row.order_id = payload.razorpay_order_id
    row.signature = payload.razorpay_signature
    row.amount_paise = payload.amount_paise
    row.currency = "INR"
    db.commit()
    db.refresh(row)
    log.info("plan upserted user=%s plan=%s payment=%s", user_id, row.plan_id, row.payment_id)
    return row
