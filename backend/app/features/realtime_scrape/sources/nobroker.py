"""
NoBroker live scraper. Uses Playwright since the site is JS-rendered.
"""

from __future__ import annotations

import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from app.core.logging import get_logger

from ..browser import fetch_rendered
from ..parsers import parse_area_sqft, parse_bhk, parse_price_inr, slugify, resolve_city

log = get_logger("realtime.nobroker")

BASE = "https://www.nobroker.in"
SOURCE = "nobroker"


def _build_url(area: str, city: Optional[str]) -> str:
    city_resolved = (resolve_city(area, city) or "Mumbai").lower()
    # NoBroker buy search — the public listings URL with locality query.
    from urllib.parse import quote
    return (
        f"{BASE}/buy_listings/?city={quote(city_resolved)}"
        f"&searchParam={quote(area)}"
        f"&type=BHK1,BHK2,BHK3,BHK4,BHK5,BHK6"
        f"&radius=2.0"
    )


async def scrape_area(area: str, city: Optional[str], limit: int) -> List[Dict[str, Any]]:
    url = _build_url(area, city)
    html = await fetch_rendered(
        url,
        wait_for_selector="[id*='card'], [class*='card'], article",
        extra_wait_ms=4500,
        scroll=True,
    )
    if not html:
        log.warning("nobroker rendered fetch failed for %s", area)
        return []

    soup = BeautifulSoup(html, "html.parser")
    cards = soup.select(
        "[id^='card'], [class*='Card_card'], [class*='cardContainer'], "
        "[class*='nb-card'], article"
    )
    out: List[Dict[str, Any]] = []
    for card in cards:
        if len(out) >= limit:
            break
        title_el = (
            card.find(attrs={"class": re.compile("heading|title|name", re.I)})
            or card.find(["h2", "h3"])
            or card.find("a")
        )
        title = title_el.get_text(" ", strip=True) if title_el else None
        if not title or len(title) < 6:
            continue

        link_el = card.find("a", href=True)
        url_listing = urljoin(BASE, link_el["href"]) if link_el else None

        price_el = card.find(attrs={"class": re.compile("price|rupee", re.I)}) or \
                   card.find(string=re.compile(r"₹|Cr|Lac|Lakh", re.I))
        price_text = price_el.get_text(" ", strip=True) if hasattr(price_el, "get_text") else str(price_el or "")
        price = parse_price_inr(price_text) or parse_price_inr(title)

        area_el = card.find(attrs={"class": re.compile("area|sqft|carpet", re.I)})
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
    log.info("nobroker %s → %d", area, len(out))
    return out
