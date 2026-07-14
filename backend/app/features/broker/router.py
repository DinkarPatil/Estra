from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.auth.dependencies import get_current_user
from app.features.auth.models import User
from app.features.broker import service
from app.features.broker.schemas import (
    BrokerListingCreate,
    BrokerListingDetail,
    BrokerListingListResponse,
    BrokerListingUpdate,
    DashboardResponse,
    LeadCreate,
    LeadListResponse,
    LeadResponse,
    LeadUpdate,
)

router = APIRouter(prefix="/broker", tags=["Broker"])


# ─── Dashboard ───


@router.get("/dashboard", response_model=DashboardResponse)
def dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Aggregate KPIs for the broker dashboard."""
    return service.get_dashboard(broker_id=current_user.id, db=db)


# ─── Leads CRUD ───


@router.get("/leads", response_model=LeadListResponse)
def list_leads(
    status: str | None = Query(None, description="Filter by status (new, contacted, qualified, viewing, negotiation, closed, lost)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List leads for the current broker."""
    return service.list_leads(
        broker_id=current_user.id,
        db=db,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/leads/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a single lead by ID."""
    lead = service.get_lead(broker_id=current_user.id, lead_id=lead_id, db=db)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


@router.post("/leads", response_model=LeadResponse, status_code=201)
def create_lead(
    body: LeadCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new lead."""
    return service.create_lead(broker_id=current_user.id, data=body, db=db)


@router.patch("/leads/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: str,
    body: LeadUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update lead fields (e.g. status change)."""
    lead = service.update_lead(broker_id=current_user.id, lead_id=lead_id, data=body, db=db)
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead


# ─── Broker Listings CRUD ───


@router.get("/listings", response_model=BrokerListingListResponse)
def list_listings(
    city: str | None = None,
    locality: str | None = None,
    listing_type: str | None = None,
    property_type: str | None = None,
    bedrooms: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    status: str | None = Query(None, description="draft | published | sold (default: all when authenticated)"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List the current broker's own listings."""
    return service.list_broker_listings(
        db,
        broker_id=current_user.id,
        city=city,
        locality=locality,
        listing_type=listing_type,
        property_type=property_type,
        bedrooms=bedrooms,
        min_price=min_price,
        max_price=max_price,
        status=status,
        limit=limit,
        offset=offset,
    )


@router.get("/listings/{listing_id}", response_model=BrokerListingDetail)
def get_listing(
    listing_id: str,
    db: Session = Depends(get_db),
):
    """Public single-listing view (used by both broker and investor pages)."""
    detail = service.get_broker_listing(db, listing_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Listing not found")
    return detail


@router.post("/listings", response_model=BrokerListingDetail, status_code=201)
def create_listing(
    body: BrokerListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new property listing for the current broker."""
    return service.create_broker_listing(db, broker_id=current_user.id, data=body)


@router.patch("/listings/{listing_id}", response_model=BrokerListingDetail)
def update_listing(
    listing_id: str,
    body: BrokerListingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update a listing the broker owns."""
    detail = service.update_broker_listing(db, broker_id=current_user.id, listing_id=listing_id, data=body)
    if not detail:
        raise HTTPException(status_code=404, detail="Listing not found")
    return detail


@router.delete("/listings/{listing_id}", status_code=204)
def delete_listing(
    listing_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete a listing the broker owns."""
    ok = service.delete_broker_listing(db, broker_id=current_user.id, listing_id=listing_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Listing not found")
    return None
