"""MagicBricks SRP (search results page) harvester.

Paginates MB city-level listing search pages and extracts every
/propertyDetails href so the detail scraper can then enrich each one.

Two SRP URL shapes supported:
    1. City-wide: /property-for-sale/residential-real-estate?cityName=<City>&page=<N>
    2. Locality:  /property-for-sale-in-<locality>-<city>-pppfs?page=<N>

Both respond 200 OK with ~30 /propertyDetails hrefs per page.
"""

from __future__ import annotations

import asyncio
import html as htmlmod
import re
from dataclasses import dataclass
from typing import Any

import httpx

from app.core.logging import get_pipeline_logger

from ._http import HostLimiter
from .magicbricks_property import HOST, _BROWSER_HEADERS

log = get_pipeline_logger("area.magicbricks_srp")

_LISTING_RE = re.compile(r'href="(/propertyDetails[^"]+)"')
_COUNT_RE = re.compile(r'(\d[\d,]*)\s*(?:Properties|Results|Listings|Ads)', re.IGNORECASE)


@dataclass
class SRPPage:
    city: str
    url: str
    page: int
    listing_urls: list[str]
    total_hint: int | None
    error: str | None = None


def city_srp_url(city: str, page: int = 1, *, proptype: str | None = None) -> str:
    """City-wide SRP URL."""
    base = (
        f"https://{HOST}/property-for-sale/residential-real-estate"
        f"?cityName={city}&page={page}&sortBy=premiumRecent"
        f"&postedSince=-1&isNRI=N&multiLang=en"
    )
    if proptype:
        base += f"&proptype={proptype}"
    return base


def locality_srp_url(locality: str, city: str, page: int = 1) -> str:
    """Locality SEO SRP URL — slug-based."""
    slug = lambda s: re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")
    base = f"https://{HOST}/property-for-sale-in-{slug(locality)}-{slug(city)}-pppfs"
    return f"{base}?page={page}" if page > 1 else base


def parse_srp(html: str) -> tuple[list[str], int | None]:
    """Return (absolute_listing_urls, total_result_hint)."""
    rels = _LISTING_RE.findall(html)
    urls: list[str] = []
    seen: set[str] = set()
    for rel in rels:
        abs_url = "https://" + HOST + htmlmod.unescape(rel)
        if abs_url in seen:
            continue
        seen.add(abs_url)
        urls.append(abs_url)
    total_hint: int | None = None
    m = _COUNT_RE.search(html)
    if m:
        try:
            total_hint = int(m.group(1).replace(",", ""))
        except ValueError:
            total_hint = None
    return urls, total_hint


async def fetch_srp(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    city: str,
    page: int,
    *,
    url: str | None = None,
) -> SRPPage:
    sem = limiter.for_host(HOST)
    target = url or city_srp_url(city, page)
    async with sem:
        try:
            r = await client.get(target, headers=_BROWSER_HEADERS, timeout=30)
            r.raise_for_status()
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            log.warning("srp fetch failed for %s p%d: %s", city, page, exc)
            return SRPPage(city=city, url=target, page=page, listing_urls=[], total_hint=None, error=str(exc))

    if len(r.text) < 50_000:
        return SRPPage(city=city, url=target, page=page, listing_urls=[], total_hint=None,
                       error=f"thin response ({len(r.text)} bytes)")

    urls, total = parse_srp(r.text)
    log.info("magicbricks SRP %s p%d — %d listings (total hint %s)", city, page, len(urls), total)
    return SRPPage(city=city, url=target, page=page, listing_urls=urls, total_hint=total)


async def harvest_city(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    city: str,
    *,
    max_pages: int = 30,
    proptype: str | None = None,
) -> tuple[list[str], list[SRPPage]]:
    """Paginate a city from page 1 until no new URLs or max_pages reached.

    Returns (unique_listing_urls, page_records).
    """
    seen: set[str] = set()
    all_urls: list[str] = []
    pages: list[SRPPage] = []

    for p in range(1, max_pages + 1):
        url = city_srp_url(city, p, proptype=proptype)
        page = await fetch_srp(client, limiter, city, p, url=url)
        pages.append(page)
        if page.error:
            break
        new = [u for u in page.listing_urls if u not in seen]
        if not new:
            log.info("magicbricks %s: no new URLs at page %d — stopping", city, p)
            break
        seen.update(new)
        all_urls.extend(new)
        # Polite gap between SRP pages within a city
        await asyncio.sleep(1.0)

    return all_urls, pages


async def harvest_locality(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    locality: str,
    city: str,
    *,
    max_pages: int = 30,
) -> tuple[list[str], list[SRPPage]]:
    """Paginate the locality-level SRP (richer for dense urban areas)."""
    seen: set[str] = set()
    all_urls: list[str] = []
    pages: list[SRPPage] = []
    tag = f"{locality}-{city}"

    for p in range(1, max_pages + 1):
        url = locality_srp_url(locality, city, p)
        page = await fetch_srp(client, limiter, tag, p, url=url)
        pages.append(page)
        if page.error:
            break
        new = [u for u in page.listing_urls if u not in seen]
        if not new:
            log.info("magicbricks %s: no new URLs at page %d — stopping", tag, p)
            break
        seen.update(new)
        all_urls.extend(new)
        await asyncio.sleep(1.0)

    return all_urls, pages
