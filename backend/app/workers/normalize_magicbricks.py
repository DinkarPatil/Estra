"""Normalize MagicBricks detail JSONL into the property-cache shape.

Reads:  data/exports/magicbricks/property_details_YYYY-MM.jsonl
Writes: data/cache/properties_mb.json   (sidecar — NOT merged into properties.json yet)

Maps each MB JSON-LD record to the dict shape consumed by
``property_intelligence.cache`` (see ``PropertyDetail``). Skips rows that
errored during scrape, dedupes within MB by ``property_id``, and
dedupes against existing ``properties.json`` on
``(round(lat,4), round(lon,4), int(price), bedrooms)``.

Usage:
    python -m app.workers.normalize_magicbricks
    python -m app.workers.normalize_magicbricks --month 2026-04
    python -m app.workers.normalize_magicbricks --no-dedupe-existing
"""

from __future__ import annotations

import argparse
import json
import re
import uuid
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from app.core.logging import get_logger

log = get_logger("workers.normalize_magicbricks")

ROOT = Path(__file__).resolve().parents[2]
EXPORT_DIR = ROOT / "data" / "exports" / "magicbricks"
CACHE_DIR = ROOT / "data" / "cache"
SEED_DIR = ROOT / "data" / "seed"
PROPERTIES_PATH = CACHE_DIR / "properties.json"
MICRO_MARKETS_PATH = SEED_DIR / "micro_markets.json"
OUT_PATH = CACHE_DIR / "properties_mb.json"

_AREA_RE = re.compile(r"(\d[\d,]*\.?\d*)\s*(sqft|sqm|sq\.?\s*ft|sq\.?\s*m|sq)", re.IGNORECASE)
_SQM_TO_SQFT = 10.7639

# Reasonable price bounds for Maharashtra residential. Values outside are
# almost always JSON-LD misparses (booking amounts at the floor; total project
# costs / EMIs at the ceiling). Real ultra-luxury Bandra/Worli tops out
# around ₹150–200cr, so 250cr leaves headroom.
_PRICE_FLOOR_INR = 300_000          # ₹3 lakh
_PRICE_CEILING_INR = 2_500_000_000  # ₹250 cr


def _parse_sqft(label: str | None) -> float | None:
    """Parse an area string and return sqft, converting from sqm if needed."""
    if not label:
        return None
    m = _AREA_RE.search(label)
    if not m:
        return None
    try:
        value = float(m.group(1).replace(",", ""))
    except ValueError:
        return None
    unit = m.group(2).lower().replace(".", "").replace(" ", "")
    if unit == "sqm":
        return round(value * _SQM_TO_SQFT, 2)
    return value


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _normalize_city(region: str | None) -> str | None:
    if not region:
        return None
    r = region.strip()
    # MB returns "Navi Mumbai" with a space; seeded micro_markets are split as
    # Mumbai/Pune/Thane/Nashik/Nagpur/Aurangabad. Keep MB's spelling — the
    # area_names substring match doesn't care, and we surface the correct
    # display value.
    return r


def _existing_keys(properties: list[dict[str, Any]]) -> set[tuple]:
    """Build dedupe keys from existing 99acres rows.

    Lat/lon for those rows are nested inside the stringified `raw` field.
    """
    keys: set[tuple] = set()
    for r in properties:
        raw_str = r.get("raw") or "{}"
        try:
            raw = json.loads(raw_str)
        except (TypeError, ValueError):
            raw = {}
        lat = raw.get("lat") or raw.get("latitude")
        lon = raw.get("lon") or raw.get("longitude")
        price = r.get("price_inr") or raw.get("price_min_inr") or raw.get("price")
        beds = r.get("bedrooms")
        if lat is None or lon is None or price is None or beds is None:
            continue
        try:
            keys.add((round(float(lat), 4), round(float(lon), 4), int(float(price)), int(beds)))
        except (TypeError, ValueError):
            continue
    return keys


def _row_key(mb: dict[str, Any]) -> tuple | None:
    lat = mb.get("latitude")
    lon = mb.get("longitude")
    price = mb.get("price")
    beds = mb.get("bedrooms")
    if lat is None or lon is None or price is None or beds is None:
        return None
    try:
        return (round(float(lat), 4), round(float(lon), 4), int(float(price)), int(beds))
    except (TypeError, ValueError):
        return None


