"""
Cleans and validates a raw scraped record into the canonical listing schema.

The schema is fixed in `clean_listing` and matches what the frontend cards expect.
Any record missing title / price / area / city is dropped — the frontend can't
render those.
"""

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from .parser import (
    clean_description,
    compute_price_per_sqft,
    normalize_city,
    parse_area_sqft,
    parse_bhk,
    parse_locality,
    parse_price,
)


def _coerce_float(value, lo: float, hi: float) -> Optional[float]:
    try:
        v = float(value)
    except (TypeError, ValueError):
        return None
    if lo <= v <= hi:
        return v
    return None


def _shorten(s: str, n: int) -> str:
    s = re.sub(r"\s+", " ", s).strip()
    return s if len(s) <= n else s[: n - 1] + "…"


def clean_listing(raw: Dict[str, Any], source: str) -> Optional[Dict[str, Any]]:
    """Normalize a raw record. Returns the cleaned dict or None if quality is too low."""
    title = (raw.get("title") or "").strip()
    if not title:
        return None

    description_raw = raw.get("description") or ""

    # Price — try the explicit field, then fall back to the description blob.
    price = parse_price(raw.get("price"))
    if price is None:
        price = parse_price(description_raw)
    if price is None:
        return None

    # Area — same fallback chain.
    area = parse_area_sqft(raw.get("area"))
    if area is None:
        area = parse_area_sqft(description_raw)
    if area is None:
        return None

    # BHK — title is the most reliable source.
    bhk = (
        parse_bhk(raw.get("bhk"))
        or parse_bhk(title)
        or parse_bhk(description_raw)
    )

    # Bathrooms — explicit if available; else mirror BHK as a sane default.
    bathrooms: Optional[int] = None
    try:
        if raw.get("bathrooms") is not None:
            bathrooms = int(float(raw["bathrooms"]))
    except (TypeError, ValueError):
        bathrooms = None
    if bathrooms is None and bhk is not None:
        bathrooms = bhk

    # City / state — try multiple inputs.
    city, state = normalize_city(raw.get("city") or "")
    if not city:
        city, state = normalize_city(title)
    if not city:
        city, state = normalize_city(raw.get("locality") or "")
    if not city:
        return None

    # Locality.
    locality = (raw.get("locality") or "").strip() or parse_locality(title, city)

    # Geo.
    lat = _coerce_float(raw.get("lat"), -90, 90)
    lon = _coerce_float(raw.get("lon"), -180, 180)

    listing_url = (raw.get("listing_url") or "").strip() or None

    cleaned = {
        "id": str(uuid.uuid4()),
        "source": source,
        "listing_type": "sale",
        "city": city,
        "state": state,
        "locality_text": locality or None,
        "title": _shorten(title, 160),
        "bedrooms": bhk,
        "bathrooms": bathrooms,
        "area_sqft": area,
        "price_inr": price,
        "price_per_sqft": compute_price_per_sqft(price, area),
        "lat": lat,
        "lon": lon,
        "description": clean_description(description_raw or title),
        "project_name": (raw.get("project_name") or "").strip() or None,
        "builder_name": (raw.get("builder_name") or "").strip() or None,
        "listing_url": listing_url,
        "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    }
    return cleaned
