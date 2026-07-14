"""
MagicBricks live scraper — async, area-scoped.

The plain-requests path works (verified earlier). We mine:
  - JSON-LD <script type="application/ld+json"> for title/url/geo
  - Inline JS state for price/carpetArea/devName (look-behind window)
  - <img src=...> tags inside each tile, plus image URLs from `taImg` /
    `propMediaUrl` patterns in the inline state.
"""

from __future__ import annotations

import asyncio
import json
import re
import uuid
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

from app.core.logging import get_logger

from ..parsers import parse_area_sqft, parse_bhk, parse_price_inr, slugify, resolve_city

log = get_logger("realtime.magicbricks")

BASE = "https://www.magicbricks.com"
SOURCE = "magicbricks"

_TILE_PRICE_RE = re.compile(
    r'"price"\s*:\s*(?P<price>\d+)'
    r'(?:[^{}]{0,2000}?"priceD"\s*:\s*"(?P<priceD>[^"]{0,40})")?',
    re.DOTALL,
)
_CARPET_RE = re.compile(r'"carpetArea"\s*:\s*"?(?P<area>\d+(?:\.\d+)?)"?')
_DEV_RE = re.compile(r'"devName"\s*:\s*"(?P<dev>[^"]{1,120})"')
_IMG_URL_RE = re.compile(r'"(?:imgUrl|propMediaUrl|imgSrc|profileMainImage)"\s*:\s*"([^"]+)"')

_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _build_urls(area: str, city: Optional[str]) -> List[str]:
    """Build SRP URLs. Magicbricks accepts ?Locality= in their public search."""
    city = resolve_city(area, city)
    locality = area.strip()
    return [
        f"{BASE}/property-for-sale/residential-real-estate"
        f"?proptype=Multistorey-Apartment,Builder-Floor-Apartment,Penthouse,"
        f"Studio-Apartment,Residential-House,Villa"
        f"&cityName={city}&Locality={locality.replace(' ', '%20')}",
    ]


