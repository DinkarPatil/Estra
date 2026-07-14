from datetime import datetime, timezone

from sqlalchemy import func
from sqlalchemy.orm import Session, selectinload

from app.features.broker.models import BrokerListing, BrokerListingImage, Lead
from app.features.broker.schemas import (
    BrokerListingCreate,
    BrokerListingDetail,
    BrokerListingImageOut,
    BrokerListingListResponse,
    BrokerListingSummary,
    BrokerListingUpdate,
    DashboardKPI,
    DashboardResponse,
    LeadCreate,
    LeadListResponse,
    LeadResponse,
    LeadUpdate,
)


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


# ─── Dashboard ───


def get_dashboard(broker_id: str, db: Session) -> DashboardResponse:
    """Aggregate KPIs for the broker dashboard."""
    total_leads = db.query(func.count(Lead.id)).filter(Lead.broker_id == broker_id).scalar() or 0
    active_leads = (
        db.query(func.count(Lead.id))
        .filter(Lead.broker_id == broker_id, Lead.status.in_(["new", "contacted", "qualified"]))
        .scalar()
        or 0
    )
    total_listings = (
        db.query(func.count(BrokerListing.id)).filter(BrokerListing.broker_id == broker_id).scalar() or 0
    )
    published_listings = (
        db.query(func.count(BrokerListing.id))
        .filter(BrokerListing.broker_id == broker_id, BrokerListing.status == "published")
        .scalar()
        or 0
    )

    status_counts = (
        db.query(Lead.status, func.count(Lead.id))
        .filter(Lead.broker_id == broker_id)
        .group_by(Lead.status)
        .all()
    )

    kpis = [
        DashboardKPI(label="Total Leads", value=total_leads, change=None, direction=None),
        DashboardKPI(label="Active Leads", value=active_leads, change=None, direction=None),
        DashboardKPI(label="Total Listings", value=total_listings, change=None, direction=None),
        DashboardKPI(label="Published Listings", value=published_listings, change=None, direction=None),
    ]
    for status, count in status_counts:
        kpis.append(
            DashboardKPI(label=f"Status: {status.title()}", value=count, change=None, direction=None)
        )

    recent = (
        db.query(Lead)
        .filter(Lead.broker_id == broker_id)
        .order_by(Lead.created_at.desc())
        .limit(10)
        .all()
    )
    activity = [
        {
            "lead_id": l.id,
            "name": l.name,
            "status": l.status,
            "created_at": l.created_at.isoformat() if l.created_at else None,
        }
        for l in recent
    ]

    return DashboardResponse(kpis=kpis, recent_activity=activity)


# ─── Leads CRUD ───


def list_leads(
    broker_id: str,
    db: Session,
    status: str | None = None,
    limit: int = 50,
    offset: int = 0,
) -> LeadListResponse:
    query = db.query(Lead).filter(Lead.broker_id == broker_id)
    if status:
        query = query.filter(Lead.status == status)

    total = query.count()
    leads = query.order_by(Lead.created_at.desc()).offset(offset).limit(limit).all()

    return LeadListResponse(
        total=total,
        leads=[LeadResponse.model_validate(l) for l in leads],
    )


def get_lead(broker_id: str, lead_id: str, db: Session) -> LeadResponse | None:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.broker_id == broker_id).first()
    if not lead:
        return None
    return LeadResponse.model_validate(lead)


def create_lead(broker_id: str, data: LeadCreate, db: Session) -> LeadResponse:
    lead = Lead(
        broker_id=broker_id,
        name=data.name,
        email=data.email,
        phone=data.phone,
        status="new",
        source=data.source,
        budget_min=data.budget_min,
        budget_max=data.budget_max,
        property_type=data.property_type,
        notes=data.notes,
    )
    db.add(lead)
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


def update_lead(broker_id: str, lead_id: str, data: LeadUpdate, db: Session) -> LeadResponse | None:
    lead = db.query(Lead).filter(Lead.id == lead_id, Lead.broker_id == broker_id).first()
    if not lead:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lead, key, value)
    lead.updated_at = _utcnow()

    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


# ─── Broker Listings (DB-backed CRUD) ───


def _listing_to_summary(listing: BrokerListing) -> BrokerListingSummary:
    cover = None
    if listing.images:
        cover = listing.images[0].url
    return BrokerListingSummary(
        id=listing.id,
        broker_id=listing.broker_id,
        title=listing.title,
        listing_type=listing.listing_type,
        property_type=listing.property_type,
        bedrooms=listing.bedrooms,
        bathrooms=listing.bathrooms,
        area_sqft=listing.area_sqft,
        price_inr=listing.price_inr,
        city=listing.city,
        locality=listing.locality,
        status=listing.status,
        cover_image=cover,
        created_at=listing.created_at,
    )


def _listing_to_detail(listing: BrokerListing) -> BrokerListingDetail:
    return BrokerListingDetail(
        id=listing.id,
        broker_id=listing.broker_id,
        title=listing.title,
        description=listing.description,
        listing_type=listing.listing_type,
        property_type=listing.property_type,
        bedrooms=listing.bedrooms,
        bathrooms=listing.bathrooms,
        area_sqft=listing.area_sqft,
        price_inr=listing.price_inr,
        city=listing.city,
        locality=listing.locality,
        address=listing.address,
        latitude=listing.latitude,
        longitude=listing.longitude,
        map_url=listing.map_url,
        status=listing.status,
        created_at=listing.created_at,
        updated_at=listing.updated_at,
        images=[BrokerListingImageOut.model_validate(img) for img in listing.images],
    )


