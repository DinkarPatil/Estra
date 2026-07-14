from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, selectinload

from app.core.database import get_db
from app.core.dependencies import Pagination, pagination_params
from app.features.broker.models import BrokerListing
from app.features.property_intelligence import cache, deepdive_service, qa_service
from app.features.property_intelligence.schemas import (
    DeepDiveResponse,
    PropertyDetail,
    PropertyListResponse,
    QARequest,
    QAResponse,
)

router = APIRouter(prefix="/properties", tags=["Property Intelligence"])


@router.get("", response_model=PropertyListResponse)
def list_properties(
    city: str | None = None,
    locality: str | None = Query(None, description="e.g. Bandra, Kalyani Nagar"),
    property_type: str | None = Query(None, description="e.g. 2 BHK, villa"),
    listing_type: str | None = Query(None, description="sale | rent"),
    source: str | None = Query(None, description="e.g. 99acres_2026_04_project"),
    min_price: float | None = Query(None, ge=0),
    max_price: float | None = Query(None, ge=0),
    min_bedrooms: int | None = Query(None, ge=0),
    max_bedrooms: int | None = Query(None, ge=0),
    pagination: Pagination = Depends(pagination_params),
) -> PropertyListResponse:
    """List property listings from the in-memory JSON cache."""
    return cache.list_properties(
        city=city,
        locality=locality,
        property_type=property_type,
        listing_type=listing_type,
        source=source,
        min_price=min_price,
        max_price=max_price,
        min_bedrooms=min_bedrooms,
        max_bedrooms=max_bedrooms,
        limit=pagination.limit,
        offset=pagination.offset,
    )


@router.get("/{property_id}", response_model=PropertyDetail)
def get_property(property_id: str, db: Session = Depends(get_db)) -> PropertyDetail:
    """Fetch a single property listing by ID.

    Tries the broker_listings DB first (canonical source for the demo),
    then falls back to the legacy in-memory JSON cache for any older IDs
    that pre-date the broker-first migration.
    """
    listing = (
        db.query(BrokerListing)
        .options(selectinload(BrokerListing.images))
        .filter(BrokerListing.id == property_id)
        .first()
    )
    if listing is not None:
        psf = None
        if listing.area_sqft and listing.area_sqft > 0 and listing.price_inr:
            psf = round(float(listing.price_inr) / float(listing.area_sqft), 2)
        return PropertyDetail.model_validate({
            "id": listing.id,
            "source": "broker",
            "listing_type": listing.listing_type,
            "title": listing.title,
            "city": listing.city,
            "state": None,
            "locality_text": listing.locality,
            "bedrooms": listing.bedrooms,
            "bathrooms": listing.bathrooms,
            "area_sqft": listing.area_sqft,
            "price_inr": listing.price_inr,
            "price_per_sqft": psf,
            "external_id": None,
            "raw": listing.description,
            "scraped_at": listing.created_at,
            "last_seen_at": listing.updated_at,
        })

    result = cache.get_property(property_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Property listing not found")
    return PropertyDetail.model_validate(result)


@router.get("/{property_id}/deepdive", response_model=DeepDiveResponse)
async def get_deepdive(property_id: str) -> DeepDiveResponse:
    """Generate a detailed investment deep-dive report for a single property.

    Checks in-memory cache first; falls back to Gemini generation on miss.
    """
    return await deepdive_service.generate(property_id)


@router.post("/{property_id}/qa", response_model=QAResponse)
async def property_qa(property_id: str, body: QARequest) -> QAResponse:
    """Answer a follow-up question about a specific property.

    Loads the property's deep-dive (cache-hit in practice) and stuffs the full
    report + area signals into the Gemini prompt. Prior turns in the session
    can be passed via ``history`` so follow-ups stay in-topic.
    """
    return await qa_service.answer(
        property_id,
        body.question,
        body.history,
        body.additional_property_ids,
    )
