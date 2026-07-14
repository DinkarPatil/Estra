"""
99acres live scraper. Uses Playwright (renders JS, accepts cookies) because
plain requests get HTTP 403 Akamai-blocked.

Card structure on 99acres SRP after render:
  - JSON-LD with @type 'Apartment' / 'Residence'
  - <img class="..."> inside each card (data-src + src)
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.core.logging import get_logger

from ..browser import fetch_rendered
from ..parsers import parse_area_sqft, parse_bhk, parse_price_inr, slugify, resolve_city

log = get_logger("realtime.99acres")

BASE = "https://www.99acres.com"
SOURCE = "99acres"


def _build_url(area: str, city: Optional[str]) -> str:
    city_resolved = resolve_city(area, city) or "Mumbai"
    city_slug = slugify(city_resolved)
    locality_slug = slugify(area)
    return (
        f"{BASE}/property-in-{locality_slug}-{city_slug}-ffid"
    )


async def scrape_area(area: str, city: Optional[str], limit: int) -> List[Dict[str, Any]]:
    url = _build_url(area, city)
    html = await fetch_rendered(
        url,
        wait_for_selector="script[type='application/ld+json']",
        extra_wait_ms=2500,
    )
    if not html:
        log.warning("99acres rendered fetch failed for %s", area)
        return []

    soup = BeautifulSoup(html, "html.parser")
    items: List[Dict[str, Any]] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(tag.string or tag.get_text() or "")
        except json.JSONDecodeError:
            continue
        block = data if isinstance(data, list) else [data]
        for it in block:
            if isinstance(it, dict) and it.get("@type") in (
                "Apartment", "Residence", "Place", "Product", "RealEstateListing"
            ):
                items.append(it)

    # Cards on the page (for image extraction in document order)
    cards = soup.select("[class*='srpTuple'], [class*='tupleCard'], article")
    card_imgs: List[List[str]] = []
    for card in cards:
        urls = []
        for img in card.find_all("img"):
            for attr in ("src", "data-src"):
                u = img.get(attr)
                if u and u.startswith("http") and u not in urls:
                    urls.append(u)
                    break
        card_imgs.append(urls[:3])

    out: List[Dict[str, Any]] = []
    for i, it in enumerate(items):
        if len(out) >= limit:
            break
        offers = it.get("offers") or {}
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        floor_size = it.get("floorSize")
        area_text = None
        if isinstance(floor_size, dict):
            area_text = floor_size.get("value") or floor_size.get("name")
        elif floor_size is not None:
            area_text = floor_size

        title = it.get("name") or it.get("description")
        url_listing = it.get("url") or it.get("@id")

        price = parse_price_inr(offers.get("price")) if isinstance(offers, dict) else None
        if not price:
            price = parse_price_inr(it.get("description"))
        if not price:
            price = parse_price_inr(title)
        area_sqft = parse_area_sqft(area_text) or parse_area_sqft(title)
        bhk = parse_bhk(title) or parse_bhk(it.get("description"))

        addr = it.get("address") or {}
        if isinstance(addr, list):
            addr = addr[0] if addr else {}
        locality = addr.get("addressLocality") if isinstance(addr, dict) else None

        imgs = card_imgs[i] if i < len(card_imgs) else []
        ld_image = it.get("image")
        if ld_image:
            if isinstance(ld_image, list):
                imgs = [u for u in ld_image if isinstance(u, str)][:3] + imgs
            elif isinstance(ld_image, str):
                imgs = [ld_image] + imgs
        imgs = list(dict.fromkeys([u for u in imgs if u and isinstance(u, str)]))[:3]

        ppsf = int(round(price / area_sqft)) if (price and area_sqft) else None
        out.append({
            "id": str(uuid.uuid4()),
            "source": SOURCE,
            "title": title,
            "city": resolve_city(area, city),
            "locality_text": locality or area,
            "bedrooms": bhk,
            "bathrooms": bhk,
            "area_sqft": area_sqft,
            "price_inr": price,
            "price_per_sqft": ppsf,
            "description": str(it.get("description") or title or "")[:400],
            "project_name": None,
            "builder_name": None,
            "listing_url": urljoin(BASE, url_listing) if url_listing else None,
            "images": imgs,
            "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        })
    log.info("99acres %s → %d listings", area, len(out))
    return out
