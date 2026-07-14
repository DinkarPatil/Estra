"""
Deterministic property comparison + ranking.

Parses a free-text user query into a structured intent (city, BHK, budget,
ROI/risk preference) using regex — no LLM call. Then scores each property
on six dimensions and returns the ranked list.

Ranking is deliberately LLM-free so it's reproducible, cheap, and never
hallucinates. The Gemini layer (in service.py) only generates narrative
*on top of* this ranking.
"""

from __future__ import annotations

import math
import re
from dataclasses import dataclass, field, asdict
from typing import Any, Dict, List, Optional, Tuple


# ─── intent parsing ────────────────────────────────────────────────────

_BHK_RE = re.compile(r"(\d+(?:\.\d+)?)\s*(?:bhk|br|bedroom|bed)\b", re.IGNORECASE)
_STUDIO_RE = re.compile(r"\bstudio\b", re.IGNORECASE)
_BUDGET_RE = re.compile(
    r"(?:under|below|max|upto|up\s*to|less than|<)\s*"
    r"₹?\s*(\d+(?:\.\d+)?)\s*(cr|crore|crores|lac|lakh|lakhs|l\b|k\b)?",
    re.IGNORECASE,
)
_AREA_RE = re.compile(
    r"(\d{2,5})\s*(?:sq\.?\s*ft|sqft|sft)", re.IGNORECASE
)

_KNOWN_CITIES = ["Mumbai", "Pune", "Navi Mumbai", "Thane"]
_ROI_KEYWORDS = re.compile(r"\b(roi|return|appreciation|growth|invest|capital gain|yield)\b", re.IGNORECASE)
_RISK_KEYWORDS = re.compile(r"\b(low\s*risk|safe|stable|premium|established|reputed)\b", re.IGNORECASE)
_HIGH_RISK_KEYWORDS = re.compile(r"\b(high\s*risk|aggressive|speculative)\b", re.IGNORECASE)


@dataclass
class Intent:
    raw_query: str
    city: Optional[str] = None
    bhk: Optional[int] = None
    budget_inr: Optional[int] = None
    target_area_sqft: Optional[int] = None
    wants_high_roi: bool = False
    wants_low_risk: bool = False
    wants_high_risk: bool = False

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _parse_budget(text: str) -> Optional[int]:
    m = _BUDGET_RE.search(text)
    if not m:
        return None
    try:
        v = float(m.group(1))
    except ValueError:
        return None
    suffix = (m.group(2) or "").lower().strip()
    if suffix in ("cr", "crore", "crores"):
        return int(round(v * 10_000_000))
    if suffix in ("lac", "lakh", "lakhs", "l"):
        return int(round(v * 100_000))
    if suffix == "k":
        return int(round(v * 1_000))
    if v >= 100_000:
        return int(v)
    if v >= 1:
        # Bare numbers like "under 1" — assume Cr (most common phrasing).
        return int(round(v * 10_000_000))
    return None


def parse_intent(query: str) -> Intent:
    """Heuristic, regex-only intent parser. No LLM calls."""
    intent = Intent(raw_query=(query or "").strip())
    if not intent.raw_query:
        return intent

    q = intent.raw_query

    # City
    for city in _KNOWN_CITIES:
        if re.search(rf"\b{re.escape(city)}\b", q, re.IGNORECASE):
            intent.city = city
            break

    # BHK
    m = _BHK_RE.search(q)
    if m:
        try:
            intent.bhk = int(float(m.group(1)))
        except ValueError:
            pass
    elif _STUDIO_RE.search(q):
        intent.bhk = 1

    # Budget
    intent.budget_inr = _parse_budget(q)

    # Target area
    am = _AREA_RE.search(q)
    if am:
        try:
            intent.target_area_sqft = int(am.group(1))
        except ValueError:
            pass

    # Risk / ROI flags
    intent.wants_high_roi = bool(_ROI_KEYWORDS.search(q))
    intent.wants_low_risk = bool(_RISK_KEYWORDS.search(q))
    intent.wants_high_risk = bool(_HIGH_RISK_KEYWORDS.search(q))

    return intent


# ─── scoring ──────────────────────────────────────────────────────────


@dataclass
class ScoreBreakdown:
    budget: float = 0.0
    value_for_money: float = 0.0
    size: float = 0.0
    location: float = 0.0
    roi: float = 0.0
    risk: float = 0.0


WEIGHTS = {
    "budget": 0.25,
    "value_for_money": 0.20,
    "size": 0.15,
    "location": 0.15,
    "roi": 0.15,
    "risk": 0.10,
}


