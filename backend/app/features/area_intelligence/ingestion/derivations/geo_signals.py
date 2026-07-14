"""Compute `livability_indicators` and `infrastructure_proximity` from
raw OSM elements returned by scrapers/osm.py.

Pure functions; no network. Haversine distance math lives here so the
scraper stays a thin adapter.
"""

from __future__ import annotations

import math
from typing import Any

from app.features.area_intelligence.ingestion.scrapers.osm_local import (
    LIVABILITY_RADIUS_M,
    OSMElement,
)

EARTH_RADIUS_KM = 6371.0


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * EARTH_RADIUS_KM * math.asin(math.sqrt(a))


_LIVABILITY_KEYS = (
    "schools",
    "hospitals_or_clinics",
    "parks_or_gardens",
    "restaurants_or_cafes",
    "supermarkets_or_malls",
    "banks_or_atms",
    "pharmacies",
)


def _classify_livability(e: OSMElement) -> str | None:
    amenity = e.tags.get("amenity", "")
    shop = e.tags.get("shop", "")
    leisure = e.tags.get("leisure", "")
    if amenity in ("school", "college", "university"):
        return "schools"
    if amenity in ("hospital", "clinic"):
        return "hospitals_or_clinics"
    if leisure in ("park", "garden"):
        return "parks_or_gardens"
    if amenity in ("restaurant", "cafe"):
        return "restaurants_or_cafes"
    if shop in ("supermarket", "mall", "department_store"):
        return "supermarkets_or_malls"
    if amenity in ("bank", "atm"):
        return "banks_or_atms"
    if amenity == "pharmacy":
        return "pharmacies"
    return None


def livability_indicators(
    center_lat: float, center_lon: float, elements: list[OSMElement]
) -> dict[str, Any]:
    counts: dict[str, int] = {k: 0 for k in _LIVABILITY_KEYS}
    for e in elements:
        d_m = haversine_km(center_lat, center_lon, e.lat, e.lon) * 1000
        if d_m > LIVABILITY_RADIUS_M:
            continue
        bucket = _classify_livability(e)
        if bucket is not None:
            counts[bucket] += 1
    return {
        **counts,
        "radius_m": LIVABILITY_RADIUS_M,
    }


def _classify_proximity(e: OSMElement) -> str | None:
    tags = e.tags
    if tags.get("railway") == "station":
        return "nearest_railway_station_km"
    if tags.get("aeroway") == "aerodrome":
        return "nearest_airport_km"
    if tags.get("amenity") == "bus_station":
        return "nearest_bus_station_km"
    if tags.get("highway") in ("motorway", "trunk"):
        return "nearest_highway_km"
    return None


_PROXIMITY_KEYS = (
    "nearest_railway_station_km",
    "nearest_airport_km",
    "nearest_bus_station_km",
    "nearest_highway_km",
)


def infrastructure_proximity(
    center_lat: float, center_lon: float, elements: list[OSMElement]
) -> dict[str, Any]:
    result: dict[str, float | None] = {k: None for k in _PROXIMITY_KEYS}
    for e in elements:
        bucket = _classify_proximity(e)
        if bucket is None:
            continue
        d_km = haversine_km(center_lat, center_lon, e.lat, e.lon)
        cur = result[bucket]
        if cur is None or d_km < cur:
            result[bucket] = round(d_km, 2)
    return result


# ── commercial density (for buy-side ROI composite) ─────────────────────────

COMMERCIAL_RADIUS_M = 2000


def _is_office(e: OSMElement) -> bool:
    return bool(e.tags.get("office"))


def _is_hotel(e: OSMElement) -> bool:
    return e.tags.get("amenity") == "hotel" or e.tags.get("tourism") == "hotel"


def _is_mall(e: OSMElement) -> bool:
    return e.tags.get("shop") in ("mall", "department_store")


def commercial_density(
    center_lat: float, center_lon: float, elements: list[OSMElement]
) -> dict[str, int]:
    """Count offices, hotels, malls within COMMERCIAL_RADIUS_M of center."""
    offices = hotels = malls = 0
    for e in elements:
        d_m = haversine_km(center_lat, center_lon, e.lat, e.lon) * 1000
        if d_m > COMMERCIAL_RADIUS_M:
            continue
        if _is_office(e):
            offices += 1
        elif _is_hotel(e):
            hotels += 1
        elif _is_mall(e):
            malls += 1
    return {
        "offices": offices,
        "hotels": hotels,
        "malls": malls,
        "radius_m": COMMERCIAL_RADIUS_M,
    }
