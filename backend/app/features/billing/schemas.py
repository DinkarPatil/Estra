from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field

PlanId = Literal["basic", "pro", "enterprise"]


class VerifyPaymentRequest(BaseModel):
    plan_id: PlanId = Field(..., description="Plan the user paid for.")
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    amount_paise: int = Field(..., ge=1)


class UserPlanResponse(BaseModel):
    plan_id: PlanId
    payment_id: str
    order_id: Optional[str] = None
    amount_paise: int
    currency: str
    paid_at: datetime

    class Config:
        from_attributes = True


class MePlanResponse(BaseModel):
    """Wrapped response so the absence of a plan is a valid JSON body
    (``{"plan": null}``) rather than a 404."""

    plan: Optional[UserPlanResponse] = None
