"""In-memory cache for normalized area intelligence.

Loaded once at startup from ``data/cache/normalized_areas.json``.
All reads are pure Python over a list — no DB, no network.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from app.features.area_intelligence.normalize import NormalizedAreaIntelligence

_CACHE_PATH = Path(__file__).resolve().parents[3] / "data" / "cache" / "normalized_areas.json"

_areas: list[NormalizedAreaIntelligence] | None = None


def load() -> None:
    """Read normalized_areas.json into memory. Call once from app lifespan."""
    global _areas
    if _areas is not None:
        return
    raw = json.loads(_CACHE_PATH.read_text(encoding="utf-8"))
    _areas = [NormalizedAreaIntelligence(**row) for row in raw]


def _reset_for_test(areas: list[NormalizedAreaIntelligence] | None = None) -> None:
    """Override in-memory cache for unit tests."""
    global _areas
    _areas = areas


def get_all() -> list[NormalizedAreaIntelligence]:
    """Return every cached area."""
    if _areas is None:
        load()
    return list(_areas)  # shallow copy


def get_by_city(city: str) -> list[NormalizedAreaIntelligence]:
    """Areas in a given city (case-insensitive)."""
    if _areas is None:
        load()
    city_lower = city.lower()
    return [a for a in _areas if a.city.lower() == city_lower]


def get_by_name(area_name: str, city: str) -> NormalizedAreaIntelligence | None:
    """Exact match by area name + city."""
    if _areas is None:
        load()
    for a in _areas:
        if a.area_name.lower() == area_name.lower() and a.city.lower() == city.lower():
            return a
    return None


def find_area_for_property(locality_text: str | None, city: str | None) -> NormalizedAreaIntelligence | None:
    """Fuzzy-match a property locality against cached area names.

    Mirrors the DB logic in candidate_retrieval / scoring:
    - Split locality on comma, take first part
    - Try full substring match, then first-word match
    """
    if not locality_text or not city:
        return None
    if _areas is None:
        load()

    base_locality = locality_text.split(",")[0].strip()
    first_word = base_locality.split()[0].strip()
    city_lower = city.lower()

    for a in _areas:
        if a.city.lower() != city_lower:
            continue
        name_lower = a.area_name.lower()
        if base_locality.lower() in name_lower or name_lower in base_locality.lower():
            return a
        if first_word.lower() in name_lower or name_lower in first_word.lower():
            return a
    return None


def find_city_in_text(text: str) -> str | None:
    """Scan free text for a known city name. Case-insensitive, word-boundary aware.

    Used as a deterministic fallback when the LLM intent parser fails to
    extract a location — short queries like "2bhk in pune" sometimes slip
    through as location=None and the ranker collapses to the global pool.
    """
    if not text:
        return None
    if _areas is None:
        load()
    import re

    cities = {a.city for a in _areas}
    lower = text.lower()
    for city in cities:
        pattern = r"\b" + re.escape(city.lower()) + r"\b"
        if re.search(pattern, lower):
            return city
    return None


def _resolve_location(location: str) -> tuple[str | None, str | None]:
    """Map a free-text location to (city, exact_area_name).

    The intent parser often returns a locality (e.g. "Hinjewadi", "Wakad",
    "Kharadi") rather than a city. The ranker filters by city, so without
    this resolution step those queries collapse to the global pool.

    Returns ``(city, exact_area_name)``:
      - city match  → ``(city, None)``
      - area match  → ``(area.city, area.area_name)``  (caller can boost)
      - no match    → ``(None, None)``                 (caller falls back)
    """
    if not location or _areas is None:
        return None, None
    loc = location.strip().lower()
    if not loc:
        return None, None

    # 1. City match (preferred — broadest pool, no need for boost).
    for a in _areas:
        if a.city.lower() == loc:
            return a.city, None

    # 2. Area-name substring match (handles "Hinjewadi", "Wakad", etc).
    for a in _areas:
        name = a.area_name.lower()
        if loc == name or loc in name or name in loc:
            return a.city, a.area_name

    # 3. First-word match (handles "Hinjewadi Phase 2" → "Hinjewadi").
    first = loc.split()[0] if loc else ""
    if len(first) >= 4:
        for a in _areas:
            tokens = a.area_name.lower().split()
            if first in tokens:
                return a.city, a.area_name

    return None, None


def _bhk_sqft_estimate(raw_entities: dict, property_type: str | None) -> float:
    """Best-guess unit size (sqft) for budget-fit math."""
    bhk = raw_entities.get("bhk")
    if isinstance(bhk, (int, float)) and bhk > 0:
        return 400.0 + float(bhk) * 250.0
    pt = (property_type or "").lower()
    if "villa" in pt or "bungalow" in pt:
        return 1800.0
    if "plot" in pt or "land" in pt:
        return 1200.0
    if "1 bhk" in pt or "1bhk" in pt:
        return 650.0
    if "3 bhk" in pt or "3bhk" in pt:
        return 1150.0
    if "4 bhk" in pt or "4bhk" in pt:
        return 1500.0
    return 900.0  # 2 BHK default


def _roi_term(roi_signal: float | None, roi_target: Any) -> tuple[float, str | None]:
    """Gradient ROI score in roughly [-15, +25].

    - Numeric target: peaks at exact match, dilutes when way over, penalizes shortfall.
    - "high"/"medium"/"low": linear preference along the ROI axis.
    - No target: neutral (0).
    """
    if roi_signal is None:
        return 0.0, None
    if isinstance(roi_target, bool):  # bool is an int subclass — guard explicitly
        roi_target = None
    if isinstance(roi_target, (int, float)):
        diff = roi_signal - float(roi_target)
        if diff >= 0:
            # Sharper falloff (0.6 → 1.0 per pt) so areas that just clear
            # the bar separate from areas that crush it. Previously the
            # term saturated at 22 across most of the candidate pool.
            term = max(0.0, 22.0 - diff * 1.0)
            return term, f"Hits ROI target ({roi_signal:.1f}% vs ask {roi_target}%)"
        term = max(-15.0, diff * 2.0)
        return term, f"Below ROI target ({roi_signal:.1f}% vs ask {roi_target}%)"
    if roi_target == "high":
        term = max(-5.0, min(22.0, (roi_signal - 12.0) * 1.2))
        if term > 5:
            return term, f"High-return corridor ({roi_signal:.1f}%)"
        return term, None
    if roi_target == "medium":
        term = max(-5.0, 18.0 - abs(roi_signal - 18.0) * 0.8)
        return term, None
    if roi_target == "low":
        term = max(-5.0, 15.0 - max(0.0, roi_signal - 8.0) * 1.0)
        return term, None
    return 0.0, None


def _risk_term(area: NormalizedAreaIntelligence, risk_tolerance: Any) -> tuple[float, str | None]:
    """Gradient risk score in roughly [-15, +12]. Uses both downside_risk and volatility."""
    if risk_tolerance not in ("low", "medium", "high"):
        return 0.0, None
    downside = area.downside_risk_score  # higher = riskier
    vol = area.volatility_index  # 0..1

    # Compose a 0..100 "riskiness" reading.
    parts: list[float] = []
    if downside is not None:
        parts.append(downside)
    if vol is not None:
        parts.append(vol * 100.0)
    if not parts:
        return 0.0, None
    riskiness = sum(parts) / len(parts)

    if risk_tolerance == "low":
        # Reward calm areas (riskiness 0 → +10), punish wild ones (100 → -15).
        term = 10.0 - riskiness * 0.25
        if term <= -5:
            return term, "Volatile / elevated downside — flagged for low-risk ask"
        if term >= 5:
            return term, "Stable, low-downside profile"
        return term, None
    if risk_tolerance == "high":
        # Reward higher uplift; penalize deeply boring areas mildly.
        uplift = area.uplift_potential_score
        if uplift is None:
            return 0.0, None
        term = max(-3.0, (uplift - 50.0) * 0.18)
        if term > 5:
            return term, f"High-uplift corridor (uplift {uplift:.0f})"
        return term, None
    # medium: small reward for balanced risk
    term = 4.0 - abs(riskiness - 50.0) * 0.08
    return term, None


def _budget_term(
    area: NormalizedAreaIntelligence,
    budget_max: float | None,
    budget_min: float | None,
    sqft_estimate: float,
) -> tuple[float, str | None]:
    """Penalize areas whose typical ticket sits well outside the user's budget."""
    psf = area.latest_psf or area.avg_price_per_sqft
    if psf is None or psf <= 0:
        return 0.0, None
    typical = psf * sqft_estimate
    if budget_max and budget_max > 0:
        if typical > budget_max:
            overshoot = (typical - budget_max) / budget_max
            term = -min(18.0, overshoot * 22.0)
            return term, f"Typical {sqft_estimate:.0f}sqft ticket ~₹{typical/1e7:.2f} cr — over budget"
        if typical < budget_max * 0.45:
            return -3.0, None  # suspiciously cheap — likely weaker market
        return 6.0, "Typical ticket fits budget"
    if budget_min and budget_min > 0 and typical < budget_min * 0.6:
        return -4.0, None
    return 0.0, None


