"""
SquareYards live scraper — plain HTTP (no Playwright). Reliable from
datacenter IPs and exposes 25+ Apartment JSON-LD blocks per SRP plus
matching DOM cards with prices and high-res images.

Strategy:
  1. JSON-LD <script type="application/ld+json"> Apartment blocks → name,
     URL, image, floorSize, numberOfRooms, address.
  2. Match listing-card DOM in document order to recover the price (which
     is rendered in the card but absent from JSON-LD).
"""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from app.core.logging import get_logger

from ..parsers import parse_area_sqft, parse_bhk, parse_price_inr, slugify, resolve_city

log = get_logger("realtime.squareyards")

BASE = "https://www.squareyards.com"
SOURCE = "squareyards"

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _build_url(area: str, city: Optional[str]) -> str:
    city_resolved = (resolve_city(area, city) or "Mumbai").lower()
    return f"{BASE}/sale/property-for-sale-in-{slugify(area)}-{city_resolved}"


def _extract_apartments(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        text = tag.string or tag.get_text() or ""
        if not text.strip():
            continue
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        block = data if isinstance(data, list) else [data]
        for it in block:
            if isinstance(it, dict) and it.get("@type") in (
                "Apartment", "Residence", "House", "Place", "Product"
            ):
                # Filter out the "Place" header (the area itself, no listing data).
                if it.get("@type") == "Place" and not it.get("name", "").startswith((
                    "1 ", "2 ", "3 ", "4 ", "5 ", "6 ",
                )):
                    continue
                out.append(it)
    return out


def _extract_card_prices(soup: BeautifulSoup) -> List[Optional[str]]:
    """Read card prices in document order so we can zip with JSON-LD index."""
    prices: List[Optional[str]] = []
    for card in soup.select("[class*='listing-card'], [class*='listing_card'], [class*='ListingCard']"):
        p = card.find(attrs={"class": re.compile("price", re.I)})
        if not p:
            p = card.find(string=re.compile(r"₹|Cr|Lac|Lakh", re.I))
            if p:
                prices.append(str(p).strip())
                continue
            prices.append(None)
            continue
        prices.append(p.get_text(" ", strip=True))
    return prices


async def scrape_area(
    client: httpx.AsyncClient, area: str, city: Optional[str], limit: int
) -> List[Dict[str, Any]]:
    url = _build_url(area, city)
    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
        "Cache-Control": "no-cache",
    }
    try:
        resp = await client.get(url, headers=headers, timeout=20.0)
    except httpx.HTTPError as e:
        log.warning("SY %s → %s", area, e)
        return []
    if resp.status_code != 200:
        log.warning("SY %s → HTTP %s", area, resp.status_code)
        return []

    soup = BeautifulSoup(resp.text, "html.parser")
    apartments = _extract_apartments(soup)
    prices = _extract_card_prices(soup)

    out: List[Dict[str, Any]] = []
    for i, apt in enumerate(apartments):
        if len(out) >= limit:
            break
        title = apt.get("name") or apt.get("description")
        if not title:
            continue
        url_listing = apt.get("url") or apt.get("@id")

        addr = apt.get("address") or {}
        if isinstance(addr, list):
            addr = addr[0] if addr else {}
        project_name = addr.get("name") if isinstance(addr, dict) else None

        floor_size = apt.get("floorSize")
        area_text = None
        if isinstance(floor_size, dict):
            area_text = floor_size.get("value") or floor_size.get("name")
        elif floor_size is not None:
            area_text = floor_size
        area_sqft = parse_area_sqft(area_text) or parse_area_sqft(title)

        bhk = apt.get("numberOfRooms") or parse_bhk(title)
        try:
            bhk = int(bhk) if bhk else None
        except (TypeError, ValueError):
            bhk = None
        bath = apt.get("numberOfBathroomsTotal")
        try:
            bath = int(bath) if bath else None
        except (TypeError, ValueError):
            bath = bhk

        # Price comes from card DOM at same index
        price = parse_price_inr(prices[i] if i < len(prices) else None)

        # Images
        ld_image = apt.get("image")
        imgs: List[str] = []
        if isinstance(ld_image, list):
            imgs = [u for u in ld_image if isinstance(u, str)][:3]
        elif isinstance(ld_image, str):
            imgs = [ld_image]
        # Strip query-string sizing on the first image so we keep full resolution.
        imgs = [re.sub(r"\?aio=.*$", "", u) for u in imgs]

        ppsf = int(round(price / area_sqft)) if (price and area_sqft) else None
        out.append({
            "id": str(uuid.uuid4()),
            "source": SOURCE,
            "title": title,
            "city": resolve_city(area, city),
            "locality_text": area,
            "bedrooms": bhk,
            "bathrooms": bath,
            "area_sqft": area_sqft,
            "price_inr": price,
            "price_per_sqft": ppsf,
            "description": str(apt.get("description") or title)[:400],
            "project_name": project_name,
            "builder_name": None,
            "listing_url": urljoin(BASE, url_listing) if url_listing else None,
            "images": imgs,
            "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        })
    log.info("SY %s → %d listings", area, len(out))
    return out
