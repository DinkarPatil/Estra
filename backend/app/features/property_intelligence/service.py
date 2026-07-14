from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.features.property_intelligence.models import PropertyListing
from app.features.property_intelligence.schemas import (
    PropertyDetail,
    PropertyListResponse,
    PropertySummary,
)

log = get_logger("features.property_intelligence.service")


def list_properties(
    db: Session,
    *,
    city: str | None = None,
    locality: str | None = None,
    property_type: str | None = None,
    listing_type: str | None = None,
    source: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_bedrooms: int | None = None,
    max_bedrooms: int | None = None,
    limit: int = 20,
    offset: int = 0,
) -> PropertyListResponse:
    """List property listings with basic filters + pagination."""
    q = db.query(PropertyListing)

    if city:
        q = q.filter(PropertyListing.city.ilike(f"%{city}%"))
    if locality:
        q = q.filter(PropertyListing.locality_text.ilike(f"%{locality}%"))
    if property_type:
        # Simple contains check for property type (e.g. "2 BHK" in title or raw)
        q = q.filter(PropertyListing.title.ilike(f"%{property_type}%"))
    if listing_type:
        q = q.filter(PropertyListing.listing_type == listing_type)
    if source:
        q = q.filter(PropertyListing.source == source)
    if min_price is not None:
        q = q.filter(PropertyListing.price_inr >= min_price)
    if max_price is not None:
        q = q.filter(PropertyListing.price_inr <= max_price)
    if min_bedrooms is not None:
        q = q.filter(PropertyListing.bedrooms >= min_bedrooms)
    if max_bedrooms is not None:
        q = q.filter(PropertyListing.bedrooms <= max_bedrooms)

    total = q.count()
    rows = q.order_by(PropertyListing.scraped_at.desc()).offset(offset).limit(limit).all()

    items = [
        PropertySummary(
            id=p.id,
            source=p.source,
            listing_type=p.listing_type,
            title=p.title,
            city=p.city,
            state=p.state,
            locality_text=p.locality_text,
            bedrooms=p.bedrooms,
            bathrooms=p.bathrooms,
            area_sqft=p.area_sqft,
            price_inr=p.price_inr,
            price_per_sqft=p.price_per_sqft,
        )
        for p in rows
    ]

    return PropertyListResponse(items=items, total=total, limit=limit, offset=offset)


def get_property(db: Session, property_id: str) -> PropertyDetail | None:
    """Fetch a single property listing by ID."""
    p = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
    if p is None:
        return None

    return PropertyDetail(
        id=p.id,
        source=p.source,
        listing_type=p.listing_type,
        title=p.title,
        city=p.city,
        state=p.state,
        locality_text=p.locality_text,
        bedrooms=p.bedrooms,
        bathrooms=p.bathrooms,
        area_sqft=p.area_sqft,
        price_inr=p.price_inr,
        price_per_sqft=p.price_per_sqft,
        external_id=p.external_id,
        raw=p.raw,
        scraped_at=p.scraped_at,
        last_seen_at=p.last_seen_at,
    )
