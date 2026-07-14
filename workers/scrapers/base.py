"""
HTTP helper for scrapers.

Centralizes:
  - rotating User-Agent (light spoofing — these sites still gate on bot signals,
    but stable UA strings get blocked faster than rotated ones)
  - retries with backoff
  - polite delay between requests
  - JSON-LD extraction (most reliable structured-data path)
"""

import json
import random
import time
from typing import Any, Dict, List, Optional

import requests
from bs4 import BeautifulSoup

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

DEFAULT_HEADERS = {
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-IN,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Connection": "keep-alive",
}


def fetch(
    url: str,
    retries: int = 3,
    timeout: float = 15.0,
    delay_range=(1.5, 3.5),
) -> Optional[str]:
    """Fetch a URL with polite retries. Returns body text on 200, else None."""
    last_err = None
    for attempt in range(retries):
        try:
            headers = {**DEFAULT_HEADERS, "User-Agent": random.choice(USER_AGENTS)}
            resp = requests.get(url, headers=headers, timeout=timeout)
            if resp.status_code == 200 and resp.text:
                # Polite delay AFTER a successful fetch so we don't hammer the next URL.
                time.sleep(random.uniform(*delay_range))
                return resp.text
            last_err = f"HTTP {resp.status_code}"
        except requests.RequestException as e:
            last_err = type(e).__name__
        # Backoff before retry.
        time.sleep(random.uniform(*delay_range) * (attempt + 1))
    print(f"    [fetch] giving up on {url}: {last_err}")
    return None


def extract_jsonld(soup: BeautifulSoup) -> List[Dict[str, Any]]:
    """Pull every dict found inside <script type='application/ld+json'> tags.

    Flattens ItemList → itemListElement so callers see one list of items.
    """
    out: List[Dict[str, Any]] = []
    for tag in soup.find_all("script", type="application/ld+json"):
        text = tag.string or tag.get_text() or ""
        if not text.strip():
            continue
        try:
            payload = json.loads(text)
        except json.JSONDecodeError:
            continue
        items = payload if isinstance(payload, list) else [payload]
        for item in items:
            if not isinstance(item, dict):
                continue
            t = item.get("@type")
            if t == "ItemList":
                for el in item.get("itemListElement") or []:
                    if isinstance(el, dict):
                        nested = el.get("item") or el
                        if isinstance(nested, dict):
                            out.append(nested)
            else:
                out.append(item)
    return out


# Type strings we treat as "this is a property listing".
_LISTING_TYPES = {
    "Product",
    "Apartment",
    "Residence",
    "House",
    "SingleFamilyResidence",
    "Place",
    "RealEstateListing",
    "Accommodation",
}


def jsonld_to_raw(item: Dict[str, Any], default_city: str) -> Optional[Dict[str, Any]]:
    """Map a JSON-LD item to the raw-record shape the cleaner expects."""
    t = item.get("@type")
    if isinstance(t, list):
        types = set(t)
    else:
        types = {t} if t else set()
    if types and not (types & _LISTING_TYPES):
        return None

    offers = item.get("offers") or {}
    if isinstance(offers, list):
        offers = offers[0] if offers else {}
    addr = item.get("address") or {}
    if isinstance(addr, list):
        addr = addr[0] if addr else {}
    geo = item.get("geo") or {}
    if isinstance(geo, list):
        geo = geo[0] if geo else {}

    floor_size = item.get("floorSize")
    area_value = None
    if isinstance(floor_size, dict):
        area_value = floor_size.get("value") or floor_size.get("name")
    elif floor_size is not None:
        area_value = floor_size

    project = item.get("isPartOf")
    if isinstance(project, list):
        project = project[0] if project else None

    return {
        "title": item.get("name") or item.get("headline"),
        "price": (
            offers.get("price")
            if isinstance(offers, dict)
            else None
        ) or item.get("price"),
        "area": area_value,
        "bhk": item.get("numberOfRooms"),
        "bathrooms": item.get("numberOfBathroomsTotal") or item.get("numberOfBathrooms"),
        "city": (addr.get("addressLocality") if isinstance(addr, dict) else None) or default_city,
        "locality": (addr.get("streetAddress") if isinstance(addr, dict) else None),
        "lat": geo.get("latitude") if isinstance(geo, dict) else None,
        "lon": geo.get("longitude") if isinstance(geo, dict) else None,
        "description": item.get("description"),
        "listing_url": item.get("url") or item.get("@id"),
        "project_name": project.get("name") if isinstance(project, dict) else None,
        "builder_name": (
            (item.get("brand") or {}).get("name")
            if isinstance(item.get("brand"), dict)
            else None
        ),
    }