def _extract_jsonld_apartments(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        text = tag.string or tag.get_text() or ""
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if not isinstance(it, dict):
                continue
            t = it.get("@type")
            if t in ("Apartment", "Residence", "House", "Place", "Product", "RealEstateListing"):
                out.append(it)
    return out


def _extract_tile_state(html: str) -> List[Dict[str, Any]]:
    tiles: List[Dict[str, Any]] = []
    last_end = 0
    for m in _TILE_PRICE_RE.finditer(html):
        behind = html[max(last_end, m.start() - 4000): m.start()]
        ahead = html[m.end(): min(len(html), m.end() + 4000)]
        dev = None
        for dm in _DEV_RE.finditer(behind):
            dev = dm
        carpet = _CARPET_RE.search(ahead)
        try:
            price = int(m.group("price"))
        except (TypeError, ValueError):
            price = None
        # Image URLs near this tile (decode / → /). Filter out agent
        # profile thumbnails — they live under /user/Photo_h75_w75/ and are
        # NOT property photos. Property photos are under /project/.
        imgs: List[str] = []
        for im in _IMG_URL_RE.finditer(behind + ahead):
            url = im.group(1).replace("\\u002F", "/").replace("\\/", "/")
            if url.startswith("//"):
                url = "https:" + url
            if not url.startswith("http"):
                continue
            # Skip agent / contact-person profile pictures
            low = url.lower()
            if any(bad in low for bad in (
                "/user/photo_h75",
                "/user/photo_h150",
                "contactpersonimage",
                "profile-",
                "/agent/",
            )):
                continue
            # Prefer property photos (project/builder uploads) at meaningful sizes
            if url not in imgs:
                imgs.append(url)
            if len(imgs) >= 3:
                break
        tiles.append({
            "price": price,
            "priceD": m.group("priceD"),
            "carpetArea": float(carpet.group("area")) if carpet else None,
            "devName": dev.group("dev") if dev else None,
            "images": imgs,
        })
        last_end = m.end()
    return tiles


def _is_agent_thumb(url: str) -> bool:
    low = url.lower()
    return any(bad in low for bad in (
        "/user/photo_h75",
        "/user/photo_h150",
        "contactpersonimage",
        "profile-",
        "/agent/",
        "/avatar",
    ))


def _extract_card_images(soup: BeautifulSoup) -> List[List[str]]:
    """One image-list per visible card, in document order. Agent profile
    thumbnails are filtered out — only property/project photos are kept."""
    cards = soup.select("[class*='mb-srp__card'], [class*='SRPTuple'], article")
    out = []
    for card in cards:
        urls = []
        for img in card.find_all("img"):
            for attr in ("src", "data-src", "data-lazy-src"):
                u = img.get(attr)
                if not u:
                    continue
                if u.startswith("//"):
                    u = "https:" + u
                if not u.startswith("http"):
                    continue
                if _is_agent_thumb(u):
                    continue
                if u not in urls:
                    urls.append(u)
                break
        out.append(urls[:3])
    return out


async def scrape_area(
    client: httpx.AsyncClient, area: str, city: Optional[str], limit: int
) -> List[Dict[str, Any]]:
    urls = _build_urls(area, city)
    headers = {
        "User-Agent": _USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-IN,en;q=0.9",
    }
    out: List[Dict[str, Any]] = []
    for url in urls:
        try:
            resp = await client.get(url, headers=headers, timeout=20.0)
            if resp.status_code != 200:
                log.warning("MB %s → HTTP %s", area, resp.status_code)
                continue
            html = resp.text
        except httpx.HTTPError as e:
            log.warning("MB %s → %s", area, e)
            continue

        soup = BeautifulSoup(html, "html.parser")
        apts = _extract_jsonld_apartments(soup)
        tiles = _extract_tile_state(html)
        card_imgs = _extract_card_images(soup)

        for i, apt in enumerate(apts):
            if len(out) >= limit:
                break
            tile = tiles[i] if i < len(tiles) else None
            imgs_from_card = card_imgs[i] if i < len(card_imgs) else []
            tile_imgs = (tile or {}).get("images") or []
            imgs = list(dict.fromkeys(imgs_from_card + tile_imgs))[:3]

            addr = apt.get("address") or {}
            if isinstance(addr, list):
                addr = addr[0] if addr else {}
            geo = apt.get("geo") or {}
            if isinstance(geo, list):
                geo = geo[0] if geo else {}

            title = apt.get("name") or apt.get("description")
            url_listing = apt.get("url") or apt.get("@id")

            price = (tile or {}).get("price")
            area_sqft = None
            if tile and tile.get("carpetArea"):
                area_sqft = int(tile["carpetArea"])
            if not price:
                price = parse_price_inr(title)
            if not area_sqft and url_listing:
                m = re.search(r"-(\d{2,5})-Sq-ft", url_listing, re.IGNORECASE)
                if m:
                    area_sqft = int(m.group(1))

            bhk = parse_bhk(title) or apt.get("numberOfRooms")
            try:
                bhk = int(bhk) if bhk else None
            except (TypeError, ValueError):
                bhk = None

            # Project name = first comma-segment after "in " in title
            project = None
            mp = re.search(r"\bin\s+([A-Za-z0-9 &/'\-]+?)\s*,", str(title or ""))
            if mp:
                project = mp.group(1).strip()

            ppsf = int(round(price / area_sqft)) if (price and area_sqft) else None
            from datetime import datetime, timezone
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
                "description": (
                    f"{title}. "
                    f"{'₹' + (tile or {}).get('priceD','') if (tile or {}).get('priceD') else ''} "
                    f"{('Carpet ' + str(area_sqft) + ' sqft.') if area_sqft else ''}"
                ).strip(),
                "project_name": project,
                "builder_name": (tile or {}).get("devName"),
                "listing_url": urljoin(BASE, url_listing) if url_listing else None,
                "images": imgs,
                "scraped_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            })
    log.info("MB %s → %d listings", area, len(out))
    return out
