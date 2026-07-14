"""
Real-time scrape orchestrator.

Fan-out: for each (source × area) we await the source's async scraper.
Sources run concurrently via asyncio.gather. Results are deduped by listing URL
and merged. A small in-memory TTL cache (default 10 min) guards against repeat
hits from the same UI in quick succession.
"""

from __future__ import annotations

import asyncio
import time
from typing import Any, Awaitable, Callable, Dict, List, Optional

import httpx

from app.core.logging import get_logger

from .parsers import resolve_city
from .sources import acres99, housing, magicbricks, nobroker, squareyards

log = get_logger("realtime.service")


SourceFn = Callable[..., Awaitable[List[Dict[str, Any]]]]
_CACHE_TTL_S = 600  # 10 minutes
_cache: Dict[str, Dict[str, Any]] = {}


SOURCES_HTTP: Dict[str, SourceFn] = {
    "magicbricks": magicbricks.scrape_area,
    "squareyards": squareyards.scrape_area,
}
SOURCES_BROWSER: Dict[str, SourceFn] = {
    "99acres": acres99.scrape_area,
    "housing": housing.scrape_area,
    "nobroker": nobroker.scrape_area,
}
ALL_SOURCES = {**SOURCES_HTTP, **SOURCES_BROWSER}


# Adjacency map for nearby-area fallback. When a primary area returns 0
# listings on a given source, we retry with one of these nearby localities
# so the user always sees something for an under-served micro-market.
_NEARBY: Dict[str, List[str]] = {
    # Mumbai
    "andheri west": ["andheri east", "jogeshwari west", "vile parle west"],
    "andheri east": ["andheri west", "marol", "sakinaka"],
    "powai": ["chandivali", "vikhroli west", "andheri east"],
    "bandra": ["bandra west", "khar west", "santacruz west"],
    "bandra east": ["kurla west", "kalina", "santacruz east"],
    "bandra west": ["khar west", "santacruz west", "bandra east"],
    "worli": ["lower parel", "prabhadevi", "mahalakshmi"],
    "worli naka": ["worli", "lower parel", "prabhadevi"],
    "lower parel": ["worli", "prabhadevi", "parel"],
    "juhu": ["vile parle west", "santacruz west", "andheri west"],
    "borivali": ["borivali west", "borivali east", "kandivali west"],
    "borivali west": ["borivali east", "kandivali west", "dahisar west"],
    "borivali east": ["borivali west", "kandivali east", "dahisar east"],
    "goregaon": ["goregaon west", "goregaon east", "malad west"],
    "malad": ["malad west", "malad east", "goregaon west"],
    "kandivali": ["kandivali west", "kandivali east", "borivali west"],
    "chembur": ["govandi west", "deonar", "kurla east"],
    "mulund": ["mulund west", "mulund east", "bhandup west"],
    "ghatkopar": ["ghatkopar west", "ghatkopar east", "vidyavihar"],
    "wadala": ["sion", "antop hill", "dadar east"],
    "sewri": ["wadala west", "parel", "lower parel"],
    "mahalakshmi": ["worli", "lower parel", "tardeo"],
    "bhandup": ["bhandup west", "bhandup east", "mulund west"],
    "kurla": ["kurla east", "kurla west", "ghatkopar west"],
    "mira road east": ["mira road", "bhayandar east", "naya nagar"],
    "mira road": ["mira road east", "bhayandar east", "borivali west"],
    "virar": ["virar east", "virar west", "vasai east"],
    "jb nagar": ["andheri east", "marol", "chakala"],
    # Pune
    "baner": ["balewadi", "aundh", "pashan"],
    "wakad": ["hinjewadi", "tathawade", "punawale"],
    "hinjewadi": ["wakad", "tathawade", "marunji"],
    "kothrud": ["karve nagar", "shivane", "warje"],
    "viman nagar": ["kharadi", "lohegaon", "yerawada"],
    "kharadi": ["viman nagar", "wagholi", "hadapsar"],
    "hadapsar": ["magarpatta", "kharadi", "manjari"],
    "magarpatta": ["hadapsar", "kharadi", "mundhwa"],
    "aundh": ["baner", "pashan", "balewadi"],
    "koregaon park": ["kalyani nagar", "yerawada", "wadgaon sheri"],
    "kalyani nagar": ["koregaon park", "viman nagar", "yerawada"],
    "punawale": ["wakad", "ravet", "tathawade"],
    "pimpri": ["chinchwad", "akurdi", "nigdi"],
    "chinchwad": ["pimpri", "akurdi", "thergaon"],
    "mundhwa": ["magarpatta", "hadapsar", "keshav nagar"],
    "keshav nagar mundhwa": ["mundhwa", "hadapsar", "magarpatta"],
}


def nearby_areas(area: str) -> List[str]:
    return _NEARBY.get((area or "").strip().lower(), [])


def find_listing_by_id(listing_id: str) -> Optional[Dict[str, Any]]:
    """Walk every cached payload and return the first listing whose id matches.

    Used by the Property Detail page to recover the full record after the
    user clicks 'Explore Property'. Listings are kept in-memory until the
    TTL expires, so this works as long as the detail click happens within
    the cache window (10 min default).
    """
    for entry in _cache.values():
        for L in entry.get("payload", {}).get("listings", []) or []:
            if L.get("id") == listing_id:
                return L
    return None


