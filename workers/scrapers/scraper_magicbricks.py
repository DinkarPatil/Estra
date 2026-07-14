"""
magicbricks.com scraper — residential sale, search-result pages.

Implementation note: magicbricks renders JSON-LD `Apartment` blocks for SEO,
but those blocks omit price and floorSize. The actual price / carpet area /
builder name live in inline JS state objects on the same page (one per tile,
in document order). We extract both, then zip by index.
"""

import json
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urljoin

from bs4 import BeautifulSoup

from .base import extract_jsonld, fetch, jsonld_to_raw

_TILE_PRICE_RE = re.compile(
    r'"price"\s*:\s*(?P<price>\d+)'
    r'(?:[^{}]{0,2000}?"priceD"\s*:\s*"(?P<priceD>[^"]{0,40})")?',
    re.DOTALL,
)
_TILE_CARPET_RE = re.compile(r'"carpetArea"\s*:\s*"?(?P<area>\d+(?:\.\d+)?)"?')
_TILE_DEV_RE = re.compile(r'"devName"\s*:\s*"(?P<dev>[^"]{1,120})"')
_URL_AREA_RE = re.compile(r"-(\d{2,5})-Sq-ft", re.IGNORECASE)

SOURCE = "magicbricks"
BASE = "https://www.magicbricks.com"

CITY_URLS = {
    "Mumbai": [
        f"{BASE}/property-for-sale/residential-real-estate"
        f"?proptype=Multistorey-Apartment,Builder-Floor-Apartment,"
        f"Penthouse,Studio-Apartment,Residential-House,Villa&cityName=Mumbai",
    ],
    "Pune": [
        f"{BASE}/property-for-sale/residential-real-estate"
        f"?proptype=Multistorey-Apartment,Builder-Floor-Apartment,"
        f"Penthouse,Studio-Apartment,Residential-House,Villa&cityName=Pune",
    ],
}


def _from_cards(soup: BeautifulSoup, city: str) -> List[Dict[str, Any]]:
    out: List[Dict[str, Any]] = []
    candidates = soup.select(
        ".mb-srp__card, .SRCard, article, [class*='SRPTuple'], [data-summary]"
    )
    for card in candidates:
        title_el = (
            card.find(attrs={"class": re.compile("title|heading", re.I)})
            or card.find(["h2", "h3"])
            or card.find("a")
        )
        title = title_el.get_text(" ", strip=True) if title_el else None
        if not title:
            continue

        link_el = card.find("a", href=True)
        listing_url = urljoin(BASE, link_el["href"]) if link_el else None

        price_el = card.find(attrs={"class": re.compile("price", re.I)})
        price = price_el.get_text(" ", strip=True) if price_el else None

        area_el = card.find(attrs={"class": re.compile("size|area|carpet", re.I)})
        area = area_el.get_text(" ", strip=True) if area_el else None

        desc_el = card.find(attrs={"class": re.compile("desc|summary", re.I)})
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


def _extract_tile_state(html: str) -> List[Dict[str, Any]]:
    """Pull (price, priceD, carpetArea, devName) from each tile in document order.

    Tile state in magicbricks is laid out roughly as:
      ... "devName": "<builder>" ... "postDateT": ... "price": <int>,
          "priceD": "<X.YZ Cr>" ... "carpetArea": "<sqft>" ...
    devName appears BEFORE price (look-behind window); carpetArea appears
    AFTER price (look-ahead window).
    """
    tiles: List[Dict[str, Any]] = []
    last_end = 0
    for m in _TILE_PRICE_RE.finditer(html):
        # Look-behind for devName (bounded by previous tile's end to avoid leaking).
        behind = html[max(last_end, m.start() - 4000): m.start()]
        # Take the LAST devName in the look-behind window — that's the closest one.
        dev_match = None
        for dm in _TILE_DEV_RE.finditer(behind):
            dev_match = dm
        # Look-ahead for carpetArea.
        ahead = html[m.end(): min(len(html), m.end() + 4000)]
        carpet = _TILE_CARPET_RE.search(ahead)
        try:
            price_int = int(m.group("price"))
        except (TypeError, ValueError):
            price_int = None
        tiles.append({
            "price": price_int,
            "priceD": m.group("priceD"),
            "carpetArea": float(carpet.group("area")) if carpet else None,
            "devName": dev_match.group("dev") if dev_match else None,
        })
        last_end = m.end()
    return tiles


_PROJECT_FROM_TITLE_RE = re.compile(
    r"\bin\s+([A-Za-z0-9 &/'\-]+?)\s*,",
    re.IGNORECASE,
)


def _project_from_title(title: Optional[str]) -> Optional[str]:
    """Magicbricks titles are reliably '<N> BHK Flat for Sale in <Project>, <Locality>, <City>'."""
    if not title:
        return None
    m = _PROJECT_FROM_TITLE_RE.search(title)
    if not m:
        return None
    name = m.group(1).strip(" -,")
    return name or None


def _build_description(raw: Dict[str, Any], tile: Optional[Dict[str, Any]]) -> str:
    """Compose a friendly card description from structured fields."""
    parts = []
    title = raw.get("title")
    if title:
        parts.append(title.replace("  ", " ").strip())
    if tile and tile.get("priceD"):
        parts.append(f"Asking ₹{tile['priceD']}.")
    if raw.get("area"):
        parts.append(f"Carpet area {raw['area']}.")
    if raw.get("builder_name"):
        parts.append(f"By {raw['builder_name']}.")
    return " ".join(parts).strip()


def _enrich(raw: Dict[str, Any], tile: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    """Fill price/area/builder/project from tile state + URL slug + title."""
    if tile:
        if not raw.get("price") and tile.get("price"):
            raw["price"] = tile["price"]
        if not raw.get("area") and tile.get("carpetArea"):
            raw["area"] = f"{int(tile['carpetArea'])} sqft"
        if not raw.get("builder_name") and tile.get("devName"):
            raw["builder_name"] = tile["devName"]
    if not raw.get("area") and raw.get("listing_url"):
        m = _URL_AREA_RE.search(raw["listing_url"])
        if m:
            raw["area"] = f"{m.group(1)} sqft"
    if not raw.get("project_name"):
        raw["project_name"] = _project_from_title(raw.get("title"))
    if not raw.get("description") or raw.get("description") == raw.get("title"):
        raw["description"] = _build_description(raw, tile)
    return raw


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

            # Magicbricks: enrich JSON-LD with inline JS state (price, area, builder).
            tiles = _extract_tile_state(html)
            for i, raw in enumerate(mapped):
                tile = tiles[i] if i < len(tiles) else None
                _enrich(raw, tile)

            if not mapped:
                mapped = _from_cards(soup, city)
            results.extend(mapped)
            print(f"    [magicbricks] {city} page {page}: {len(mapped)} raw items")
    return results
