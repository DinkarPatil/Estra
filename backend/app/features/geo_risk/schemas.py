from pydantic import BaseModel


class GeoRiskResponse(BaseModel):
    property_id: str
    risk_score: float
    geo_summary: dict
    flags: list[str] = []
