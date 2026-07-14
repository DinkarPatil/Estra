"""Pydantic models for real-time area-scoped scraping."""

from __future__ import annotations

from typing import List, Optional

from pydantic import BaseModel, Field


class RealtimeScrapeRequest(BaseModel):
    areas: List[str] = Field(
        ..., min_length=1, max_length=5,
        description="Locality names to scrape, e.g. ['Andheri West', 'Powai']"
    )
    city: Optional[str] = Field(
        default=None,
        description="City hint — Mumbai or Pune. Inferred from areas if omitted.",
    )
    sources: Optional[List[str]] = Field(
        default=None,
        description="Subset of sources to scrape. Defaults to all available.",
    )
    limit_per_source: int = Field(
        default=12, ge=1, le=30,
        description="Cap on listings per source per area to keep response fast.",
    )
    fresh: bool = Field(
        default=False,
        description="If true, bypass cache and re-scrape.",
    )


class ScrapedListing(BaseModel):
    id: str
    source: str
    title: Optional[str] = None
    city: Optional[str] = None
    locality_text: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    area_sqft: Optional[int] = None
    price_inr: Optional[int] = None
    price_per_sqft: Optional[int] = None
    description: Optional[str] = None
    project_name: Optional[str] = None
    builder_name: Optional[str] = None
    listing_url: Optional[str] = None
    images: List[str] = Field(default_factory=list)
    scraped_at: Optional[str] = None


class RealtimeScrapeResponse(BaseModel):
    areas: List[str]
    city: Optional[str]
    total: int
    by_source: dict
    listings: List[ScrapedListing]
    elapsed_ms: int
    cached: bool
    errors: List[str] = Field(default_factory=list)
