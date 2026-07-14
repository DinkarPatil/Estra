from pydantic import BaseModel, Field


class RankRequest(BaseModel):
    property_ids: list[str] = Field(..., min_length=1)
    preferences: dict = Field(default_factory=dict)


class RankedItem(BaseModel):
    property_id: str
    score: float
    explanation: list[str] = Field(default_factory=list)


class RankResponse(BaseModel):
    items: list[RankedItem]


class CompareRequest(BaseModel):
    property_ids: list[str] = Field(..., min_length=2, max_length=5)
    preferences: dict = Field(default_factory=dict)


class PropertySnapshot(BaseModel):
    property_id: str
    title: str | None = None
    locality: str | None = None
    city: str | None = None
    price_inr: float | None = None
    price_per_sqft: float | None = None
    area_sqft: float | None = None
    bedrooms: int | None = None
    bathrooms: int | None = None
    floor_level: int | None = None
    rera_number: str | None = None
    project_age: str | None = None  # e.g. "1-5 years", "5-10 years"
    facing: str | None = None
    amenities: list[str] = Field(default_factory=list)

    # Area intelligence overlay
    area_name: str | None = None
    trend_1yr_pct: float | None = None
    trend_3yr_pct: float | None = None
    trend_5yr_pct: float | None = None
    latest_psf: float | None = None
    rental_yield_pct: float | None = None
    downside_risk_score: float | None = None
    uplift_potential_score: float | None = None
    infra_impact_score: float | None = None
    liquidity_demand_score: float | None = None


class Highlights(BaseModel):
    best_value: str | None = Field(None, description="Property ID with lowest price_per_sqft")
    highest_growth: str | None = Field(None, description="Property ID in area with highest 3yr trend")
    safest_bet: str | None = Field(None, description="Property ID with lowest downside_risk_score")
    best_rental: str | None = Field(None, description="Property ID in area with highest rental_yield")
    most_affordable: str | None = Field(None, description="Property ID with lowest total price")


class CompareResponse(BaseModel):
    properties: list[PropertySnapshot]
    highlights: Highlights = Field(default_factory=Highlights)
    ai_summary: str = Field(default="", description="Gemini-generated investment comparison narrative")
    decision_cues: list[str] = Field(default_factory=list, description="2-3 short tags like ['Pick A for rental', 'Pick B for appreciation']")
