"""
Housing.com live scraper. Uses Playwright because plain requests returns 406.
Card extraction relies on rendered DOM + JSON-LD when present.
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

log = get_logger("realtime.housing")

BASE = "https://housing.com"
SOURCE = "housing"


def _build_url(area: str, city: Optional[str]) -> str:
    city_resolved = (resolve_city(area, city) or "Mumbai").lower()
    locality_slug = slugify(area)
    return f"{BASE}/in/buy/{city_resolved}/{locality_slug}"


async def scrape_area(area: str, city: Optional[str], limit: int) -> List[Dict[str, Any]]:
    url = _build_url(area, city)
    html = await fetch_rendered(
        url,
        wait_for_selector="article, [class*='Card'], [data-q]",
        extra_wait_ms=2500,
    )
    if not html:
        log.warning("housing rendered fetch failed for %s", area)
        return []

    soup = BeautifulSoup(html, "html.parser")

    # Try JSON-LD first
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

    out: List[Dict[str, Any]] = []

    # JSON-LD path
    for it in items:
        if len(out) >= limit:
            break
        title = it.get("name") or it.get("description")
        url_listing = it.get("url") or it.get("@id")
        offers = it.get("offers") or {}
        if isinstance(offers, list):
            offers = offers[0] if offers else {}
        price = parse_price_inr(offers.get("price")) if isinstance(offers, dict) else None
        if not price:
            price = parse_price_inr(title)
        floor_size = it.get("floorSize")
        area_text = None
        if isinstance(floor_size, dict):
            area_text = floor_size.get("value") or floor_size.get("name")
        elif floor_size is not None:
            area_text = floor_size
        area_sqft = parse_area_sqft(area_text) or parse_area_sqft(title)
        bhk = parse_bhk(title)

        ld_image = it.get("image")
        imgs: List[str] = []
        if isinstance(ld_image, list):
            imgs = [u for u in ld_image if isinstance(u, str)][:3]
        elif isinstance(ld_image, str):
            imgs = [ld_image]

        ppsf = int(round(price / area_sqft)) if (price and area_sqft) else None
        out.append({
            "id": str(uuid.uuid4()),
            "source": SOURCE,
            "title": title,
            "city": resolve_city(area, city),
            "locality_text": area,
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

    if out:
        log.info("housing %s (jsonld) → %d", area, len(out))
        return out

    # Fallback: heuristic card parsing
    cards = soup.select("article, [class*='SerpTuple'], [data-q='card']")
    for card in cards:
        if len(out) >= limit:
            break
        title_el = (
            card.find(["h2", "h3"])
            or card.find(attrs={"class": re.compile("title|heading|name", re.I)})
            or card.find("a")
        )
        title = title_el.get_text(" ", strip=True) if title_el else None
        if not title:
            continue
        link_el = card.find("a", href=True)
        url_listing = urljoin(BASE, link_el["href"]) if link_el else None
        price_el = card.find(attrs={"class": re.compile("price", re.I)})
        price = parse_price_inr(price_el.get_text(" ", strip=True) if price_el else title)
        area_el = card.find(attrs={"class": re.compile("area|carpet|builtup", re.I)})
        area_sqft = parse_area_sqft(area_el.get_text(" ", strip=True) if area_el else title)
        bhk = parse_bhk(title)
        imgs: List[str] = []
        for img in card.find_all("img"):
            for attr in ("src", "data-src"):
                u = img.get(attr)
                if u and u.startswith("http") and u not in imgs:
                    imgs.append(u)
                    break
            if len(imgs) >= 3:
                break

        ppsf = int(round(price / area_sqft)) if (price and area_sqft) else None
        out.append({
            "id": str(uuid.uuid4()),
            "source": SOURCE,
            "title": title,
            "city": resolve_city(area, city),
            "locality_text": area,
            "bedrooms": bhk,
            "bathrooms": bhk,
            "area_sqft": area_sqft,
            "price_inr": price,
            "price_per_sqft": ppsf,
            "description": title,
            "project_name": None,
            "builder_name": None,
            "listing_url": url_listing,
            "images": imgs,
            "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        })
    log.info("housing %s (cards) → %d", area, len(out))
    return out
