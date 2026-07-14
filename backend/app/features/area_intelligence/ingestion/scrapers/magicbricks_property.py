"""MagicBricks single-property detail scraper.

MagicBricks emits rich schema.org JSON-LD on every listing detail page which
carries the bulk of the useful data (price, lat/lng, locality, bedrooms,
bathrooms, floorSize, primary amenities, datePosted, image). A few fields
only live in the HTML body — RERA registration IDs, the detail key/value
table (Carpet Area, Status, Facing, Furnished Status, Car parking,
Ownership, Transaction type), and the seller type.

These pages are individual listings — one unit, one price, one seller —
complementary to the project-level cards 99acres gives us.
"""

from __future__ import annotations

import asyncio
import html as htmlmod
import json
import re
from dataclasses import asdict, dataclass, field
from datetime import datetime, timezone
from typing import Any

import httpx

from app.core.logging import get_pipeline_logger

from ._http import HostLimiter

log = get_pipeline_logger("area.magicbricks_property")

HOST = "www.magicbricks.com"

_BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:121.0) "
        "Gecko/20100101 Firefox/121.0"
    ),
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Accept-Language": "en-US,en;q=0.5",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
    "Referer": "https://www.google.com/",
}


@dataclass
class Amenity:
    name: str
    value: str | None = None


@dataclass
class MBPropertyDetail:
    url: str
    property_id: str | None        # trailing id= in URL
    name: str | None
    description: str | None
    # pricing
    price: float | None
    price_currency: str | None
    availability: str | None
    # location
    locality: str | None
    region: str | None             # city in schema.org terms
    country: str | None
    latitude: float | None
    longitude: float | None
    # unit shape
    bedrooms: int | None
    bathrooms: int | None
    floor_size_label: str | None   # e.g. "1500 FTK"
    carpet_area: str | None
    transaction_type: str | None   # "Resale" / "New Property"
    status: str | None             # "Ready to Move" / "Under Construction"
    facing: str | None
    furnished_status: str | None
    car_parking: str | None
    ownership_type: str | None
    # project (apartment pages only)
    developer: str | None = None
    project_name: str | None = None
    possession_note: str | None = None
    lifts: str | None = None
    # regulatory
    rera_ids: list[str] = field(default_factory=list)
    # content
    amenities: list[Amenity] = field(default_factory=list)
    image_url: str | None = None
    date_posted: str | None = None
    seller_type: str | None = None  # "Owner" / "Agent" / "Builder"
    # meta
    scraped_at: str = ""
    error: str | None = None


# ── parsing helpers ──────────────────────────────────────────────────────────

_LD_RE = re.compile(
    r'<script\s+type="application/ld\+json"[^>]*>(.*?)</script>',
    re.DOTALL,
)
_DETAIL_RE = re.compile(
    r'class="mb-ldp__dtls__body__list--label"[^>]*>([^<]+)</div>\s*'
    r'<div\s+class="mb-ldp__dtls__body__list--value[^"]*"[^>]*>(.*?)'
    r'(?=<div\s+class="mb-ldp__dtls__body__list--(?:label|item))',
    re.DOTALL,
)
# Primary RERA lives in an element with id="reraId" — grab its text only.
# The page also has a background JSON array of related-project RERAs which
# we deliberately skip to avoid attributing someone else's RERA to this listing.
_RERA_RE = re.compile(r'id="reraId"[^>]*>\s*([A-Z]\d{10,}(?:\s+[A-Z]\d{10,})*)')
_ID_RE = re.compile(r'[?&]id=([A-Za-z0-9]+)')
_SELLER_TYPE_RE = re.compile(
    r'"sellerType"\s*:\s*"([^"]+)"|Posted By[^<]*<[^>]*>([A-Za-z ]+)<'
)


