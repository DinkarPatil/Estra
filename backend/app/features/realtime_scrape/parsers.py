"""Field parsers shared across live scrapers (price/area/BHK/slug)."""

from __future__ import annotations

import re
from typing import Optional


_PRICE_WITH_SUFFIX = re.compile(
    r"([0-9]+(?:\.[0-9]+)?)\s*(cr|crore|crores|lac|lakh|lakhs|l\b|k\b)",
    re.IGNORECASE,
)
_PRICE_BARE = re.compile(r"[0-9]+(?:\.[0-9]+)?")
_AREA = re.compile(
    r"([0-9]+(?:\.[0-9]+)?)\s*(sq\.?\s*ft|sqft|sft|sq\.?\s*m|sqm)",
    re.IGNORECASE,
)
_BHK = re.compile(r"(\d+(?:\.\d+)?)\s*(?:bhk|br|bedroom)\b", re.IGNORECASE)


def parse_price_inr(text) -> Optional[int]:
    """Parse INR price into integer rupees."""
    if not text:
        return None
    s = str(text).replace(",", " ").lower()
    best: Optional[int] = None
    for m in _PRICE_WITH_SUFFIX.finditer(s):
        try:
            v = float(m.group(1))
        except ValueError:
            continue
        suf = m.group(2).strip()
        if suf in ("cr", "crore", "crores"):
            inr = int(round(v * 10_000_000))
        elif suf in ("lac", "lakh", "lakhs", "l"):
            inr = int(round(v * 100_000))
        elif suf == "k":
            inr = int(round(v * 1_000))
        else:
            continue
        if best is None or inr > best:
            best = inr
    if best is not None:
        return best
    for m in _PRICE_BARE.finditer(s):
        try:
            v = float(m.group(0))
        except ValueError:
            continue
        if v >= 100_000:
            return int(v)
    return None


def parse_area_sqft(text) -> Optional[int]:
    if not text:
        return None
    s = str(text).replace(",", "").lower()
    m = _AREA.search(s)
    if not m:
        return None
    try:
        v = float(m.group(1))
    except ValueError:
        return None
    unit = m.group(2).replace(" ", "").replace(".", "")
    if unit.startswith("sqm"):
        v *= 10.7639
    if v < 100 or v > 20000:
        return None
    return int(round(v))


def parse_bhk(text) -> Optional[int]:
    if not text:
        return None
    m = _BHK.search(str(text))
    if not m:
        if re.search(r"\bstudio\b", str(text), re.IGNORECASE):
            return 1
        return None
    try:
        return int(float(m.group(1)))
    except ValueError:
        return None


# Locality → city resolver (extends the dataset).
_MUMBAI_LOCALITIES = {
    "andheri west", "andheri east", "andheri", "bandra", "bandra east", "bandra west",
    "borivali", "borivali east", "borivali west", "powai", "goregaon",
    "malad", "malad west", "malad east", "kandivali", "kandivali east", "kandivali west",
    "juhu", "dadar", "dadar west", "worli", "lower parel", "vikhroli",
    "ghatkopar", "mulund", "mulund east", "mulund west", "chembur", "bkc", "sewri",
    "wadala", "mahalakshmi", "bhandup", "bhandup west", "kurla", "kurla east",
    "mira road", "mira road east", "virar", "virar east", "thane",
}
_PUNE_LOCALITIES = {
    "baner", "wakad", "hinjewadi", "kothrud", "viman nagar", "kharadi",
    "hadapsar", "magarpatta", "aundh", "koregaon park", "kalyani nagar",
    "punawale", "pimpri", "chinchwad", "mundhwa", "keshav nagar mundhwa",
}


def resolve_city(locality: str, hint: Optional[str] = None) -> str:
    """Map a locality to its parent city. Defaults to hint (or 'Mumbai')."""
    s = (locality or "").lower().strip()
    if any(k in s for k in _PUNE_LOCALITIES):
        return "Pune"
    if any(k in s for k in _MUMBAI_LOCALITIES):
        return "Mumbai"
    if hint:
        return hint
    return "Mumbai"


def slugify(text: str) -> str:
    """Convert 'Andheri West' → 'andheri-west'."""
    s = re.sub(r"[^a-zA-Z0-9]+", "-", str(text or "").strip().lower())
    return re.sub(r"-+", "-", s).strip("-")