def normalize(mb: dict[str, Any], *, source_tag: str) -> dict[str, Any] | None:
    """Map one MB JSONL row → cache-shaped property dict. Returns None on error rows."""
    if mb.get("error"):
        return None

    sqft = _parse_sqft(mb.get("carpet_area"))
    if sqft is not None and sqft < 100:
        # MB sometimes lists nonsensical areas (e.g. "40 sqft" for a 3BHK).
        # Null the area so price-per-sqft isn't computed off garbage.
        sqft = None
    price = mb.get("price")
    if price is not None and not (_PRICE_FLOOR_INR <= price <= _PRICE_CEILING_INR):
        # Out-of-band: drop the price (booking amount at the floor; total
        # project / EMI bundle at the ceiling). Row stays so non-price filters
        # still surface it; strict mode will reject it for missing price.
        price = None
    ppsf: float | None = None
    if price and sqft and sqft > 0:
        ppsf = round(price / sqft, 2)
        # Bandra-Stand / Cuffe Parade tops out around ₹150k/sqft. Anything
        # above ₹200k is a guaranteed price/area misparse — drop the
        # derived ppsf and the price (area kept; downstream may still filter).
        if ppsf > 200_000:
            price = None
            ppsf = None

    return {
        "id": str(uuid.uuid4()),
        "source": source_tag,
        "external_id": mb.get("property_id"),
        "listing_type": "sale",
        "city": _normalize_city(mb.get("region")),
        "state": "Maharashtra",
        "locality_text": mb.get("locality"),
        "title": (mb.get("name") or "").strip() or None,
        "bedrooms": mb.get("bedrooms"),
        "bathrooms": mb.get("bathrooms"),
        "area_sqft": sqft,
        "price_inr": price,
        "price_per_sqft": ppsf,
        "raw": json.dumps(mb, ensure_ascii=False),
        "scraped_at": mb.get("scraped_at"),
        "last_seen_at": _now_iso(),
    }


def run() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--month", type=str, default=None,
                        help="YYYY-MM tag. Defaults to current UTC month.")
    parser.add_argument("--out", type=Path, default=OUT_PATH,
                        help=f"Output JSON path (default {OUT_PATH})")
    parser.add_argument("--no-dedupe-existing", action="store_true",
                        help="Skip cross-source dedupe vs properties.json")
    parser.add_argument("--strict", action="store_true",
                        help="Keep only rows with price AND locality matching a "
                             "seeded micro-market. Bedrooms/area allowed null.")
    args = parser.parse_args()

    month = args.month or datetime.now(timezone.utc).strftime("%Y-%m")
    in_path = EXPORT_DIR / f"property_details_{month}.jsonl"
    if not in_path.exists():
        raise SystemExit(f"input not found: {in_path}")

    source_tag = f"magicbricks_{month.replace('-', '_')}"

    log.info("reading %s", in_path)
    rows: list[dict[str, Any]] = []
    with in_path.open("r", encoding="utf-8") as fh:
        for ln in fh:
            ln = ln.strip()
            if not ln:
                continue
            try:
                rows.append(json.loads(ln))
            except json.JSONDecodeError:
                continue
    log.info("loaded %d MB rows", len(rows))

    counters: Counter[str] = Counter()
    counters["raw_total"] = len(rows)

    seen_external: set[str] = set()
    existing_keys: set[tuple] = set()
    if not args.no_dedupe_existing and PROPERTIES_PATH.exists():
        existing = json.loads(PROPERTIES_PATH.read_text(encoding="utf-8"))
        existing_keys = _existing_keys(existing)
        log.info("loaded %d existing 99acres rows (%d dedupe keys)",
                 len(existing), len(existing_keys))

    seeded_names: list[str] = []
    if args.strict:
        if not MICRO_MARKETS_PATH.exists():
            raise SystemExit(f"--strict needs {MICRO_MARKETS_PATH}")
        mm = json.loads(MICRO_MARKETS_PATH.read_text(encoding="utf-8"))
        seeded_names = sorted({m["name"].lower() for m in mm if m.get("name")})
        log.info("strict mode: %d seeded micro-market names loaded", len(seeded_names))

    def _matches_seeded_locality(loc: str | None) -> bool:
        if not loc or not seeded_names:
            return False
        ll = loc.lower()
        return any(name in ll or ll in name for name in seeded_names)

    out_rows: list[dict[str, Any]] = []
    for mb in rows:
        if mb.get("error"):
            counters["skipped_error"] += 1
            continue
        ext = mb.get("property_id")
        if ext and ext in seen_external:
            counters["dup_within_mb"] += 1
            continue
        if ext:
            seen_external.add(ext)
        key = _row_key(mb)
        if key and key in existing_keys:
            counters["dup_vs_existing"] += 1
            continue
        norm = normalize(mb, source_tag=source_tag)
        if norm is None:
            counters["skipped_normalize"] += 1
            continue
        if args.strict:
            if norm.get("price_inr") is None:
                counters["strict_dropped_no_price"] += 1
                continue
            if not _matches_seeded_locality(norm.get("locality_text")):
                counters["strict_dropped_unseeded_area"] += 1
                continue
        out_rows.append(norm)
        counters["normalized"] += 1
        # null-field counters for visibility
        for fld in ("price_inr", "area_sqft", "bedrooms", "city", "locality_text"):
            if norm.get(fld) is None:
                counters[f"null_{fld}"] += 1

    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(out_rows, ensure_ascii=False, indent=2), encoding="utf-8")

    log.info("wrote %d normalized rows → %s", len(out_rows), args.out)

    print("\n=== normalize_magicbricks ===")
    for k in (
        "raw_total", "skipped_error", "dup_within_mb", "dup_vs_existing",
        "strict_dropped_no_price", "strict_dropped_unseeded_area",
        "normalized",
        "null_price_inr", "null_area_sqft", "null_bedrooms", "null_city",
        "null_locality_text",
    ):
        print(f"  {k:24s} {counters[k]}")
    print(f"  output: {args.out}")


if __name__ == "__main__":
    run()