def list_broker_listings(
    db: Session,
    broker_id: str | None = None,
    *,
    city: str | None = None,
    locality: str | None = None,
    listing_type: str | None = None,
    property_type: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    bedrooms: int | None = None,
    status: str | None = "published",
    limit: int = 50,
    offset: int = 0,
) -> BrokerListingListResponse:
    """Return broker listings with optional filters.

    When ``broker_id`` is provided the result is scoped to that broker
    (used by /broker/listings). When omitted, all brokers' listings are
    visible — used by the public investor search path.
    """
    query = db.query(BrokerListing).options(selectinload(BrokerListing.images))

    if broker_id is not None:
        query = query.filter(BrokerListing.broker_id == broker_id)
    if status is not None:
        query = query.filter(BrokerListing.status == status)
    if city:
        query = query.filter(func.lower(BrokerListing.city) == city.lower())
    if locality:
        like = f"%{locality.lower()}%"
        query = query.filter(func.lower(BrokerListing.locality).like(like))
    if listing_type:
        query = query.filter(BrokerListing.listing_type == listing_type)
    if property_type:
        query = query.filter(BrokerListing.property_type == property_type)
    if bedrooms is not None:
        query = query.filter(BrokerListing.bedrooms == bedrooms)
    if min_price is not None:
        query = query.filter(BrokerListing.price_inr >= min_price)
    if max_price is not None:
        query = query.filter(BrokerListing.price_inr <= max_price)

    total = query.count()
    rows = (
        query.order_by(BrokerListing.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )
    return BrokerListingListResponse(
        total=total,
        listings=[_listing_to_summary(r) for r in rows],
    )


def get_broker_listing(db: Session, listing_id: str) -> BrokerListingDetail | None:
    listing = (
        db.query(BrokerListing)
        .options(selectinload(BrokerListing.images))
        .filter(BrokerListing.id == listing_id)
        .first()
    )
    if not listing:
        return None
    return _listing_to_detail(listing)


def create_broker_listing(
    db: Session, broker_id: str, data: BrokerListingCreate
) -> BrokerListingDetail:
    listing = BrokerListing(
        broker_id=broker_id,
        title=data.title,
        description=data.description,
        listing_type=data.listing_type,
        property_type=data.property_type,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        area_sqft=data.area_sqft,
        price_inr=data.price_inr,
        city=data.city,
        locality=data.locality,
        address=data.address,
        latitude=data.latitude,
        longitude=data.longitude,
        map_url=data.map_url,
        status=data.status or "published",
    )
    db.add(listing)
    db.flush()  # populate listing.id

    for idx, img in enumerate(data.images):
        db.add(
            BrokerListingImage(
                listing_id=listing.id,
                url=img.url,
                display_order=img.display_order if img.display_order is not None else idx,
            )
        )
    db.commit()
    db.refresh(listing)
    return _listing_to_detail(listing)


def update_broker_listing(
    db: Session, broker_id: str, listing_id: str, data: BrokerListingUpdate
) -> BrokerListingDetail | None:
    listing = (
        db.query(BrokerListing)
        .options(selectinload(BrokerListing.images))
        .filter(BrokerListing.id == listing_id, BrokerListing.broker_id == broker_id)
        .first()
    )
    if not listing:
        return None

    payload = data.model_dump(exclude_unset=True)
    images = payload.pop("images", None)
    for key, value in payload.items():
        setattr(listing, key, value)
    listing.updated_at = _utcnow()

    if images is not None:
        # Replace the image set wholesale.
        for existing in list(listing.images):
            db.delete(existing)
        db.flush()
        for idx, img in enumerate(images):
            db.add(
                BrokerListingImage(
                    listing_id=listing.id,
                    url=img["url"],
                    display_order=img.get("display_order") if img.get("display_order") is not None else idx,
                )
            )

    db.commit()
    db.refresh(listing)
    return _listing_to_detail(listing)


def delete_broker_listing(db: Session, broker_id: str, listing_id: str) -> bool:
    listing = (
        db.query(BrokerListing)
        .filter(BrokerListing.id == listing_id, BrokerListing.broker_id == broker_id)
        .first()
    )
    if not listing:
        return False
    db.delete(listing)
    db.commit()
    return True


def count_listings_for_area(db: Session, area_name: str, city: str | None = None) -> int:
    """Count published broker listings whose locality matches ``area_name``.

    Mirrors the forgiving first-word substring match used elsewhere so
    counts stay consistent with what the search pipeline actually returns.
    """
    if not area_name:
        return 0
    base = area_name.split(",")[0].strip().lower()
    if not base:
        return 0
    first_word = base.split()[0]

    query = db.query(func.count(BrokerListing.id)).filter(
        BrokerListing.status == "published"
    )
    if city:
        query = query.filter(func.lower(BrokerListing.city) == city.lower())
    pattern = f"%{first_word}%"
    query = query.filter(func.lower(BrokerListing.locality).like(pattern))
    return int(query.scalar() or 0)