# Curated locality desirability multipliers (0..1). Tuned for Mumbai/Pune.
# Anything outside the lookup gets a neutral 0.55.
_LOCALITY_DESIRABILITY = {
    # Mumbai prime
    "bandra": 0.95, "worli": 0.95, "lower parel": 0.93, "juhu": 0.92,
    "powai": 0.88, "andheri west": 0.86, "andheri": 0.82, "bkc": 0.95,
    # Mumbai mid
    "goregaon": 0.72, "malad": 0.7, "borivali": 0.7, "kandivali": 0.68,
    "ghatkopar": 0.7, "vikhroli": 0.7, "chembur": 0.72, "mulund": 0.7,
    "wadala": 0.74, "sewri": 0.78, "mahalakshmi": 0.9, "dadar": 0.85,
    # Mumbai outer / value
    "bhandup west": 0.6, "bhandup": 0.6, "kurla east": 0.55, "kurla": 0.55,
    "mira road east": 0.5, "mira road": 0.5, "virar east": 0.42, "virar": 0.42,
    # Pune prime
    "koregaon park": 0.92, "kalyani nagar": 0.9, "viman nagar": 0.85,
    "kharadi": 0.82, "magarpatta": 0.85, "aundh": 0.85, "baner": 0.82,
    "kothrud": 0.78,
    # Pune mid / new
    "wakad": 0.75, "hinjewadi": 0.78, "hadapsar": 0.7, "punawale": 0.6,
    "pimpri chinchwad": 0.6, "pimpri": 0.6, "chinchwad": 0.6,
}


def _locality_score(locality: Optional[str]) -> float:
    if not locality:
        return 0.55
    key = locality.lower().strip()
    if key in _LOCALITY_DESIRABILITY:
        return _LOCALITY_DESIRABILITY[key]
    # Fall back to substring match (e.g. "Andheri West, Mumbai" → "andheri west").
    for k, v in _LOCALITY_DESIRABILITY.items():
        if k in key:
            return v
    return 0.55


def _budget_score(price: Optional[int], budget: Optional[int]) -> float:
    """1.0 if within budget, decays as we go over. Neutral 0.6 if no budget."""
    if price is None or price <= 0:
        return 0.0
    if budget is None or budget <= 0:
        return 0.6
    if price <= budget:
        # Reward using budget well — 100% budget use = 1.0; 50% use = 0.85.
        ratio = price / budget
        return 0.7 + 0.3 * ratio
    # Over budget: penalise sharply.
    over = (price - budget) / budget
    return max(0.0, 1.0 - over * 1.5)


