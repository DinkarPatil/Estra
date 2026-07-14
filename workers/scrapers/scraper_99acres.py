"""
99acres.com scraper — residential sale, search-result pages.

Strategy: prefer JSON-LD structured data (most reliable across SPA churn).
Fall back to heuristic card parsing when JSON-LD is absent.
"""

import re
from typing import Any, Dict, List
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .base import extract_jsonld, fetch, jsonld_to_raw

SOURCE = "99acres"
BASE = "https://www.99acres.com"

CITY_URLS = {
    "Mumbai": [
        f"{BASE}/property-in-mumbai-ffid",
        f"{BASE}/search/property/buy/mumbai-all"
        f"?city=12&preference=S&area_unit=1&res_com=R",
    ],
    "Pune": [
        f"{BASE}/property-in-pune-ffid",
        f"{BASE}/search/property/buy/pune-all"
        f"?city=19&preference=S&area_unit=1&res_com=R",
    ],
}


def _from_cards(soup: BeautifulSoup, city: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    candidates = soup.select(
        "[class*='srpTuple'], [class*='tupleCard'], "
        "[class*='SrpTuple'], article, [data-id]"
    )
    for card in candidates:
        title_el = (
            card.find(["h2", "h3"])
            or card.find(attrs={"class": re.compile("title", re.I)})
            or card.find("a")
        )
        title = title_el.get_text(" ", strip=True) if title_el else None
        if not title:
            continue

        link_el = card.find("a", href=True)
        listing_url = urljoin(BASE, link_el["href"]) if link_el else None

        price_el = card.find(attrs={"class": re.compile("price", re.I)})
        price = price_el.get_text(" ", strip=True) if price_el else None

        area_el = card.find(attrs={"class": re.compile("area|size|carpet", re.I)})
        area = area_el.get_text(" ", strip=True) if area_el else None

        desc_el = card.find(attrs={"class": re.compile("desc|summary|specs", re.I)})
        description = desc_el.get_text(" ", strip=True) if desc_el else title

        out.append({
            "title": title,
            "price": price,
            "area": area,
            "description": description,
            "listing_url": listing_url,
            "city": city,
        })
    return out


def scrape(city: str, max_pages: int = 1) -> List[Dict[str, Any]]:
    urls = CITY_URLS.get(city, [])
    results: List[Dict[str, Any]] = []
    for base_url in urls:
        for page in range(1, max_pages + 1):
            sep = "&" if "?" in base_url else "?"
            url = base_url if page == 1 else f"{base_url}{sep}page={page}"
            html = fetch(url)
            if not html:
                continue
            soup = BeautifulSoup(html, "html.parser")
            jsonld_items = extract_jsonld(soup)
            mapped = [jsonld_to_raw(it, city) for it in jsonld_items]
            mapped = [m for m in mapped if m and m.get("title")]
            if not mapped:
                mapped = _from_cards(soup, city)
            results.extend(mapped)
            print(f"    [99acres] {city} page {page}: {len(mapped)} raw items")
    return results
