"""FastAPI router for AI property recommendation / comparison."""

from __future__ import annotations

from fastapi import APIRouter

from .schemas import RecommendationRequest, RecommendationResponse
from .service import get_recommendations

router = APIRouter(prefix="/recommendation", tags=["recommendation"])


@router.post("/compare", response_model=RecommendationResponse)
def compare(req: RecommendationRequest) -> RecommendationResponse:
    """Compare and rank a set of property listings against a free-text query.

    Body shape: see :class:`RecommendationRequest`. The endpoint resolves the
    property pool in this order: ``properties`` (inline) → ``property_ids``
    (filter on disk) → all entries in ``data/listings.json``.
    """
    payload = get_recommendations(
        user_query=req.user_query or "",
        properties=req.properties,
        property_ids=req.property_ids,
        top_n=req.top_n,
    )
    return RecommendationResponse(**payload)
