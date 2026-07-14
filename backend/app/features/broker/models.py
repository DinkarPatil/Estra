import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Lead(Base):
    """Broker lead — a prospective buyer/seller tracked through the pipeline."""

    __tablename__ = "leads"

    id = Column(String, primary_key=True, default=_uuid)
    broker_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    status = Column(String, nullable=False, default="new", index=True)
    source = Column(String, nullable=True)
    budget_min = Column(Float, nullable=True)
    budget_max = Column(Float, nullable=True)
    property_type = Column(String, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class BrokerListing(Base):
    """Broker-owned property listing surfaced in the catalogue."""

    __tablename__ = "broker_listings"

    id = Column(String, primary_key=True, default=_uuid)
    broker_id = Column(String, ForeignKey("users.id"), nullable=False, index=True)

    title = Column(String(160), nullable=False)
    description = Column(Text, nullable=True)

    listing_type = Column(String, nullable=False, index=True)   # sale | rent
    property_type = Column(String, nullable=False, index=True)  # apartment | villa | plot | commercial

    bedrooms = Column(Integer, nullable=False)
    bathrooms = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=False)
    price_inr = Column(Float, nullable=False, index=True)

    city = Column(String, nullable=False, index=True)
    locality = Column(String, nullable=False, index=True)
    address = Column(String(300), nullable=True)

    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    map_url = Column(Text, nullable=True)

    embedding = Column(JSON, nullable=True)

    status = Column(String, nullable=False, default="published", index=True)

    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    images = relationship(
        "BrokerListingImage",
        back_populates="listing",
        cascade="all, delete-orphan",
        order_by="BrokerListingImage.display_order",
    )


class BrokerListingImage(Base):
    """Image attached to a broker listing. Stored externally; we keep only the URL."""

    __tablename__ = "broker_listing_images"

    id = Column(String, primary_key=True, default=_uuid)
    listing_id = Column(
        String,
        ForeignKey("broker_listings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    url = Column(String(500), nullable=False)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=_utcnow)

    listing = relationship("BrokerListing", back_populates="images")