def _intent_bump_for_demand(area: NormalizedAreaIntelligence, investment_intent: Any) -> tuple[float, str | None]:
    """Demand bump fires only under rental intent.

    Without an investment_intent, demand_strength values in the seed are
    noisy (premium Pune areas often labelled "Low" while suburbs read
    "High") and using them as a tiebreaker pushes the wrong areas to the
    top. Keep demand strictly rental-flavoured.
    """
    if investment_intent != "rental":
        return 0.0, None
    demand = area.demand_strength.value if area.demand_strength else "Unknown"
    if demand == "High":
        return 8.0, "Strong rental demand"
    if demand == "Low":
        return -4.0, None
    return 0.0, None


def _yield_term(area: NormalizedAreaIntelligence, investment_intent: Any) -> tuple[float, str | None]:
    """Reward rental yield when the user wants rental income."""
    if investment_intent != "rental":
        return 0.0, None
    y = area.rental_yield_pct
    if y is None:
        return 0.0, None
    term = max(-3.0, min(10.0, (y - 2.5) * 4.0))
    if term > 4:
        return term, f"Rental yield {y:.1f}%"
    return term, None


def _stretch_top_n(
    scored: list[tuple[NormalizedAreaIntelligence, float, list[str]]],
    *,
    lo: float = 70.0,
    hi: float = 95.0,
) -> list[tuple[NormalizedAreaIntelligence, float, list[str]]]:
    """Min-max rescale the displayed scores into a fixed visual band.

    Top-N from a uniformly-strong market (e.g. Mumbai) cluster within a
    few raw points; rescaling guarantees the UI uses a meaningful range
    while preserving sort order. Tied pools collapse to the band's midpoint.
    """
    if not scored:
        return scored
    raw = [s for _, s, _ in scored]
    s_min, s_max = min(raw), max(raw)
    span = s_max - s_min
    if span < 0.5:
        mid = (lo + hi) / 2.0
        return [(a, mid, r) for a, _, r in scored]
    return [
        (a, lo + (s - s_min) / span * (hi - lo), r)
        for a, s, r in scored
    ]


