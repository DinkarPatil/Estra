from sqlalchemy.orm import Session

from app.core.logging import get_pipeline_logger
from app.features.area_intelligence.cache import find_area_for_property
from app.features.broker.models import BrokerListing
from app.features.property_intelligence.models import PropertyListing

log = get_pipeline_logger("geo_risk.score")


def _lookup_locality(db: Session, property_id: str) -> tuple[str | None, str | None]:
    """Return (locality, city) for a property — broker DB first, seed fallback."""
    bl = db.query(BrokerListing).filter(BrokerListing.id == property_id).first()
    if bl is not None:
        return bl.locality, bl.city
    pl = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
    if pl is not None:
        return pl.locality_text, pl.city
    return None, None


def run(db: Session, property_id: str) -> tuple[float, list[str]]:
    """Per-property risk score + flag tags, derived from area intelligence.

    The risk_score is `downside_risk_score` from the property's matched
    micro-market (0-100, higher = riskier). Flags are the area's risk_tags
    (seismic, flood, etc.). Returns (50.0, []) when the area can't be
    matched — neutral default, never raises.
    """
    log.info("risk score", extra={"property_id": property_id})
    locality, city = _lookup_locality(db, property_id)
    if not locality or not city:
        return 50.0, []

    area = find_area_for_property(locality, city)
    if area is None:
        return 50.0, []

    score = area.downside_risk_score if area.downside_risk_score is not None else 50.0
    return float(score), list(area.risk_tags or [])
