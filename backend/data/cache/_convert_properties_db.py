"""
One-shot transformer:
  Input : backend/data/cache/properties_mb.json   (untouched)
  Output: backend/data/cache/properties_db.json   (database-shape, magicbricks references stripped)

Schema for each output row:
  id, broker_id, title, description, listing_type, property_type,
  bedrooms, bathrooms, area_sqft, price_inr, city, locality, address,
  latitude, longitude, map_url, embedding, status, created_at, updated_at
"""

from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
SRC = HERE / "properties_mb.json"
DST = HERE / "properties_db.json"

# Deterministic broker pool — same input id => same broker_id every run.
BROKER_POOL = [str(uuid.UUID(int=i)) for i in (
    0xA1B2C3D4_0001_4000_8000_000000000001,
    0xA1B2C3D4_0001_4000_8000_000000000002,
    0xA1B2C3D4_0001_4000_8000_000000000003,
    0xA1B2C3D4_0001_4000_8000_000000000004,
    0xA1B2C3D4_0001_4000_8000_000000000005,
    0xA1B2C3D4_0001_4000_8000_000000000006,
    0xA1B2C3D4_0001_4000_8000_000000000007,
    0xA1B2C3D4_0001_4000_8000_000000000008,
)]

NOW_ISO = datetime.now(timezone.utc).replace(microsecond=0).isoformat()

PROPERTY_TYPE_RULES: list[tuple[re.Pattern[str], str]] = [
    (re.compile(r"\b(plot|land|nala?|residential land)\b", re.I), "plot"),
    (re.compile(r"\b(office|shop|commercial|warehouse|showroom|industrial)\b", re.I), "commercial"),
    (re.compile(r"\bvilla\b", re.I), "villa"),
    (re.compile(r"\b(bungalow|farm ?house)\b", re.I), "villa"),
    (re.compile(r"\b(house|independent floor|builder floor)\b", re.I), "villa"),
    (re.compile(r"\b(flat|apartment|multistorey|studio)\b", re.I), "apartment"),
]

TEXT_SCRUBS = [
    re.compile(r"com(?:\.[A-Za-z_]+)+(?:\$[A-Za-z_]+)?@[0-9a-f]+", re.I),  # leaked Java FQCN.toString()
    re.compile(r"magic\s*bricks", re.I),
    re.compile(r"99\s*acres", re.I),
    re.compile(r"click the page to know more\s*>+", re.I),
    re.compile(r"https?://\S+", re.I),
    re.compile(r"[✓✔✅●■►→»]", re.I),
]


def scrub_text(text: str | None) -> str | None:
    if not text:
        return None
    for pat in TEXT_SCRUBS:
        text = pat.sub("", text)
    text = re.sub(r"\s+", " ", text).strip(" .•,-")
    return text or None


def infer_property_type(title: str, description: str) -> str:
    blob = f"{title} {description}"
    for pat, label in PROPERTY_TYPE_RULES:
        if pat.search(blob):
            return label
    return "apartment"  # safe default for the catalogue


def build_address(locality: str | None, city: str | None, project: str | None) -> str | None:
    parts = [p for p in (project, locality, city) if p]
    if not parts:
        return None
    addr = ", ".join(parts)
    return addr[:300]


def build_map_url(lat, lng) -> str | None:
    if lat is None or lng is None:
        return None
    return f"https://www.google.com/maps/search/?api=1&query={lat},{lng}"


def pick_broker(prop_id: str) -> str:
    h = int(prop_id.replace("-", "")[:8], 16)
    return BROKER_POOL[h % len(BROKER_POOL)]


def transform(row: dict) -> dict | None:
    raw_str = row.get("raw") or "{}"
    try:
        raw = json.loads(raw_str) if isinstance(raw_str, str) else (raw_str or {})
    except json.JSONDecodeError:
        raw = {}

    prop_id = row.get("id") or str(uuid.uuid4())
    raw_title = (row.get("title") or raw.get("name") or "").strip()
    title = scrub_text(raw_title)
    if not title:
        return None
    title = title[:160]

    description = scrub_text(raw.get("description"))

    listing_type = (row.get("listing_type") or "sale").strip().lower()
    if listing_type not in {"sale", "rent"}:
        listing_type = "sale"

    property_type = infer_property_type(title, description or "")

    bedrooms = row.get("bedrooms")
    if bedrooms is None:
        bedrooms = raw.get("bedrooms")
    if bedrooms is None:
        return None
    try:
        bedrooms = int(bedrooms)
    except (TypeError, ValueError):
        return None

    bathrooms = row.get("bathrooms") if row.get("bathrooms") is not None else raw.get("bathrooms")
    if bathrooms is not None:
        try:
            bathrooms = int(bathrooms)
        except (TypeError, ValueError):
            bathrooms = None

    area_sqft = row.get("area_sqft")
    if area_sqft is None:
        # try carpet_area like "881 sqft"
        ca = raw.get("carpet_area")
        if isinstance(ca, str):
            m = re.search(r"(\d+(?:\.\d+)?)", ca)
            if m:
                area_sqft = float(m.group(1))
    if area_sqft is None:
        # try floor_size_label like "1081 FTK"
        fsl = raw.get("floor_size_label")
        if isinstance(fsl, str):
            m = re.search(r"(\d+(?:\.\d+)?)", fsl)
            if m:
                area_sqft = float(m.group(1))
    if area_sqft is None:
        return None
    try:
        area_sqft = float(area_sqft)
    except (TypeError, ValueError):
        return None

    price_inr = row.get("price_inr")
    if price_inr is None:
        price_inr = raw.get("price")
    if price_inr is None:
        return None
    try:
        price_inr = float(price_inr)
    except (TypeError, ValueError):
        return None

    city = (row.get("city") or raw.get("region") or "").strip()
    locality = (row.get("locality_text") or raw.get("locality") or "").strip()
    if not city or not locality:
        return None

    project = raw.get("project_name")
    address = build_address(locality, city, project)

    lat = raw.get("latitude")
    lng = raw.get("longitude")
    map_url = build_map_url(lat, lng)

    created_at = row.get("scraped_at") or NOW_ISO
    updated_at = row.get("last_seen_at") or created_at

    return {
        "id": prop_id,
        "broker_id": pick_broker(prop_id),
        "title": title,
        "description": description,
        "listing_type": listing_type,
        "property_type": property_type,
        "bedrooms": bedrooms,
        "bathrooms": bathrooms,
        "area_sqft": area_sqft,
        "price_inr": price_inr,
        "city": city,
        "locality": locality,
        "address": address,
        "latitude": lat,
        "longitude": lng,
        "map_url": map_url,
        "embedding": None,
        "status": "published",
        "created_at": created_at,
        "updated_at": updated_at,
    }


def main() -> None:
    with SRC.open("r", encoding="utf-8") as fh:
        rows = json.load(fh)

    out: list[dict] = []
    skipped = 0
    for row in rows:
        rec = transform(row)
        if rec is None:
            skipped += 1
            continue
        out.append(rec)

    with DST.open("w", encoding="utf-8") as fh:
        json.dump(out, fh, ensure_ascii=False, indent=2)

    print(f"input rows : {len(rows)}")
    print(f"written    : {len(out)} -> {DST}")
    print(f"skipped    : {skipped}")


if __name__ == "__main__":
    main()