def _cache_key(areas: List[str], sources: List[str], limit: int) -> str:
    return "|".join([
        ",".join(sorted(s.lower() for s in sources)),
        ",".join(sorted(a.lower() for a in areas)),
        str(limit),
    ])


def _dedupe(items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set = set()
    out: List[Dict[str, Any]] = []
    for it in items:
        url = (it.get("listing_url") or "").strip().lower()
        key = (
            url
            or f"{(it.get('title') or '').lower()}::{(it.get('locality_text') or '').lower()}"
        )
        if key and key in seen:
            continue
        if key:
            seen.add(key)
        out.append(it)
    return out


async def _run_one(
    source: str,
    fn: SourceFn,
    area: str,
    city: Optional[str],
    limit: int,
    client: Optional[httpx.AsyncClient],
) -> List[Dict[str, Any]]:
    try:
        if source in SOURCES_HTTP:
            return await fn(client, area, city, limit)
        return await fn(area, city, limit)
    except Exception as e:
        log.warning("source=%s area=%s failed: %s", source, area, e)
        return []


async def scrape_areas(
    areas: List[str],
    *,
    city: Optional[str] = None,
    sources: Optional[List[str]] = None,
    limit_per_source: int = 12,
    fresh: bool = False,
) -> Dict[str, Any]:
    """Fan-out scrape. Returns aggregated payload + per-source counts."""
    sources = [s for s in (sources or list(ALL_SOURCES.keys())) if s in ALL_SOURCES]
    if not sources:
        sources = list(ALL_SOURCES.keys())

    if not city:
        city = resolve_city(areas[0], None) if areas else None

    cache_key = _cache_key(areas, sources, limit_per_source)
    now = time.time()
    if not fresh and cache_key in _cache:
        entry = _cache[cache_key]
        if now - entry["t"] < _CACHE_TTL_S:
            payload = dict(entry["payload"])
            payload["cached"] = True
            return payload

    t0 = time.time()
    errors: List[str] = []
    by_source: Dict[str, int] = {s: 0 for s in sources}
    aggregated: List[Dict[str, Any]] = []

    async with httpx.AsyncClient(http2=False, timeout=20.0) as client:
        # Round 1: primary (source, area) pairs in parallel.
        tasks = []
        task_meta: List[tuple] = []
        for src in sources:
            fn = ALL_SOURCES[src]
            for area in areas:
                tasks.append(_run_one(src, fn, area, city, limit_per_source, client))
                task_meta.append((src, area))
        results = await asyncio.gather(*tasks, return_exceptions=False)

        # Identify zero-yield (source, area) pairs and retry against nearby areas.
        retry_tasks = []
        retry_meta: List[tuple] = []  # (src, original_area, fallback_area)
        for (src, area), items in zip(task_meta, results):
            if items:
                continue
            # Try at most 2 nearby fallbacks per missing pair to keep latency bounded.
            for nearby in nearby_areas(area)[:2]:
                fn = ALL_SOURCES[src]
                retry_tasks.append(
                    _run_one(src, fn, nearby, city, limit_per_source, client)
                )
                retry_meta.append((src, area, nearby))
        retry_results = (
            await asyncio.gather(*retry_tasks, return_exceptions=False)
            if retry_tasks else []
        )

    # Tag every listing with the area the user originally selected so the UI
    # groups them under that bucket even when sourced from a neighbour.
    fallback_hits: Dict[str, str] = {}  # (src, area) -> nearby that worked
    for (src, original_area, nearby), items in zip(retry_meta, retry_results):
        if not items:
            continue
        key = f"{src}::{original_area.lower()}"
        if key in fallback_hits:
            continue  # already filled
        fallback_hits[key] = nearby
        for it in items:
            it["fallback_from"] = nearby
            it["locality_text"] = original_area  # show as user's chosen area
        results_idx = task_meta.index((src, original_area))
        results[results_idx] = items  # promote into round-1 results

    for (src, area), items in zip(task_meta, results):
        if not items:
            errors.append(f"{src}:{area} returned 0 listings (no nearby fallback)")
            continue
        by_source[src] = by_source.get(src, 0) + len(items)
        aggregated.extend(items)

    # Quality gate — drop listings missing critical fields. Strictly require
    # title + non-zero price (so the user never sees ₹0 cards) AND at least
    # one image (the user explicitly does not want imageless cards).
    def _ok(it: Dict[str, Any]) -> bool:
        if not it.get("title"):
            return False
        price = it.get("price_inr")
        if not price or price <= 0:
            return False
        if not (it.get("images") or []):
            return False
        return True

    aggregated = [it for it in aggregated if _ok(it)]
    aggregated = _dedupe(aggregated)

    elapsed_ms = int((time.time() - t0) * 1000)
    payload: Dict[str, Any] = {
        "areas": areas,
        "city": city,
        "total": len(aggregated),
        "by_source": by_source,
        "listings": aggregated,
        "elapsed_ms": elapsed_ms,
        "cached": False,
        "errors": errors,
    }
    _cache[cache_key] = {"t": now, "payload": payload}
    return payload
