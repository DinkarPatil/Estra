from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


# ─── Lead Schemas ───


class LeadCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    email: str | None = None
    phone: str | None = None
    source: str | None = None
    budget_min: float | None = Field(None, ge=0)
    budget_max: float | None = Field(None, ge=0)
    property_type: str | None = None
    notes: str | None = None


class LeadUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=200)
    email: str | None = None
    phone: str | None = None
    status: str | None = None
    source: str | None = None
    budget_min: float | None = Field(None, ge=0)
    budget_max: float | None = Field(None, ge=0)
    property_type: str | None = None
    notes: str | None = None


class LeadResponse(BaseModel):
    id: str
    broker_id: str
    name: str
    email: str | None = None
    phone: str | None = None
    status: str
    source: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    property_type: str | None = None
    notes: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class LeadListResponse(BaseModel):
    total: int
    leads: list[LeadResponse]


# ─── Dashboard Schemas ───


class DashboardKPI(BaseModel):
    label: str
    value: str | float
    change: float | None = None
    direction: str | None = None  # 'up' | 'down'


class DashboardResponse(BaseModel):
    kpis: list[DashboardKPI]
    recent_activity: list[dict[str, Any]] = Field(default_factory=list)


# ─── Broker Listing Image ───


class BrokerListingImageIn(BaseModel):
    url: str = Field(..., min_length=1, max_length=500)
    display_order: int = 0


class BrokerListingImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    url: str
    display_order: int


# ─── Broker Listing Schemas ───


class BrokerListingCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=160)
    description: str | None = None
    listing_type: str = Field(..., description="sale | rent")
    property_type: str = Field(..., description="apartment | villa | plot | commercial")
    bedrooms: int = Field(..., ge=0)
    bathrooms: int | None = Field(None, ge=0)
    area_sqft: float = Field(..., gt=0)
    price_inr: float = Field(..., gt=0)
    city: str = Field(..., min_length=1)
    locality: str = Field(..., min_length=1)
    address: str | None = Field(None, max_length=300)
    latitude: float | None = None
    longitude: float | None = None
    map_url: str | None = None
    status: str = Field("published", description="draft | published | sold")
    images: list[BrokerListingImageIn] = Field(default_factory=list)


class BrokerListingUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=160)
    description: str | None = None
    listing_type: str | None = None
    property_type: str | None = None
    bedrooms: int | None = Field(None, ge=0)
    bathrooms: int | None = Field(None, ge=0)
    area_sqft: float | None = Field(None, gt=0)
    price_inr: float | None = Field(None, gt=0)
    city: str | None = None
    locality: str | None = None
    address: str | None = Field(None, max_length=300)
    latitude: float | None = None
    longitude: float | None = None
    map_url: str | None = None
    status: str | None = None
    images: list[BrokerListingImageIn] | None = None


class BrokerListingDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    broker_id: str
    title: str
    description: str | None = None
    listing_type: str
    property_type: str
    bedrooms: int
    bathrooms: int | None = None
    area_sqft: float
    price_inr: float
    city: str
    locality: str
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    map_url: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime
    images: list[BrokerListingImageOut] = Field(default_factory=list)


class BrokerListingSummary(BaseModel):
    """Compact card-shape for grids / search result lists."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    broker_id: str
    title: str
    listing_type: str
    property_type: str
    bedrooms: int
    bathrooms: int | None = None
    area_sqft: float
    price_inr: float
    city: str
    locality: str
    status: str
    cover_image: str | None = None
    created_at: datetime


class BrokerListingListResponse(BaseModel):
    total: int
    listings: list[BrokerListingSummary]