def _value_for_money_score(ppsf: Optional[int], peer_ppsfs: List[int]) -> float:
    """Cheaper-than-peers wins. Median peer = 0.65; -50% = 1.0; +50% = 0.0."""
    if not ppsf or ppsf <= 0 or not peer_ppsfs:
        return 0.5
    median = sorted(peer_ppsfs)[len(peer_ppsfs) // 2]
    if median <= 0:
        return 0.5
    delta = (ppsf - median) / median  # negative = cheaper
    score = 0.65 - delta
    return max(0.0, min(1.0, score))


def _size_score(area: Optional[int], target: Optional[int], bhk: Optional[int]) -> float:
    if area is None or area <= 0:
        return 0.0
    if target:
        # Closer to target = better. Within 20% = 1.0; doubled or halved = 0.0.
        ratio = area / target
        if 0.8 <= ratio <= 1.2:
            return 1.0
        if ratio < 0.8:
            return max(0.0, ratio / 0.8)
        return max(0.0, 1.0 - (ratio - 1.2) / 0.8)
    if bhk:
        # Use a typical sqft-per-BHK target as a soft anchor (450 sqft/BHK).
        target_for_bhk = bhk * 450
        return _size_score(area, target_for_bhk, None)
    # No anchor — reward larger but cap.
    return min(1.0, area / 1500)


def _roi_score(prop: Dict[str, Any], peer_ppsfs: List[int]) -> float:
    """Inferred ROI proxy: cheaper price-per-sqft + premium locality = stronger upside.

    No real time-series data is available in the JSON, so this is a transparent
    composite rather than a forecast. Documented in the explanation prompt.
    """
    ppsf = prop.get("price_per_sqft")
    if not ppsf or not peer_ppsfs:
        ppsf_component = 0.5
    else:
        median = sorted(peer_ppsfs)[len(peer_ppsfs) // 2]
        if median <= 0:
            ppsf_component = 0.5
        else:
            delta = (median - ppsf) / median  # positive = cheaper than peers
            ppsf_component = 0.5 + delta  # peer = 0.5; -50% under = 1.0
            ppsf_component = max(0.0, min(1.0, ppsf_component))
    loc_component = _locality_score(prop.get("locality_text"))
    return 0.55 * ppsf_component + 0.45 * loc_component


def _risk_score(prop: Dict[str, Any]) -> float:
    """Higher score = LOWER risk. Uses builder presence + locality stability + price band."""
    builder = (prop.get("builder_name") or "").strip().lower()
    score = 0.5  # neutral starting point

    # Known reputed builders — soft list, not exhaustive.
    reputed = ("lodha", "godrej", "rustomjee", "adani", "raymond", "dosti",
               "shapoorji", "mahindra", "kalpataru", "tata", "piramal",
               "hiranandani", "oberoi", "sunteck")
    if builder and any(r in builder for r in reputed):
        score += 0.25
    elif builder:
        score += 0.05  # at least the builder name is known

    # Locality stability proxy — high desirability also implies liquidity.
    score += (_locality_score(prop.get("locality_text")) - 0.55) * 0.4

    # Avoid extreme outliers: very cheap psqft in a premium locality is suspicious.
    ppsf = prop.get("price_per_sqft") or 0
    if ppsf and ppsf < 5000:
        score -= 0.1

    return max(0.0, min(1.0, score))


# ─── public API ────────────────────────────────────────────────────────


@dataclass
class RankedProperty:
    property: Dict[str, Any]
    score: float
    breakdown: ScoreBreakdown
    reason: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "property": self.property,
            "score": round(self.score * 10, 2),  # 0..10 for the UI
            "breakdown": {k: round(v * 10, 2) for k, v in asdict(self.breakdown).items()},
            "reason": self.reason,
        }


def _filter_by_intent(properties: List[Dict[str, Any]], intent: Intent) -> List[Dict[str, Any]]:
    """Pre-filter on hard constraints before scoring."""
    out = []
    for p in properties:
        if intent.city and (p.get("city") or "").lower() != intent.city.lower():
            continue
        if intent.bhk is not None and p.get("bedrooms") and p["bedrooms"] != intent.bhk:
            continue
        out.append(p)
    return out


def _build_reason(intent: Intent, prop: Dict[str, Any], breakdown: ScoreBreakdown) -> str:
    """One-line, human-readable reason. Pulled from the strongest 1-2 dimensions."""
    parts: List[Tuple[str, float]] = [
        ("budget fit", breakdown.budget),
        ("value-for-money", breakdown.value_for_money),
        ("size match", breakdown.size),
        ("desirable locality", breakdown.location),
        ("ROI potential", breakdown.roi),
        ("low risk profile", breakdown.risk),
    ]
    parts.sort(key=lambda x: x[1], reverse=True)
    top = [label for label, score in parts[:2] if score >= 0.6]
    if not top:
        top = [parts[0][0]]
    locality = prop.get("locality_text") or prop.get("city") or "this area"
    bhk = prop.get("bedrooms") or "?"
    return f"Strong on {' and '.join(top)} for a {bhk}BHK in {locality}."


def compare_properties(
    properties: List[Dict[str, Any]],
    user_intent: Intent,
) -> List[RankedProperty]:
    """Score and rank a list of property dicts against an intent.

    Returns a list sorted highest-score first.
    """
    pool = _filter_by_intent(properties, user_intent)
    if not pool:
        # No matches after hard filter — fall back to the unfiltered set so
        # the UI still gets something.
        pool = properties

    peer_ppsfs = [p["price_per_sqft"] for p in pool
                  if isinstance(p.get("price_per_sqft"), (int, float)) and p["price_per_sqft"] > 0]

    ranked: List[RankedProperty] = []
    for prop in pool:
        b = ScoreBreakdown()
        b.budget = _budget_score(prop.get("price_inr"), user_intent.budget_inr)
        b.value_for_money = _value_for_money_score(prop.get("price_per_sqft"), peer_ppsfs)
        b.size = _size_score(prop.get("area_sqft"), user_intent.target_area_sqft, user_intent.bhk)
        b.location = _locality_score(prop.get("locality_text"))
        b.roi = _roi_score(prop, peer_ppsfs)
        b.risk = _risk_score(prop)

        # Apply intent weighting overrides — bump the dimensions the user cares about.
        weights = dict(WEIGHTS)
        if user_intent.wants_high_roi:
            weights["roi"] += 0.10
            weights["budget"] -= 0.05
            weights["size"] -= 0.05
        if user_intent.wants_low_risk:
            weights["risk"] += 0.10
            weights["roi"] -= 0.05
            weights["size"] -= 0.05
        if user_intent.wants_high_risk:
            weights["risk"] -= 0.05
            weights["roi"] += 0.05

        # Renormalize weights (clamp negatives to 0).
        weights = {k: max(0.0, v) for k, v in weights.items()}
        total = sum(weights.values()) or 1.0
        weights = {k: v / total for k, v in weights.items()}

        composite = (
            weights["budget"] * b.budget
            + weights["value_for_money"] * b.value_for_money
            + weights["size"] * b.size
            + weights["location"] * b.location
            + weights["roi"] * b.roi
            + weights["risk"] * b.risk
        )

        ranked.append(RankedProperty(
            property=prop,
            score=composite,
            breakdown=b,
            reason=_build_reason(user_intent, prop, b),
        ))

    ranked.sort(key=lambda r: r.score, reverse=True)
    return ranked