def _diversify_by_city(
    scored: list[tuple[NormalizedAreaIntelligence, float, list[str]]],
    top_n: int,
    *,
    per_city_cap: int | None = None,
) -> list[tuple[NormalizedAreaIntelligence, float, list[str]]]:
    """Pick top_n areas with a per-city cap so the result spans multiple cities.

    The raw global top-N is dominated by whichever city has the highest
    ``final_area_score`` density (Mumbai = 38% of the catalogue), so users
    see only Mumbai areas even though Pune/Thane/Navi Mumbai cover the
    same dataset. Capping per city in the no-specific-city path surfaces
    a mix of localities and reflects the real coverage.

    Input is assumed sorted by score descending. Greedy fill: walk once,
    keep an area if its city still has quota, else stash. If we end up
    short (e.g. fewer cities than slots), the stashed entries fill the
    tail so the caller always gets ``min(top_n, len(scored))`` results
    with the original score-descending order preserved within each group.
    """
    if per_city_cap is None:
        # For top_n=10 → cap=3 (≥4 cities visible). For top_n=5 → cap=2.
        per_city_cap = max(1, (top_n + 3) // 4)

    picked: list[tuple[NormalizedAreaIntelligence, float, list[str]]] = []
    per_city_count: dict[str, int] = {}
    skipped: list[tuple[NormalizedAreaIntelligence, float, list[str]]] = []

    for entry in scored:
        area, _score, _reasons = entry
        city_key = (area.city or "").lower()
        count = per_city_count.get(city_key, 0)
        if count < per_city_cap:
            picked.append(entry)
            per_city_count[city_key] = count + 1
            if len(picked) >= top_n:
                return picked
        else:
            skipped.append(entry)

    for entry in skipped:
        if len(picked) >= top_n:
            break
        picked.append(entry)
    return picked


def rank_for_intent(
    intent: Any,
    *,
    top_n: int = 5,
) -> list[tuple[NormalizedAreaIntelligence, float, list[str]]]:
    """Rank areas against a parsed search intent.

    Score composition (per area):
        0.5 * final_area_score        # dampened base, ~20–46 typical
        + roi_term                    # gradient, ~[-15, +25]
        + risk_term                   # gradient, ~[-15, +12]
        + budget_term                 # gradient, ~[-18, +6]
        + yield_term                  # rental-only, ~[-3, +10]
        + demand_term                 # ~[-4, +8]
        + uplift_kicker               # ~[0, +4]

    Returns ``(area, score, reasons)`` sorted descending by score.
    """
    if _areas is None:
        load()

    location_text = (intent.location or "").strip()
    resolved_city, exact_area = _resolve_location(location_text)
    if resolved_city:
        pool = [a for a in _areas if a.city.lower() == resolved_city.lower()]
    else:
        pool = list(_areas)
    if not pool:
        pool = list(_areas)

    raw_entities: dict = getattr(intent, "raw_entities", {}) or {}
    roi_target = raw_entities.get("roi_target")
    risk_tolerance = raw_entities.get("risk_tolerance")
    investment_intent = raw_entities.get("investment_intent")
    budget_min = getattr(intent, "budget_min", None)
    budget_max = getattr(intent, "budget_max", None)
    property_type = getattr(intent, "property_type", None)
    sqft_estimate = _bhk_sqft_estimate(raw_entities, property_type)

    # No actionable discrimination signal → rank by raw fundamentals.
    # BHK and property_type alone don't differentiate at the AREA level
    # (they matter for property ranking, not which area to look in), so
    # we deliberately don't count them as "actionable" here.
    has_signal = (
        roi_target is not None
        or risk_tolerance in ("low", "medium", "high")
        or investment_intent in ("rental", "resale", "self_use", "investment")
        or (budget_max is not None and budget_max > 0)
        or (budget_min is not None and budget_min > 0)
    )
    if not has_signal:
        scored: list[tuple[NormalizedAreaIntelligence, float, list[str]]] = []
        for area in pool:
            score = area.final_area_score if area.final_area_score is not None else 50.0
            reasons: list[str] = []
            if exact_area and area.area_name == exact_area:
                score += 15.0
                reasons.append(f"User asked for {exact_area}")
            if area.final_area_score is not None and area.final_area_score >= 75:
                reasons.append(f"Strong area fundamentals (score: {area.final_area_score:.0f})")
            elif area.final_area_score is None:
                reasons.append("Limited data available for this area")
            if area.uplift_potential_score is not None and area.uplift_potential_score >= 80:
                reasons.append(f"High appreciation potential (uplift {area.uplift_potential_score:.0f})")
            scored.append((area, score, reasons))
        scored.sort(key=lambda x: x[1], reverse=True)
        # Diversify across cities only when the user didn't pin a specific
        # city; a city-pinned query (e.g. "areas in Pune") already filtered
        # the pool to one city so capping per city there would be a no-op.
        top = _diversify_by_city(scored, top_n) if resolved_city is None else scored[:top_n]
        return _stretch_top_n(top)

    scored: list[tuple[NormalizedAreaIntelligence, float, list[str]]] = []
    for area in pool:
        # Bumped from 0.5 → 0.7 so raw fundamentals carry through the
        # final score with less compression. Combined with the sharper
        # _roi_term slope, this gives meaningfully different scores
        # across the displayed top-N instead of the previous 1–2 pt window.
        base = 0.7 * (area.final_area_score if area.final_area_score is not None else 50.0)
        reasons: list[str] = []

        if area.final_area_score is not None and area.final_area_score >= 75:
            reasons.append(f"Strong area fundamentals (score: {area.final_area_score:.0f})")
        elif area.final_area_score is None:
            reasons.append("Limited data available for this area")

        roi_signal = area.roi_composite_pct
        if roi_signal is None:
            roi_signal = area.rental_yield_pct
        roi_pts, roi_reason = _roi_term(roi_signal, roi_target)
        risk_pts, risk_reason = _risk_term(area, risk_tolerance)
        budget_pts, budget_reason = _budget_term(area, budget_max, budget_min, sqft_estimate)
        yield_pts, yield_reason = _yield_term(area, investment_intent)
        demand_pts, demand_reason = _intent_bump_for_demand(area, investment_intent)

        uplift_kicker = 0.0
        if area.uplift_potential_score is not None and area.uplift_potential_score > 75:
            uplift_kicker = (area.uplift_potential_score - 75.0) * 0.16  # max ~4
            reasons.append(f"High appreciation potential (uplift {area.uplift_potential_score:.0f})")

        exact_match_bonus = 0.0
        if exact_area and area.area_name == exact_area:
            exact_match_bonus = 15.0
            reasons.append(f"User asked for {exact_area}")

        score = (
            base
            + roi_pts
            + risk_pts
            + budget_pts
            + yield_pts
            + demand_pts
            + uplift_kicker
            + exact_match_bonus
        )

        for r in (roi_reason, risk_reason, budget_reason, yield_reason, demand_reason):
            if r:
                reasons.append(r)

        scored.append((area, score, reasons))

    scored.sort(key=lambda x: x[1], reverse=True)
    top = _diversify_by_city(scored, top_n) if resolved_city is None else scored[:top_n]
    return _stretch_top_n(top)