def _clean_html(s: str) -> str:
    """Strip tags, unescape HTML entities, collapse whitespace."""
    s = re.sub(r"<[^>]+>", " ", s)
    s = htmlmod.unescape(s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def _safe_float(v: Any) -> float | None:
    try:
        return float(v) if v not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _safe_int(v: Any) -> int | None:
    try:
        return int(v) if v not in (None, "") else None
    except (TypeError, ValueError):
        return None


def _parse_ld_blocks(html: str) -> list[dict]:
    blocks: list[dict] = []
    for m in _LD_RE.finditer(html):
        try:
            obj = json.loads(m.group(1).strip())
        except json.JSONDecodeError:
            continue
        if isinstance(obj, list):
            blocks.extend(x for x in obj if isinstance(x, dict))
        elif isinstance(obj, dict):
            blocks.append(obj)
    return blocks


def _pick_listing_block(blocks: list[dict]) -> dict | None:
    """Return the Product/RealEstateListing block (richest payload)."""
    for b in blocks:
        t = b.get("@type") or b.get("type")
        if isinstance(t, list) and ("RealEstateListing" in t or "Product" in t):
            return b
        if isinstance(t, str) and t in ("RealEstateListing", "Product"):
            return b
    return None


def _pick_residence_block(blocks: list[dict]) -> dict | None:
    """Return the residence block (has floorSize, geo, address)."""
    residence_types = {
        "SingleFamilyResidence", "Residence", "Apartment", "House",
        "ApartmentComplex",
    }
    for b in blocks:
        t = b.get("@type") or b.get("type")
        if isinstance(t, str) and t in residence_types:
            return b
    return None


def _parse_detail_table(html: str) -> dict[str, str]:
    """Extract the label→value pairs from the detail table body."""
    out: dict[str, str] = {}
    for label, raw_value in _DETAIL_RE.findall(html):
        label = label.strip()
        value = _clean_html(raw_value)
        # Carpet Area value is cluttered with unit-selector text — keep the
        # leading "<num> <unit>" segment only.
        if label.lower() == "carpet area":
            m = re.match(r"^([\d.,]+\s*\w+)", value)
            if m:
                value = m.group(1)
        out[label] = value
    return out


def _parse_rera(html: str) -> list[str]:
    ids: set[str] = set()
    for m in _RERA_RE.finditer(html):
        raw = m.group(1).strip()
        for part in raw.split():
            if re.fullmatch(r"[A-Z]\d{10,}", part):
                ids.add(part)
    return sorted(ids)


def _parse_seller_type(html: str) -> str | None:
    m = _SELLER_TYPE_RE.search(html)
    if not m:
        return None
    return (m.group(1) or m.group(2) or "").strip() or None


def _parse_id(url: str) -> str | None:
    m = _ID_RE.search(url)
    return m.group(1) if m else None


def _amenities_from_ld(block: dict) -> list[Amenity]:
    main = block.get("mainEntity") or block
    feats = main.get("amenityFeature") or []
    out: list[Amenity] = []
    if isinstance(feats, list):
        for f in feats:
            if isinstance(f, dict):
                name = f.get("name")
                val = f.get("value")
                if name:
                    out.append(Amenity(name=str(name).strip(), value=str(val).strip() if val is not None else None))
    return out


def extract_mb_property(html: str, url: str) -> MBPropertyDetail:
    blocks = _parse_ld_blocks(html)
    listing = _pick_listing_block(blocks) or {}
    residence = _pick_residence_block(blocks) or {}

    # Merge address + geo — prefer listing.mainEntity, fall back to residence
    main = listing.get("mainEntity") or {}
    addr = main.get("address") or residence.get("address") or {}
    geo = main.get("geo") or residence.get("geo") or {}
    offer = listing.get("offers") or {}
    image = listing.get("image") or {}
    floor_size = residence.get("floorSize") or {}
    country = addr.get("addressCountry")
    if isinstance(country, dict):
        country = country.get("name")

    table = _parse_detail_table(html)
    rera_ids = _parse_rera(html)

    bedrooms = (
        _safe_int(main.get("numberOfBedrooms"))
        or _safe_int(residence.get("numberOfRooms"))
    )
    bathrooms = _safe_int(main.get("numberOfBathroomsTotal"))

    return MBPropertyDetail(
        url=url,
        property_id=_parse_id(url),
        name=listing.get("name") or residence.get("name"),
        description=listing.get("description") or residence.get("description"),
        price=_safe_float(offer.get("price")),
        price_currency=offer.get("priceCurrency"),
        availability=offer.get("availability"),
        locality=addr.get("addressLocality"),
        region=addr.get("addressRegion"),
        country=country if isinstance(country, str) else None,
        latitude=_safe_float(geo.get("latitude")),
        longitude=_safe_float(geo.get("longitude")),
        bedrooms=bedrooms,
        bathrooms=bathrooms,
        floor_size_label=floor_size.get("name") if isinstance(floor_size, dict) else None,
        carpet_area=table.get("Carpet Area"),
        transaction_type=table.get("Transaction type") or table.get("Transaction Type"),
        status=table.get("Status"),
        facing=table.get("Facing"),
        furnished_status=table.get("Furnished Status") or table.get("Furnishing"),
        car_parking=table.get("Car parking") or table.get("Car Parking"),
        ownership_type=table.get("Type of Ownership") or table.get("Ownership"),
        developer=table.get("Developer"),
        project_name=table.get("Project"),
        # On apartment SRPs the status + possession are fused: label="Under
        # Construction" / value="Poss by May '28". Capture whichever label
        # describes the construction phase.
        possession_note=(
            table.get("Under Construction")
            or table.get("Ready to Move")
            or table.get("Possession")
        ),
        lifts=table.get("Lifts"),
        rera_ids=rera_ids,
        amenities=_amenities_from_ld(listing),
        image_url=image.get("url") if isinstance(image, dict) else None,
        date_posted=listing.get("datePosted"),
        seller_type=_parse_seller_type(html),
        scraped_at=datetime.now(timezone.utc).isoformat(),
    )


# ── async fetch ──────────────────────────────────────────────────────────────

async def fetch_mb_property(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    url: str,
) -> MBPropertyDetail:
    sem = limiter.for_host(HOST)
    now = datetime.now(timezone.utc).isoformat()
    async with sem:
        try:
            r = await client.get(url, headers=_BROWSER_HEADERS, timeout=30)
            r.raise_for_status()
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            log.warning("mb fetch failed for %s: %s", url, exc)
            return _err(url, now, str(exc))

    if len(r.text) < 40_000:
        return _err(url, now, f"thin response ({len(r.text)} bytes)")

    try:
        detail = extract_mb_property(r.text, url)
    except Exception as exc:  # noqa: BLE001 — protect the worker loop
        log.error("mb parse failed for %s: %s", url, exc)
        return _err(url, now, f"parse: {exc}")

    log.info(
        "magicbricks: %s — ₹%s, %d amenities, RERA=%s",
        detail.name or url, detail.price, len(detail.amenities),
        ",".join(detail.rera_ids) or "-",
    )
    return detail


def _err(url: str, now: str, msg: str) -> MBPropertyDetail:
    return MBPropertyDetail(
        url=url, property_id=_parse_id(url), name=None, description=None,
        price=None, price_currency=None, availability=None,
        locality=None, region=None, country=None,
        latitude=None, longitude=None,
        bedrooms=None, bathrooms=None, floor_size_label=None,
        carpet_area=None, transaction_type=None, status=None, facing=None,
        furnished_status=None, car_parking=None, ownership_type=None,
        scraped_at=now, error=msg,
    )


def mb_detail_as_dict(d: MBPropertyDetail) -> dict:
    return asdict(d)
