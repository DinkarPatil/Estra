from sqlalchemy.orm import Session

from app.features.geo_risk.pipeline import geo_summary, risk_score
from app.features.geo_risk.schemas import GeoRiskResponse


def summarize(db: Session, property_id: str) -> GeoRiskResponse:
    score, flags = risk_score.run(db, property_id)
    return GeoRiskResponse(
        property_id=property_id,
        risk_score=score,
        geo_summary=geo_summary.run(db, property_id),
        flags=flags,
    )
