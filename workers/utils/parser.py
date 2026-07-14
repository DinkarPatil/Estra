"""
Pure text parsers for real-estate listings.

Each function takes a raw string (or None) and returns a normalized value
or None when extraction is not possible. No I/O, no side effects.
"""

import re
from typing import Optional, Tuple


_PRICE_WITH_SUFFIX_RE = re.compile(
    r"([0-9]+(?:\.[0-9]+)?)\s*(cr|crore|crores|lac|lakh|lakhs|l\b|k\b)",
    re.IGNORECASE,
)
_PRICE_BARE_NUMBER_RE = re.compile(r"[0-9]+(?:\.[0-9]+)?")
_AREA_RE = re.compile(
    r"([0-9]+(?:\.[0-9]+)?)\s*"
    r"(sq\.?\s*ft|sqft|sft|sq\.?\s*m|sqm|sq\.?\s*yd|sqyd|sq\.?\s*yard)?",
    re.IGNORECASE,
)
_BHK_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:bhk|br|bedroom|bed)\b", re.IGNORECASE)
_STUDIO_RE = re.compile(r"\bstudio\b", re.IGNORECASE)


# --- Price ---------------------------------------------------------------

def parse_price(text) -> Optional[int]:
    """Parse INR price text into integer rupees.

    Handles: '95 Lac', '1.2 Cr', '95,00,000', 'Rs. 1.5 Crore', '85L', '₹9500000',
    and prices embedded inside long descriptions ('asking price 1.85 Crore').
    Returns None if no plausible price is present.

    Strategy: prefer matches that carry an explicit unit suffix (Cr/Lac/K) over
    bare numbers, since suffix-bearing matches are almost always the price.
    """
    if text is None:
        return None
    s = str(text).replace(",", " ").strip().lower()
    if not s:
        return None

    # Pass 1: collect every suffix-bearing match and take the largest.
    best: Optional[int] = None
    for m in _PRICE_WITH_SUFFIX_RE.finditer(s):
        try:
            v = float(m.group(1))
        except ValueError:
            continue
        suffix = m.group(2).lower().strip()
        if suffix in ("cr", "crore", "crores"):
            inr = int(round(v * 10_000_000))
        elif suffix in ("lac", "lakh", "lakhs", "l"):
            inr = int(round(v * 100_000))
        elif suffix == "k":
            inr = int(round(v * 1_000))
        else:
            continue
        if best is None or inr > best:
            best = inr
    if best is not None:
        return best

    # Pass 2: bare numbers — first plausibly-large one wins.
    for m in _PRICE_BARE_NUMBER_RE.finditer(s):
        try:
            v = float(m.group(0))
        except ValueError:
            continue
        if v >= 1_00_000:  # at least 1 lakh in raw rupees
            return int(v)
    return None


# --- Area ----------------------------------------------------------------

_SQM_TO_SQFT = 10.7639
_SQYD_TO_SQFT = 9.0


def parse_area_sqft(text) -> Optional[int]:
    """Parse area into square feet (integer). Converts sqm / sqyd if labelled."""
    if text is None:
        return None
    s = str(text).replace(",", "").strip().lower()
    if not s:
        return None
    m = _AREA_RE.search(s)
    if not m:
        return None
    try:
        value = float(m.group(1))
    except ValueError:
        return None
    unit = (m.group(2) or "").replace(" ", "").replace(".", "").lower()
    if unit in ("sqm", "sqmeter"):
        value *= _SQM_TO_SQFT
    elif unit in ("sqyd", "sqyard"):
        value *= _SQYD_TO_SQFT
    # Sanity: residential listings are 100–20000 sqft.
    if value < 100 or value > 20_000:
        return None
    return int(round(value))


# --- BHK -----------------------------------------------------------------

def parse_bhk(text) -> Optional[int]:
    if text is None:
        return None
    s = str(text)
    m = _BHK_RE.search(s)
    if m:
        try:
            return int(float(m.group(1)))
        except ValueError:
            return None
    if _STUDIO_RE.search(s):
        return 1
    return None


# --- Locality / city ----------------------------------------------------

