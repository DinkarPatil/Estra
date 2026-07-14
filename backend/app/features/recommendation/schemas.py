"""Pydantic request / response schemas for the recommendation feature."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class RecommendationRequest(BaseModel):
    user_query: str = Field(
        "",
        description="Free-text user intent, e.g. '2 BHK in Pune under 1 Cr with good ROI'",
    )
    property_ids: Optional[List[str]] = Field(
        default=None,
        description="Optional subset of property ids to compare. If omitted, the "
                    "service ranks all listings and uses the top 5.",
    )
    properties: Optional[List[Dict[str, Any]]] = Field(
        default=None,
        description="Optional inline property records — overrides property_ids and "
                    "the on-disk listings.json. Used by the frontend Compare page.",
    )
    top_n: int = Field(default=5, ge=2, le=10, description="How many to send to Gemini.")


class RankedPropertyOut(BaseModel):
    id: Optional[str] = None
    title: Optional[str] = None
    score: float
    reason: str
    pros: List[str] = Field(default_factory=list)
    cons: List[str] = Field(default_factory=list)
    breakdown: Dict[str, float] = Field(default_factory=dict)
    property: Dict[str, Any] = Field(default_factory=dict)


class IntentOut(BaseModel):
    raw_query: str
    city: Optional[str] = None
    bhk: Optional[int] = None
    budget_inr: Optional[int] = None
    target_area_sqft: Optional[int] = None
    wants_high_roi: bool = False
    wants_low_risk: bool = False
    wants_high_risk: bool = False


class RecommendationResponse(BaseModel):
    intent: IntentOut
    ranked_properties: List[RankedPropertyOut]
    comparison_summary: str
    final_recommendation: str
    tradeoffs: List[str]
    risks: List[str] = Field(default_factory=list)
    source: str = Field(
        description="'gemini' if the AI narrative was used, 'offline' if the "
                    "deterministic fallback ran (no API key or call failed).",
    )
    source_detail: Optional[str] = Field(
        default=None,
        description="Why the AI fallback engaged, when source == 'offline'. "
                    "E.g. 'GEMINI_API_KEY not set' or 'free-tier overloaded'.",
    )
