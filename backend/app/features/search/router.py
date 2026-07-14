from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.search import service
from app.features.search.schemas import (
    AreaCompareRequest,
    AreaCompareResponse,
    AreaCompareSignal,
    AreaSearchResponse,
    SearchRequest,
    SearchResponse,
)

router = APIRouter(prefix="/search", tags=["Search"])


@router.post("/areas", response_model=AreaSearchResponse)
def search_areas(body: SearchRequest) -> AreaSearchResponse:
    """Stage 1 — Area-first search.

    Parses the user query, ranks micro-markets by normalized area scores
    and intent signals, and returns the top 5 with explanations.
    """
    return service.run_area_search(body)


@router.post("/areas/compare", response_model=AreaCompareResponse)
def compare_areas(body: AreaCompareRequest) -> AreaCompareResponse:
    """Compare micro-markets side-by-side.

    Returns a merged view with a ``signals`` array keyed by signal label
    so the frontend can render a comparison table without re-shaping.
    """
    from app.features.area_intelligence.cache import get_by_name

    if not body.city:
        # Try to infer city from the first area name
        from app.features.area_intelligence.cache import find_city_in_text

        city = find_city_in_text(body.area_names[0])
        resolved_city = city or "Pune"
    else:
        resolved_city = body.city

    areas = []
    for name in body.area_names:
        area = get_by_name(name, resolved_city)
        if area:
            areas.append(area)

    if not areas:
        raise HTTPException(status_code=404, detail="No areas found for comparison")

    # Build comparison signals
    def _safe(val, fmt: str = "raw"):
        if val is None:
            return None
        if fmt == "pct":
            return f"{val:.1f}%"
        if fmt == "short":
            return f"{val:.2f}"
        return val

    signal_defs = [
        ("Area Score", lambda a: _safe(a.final_area_score, "short")),
        ("Historical Trend", lambda a: _safe(a.historical_trend_score, "short")),
        ("Upside Potential", lambda a: _safe(a.uplift_potential_score, "short")),
        ("Downside Risk", lambda a: _safe(a.downside_risk_score, "short")),
        ("ROI Composite", lambda a: _safe(a.roi_composite_pct, "pct")),
        ("Volatility", lambda a: _safe(a.volatility_index, "short")),
        ("Demand", lambda a: a.demand_strength.value if hasattr(a.demand_strength, 'value') else str(a.demand_strength)),
    ]

    signals = []
    for label, extractor in signal_defs:
        values = {}
        for area in areas:
            values[area.area_name] = extractor(area)
        signals.append(AreaCompareSignal(label=label, values=values))

    area_dicts = []
    for area in areas:
        d = area.model_dump()
        # Serialize enum field
        if "demand_strength" in d and hasattr(d["demand_strength"], "value"):
            d["demand_strength"] = d["demand_strength"].value
        area_dicts.append(d)

    return AreaCompareResponse(areas=area_dicts, signals=signals)


@router.post("", response_model=SearchResponse)
def search(body: SearchRequest, db: Session = Depends(get_db)) -> SearchResponse:
    """Stage 2 — Property search.

    When ``area_names`` is provided (area-first flow), filters properties
    to only those localities and reads from the in-memory JSON cache.

    Otherwise falls back to the original DB-backed candidate retrieval.
    """
    return service.run_search(db, body)
