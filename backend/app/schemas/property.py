import json
from typing import Optional

from pydantic import BaseModel, ConfigDict

from app.models.property import Property


# --- Nested sub-shapes (match src/types/property.ts and src/types/common.ts) ---

class Coordinates(BaseModel):
    lat: float
    lng: float


class PropertyLocation(BaseModel):
    address: Optional[str] = None
    city: str
    state: Optional[str] = None
    country: str
    countryCode: str
    coordinates: Coordinates
    neighborhood: Optional[str] = None


class MoneyAmount(BaseModel):
    amount: float
    currency: str


class Area(BaseModel):
    value: float
    unit: str  # 'sqft' | 'sqm'


# --- Property response (mirrors the TypeScript Property interface) ---

class PropertyResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    id: str
    title: str
    description: str
    location: PropertyLocation
    price: MoneyAmount
    type: str
    subType: str
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area: Area
    yearBuilt: int
    developer: str
    aiScore: int
    rentalYield: float
    capitalAppreciation: float
    riskScore: str
    images: list[str]
    features: list[str]
    status: str
    isFractional: Optional[bool] = None
    isLuxury: Optional[bool] = None
    createdAt: str


class PropertyListResponse(BaseModel):
    items: list[PropertyResponse]
    total: int
    limit: int
    offset: int


# --- ORM -> response mapper ---

def to_property_response(p: Property) -> PropertyResponse:
    return PropertyResponse(
        id=p.id,
        title=p.title,
        description=p.description or "",
        location=PropertyLocation(
            city=p.city or "",
            state=p.state,
            country=p.country or "",
            countryCode=p.country_code or "",
            coordinates=Coordinates(lat=p.lat or 0.0, lng=p.lng or 0.0),
            neighborhood=p.neighborhood,
        ),
        price=MoneyAmount(amount=p.price or 0.0, currency=p.currency or "USD"),
        type=p.type or "",
        subType=p.sub_type or "",
        bedrooms=p.bedrooms,
        bathrooms=p.bathrooms,
        area=Area(value=p.area or 0.0, unit=p.area_unit or "sqft"),
        yearBuilt=p.year_built or 0,
        developer=p.developer or "",
        aiScore=p.ai_score or 0,
        rentalYield=p.rental_yield or 0.0,
        capitalAppreciation=p.capital_appreciation or 0.0,
        riskScore=p.risk_score or "low",
        images=json.loads(p.images) if p.images else [],
        features=json.loads(p.features) if p.features else [],
        status=p.status or "available",
        isFractional=bool(p.is_fractional) if p.is_fractional is not None else None,
        isLuxury=bool(p.is_luxury) if p.is_luxury is not None else None,
        createdAt=p.created_at.isoformat() + "Z" if p.created_at else "",
    )
