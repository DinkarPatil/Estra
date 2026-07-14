"""Local OSM PBF reader — replaces the Overpass API approach.

Parses a Geofabrik extract once, keeps the filtered POI list in memory,
and serves radius queries in milliseconds. A JSON cache on disk makes
subsequent worker runs cheap (skips the ~2-minute PBF parse).

Only nodes are currently indexed. Ways (for highway proximity) are a
follow-up — they need a node-location cache during parse and aren't
worth the memory budget for the MVP.
"""

from __future__ import annotations

import json
import time
from dataclasses import dataclass, asdict
from pathlib import Path

import osmium

from app.core.config import settings
from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("area.osm_local")

# Radii used by both this module and the geo_signals derivation. Kept here
# so the derivation's substring-match on LIVABILITY_RADIUS_M stays valid.
LIVABILITY_RADIUS_M = 1500
PROXIMITY_RADIUS_M = 25_000

# Maharashtra bounding box (loose) — cheap way to cut the western-zone PBF
# (which includes Gujarat, Goa, parts of MP) down to just the state we care
# about before we spend RAM on it.
_MH_BBOX = (15.0, 72.0, 22.5, 81.0)  # (min_lat, min_lon, max_lat, max_lon)


@dataclass(frozen=True)
class OSMElement:
    """Flat POI record. Same shape the derivation layer already consumes."""

    osm_type: str
    lat: float
    lon: float
    tags: dict[str, str]


# Tags we consider "interesting" — must match the union used by the
# livability + proximity derivations in geo_signals.py.
_KEEP_AMENITY = {
    "school", "college", "university",
    "hospital", "clinic", "pharmacy",
    "restaurant", "cafe",
    "bank", "atm",
    "bus_station",
    "hotel",
    "office",
}
_KEEP_SHOP = {"supermarket", "mall", "department_store"}
_KEEP_LEISURE = {"park", "garden"}
_KEEP_TOURISM = {"hotel"}
_KEEP_RAILWAY = {"station"}
_KEEP_AEROWAY = {"aerodrome"}

# Tag keys we preserve on each POI (everything else is dropped to shrink
# the cache).
_KEEP_TAG_KEYS = (
    "amenity", "shop", "leisure", "railway", "aeroway", "tourism",
    "name", "office",
)


def _in_bbox(lat: float, lon: float) -> bool:
    return _MH_BBOX[0] <= lat <= _MH_BBOX[2] and _MH_BBOX[1] <= lon <= _MH_BBOX[3]


def _should_keep(tags: dict[str, str]) -> bool:
    if tags.get("amenity") in _KEEP_AMENITY:
        return True
    if tags.get("shop") in _KEEP_SHOP:
        return True
    if tags.get("leisure") in _KEEP_LEISURE:
        return True
    if tags.get("railway") in _KEEP_RAILWAY:
        return True
    if tags.get("aeroway") in _KEEP_AEROWAY:
        return True
    if tags.get("tourism") in _KEEP_TOURISM:
        return True
    # office=* tag family (any subtype)
    if tags.get("office"):
        return True
    return False


class _PoiHandler(osmium.SimpleHandler):
    def __init__(self) -> None:
        super().__init__()
        self.pois: list[OSMElement] = []

    def node(self, n) -> None:  # osmium Node type varies across versions
        if not n.location.valid():
            return
        lat, lon = n.location.lat, n.location.lon
        if not _in_bbox(lat, lon):
            return
        tags = {k: v for k, v in n.tags if k in _KEEP_TAG_KEYS}
        if not _should_keep(tags):
            return
        self.pois.append(OSMElement(osm_type="node", lat=lat, lon=lon, tags=tags))


def _parse_pbf(pbf_path: Path) -> list[OSMElement]:
    t0 = time.time()
    log.info("parsing OSM PBF at %s (this takes ~2 minutes first time)", pbf_path)
    h = _PoiHandler()
    h.apply_file(str(pbf_path))
    log.info(
        "parsed %d POIs in %.1fs from %s",
        len(h.pois), time.time() - t0, pbf_path.name,
    )
    return h.pois


def _load_cache(cache_path: Path) -> list[OSMElement] | None:
    if not cache_path.exists():
        return None
    try:
        raw = json.loads(cache_path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        log.warning("OSM cache unreadable (%s); will re-parse PBF", exc)
        return None
    return [OSMElement(**row) for row in raw]


def _write_cache(cache_path: Path, pois: list[OSMElement]) -> None:
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(
        json.dumps([asdict(p) for p in pois], separators=(",", ":")),
        encoding="utf-8",
    )
    log.info("wrote OSM cache (%d POIs) to %s", len(pois), cache_path)


_pois_cache: list[OSMElement] | None = None


def load_pois(
    pbf_path: Path | None = None, cache_path: Path | None = None
) -> list[OSMElement]:
    """Return the filtered POI list. First call parses the PBF (~2m);
    subsequent calls (same process) return from memory; fresh processes
    read from the on-disk JSON cache in ~1s.
    """
    global _pois_cache
    if _pois_cache is not None:
        return _pois_cache

    backend_root = Path(__file__).resolve().parents[5]
    pbf = pbf_path or (backend_root / settings.OSM_PBF_PATH)
    cache = cache_path or (backend_root / settings.OSM_POI_CACHE_PATH)

    cached = _load_cache(cache)
    if cached is not None:
        log.info("loaded %d POIs from cache %s", len(cached), cache)
        _pois_cache = cached
        return cached

    if not pbf.exists():
        log.error("no OSM PBF at %s and no cache at %s — OSM signals unavailable",
                  pbf, cache)
        _pois_cache = []
        return []

    pois = _parse_pbf(pbf)
    _write_cache(cache, pois)
    _pois_cache = pois
    return pois


def _haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Duplicated from derivations/geo_signals.py intentionally: keeps the
    # scraper self-contained for the bounding-box prefilter. Distances the
    # derivation later publishes use the canonical copy.
    import math
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * 6371.0 * math.asin(math.sqrt(a))


def fetch_osm_signals(lat: float, lon: float, radius_m: int = 25_000) -> list[OSMElement]:
    """Synchronous, offline, instant. Replaces the old Overpass round-trip."""
    pois = load_pois()
    if not pois:
        return []

    # Coarse box filter before haversine — ~0.25° of lat/lon ≈ 28 km at this
    # latitude; plenty of slack around a 25 km radius.
    deg = (radius_m / 1000.0) / 100.0
    min_lat, max_lat = lat - deg, lat + deg
    min_lon, max_lon = lon - deg, lon + deg
    radius_km = radius_m / 1000.0

    out: list[OSMElement] = []
    for p in pois:
        if not (min_lat <= p.lat <= max_lat and min_lon <= p.lon <= max_lon):
            continue
        if _haversine_km(lat, lon, p.lat, p.lon) <= radius_km:
            out.append(p)
    return out
