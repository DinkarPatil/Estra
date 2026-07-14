from pydantic import BaseModel, Field

from app.features.compliance.schemas import ComplianceResponse
from app.features.geo_risk.schemas import GeoRiskResponse
from app.features.ranking.schemas import RankResponse
from app.features.roi.schemas import RoiResponse
from app.features.search.schemas import AreaSearchResponse, SearchResponse


class AreasRequest(BaseModel):
    """Stage 1 of the area-first flow — query only, no area selection yet."""

    query: str


class AnalyzeRequest(BaseModel):
    query: str
    buyer_country: str | None = None
    horizon_years: int = 5
    area_names: list[str] | None = Field(
        None,
        description=(
            "Stage 2 of the area-first flow. When provided, properties are "
            "restricted to these user-selected localities. When omitted, the "
            "orchestrator falls back to the flat (non-area-first) search path."
        ),
    )


class AreasResponse(AreaSearchResponse):
    """Alias kept for orchestrator symmetry with AnalyzeResponse."""


class AnalyzeResponse(BaseModel):
    """One merged payload that the frontend can render end-to-end."""

    search: SearchResponse
    ranking: RankResponse | None = None
    roi: list[RoiResponse]
    geo_risk: list[GeoRiskResponse]
    compliance: list[ComplianceResponse]
