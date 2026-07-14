from pydantic import BaseModel, Field


class RoiRequest(BaseModel):
    property_id: str
    horizon_years: int = Field(5, ge=1, le=30)
    scenario: str | None = Field(None, description="base | bull | bear")


class RoiResponse(BaseModel):
    property_id: str
    rental_yield_pct: float
    appreciation_pct: float
    liquidity_score: float
    scenario_summary: dict