CITY_STATE = {
    # Direct city names
    "mumbai": ("Mumbai", "Maharashtra"),
    "navi mumbai": ("Navi Mumbai", "Maharashtra"),
    "thane": ("Thane", "Maharashtra"),
    "pune": ("Pune", "Maharashtra"),
    "pimpri": ("Pune", "Maharashtra"),
    "chinchwad": ("Pune", "Maharashtra"),
    # Mumbai sub-localities — let locality-only titles still resolve.
    "andheri": ("Mumbai", "Maharashtra"),
    "bandra": ("Mumbai", "Maharashtra"),
    "borivali": ("Mumbai", "Maharashtra"),
    "powai": ("Mumbai", "Maharashtra"),
    "goregaon": ("Mumbai", "Maharashtra"),
    "malad": ("Mumbai", "Maharashtra"),
    "kandivali": ("Mumbai", "Maharashtra"),
    "juhu": ("Mumbai", "Maharashtra"),
    "dadar": ("Mumbai", "Maharashtra"),
    "worli": ("Mumbai", "Maharashtra"),
    "lower parel": ("Mumbai", "Maharashtra"),
    "vikhroli": ("Mumbai", "Maharashtra"),
    "ghatkopar": ("Mumbai", "Maharashtra"),
    "mulund": ("Mumbai", "Maharashtra"),
    "chembur": ("Mumbai", "Maharashtra"),
    "bkc": ("Mumbai", "Maharashtra"),
    # Pune sub-localities
    "baner": ("Pune", "Maharashtra"),
    "wakad": ("Pune", "Maharashtra"),
    "hinjewadi": ("Pune", "Maharashtra"),
    "kothrud": ("Pune", "Maharashtra"),
    "viman nagar": ("Pune", "Maharashtra"),
    "kharadi": ("Pune", "Maharashtra"),
    "hadapsar": ("Pune", "Maharashtra"),
    "magarpatta": ("Pune", "Maharashtra"),
    "aundh": ("Pune", "Maharashtra"),
    "koregaon park": ("Pune", "Maharashtra"),
    "kalyani nagar": ("Pune", "Maharashtra"),
}


def normalize_city(text) -> Tuple[Optional[str], Optional[str]]:
    """Map free-text to (canonical_city, state). Returns (None, None) if unknown."""
    if not text:
        return (None, None)
    s = str(text).lower()
    # Longest-match wins so 'navi mumbai' beats 'mumbai'.
    for key in sorted(CITY_STATE, key=len, reverse=True):
        if re.search(rf"\b{re.escape(key)}\b", s):
            return CITY_STATE[key]
    return (None, None)


def parse_locality(title, city: Optional[str]) -> Optional[str]:
    """Extract a locality (suburb) from a property title.

    Handles two common patterns:
      A) "2 BHK Flat in Andheri West, Mumbai"          → "Andheri West"
      B) "3 BHK Flat in Rustomjee Vista Bay, Sewri, Mumbai" → "Sewri"
         (when the segment right after 'in' is a project name and the next
         comma-delimited segment is the actual locality)
    """
    if not title:
        return None
    s = str(title)
    m = re.search(
        r"\bin\s+([A-Za-z0-9 &/'\-,]+?)(?:\s+near\b|\s+for\b|\s*\(|$)",
        s,
        re.IGNORECASE,
    )
    if not m:
        return None
    tail = m.group(1)
    parts = [p.strip(" -") for p in tail.split(",") if p.strip(" -")]
    if not parts:
        return None
    if city:
        parts = [p for p in parts if not re.fullmatch(rf"\s*{re.escape(city)}\s*", p, re.IGNORECASE)]
    if not parts:
        return None
    # Pattern B: "<project>, <locality>, <city>" — magicbricks-style titles.
    # When there are 2+ comma segments, the first is almost always the project
    # name and the actual locality is segment[1]. Only fall back to segment[0]
    # when it's itself a recognised locality token.
    if len(parts) >= 2:
        if _is_known_locality(parts[0]):
            return parts[0]
        return parts[1]
    return parts[0]


def _is_known_locality(segment: str) -> bool:
    s = segment.lower().strip()
    return any(
        re.search(rf"\b{re.escape(k)}\b", s)
        for k in CITY_STATE
        if k not in {"mumbai", "pune", "navi mumbai", "thane"}
    )


# --- Description --------------------------------------------------------

_HTML_TAG_RE = re.compile(r"<[^>]+>")
_WHITESPACE_RE = re.compile(r"\s+")
_JUNK_PHRASES = (
    "click here", "read more", "show more", "view details",
    "for more details", "contact owner", "call now", "verified by",
)


def clean_description(text) -> str:
    if text is None:
        return ""
    s = _HTML_TAG_RE.sub(" ", str(text))
    s = _WHITESPACE_RE.sub(" ", s).strip()
    for j in _JUNK_PHRASES:
        s = re.sub(re.escape(j), "", s, flags=re.IGNORECASE)
    # Collapse punctuation orphaned by junk-phrase removal (". ." → ".").
    s = re.sub(r"\s*([.,;:!?])\s*(?=[.,;:!?])", "", s)
    s = re.sub(r"\s+([.,;:!?])", r"\1", s)
    s = _WHITESPACE_RE.sub(" ", s).strip()
    return s[:1500]


# --- Derived ------------------------------------------------------------

def compute_price_per_sqft(price: Optional[int], area: Optional[int]) -> Optional[int]:
    if not price or not area or area <= 0:
        return None
    return int(round(price / area))
