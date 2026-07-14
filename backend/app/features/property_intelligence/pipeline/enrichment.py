from sqlalchemy.orm import Session

from app.core.logging import get_pipeline_logger
from app.features.property_intelligence.models import Developer, Location, Property
from app.features.property_intelligence.schemas import PropertyDetail

log = get_pipeline_logger("property.enrichment")


def run(db: Session, property_id: str) -> PropertyDetail | None:
    """Join Property + Developer + Location → PropertyDetail. None if not found."""
    log.info("enriching property %s", property_id)

    row = (
        db.query(Property, Developer, Location)
        .outerjoin(Developer, Property.developer_id == Developer.id)
        .outerjoin(Location, Property.location_id == Location.id)
        .filter(Property.id == property_id)
        .first()
    )
    if row is None:
        return None

    prop, dev, loc = row
    return PropertyDetail(
        id=prop.id,
        title=prop.title,
        description=prop.description,
        property_type=prop.property_type,
        price=prop.price,
        currency=prop.currency,
        bedrooms=prop.bedrooms,
        bathrooms=prop.bathrooms,
        area=prop.area,
        area_unit=prop.area_unit,
        status=prop.status,
        developer=dev.name if dev else None,
        city=loc.city if loc else None,
        country=loc.country if loc else None,
        region=loc.region if loc else None,
        latitude=loc.latitude if loc else None,
        longitude=loc.longitude if loc else None,
    )
