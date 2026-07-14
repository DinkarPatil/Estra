from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.property import Property
from app.schemas.property import (
    PropertyListResponse,
    PropertyResponse,
    to_property_response,
)

router = APIRouter(prefix="/properties", tags=["Properties"])


@router.get("", response_model=PropertyListResponse)
def list_properties(
    city: Optional[str] = None,
    country: Optional[str] = None,
    country_code: Optional[str] = None,
    type: Optional[str] = Query(None, description="residential | commercial | land | mixed-use | industrial"),
    status: Optional[str] = Query(None, description="available | under-offer | sold | off-market"),
    risk_score: Optional[str] = Query(None, description="low | medium | high"),
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    min_yield: Optional[float] = Query(None, ge=0),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
):
    q = db.query(Property)

    if city:
        q = q.filter(Property.city == city)
    if country:
        q = q.filter(Property.country == country)
    if country_code:
        q = q.filter(Property.country_code == country_code)
    if type:
        q = q.filter(Property.type == type)
    if status:
        q = q.filter(Property.status == status)
    if risk_score:
        q = q.filter(Property.risk_score == risk_score)
    if min_price is not None:
        q = q.filter(Property.price >= min_price)
    if max_price is not None:
        q = q.filter(Property.price <= max_price)
    if min_yield is not None:
        q = q.filter(Property.rental_yield >= min_yield)

    total = q.count()
    items = q.order_by(Property.created_at.desc()).offset(offset).limit(limit).all()

    return PropertyListResponse(
        items=[to_property_response(p) for p in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{property_id}", response_model=PropertyResponse)
def get_property(property_id: str, db: Session = Depends(get_db)):
    prop = db.query(Property).filter(Property.id == property_id).first()
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return to_property_response(prop)
