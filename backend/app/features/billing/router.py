from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.auth.models import User
from app.features.billing import service
from app.features.billing.schemas import (
    MePlanResponse,
    UserPlanResponse,
    VerifyPaymentRequest,
)

router = APIRouter(tags=["billing"])


@router.get("/me/plan", response_model=MePlanResponse)
def get_my_plan(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MePlanResponse:
    row = service.get_plan_for_user(db, user.id)
    return MePlanResponse(plan=UserPlanResponse.model_validate(row) if row else None)


@router.post("/payments/verify", response_model=MePlanResponse)
def verify_and_record_payment(
    payload: VerifyPaymentRequest,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MePlanResponse:
    secret = settings.RAZORPAY_KEY_SECRET
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="RAZORPAY_KEY_SECRET is not configured on the server.",
        )
    if not service.verify_signature(payload, secret):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Razorpay signature verification failed.",
        )
    row = service.upsert_plan(db, user.id, payload)
    return MePlanResponse(plan=UserPlanResponse.model_validate(row))
