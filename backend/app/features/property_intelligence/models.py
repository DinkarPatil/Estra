import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text

from app.core.database import Base


def _uuid() -> str:
    return str(uuid.uuid4())


def _utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Developer(Base):
    __tablename__ = "developers"

    id = Column(String, primary_key=True, default=_uuid)
    name = Column(String, unique=True, nullable=False, index=True)
    country = Column(String, nullable=True)
    created_at = Column(DateTime, default=_utcnow)


class Location(Base):
    __tablename__ = "locations"

    id = Column(String, primary_key=True, default=_uuid)
    city = Column(String, nullable=False, index=True)
    region = Column(String, nullable=True)
    country = Column(String, nullable=False, index=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)


class Property(Base):
    __tablename__ = "properties"

    id = Column(String, primary_key=True, default=_uuid)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    property_type = Column(String, nullable=False, index=True)
    price = Column(Float, nullable=False)
    currency = Column(String, nullable=False, default="USD")

    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area = Column(Float, nullable=True)
    area_unit = Column(String, nullable=True)  # 'sqft' | 'sqm'
    status = Column(String, nullable=False, default="available", index=True)

    developer_id = Column(String, ForeignKey("developers.id"), nullable=True)
    location_id = Column(String, ForeignKey("locations.id"), nullable=True)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)


class PropertyListing(Base):
    """Bulk market listings (Kaggle + live-scraped) for statistical aggregation.

    Distinct from `properties` above: no developer/location FKs, denormalised
    locality string, indexed by source + city + listing_type for cheap
    groupby queries. Used by area_intelligence derivations (median ₹/sqft,
    rental yield, volatility) and by Task 6 property ranking.
    """

    __tablename__ = "property_listings"

    id = Column(String, primary_key=True, default=_uuid)
    source = Column(String, nullable=False, index=True)  # e.g. "kaggle_pune_house"
    external_id = Column(String, nullable=True, index=True)

    listing_type = Column(String, nullable=False, index=True)  # "sale" | "rent"
    city = Column(String, nullable=False, index=True)
    state = Column(String, nullable=True, index=True)
    locality_text = Column(String, nullable=True, index=True)  # raw, for match

    title = Column(String, nullable=True)
    bedrooms = Column(Integer, nullable=True)
    bathrooms = Column(Integer, nullable=True)
    area_sqft = Column(Float, nullable=True)
    price_inr = Column(Float, nullable=True)  # sale: total ₹; rent: monthly ₹
    price_per_sqft = Column(Float, nullable=True)  # computed when possible

    raw = Column(Text, nullable=True)  # original row as JSON, for debugging
    scraped_at = Column(DateTime, default=_utcnow, index=True)
    last_seen_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)
