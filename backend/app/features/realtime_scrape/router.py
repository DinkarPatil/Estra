"""Realtime scrape endpoints — list (POST) + single-listing lookup (GET)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from .schemas import RealtimeScrapeRequest, RealtimeScrapeResponse, ScrapedListing
from .service import find_listing_by_id, scrape_areas

router = APIRouter(prefix="/realtime", tags=["realtime"])


@router.post("/properties", response_model=RealtimeScrapeResponse)
async def realtime_properties(req: RealtimeScrapeRequest) -> RealtimeScrapeResponse:
    payload = await scrape_areas(
        areas=req.areas,
        city=req.city,
        sources=req.sources,
        limit_per_source=req.limit_per_source,
        fresh=req.fresh,
    )
    return RealtimeScrapeResponse(**payload)


@router.get("/property/{listing_id}", response_model=ScrapedListing)
async def realtime_property_detail(listing_id: str) -> ScrapedListing:
    """Return a single live-scraped listing by id from the in-memory cache.

    Used by the Property Detail page so 'Explore Property' opens the same
    record the user clicked on the Properties grid. Falls through with 404
    if the cache has expired (10-min TTL) — the frontend then renders a
    'listing expired' state and a Back-to-Properties button.
    """
    listing = find_listing_by_id(listing_id)
    if listing is None:
        raise HTTPException(status_code=404, detail="Listing not found in live cache")
    return ScrapedListing(**listing)
