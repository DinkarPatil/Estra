from sqlalchemy.orm import Session

from app.core.logging import get_pipeline_logger
from app.features.area_intelligence.cache import find_area_for_property
from app.features.geo_risk.pipeline.risk_score import _lookup_locality

log = get_pipeline_logger("geo_risk.geo")


def run(db: Session, property_id: str) -> dict:
    """Return a per-property geospatial snapshot pulled from the property's
    matched micro-market. Empty dict when the area can't be matched.
    """
    log.info("geo summary", extra={"property_id": property_id})
    locality, city = _lookup_locality(db, property_id)
    if not locality or not city:
        return {}

    area = find_area_for_property(locality, city)
    if area is None:
        return {}

    return {
        "area_name": area.area_name,
        "city": area.city,
        "infra_impact_score": area.infra_impact_score,
        "legal_safety_score": area.legal_safety_score,
        "downside_risk_score": area.downside_risk_score,
        "demand_strength": getattr(area.demand_strength, "value", None),
        "risk_tags": list(area.risk_tags or []),
    }
