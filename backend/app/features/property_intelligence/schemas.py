from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class PropertySummary(BaseModel):
    """Fields shown in a list view (cards, search results)."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    source: str
    listing_type: str
    title: str | None = None

    city: str | None = None
    state: str | None = None
    locality_text: str | None = None

    bedrooms: int | None = None
    bathrooms: int | None = None
    area_sqft: float | None = None
    price_inr: float | None = None
    price_per_sqft: float | None = None


class PropertyDetail(PropertySummary):
    """Full single-property payload for the detail page."""

    external_id: str | None = None
    raw: str | None = None
    scraped_at: datetime | None = None
    last_seen_at: datetime | None = None


class PropertyListResponse(BaseModel):
    items: list[PropertySummary]
    total: int
    limit: int
    offset: int


class DeepDiveSections(BaseModel):
    property_overview: str = ""
    area_investment_context: str = ""
    value_analysis: str = ""
    risk_compliance: str = ""
    developer_project_quality: str = ""
    amenities_lifestyle: str = ""
    final_recommendation: str = ""


class DeepDiveResponse(BaseModel):
    property_id: str
    property: dict = Field(default_factory=dict, description="Full property data with mock fields")
    area_context: dict = Field(default_factory=dict, description="Area intelligence signals")
    graph_context: dict = Field(default_factory=dict, description="Cache-derived peer/developer relationship facts")
    verdict: str = Field(default="NEUTRAL", description="STRONG_BUY | BUY | NEUTRAL | AVOID")
    narrative: str = Field(default="", description="3-5 paragraph detailed analysis")
    sections: DeepDiveSections = Field(default_factory=DeepDiveSections)
    action_items: list[str] = Field(default_factory=list)
    key_highlights: list[str] = Field(default_factory=list)
    investment_thesis: str = ""


class QAMessage(BaseModel):
    role: str = Field(description="'user' or 'bot'")
    text: str


class QARequest(BaseModel):
    question: str = Field(min_length=1, max_length=1000)
    history: list[QAMessage] = Field(
        default_factory=list,
        description="Prior turns in this QA session for this property. Last 8 are used.",
    )
    additional_property_ids: list[str] = Field(
        default_factory=list,
        description="Other shortlisted property IDs to include as comparison context. Capped server-side.",
    )


class QAResponse(BaseModel):
    property_id: str
    question: str
    answer: str
    source: str = Field(default="", description="Which deep-dive section(s) grounded the answer")
