from typing import Any

from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.area_intelligence.schemas import MicroMarketResponse
from app.features.area_intelligence import service
from app.features.area_intelligence.normalize import (
    NormalizedAreaIntelligence,
    normalize,
)

router = APIRouter(prefix="/area-intelligence", tags=["Area Intelligence"], include_in_schema=False)

_NORMALIZE_EXAMPLE = {
    "area_name": "Kalyani Nagar",
    "city": "Pune",
    "historical_price_trend_pct": 7.8,
    "projected_uplift_pct": 12.0,
    "projected_downside_pct": -4.0,
    "volatility_index": 0.22,
    "rental_demand_strength": "High",
    "roi_trend_pct": 4.1,
    "risk_signals": "Seismic Zone III (medium) | Flood risk: Low",
    "infra_news_impact": "Metro line extension sanctioned; new ring road corridor approved.",
    "legal_regulatory_friction": "No MahaRERA complaints match projects named after Kalyani Nagar.",
    "legal_approval_signals": {"suspended_project_count": 0},
    "infrastructure_proximity": {
        "nearest_railway_station_km": 2.1,
        "nearest_bus_station_km": 0.9,
        "nearest_highway_km": 1.4,
        "nearest_airport_km": 6.2,
    },
    "livability_indicators": {
        "schools": 8, "hospitals_or_clinics": 6, "parks_or_gardens": 3,
        "restaurants_or_cafes": 25, "supermarkets_or_malls": 4,
        "banks_or_atms": 12, "pharmacies": 9, "radius_m": 1500,
    },
    "raw_data_dump": {
        "news_items": [{"title": "x"}] * 6,
        "price_metrics": {
            "median_sale_psf": 14500,
            "sample_sizes": {"sale": 40, "rent": 25},
        },
    },
}


@router.get("/areas", response_model=list[MicroMarketResponse])
def list_areas(
    city: str | None = Query(None, description="Filter by city (e.g. Pune, Mumbai)"),
    db: Session = Depends(get_db),
):
    """List all micro-markets, optionally filtered by city."""
    return service.list_areas(db, city=city)


@router.get("/areas/{area_name}", response_model=MicroMarketResponse)
def get_area(
    area_name: str,
    city: str = Query(..., description="City name (required to disambiguate)"),
    db: Session = Depends(get_db),
):
    """Get a single micro-market by name + city."""
    area = service.get_area_by_name(db, name=area_name, city=city)
    if not area:
        raise HTTPException(status_code=404, detail=f"Area '{area_name}' not found in {city}")
    return area


@router.post("/normalize", response_model=NormalizedAreaIntelligence)
def normalize_raw_area(
    raw: dict[str, Any] = Body(..., example=_NORMALIZE_EXAMPLE),
):
    """Normalize a raw area-intelligence record into the canonical
    scoring-ready format: 8 signal scores (0-100) + final weighted
    area score. Accepts either the flat analyst shape or the rich
    ingestion-worker payload (MicroMarketCreate).
    """
    return normalize(raw)


@router.get("/normalize/{area_name}", response_model=NormalizedAreaIntelligence)
def normalize_area_from_db(
    area_name: str,
    city: str = Query(..., description="City name (required to disambiguate)"),
    db: Session = Depends(get_db),
):
    """Pull a stored micro-market from the DB and normalize it on the fly.

    Convenience endpoint for testing: lets you see the normalized record
    for any seeded area without hand-typing a JSON payload.
    """
    area = service.get_area_by_name(db, name=area_name, city=city)
    if not area:
        raise HTTPException(
            status_code=404,
            detail=f"Area '{area_name}' not found in {city}",
        )
    raw = {c.name: getattr(area, c.name) for c in area.__table__.columns}
    return normalize(raw)
