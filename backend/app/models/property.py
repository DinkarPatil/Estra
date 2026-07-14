from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text

from app.database import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Property(Base):
    __tablename__ = "properties"

    id          = Column(String, primary_key=True)
    title       = Column(String, nullable=False)
    description = Column(Text)

    # Location
    city         = Column(String, index=True)
    state        = Column(String)
    country      = Column(String, index=True)
    country_code = Column(String, index=True)
    neighborhood = Column(String)
    lat          = Column(Float)
    lng          = Column(Float)

    # Price
    price    = Column(Float)
    currency = Column(String)

    # Type
    type     = Column(String, index=True)
    sub_type = Column(String)

    # Specs
    bedrooms  = Column(Integer)
    bathrooms = Column(Integer)
    area      = Column(Float)
    area_unit = Column(String)  # 'sqft' | 'sqm'

    # Metadata
    year_built = Column(Integer)
    developer  = Column(String)

    # Analytics
    ai_score             = Column(Integer)
    rental_yield         = Column(Float)
    capital_appreciation = Column(Float)
    risk_score           = Column(String)  # 'low' | 'medium' | 'high'

    # Media / tags
    images   = Column(Text)  # JSON-encoded list[str]
    features = Column(Text)  # JSON-encoded list[str]

    # Flags
    status        = Column(String, index=True)
    is_luxury     = Column(Boolean, default=False)
    is_fractional = Column(Boolean, default=False)

    created_at = Column(DateTime, default=utcnow)
