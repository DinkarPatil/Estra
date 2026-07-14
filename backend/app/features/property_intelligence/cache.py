"""In-memory cache for property listings.

Loaded once at startup from ``data/cache/properties.json``.
All reads are pure Python list filters — no DB, no network.
"""

from __future__ import annotations

import json
import os
import re
from pathlib import Path
from typing import Any

from app.core.logging import get_logger
from app.features.property_intelligence.schemas import (
    PropertyListResponse,
    PropertySummary,
)

log = get_logger("property_intelligence.cache")

_CACHE_DIR = Path(__file__).resolve().parents[3] / "data" / "cache"
_CACHE_PATH = _CACHE_DIR / "properties.json"
_MB_CACHE_PATH = _CACHE_DIR / "properties_mb.json"

_properties: list[dict[str, Any]] | None = None


def _truthy(val: str | None) -> bool:
    return (val or "").strip().lower() in {"1", "true", "yes", "on"}


def load() -> None:
    """Read properties.json (+ optional MagicBricks sidecar) into memory.

    Call once from app lifespan. The MB sidecar at ``properties_mb.json`` is
    appended if it exists and ``LOAD_MB_CACHE`` env is truthy (default on).
    Set ``LOAD_MB_CACHE=0`` to fall back to the 99acres-only cache.
    """
    global _properties
    if _properties is not None:
        return
    rows = json.loads(_CACHE_PATH.read_text(encoding="utf-8"))
    base_count = len(rows)

    load_mb = _truthy(os.getenv("LOAD_MB_CACHE", "1"))
    if load_mb and _MB_CACHE_PATH.exists():
        try:
            mb_rows = json.loads(_MB_CACHE_PATH.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            log.warning("MB sidecar present but unreadable: %s", exc)
            mb_rows = []
        rows.extend(mb_rows)
        log.info("loaded properties cache: %d base + %d MB = %d rows",
                 base_count, len(mb_rows), len(rows))
    else:
        log.info("loaded properties cache: %d rows (MB sidecar disabled or missing)",
                 base_count)

    _properties = rows


def _reset_for_test(properties: list[dict[str, Any]] | None = None) -> None:
    """Override in-memory cache for unit tests."""
    global _properties
    _properties = properties


def _all() -> list[dict[str, Any]]:
    if _properties is None:
        load()
    return _properties


def _match(row: dict[str, Any], **filters: Any) -> bool:
    """Check if a property row satisfies all given filters."""
    city = filters.get("city")
    if city is not None:
        if not row.get("city") or city.lower() not in row["city"].lower():
            return False

    locality = filters.get("locality")
    if locality is not None:
        loc = row.get("locality_text") or ""
        if locality.lower() not in loc.lower():
            return False

    property_type = filters.get("property_type")
    if property_type is not None:
        title = row.get("title") or ""
        pt = property_type.lower()
        title_lower = title.lower()

        # Handle BHK property types by checking bedrooms, not just title text
        bhk_match = re.search(r"(\d+)\s*bhk", pt)
        if bhk_match:
            required_beds = int(bhk_match.group(1))
            beds = row.get("bedrooms")
            if beds is not None and beds != required_beds:
                return False
            # If bedrooms field is missing, fall through to title check
            elif beds is None:
                if str(required_beds) not in title_lower:
                    return False
        elif pt in ("flat", "apartment"):
            # Synonyms: flat ≈ apartment — be lenient
            pass
        elif pt not in title_lower:
            return False

    listing_type = filters.get("listing_type")
    if listing_type is not None:
        if row.get("listing_type") != listing_type:
            return False

    source = filters.get("source")
    if source is not None:
        if row.get("source") != source:
            return False

    min_price = filters.get("min_price")
    price = row.get("price_inr")
    if min_price is not None:
        if price is None or price < min_price:
            return False

    max_price = filters.get("max_price")
    if max_price is not None:
        if price is None or price > max_price:
            return False

    min_bedrooms = filters.get("min_bedrooms")
    beds = row.get("bedrooms")
    if min_bedrooms is not None:
        if beds is None or beds < min_bedrooms:
            return False

    max_bedrooms = filters.get("max_bedrooms")
    if max_bedrooms is not None:
        if beds is None or beds > max_bedrooms:
            return False

    area_names = filters.get("area_names")
    if area_names is not None:
        loc = row.get("locality_text") or ""
        # Try matching any of the picked area names against locality_text
        # We do a forgiving match: first word of area name vs first part of locality
        loc_first = loc.split(",")[0].strip().lower()
        matched = False
        for name in area_names:
            name_first = name.split(",")[0].strip().lower()
            if name_first in loc_first or loc_first in name_first:
                matched = True
                break
        if not matched:
            return False

    return True


def list_properties(
    *,
    city: str | None = None,
    locality: str | None = None,
    property_type: str | None = None,
    listing_type: str | None = None,
    source: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    min_bedrooms: int | None = None,
    max_bedrooms: int | None = None,
    area_names: list[str] | None = None,
    limit: int = 20,
    offset: int = 0,
) -> PropertyListResponse:
    """Filter cached properties the same way the DB service does."""
    rows = _all()

    filters = {
        "city": city,
        "locality": locality,
        "property_type": property_type,
        "listing_type": listing_type,
        "source": source,
        "min_price": min_price,
        "max_price": max_price,
        "min_bedrooms": min_bedrooms,
        "max_bedrooms": max_bedrooms,
        "area_names": area_names,
    }
    filters = {k: v for k, v in filters.items() if v is not None}

    matched = [r for r in rows if _match(r, **filters)]
    total = len(matched)

    # Sort by scraped_at desc (newest first). Fall back to id for stability.
    matched.sort(
        key=lambda r: (r.get("scraped_at") or "", r.get("id") or ""),
        reverse=True,
    )

    page = matched[offset : offset + limit]

    items = [
        PropertySummary(
            id=r["id"],
            source=r["source"],
            listing_type=r["listing_type"],
            title=r.get("title"),
            city=r.get("city"),
            state=r.get("state"),
            locality_text=r.get("locality_text"),
            bedrooms=r.get("bedrooms"),
            bathrooms=r.get("bathrooms"),
            area_sqft=r.get("area_sqft"),
            price_inr=r.get("price_inr"),
            price_per_sqft=r.get("price_per_sqft"),
        )
        for r in page
    ]

    return PropertyListResponse(items=items, total=total, limit=limit, offset=offset)


def get_property(property_id: str) -> dict[str, Any] | None:
    """Fetch a single raw property dict by ID."""
    for r in _all():
        if r.get("id") == property_id:
            return r
    return None


def count_for_area(area_name: str, city: str | None = None) -> int:
    """Count cached properties whose locality matches ``area_name``.

    Uses the same forgiving first-word match as the area-first filter, so
    counts stay consistent with what /orchestrator/analyze actually returns.
    """
    if not area_name:
        return 0
    filters: dict[str, Any] = {"area_names": [area_name]}
    if city:
        filters["city"] = city
    return sum(1 for r in _all() if _match(r, **filters))
