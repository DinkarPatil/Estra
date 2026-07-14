from datetime import datetime

from pydantic import BaseModel


class DealCreate(BaseModel):
    property_id: str
    offer_amount: float | None = None
    offer_currency: str | None = None


class DealStatusUpdate(BaseModel):
    status: str  # lead | offer | accepted | closed | rejected


class DealResponse(BaseModel):
    id: str
    property_id: str
    buyer_user_id: str
    status: str
    offer_amount: float | None
    offer_currency: str | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
