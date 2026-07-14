from typing import Any

from pydantic import BaseModel, Field

from app.features.property_intelligence.schemas import PropertySummary


class SearchRequest(BaseModel):
    query: str = Field(..., description="Natural-language query from the user.")
    filters: dict[str, Any] | None = None
    area_names: list[str] | None = Field(
        None,
        description="User-selected areas (area-first flow stage 2).",
    )


class SearchIntent(BaseModel):
    location: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    property_type: str | None = None
    raw_entities: dict[str, Any] = Field(default_factory=dict)


class SearchCandidate(BaseModel):
    property_id: str
    score: float
    reasons: list[str] = Field(default_factory=list)
    property: PropertySummary | None = Field(
        None,
        description=(
            "Full property details inlined from the cache so the frontend can "
            "render ranked cards without a second round-trip. Populated by the "
            "area-first (cache-backed) path; may be None on the legacy DB path."
        ),
    )


class SearchResponse(BaseModel):
    intent: SearchIntent
    candidates: list[SearchCandidate]


class AreaSignals(BaseModel):
    """Per-area metric snapshot returned alongside ranking results.

    Mirrors the fields populated by ``area_retrieval.py`` from the
    ``NormalizedAreaIntelligence`` cache. All fields are optional because
    older cached areas may be missing newer derived metrics.
    """

    historical_trend_score: float | None = None
    trend_1yr_pct: float | None = None
    trend_3yr_pct: float | None = None
    trend_5yr_pct: float | None = None
    latest_psf: float | None = None
    uplift_potential_score: float | None = None
    downside_risk_score: float | None = None
    legal_safety_score: float | None = None
    infra_impact_score: float | None = None
    market_momentum_score: float | None = None
    news_relevance_score: float | None = None
    liquidity_demand_score: float | None = None
    rental_yield_pct: float | None = None
    roi_composite_pct: float | None = None
    volatility_index: float | None = None
    demand_strength: str | None = None


class AreaCandidate(BaseModel):
    area_name: str
    city: str
    score: float
    final_area_score: float | None = None
    reasons: list[str] = Field(default_factory=list)
    signals: AreaSignals = Field(default_factory=AreaSignals)
    property_count: int = 0


class AreaSearchResponse(BaseModel):
    intent: SearchIntent
    areas: list[AreaCandidate]


# ─── Area Comparison ───


class AreaCompareRequest(BaseModel):
    area_names: list[str] = Field(..., min_length=2, max_length=10, description="Areas to compare (2–10).")
    city: str | None = Field(None, description="City to disambiguate area names.")


class AreaCompareSignal(BaseModel):
    label: str
    values: dict[str, str | float | None]  # area_name → value


class AreaCompareResponse(BaseModel):
    areas: list[dict[str, Any]]  # full area data for each
    signals: list[AreaCompareSignal]  # comparison-ready side-by-side
