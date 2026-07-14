"""Normalize raw area-intelligence ingestion output into the canonical
area-intelligence record that powers the MVP's weighted area score.

Pipeline position
-----------------
    scrapers (raw text + numbers)
        -> derivations (per-column)
            -> ingestion upsert (MicroMarket / MicroMarketCreate)
                -> normalize()              <-- THIS MODULE
                    -> weighted final_area_score + scoring / ranking /
                       recommendation explanations

What this module does
---------------------
1. Interprets unstructured text (news, risk summaries, legal-friction blurbs)
   via an optional LLM hook (``TextScorer``). When no LLM is provided it
   falls back to a deterministic lexicon heuristic so offline runs still
   produce a full record.
2. Converts every signal - numeric or textual - into a uniform 0-100 score.
3. Maps all signals into one canonical ``NormalizedAreaIntelligence``
   record with eight pillars aligned to the MVP scoring contract:
       historical trend, uplift potential, downside risk,
       legal/regulatory safety, infra impact, market momentum,
       news relevance, liquidity/demand strength.
4. Computes a final weighted area score in [0, 100]. Weights default to
   ``DEFAULT_WEIGHTS`` but can be overridden per call; missing components
   cause the remaining weights to be renormalized so a partial record
   still yields a comparable score.

The function is pure: no I/O, no DB, no network. Plug an LLM in by passing
a ``text_scorer`` callable.
"""
from __future__ import annotations

from enum import Enum
from typing import Any, Callable, Iterable, Mapping, Optional

from pydantic import BaseModel, Field


# -- signal contract ---------------------------------------------------------

SIGNALS: tuple[str, ...] = (
    "historical_trend",
    "uplift_potential",
    "downside_risk",
    "legal_safety",
    "infra_impact",
    "market_momentum",
    "news_relevance",
    "liquidity_demand",
)

DEFAULT_WEIGHTS: dict[str, float] = {
    "historical_trend":  0.15,
    "uplift_potential":  0.20,
    "downside_risk":     0.15,  # applied as (100 - downside_risk)
    "legal_safety":      0.10,
    "infra_impact":      0.15,
    "market_momentum":   0.10,
    "news_relevance":    0.05,
    "liquidity_demand":  0.10,
}

# Signals where a higher score is WORSE (i.e. more risk). The final-score
# combiner flips these before weighting.
INVERTED_SIGNALS: frozenset[str] = frozenset({"downside_risk"})


# -- optional LLM hook -------------------------------------------------------

TextKind = str  # "news_sentiment" | "infra_impact" | "legal_friction" | "risk"

TextScorer = Callable[[str, TextKind], Optional[float]]
"""Signature: ``(text, kind) -> 0-100 or None``.

Callers pass this to ``normalize(...)`` when they want text interpreted by
an LLM. Returning ``None`` means "fall back to the heuristic".
"""


# -- public schema -----------------------------------------------------------


class DemandStrength(str, Enum):
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    UNKNOWN = "Unknown"


class NormalizedAreaIntelligence(BaseModel):
    """Canonical area-intelligence record. Eight 0-100 signals, one final
    weighted score, plus auxiliary context used for recommendation
    explanations. ``None`` means "unknown"; downstream must treat it
    differently from 0.
    """

    area_name: str
    city: str
    state: str = "Maharashtra"

    # Eight canonical signals (0-100). downside_risk: higher = riskier.
    historical_trend_score:  Optional[float] = Field(default=None, ge=0, le=100)
    uplift_potential_score:  Optional[float] = Field(default=None, ge=0, le=100)
    downside_risk_score:     Optional[float] = Field(default=None, ge=0, le=100)
    legal_safety_score:      Optional[float] = Field(default=None, ge=0, le=100)
    infra_impact_score:      Optional[float] = Field(default=None, ge=0, le=100)
    market_momentum_score:   Optional[float] = Field(default=None, ge=0, le=100)
    news_relevance_score:    Optional[float] = Field(default=None, ge=0, le=100)
    liquidity_demand_score:  Optional[float] = Field(default=None, ge=0, le=100)

    # Final weighted area score in [0, 100]; None only when every signal
    # is None.
    final_area_score: Optional[float] = Field(default=None, ge=0, le=100)

    # Raw-ish auxiliary numerics (kept for transparency / the UI layer).
    avg_price_per_sqft:  Optional[float] = Field(default=None, ge=0)
    price_growth_pct:    Optional[float] = None
    # True rental yield = (annual rent / sale price) × 100. Pune/Mumbai
    # typically runs 2–4%. Sourced from raw.rental_yield_pct when present,
    # else from price_metrics.rental_yield_pct in raw_data_dump.
    rental_yield_pct:    Optional[float] = None
    # Buy-side ROI composite = historical_trend_pct + infra/commercial/news
    # bonuses. Typically 10–40% (3-year total-return proxy). Sourced from
    # raw.roi_trend_pct (which is what compute_roi_composite writes).
    roi_composite_pct:   Optional[float] = None
    volatility_index:    Optional[float] = Field(default=None, ge=0, le=1)
    demand_strength:     DemandStrength = DemandStrength.UNKNOWN

    # Historical trend breakdown from 99acres quarterly data (1yr/3yr/5yr CAGR + latest PSF)
    trend_1yr_pct:       Optional[float] = None
    trend_3yr_pct:       Optional[float] = None
    trend_5yr_pct:       Optional[float] = None
    latest_psf:          Optional[float] = Field(default=None, ge=0)

    amenities: list[str] = Field(default_factory=list)
    risk_tags: list[str] = Field(default_factory=list)

    # Audit trail so the scorer / UI can justify the final number.
    weights_used: dict[str, float] = Field(default_factory=dict)


# -- low-level helpers -------------------------------------------------------


def _to_float(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        f = float(value)
    except (TypeError, ValueError):
        return None
    if f != f:  # NaN guard
        return None
    return f


def _clamp(value: Optional[float], lo: float = 0.0, hi: float = 100.0) -> Optional[float]:
    if value is None:
        return None
    return max(lo, min(hi, value))


def _pct_to_score(
    pct: Optional[float],
    *,
    zero_point: float = 0.0,
    full_point: float = 15.0,
) -> Optional[float]:
    """Map a signed percentage to a 0-100 score.

    ``zero_point`` maps to 50, ``full_point`` to 100, and
    ``-full_point`` to 0. Values outside are clipped.
    """
    if pct is None:
        return None
    span = full_point - zero_point
    if span <= 0:
        return None
    score = 50.0 + (pct - zero_point) / span * 50.0
    return _clamp(score)


# -- text interpretation -----------------------------------------------------

_POSITIVE_NEWS_KEYWORDS = (
    "launch", "expansion", "growth", "investment", "boom", "metro", "airport",
    "ring road", "highway", "corridor", "upgrad", "hiring", "fdi", "opening",
    "completed", "approved", "sanctioned",
)
_NEGATIVE_NEWS_KEYWORDS = (
    "scam", "fraud", "duped", "delay", "stalled", "demolition", "encroach",
    "protest", "strike", "killed", "injured", "hit-and-run", "crackdown",
    "notice", "complaint",
)


def _heuristic_news_sentiment(text: str) -> Optional[float]:
    if not text:
        return None
    lower = text.lower()
    pos = sum(lower.count(k) for k in _POSITIVE_NEWS_KEYWORDS)
    neg = sum(lower.count(k) for k in _NEGATIVE_NEWS_KEYWORDS)
    if pos == 0 and neg == 0:
        return 50.0
    total = pos + neg
    return _clamp(50.0 + (pos - neg) / total * 50.0)


def _heuristic_legal_friction(text: str) -> Optional[float]:
    """Returns a SAFETY score (higher = safer)."""
    if not text:
        return None
    lower = text.lower()
    score = 80.0
    if "no maharera complaints" in lower:
        score = 90.0
    if "suspended" in lower:
        score -= 30.0
    if "dispute" in lower or "litigation" in lower:
        score -= 20.0
    if "complaint" in lower:
        # Subtract proportionally to the complaint-mention count but cap it.
        score -= min(25.0, lower.count("complaint") * 5.0)
    if "zoning" in lower or "violat" in lower:
        score -= 10.0
    return _clamp(score)


def _heuristic_infra_impact(text: str) -> Optional[float]:
    if not text:
        return None
    lower = text.lower()
    score = 50.0
    boosters = ("metro", "airport", "highway", "ring road", "corridor",
                "expansion", "completed", "sanctioned", "upgrad")
    drags = ("bottleneck", "delay", "stalled", "encroach", "cancelled")
    score += sum(8 for k in boosters if k in lower)
    score -= sum(10 for k in drags if k in lower)
    return _clamp(score)


def _score_text(
    text: Optional[str],
    kind: TextKind,
    scorer: Optional[TextScorer],
    fallback: Callable[[str], Optional[float]],
) -> Optional[float]:
    if not text:
        return None
    if scorer is not None:
        try:
            llm_score = scorer(text, kind)
        except Exception:
            llm_score = None
        if llm_score is not None:
            return _clamp(_to_float(llm_score))
    return fallback(text)


# -- structured derivations --------------------------------------------------


def _connectivity_from_proximity(proximity: Optional[Mapping[str, Any]]) -> Optional[float]:
    if not proximity:
        return None
    weights = {
        "nearest_railway_station_km": 1.0,
        "nearest_highway_km":         0.7,
        "nearest_bus_station_km":     0.5,
        "nearest_airport_km":         0.3,
    }
    weighted = 0.0
    total_w = 0.0
    for key, w in weights.items():
        km = _to_float(proximity.get(key))
        if km is None or km < 0:
            continue
        node = (10.0 - min(km, 10.0)) / 10.0 * 100.0
        weighted += node * w
        total_w += w
    return round(weighted / total_w, 2) if total_w else None


_LIVABILITY_TARGETS = {
    "schools":              10,
    "hospitals_or_clinics":  5,
    "parks_or_gardens":      5,
    "restaurants_or_cafes": 20,
    "supermarkets_or_malls": 5,
    "banks_or_atms":        10,
    "pharmacies":           10,
}


def _livability_from_counts(indicators: Optional[Mapping[str, Any]]) -> Optional[float]:
    if not indicators:
        return None
    scores: list[float] = []
    for key, target in _LIVABILITY_TARGETS.items():
        count = _to_float(indicators.get(key))
        if count is None:
            continue
        scores.append(min(100.0, count / target * 100.0))
    return round(sum(scores) / len(scores), 2) if scores else None


def _risk_tags(text: Optional[str]) -> list[str]:
    if not text:
        return []
    lower = text.lower()
    mapping = (
        ("flood",   "flood"),
        ("seismic", "seismic"),
        ("crime",   "crime"),
        ("cyclone", "cyclone"),
    )
    return sorted({tag for needle, tag in mapping if needle in lower})


def _amenities(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, Mapping):
        return sorted(
            str(k) for k, v in raw.items()
            if isinstance(v, (int, float)) and v > 0 and str(k) != "radius_m"
        )
    if isinstance(raw, (list, tuple, set)):
        return sorted({str(x).strip() for x in raw if str(x).strip()})
    return []


def _demand(value: Any) -> DemandStrength:
    if not value:
        return DemandStrength.UNKNOWN
    s = str(value).strip().lower()
    if s.startswith("high"):
        return DemandStrength.HIGH
    if s.startswith("med"):
        return DemandStrength.MEDIUM
    if s.startswith("low"):
        return DemandStrength.LOW
    return DemandStrength.UNKNOWN


def _demand_score(
    strength: DemandStrength,
    yield_pct: Optional[float],
    sample_sizes: Optional[Mapping[str, Any]],
) -> Optional[float]:
    """Liquidity/demand score from the categorical strength + rental-yield
    + scraper sample sizes (more listings => deeper market)."""
    base: Optional[float] = {
        DemandStrength.HIGH:    80.0,
        DemandStrength.MEDIUM:  55.0,
        DemandStrength.LOW:     30.0,
        DemandStrength.UNKNOWN: None,
    }[strength]

    if yield_pct is not None:
        yield_component = _clamp(yield_pct / 8.0 * 100.0)  # 8% yield => 100
        base = yield_component if base is None else (base * 0.6 + yield_component * 0.4)

    if sample_sizes and isinstance(sample_sizes, Mapping):
        total = 0.0
        for key in ("sale", "rent"):
            v = _to_float(sample_sizes.get(key))
            if v is not None:
                total += v
        if total > 0:
            depth = _clamp(total / 100.0 * 100.0)  # 100 listings => full depth
            base = depth if base is None else (base * 0.75 + depth * 0.25)

    return round(base, 2) if base is not None else None


def _market_momentum(
    trend_pct: Optional[float],
    volatility: Optional[float],
    transaction_velocity: Optional[float],
    supply_pressure: Optional[float],
) -> Optional[float]:
    """Trend adjusted for volatility and supply/velocity balance."""
    trend_component = _pct_to_score(trend_pct, full_point=15.0)
    components: list[float] = []
    if trend_component is not None:
        if volatility is not None:
            trend_component = _clamp(trend_component - volatility * 100.0 * 0.3)
        components.append(trend_component)

    if transaction_velocity is not None:
        # Lower days-on-market => faster market. Cap at 180 days.
        dom = max(0.0, min(180.0, transaction_velocity))
        components.append((180.0 - dom) / 180.0 * 100.0)

    if supply_pressure is not None:
        components.append(_clamp(100.0 - supply_pressure) or 0.0)

    return round(sum(components) / len(components), 2) if components else None


def _downside_risk(
    projected_downside_pct: Optional[float],
    volatility: Optional[float],
    risk_text: Optional[str],
) -> Optional[float]:
    """Composite downside-risk score. Higher = riskier."""
    parts: list[float] = []
    if projected_downside_pct is not None:
        # -20% => 100 risk, 0% => 0 risk.
        parts.append(_clamp(-projected_downside_pct / 20.0 * 100.0) or 0.0)
    if volatility is not None:
        parts.append(_clamp(volatility * 100.0) or 0.0)
    if risk_text:
        lower = risk_text.lower()
        text_risk = 20.0
        if "flood risk: high" in lower or "seismic zone v" in lower:
            text_risk = 85.0
        elif "flood risk: medium" in lower or "seismic zone iv" in lower:
            text_risk = 55.0
        elif "flood risk: low" in lower and "seismic zone ii" in lower:
            text_risk = 15.0
        parts.append(text_risk)
    return round(sum(parts) / len(parts), 2) if parts else None


def _news_relevance(
    infra_text: Optional[str],
    news_sentiment_text: Optional[str],
    news_items: Optional[Iterable[Any]],
    scorer: Optional[TextScorer],
) -> Optional[float]:
    """Blends LLM/heuristic sentiment with raw article volume."""
    sentiment_inputs = [t for t in (news_sentiment_text, infra_text) if t]
    sentiments: list[float] = []
    for text in sentiment_inputs:
        s = _score_text(text, "news_sentiment", scorer, _heuristic_news_sentiment)
        if s is not None:
            sentiments.append(s)

    volume_score: Optional[float] = None
    if news_items is not None:
        try:
            count = sum(1 for _ in news_items)
        except TypeError:
            count = 0
        if count > 0:
            volume_score = _clamp(min(100.0, count / 10.0 * 100.0))

    if not sentiments and volume_score is None:
        return None
    if not sentiments:
        return volume_score
    sentiment_avg = sum(sentiments) / len(sentiments)
    if volume_score is None:
        return round(sentiment_avg, 2)
    return round(sentiment_avg * 0.7 + volume_score * 0.3, 2)


def _legal_safety(
    friction_text: Optional[str],
    approval_signals: Optional[Mapping[str, Any]],
    scorer: Optional[TextScorer],
) -> Optional[float]:
    text_score = _score_text(
        friction_text, "legal_friction", scorer, _heuristic_legal_friction
    )
    if approval_signals and isinstance(approval_signals, Mapping):
        suspended = _to_float(approval_signals.get("suspended_project_count")) or 0.0
        penalty = min(40.0, suspended * 10.0)
        if text_score is None:
            text_score = 85.0
        text_score = _clamp(text_score - penalty)
    return text_score


def _infra_impact(
    news_text: Optional[str],
    pipeline_text: Optional[str],
    proximity: Optional[Mapping[str, Any]],
    scorer: Optional[TextScorer],
) -> Optional[float]:
    parts: list[float] = []
    for text in (news_text, pipeline_text):
        s = _score_text(text, "infra_impact", scorer, _heuristic_infra_impact)
        if s is not None:
            parts.append(s)
    prox_score = _connectivity_from_proximity(proximity)
    if prox_score is not None:
        parts.append(prox_score)
    return round(sum(parts) / len(parts), 2) if parts else None


# -- final score combiner ----------------------------------------------------


def _weighted_final(
    components: Mapping[str, Optional[float]],
    weights: Mapping[str, float],
) -> tuple[Optional[float], dict[str, float]]:
    """Combine component scores with weight renormalization over present
    signals. Returns ``(final_score, weights_actually_applied)``.
    """
    active_weights: dict[str, float] = {}
    weighted_sum = 0.0
    total_w = 0.0
    for signal, raw_score in components.items():
        if raw_score is None:
            continue
        w = weights.get(signal, 0.0)
        if w <= 0:
            continue
        score = (100.0 - raw_score) if signal in INVERTED_SIGNALS else raw_score
        weighted_sum += score * w
        total_w += w
        active_weights[signal] = w

    if total_w == 0:
        return None, {}

    normalized_weights = {k: round(v / total_w, 4) for k, v in active_weights.items()}
    return round(weighted_sum / total_w, 2), normalized_weights


# -- public API --------------------------------------------------------------


def normalize(
    raw: Mapping[str, Any],
    *,
    text_scorer: Optional[TextScorer] = None,
    weights: Optional[Mapping[str, float]] = None,
) -> NormalizedAreaIntelligence:
    """Convert a single raw ingestion record into the canonical record.

    Parameters
    ----------
    raw
        One record from the ingestion worker (``MicroMarketCreate`` dict)
        or a flat analyst-shape dict.
    text_scorer
        Optional LLM-backed interpreter ``(text, kind) -> 0-100``. When
        omitted, a deterministic lexicon fallback is used so the function
        remains pure and offline.
    weights
        Optional per-signal weight override. Defaults to
        ``DEFAULT_WEIGHTS``. Weights for missing signals are automatically
        redistributed to the present ones.
    """
    area_name = str(raw.get("area_name") or raw.get("name") or "").strip()
    city = str(raw.get("city") or "").strip()
    state = str(raw.get("state") or "Maharashtra").strip()

    dump = raw.get("raw_data_dump") if isinstance(raw.get("raw_data_dump"), Mapping) else {}
    price_metrics = dump.get("price_metrics") if isinstance(dump.get("price_metrics"), Mapping) else {}
    news_items = dump.get("news_items") if isinstance(dump.get("news_items"), list) else None

    # --- raw numerics ---
    price = _to_float(raw.get("avg_price_per_sqft"))
    if price is None:
        price = _to_float(price_metrics.get("median_sale_psf"))
    if price is not None and price < 0:
        price = None

    growth = _to_float(raw.get("price_growth_pct"))
    if growth is None:
        growth = _to_float(raw.get("historical_price_trend_pct"))

    uplift_pct = _to_float(raw.get("projected_uplift_pct"))
    downside_pct = _to_float(raw.get("projected_downside_pct"))

    # Real rental yield (2-4% typical). Prefer the top-level field, then
    # the price_metrics dump in raw_data_dump. Do NOT fall back to
    # roi_trend_pct — that is the buy-side composite and has a much wider
    # range (10-40%); mixing the two inflates what the UI labels as yield.
    yield_pct = _to_float(raw.get("rental_yield_pct"))
    if yield_pct is None:
        yield_pct = _to_float(price_metrics.get("rental_yield_pct"))

    # Buy-side ROI composite (historical trend + infra + commercial + news).
    # Kept separate from rental_yield_pct; the UI can surface it as
    # "Expected 3Y Return" or similar.
    roi_composite_pct = _to_float(raw.get("roi_trend_pct"))

    volatility = _to_float(raw.get("volatility_index"))
    if volatility is not None and not (0.0 <= volatility <= 1.0):
        volatility = None

    transaction_velocity = _to_float(raw.get("transaction_velocity"))
    supply_pressure = _to_float(raw.get("supply_pressure"))
    sample_sizes = price_metrics.get("sample_sizes") if isinstance(price_metrics, Mapping) else None

    # --- text blobs ---
    risk_text = raw.get("risk_signals")
    infra_news_text = raw.get("infra_news_impact")
    legal_text = raw.get("legal_regulatory_friction")
    pipeline_text = raw.get("upcoming_infra_pipeline")
    news_sentiment_text = raw.get("recent_news_sentiment")

    proximity = raw.get("infrastructure_proximity")
    livability_json = raw.get("livability_indicators")
    approval_signals = raw.get("legal_approval_signals")

    demand_enum = _demand(raw.get("rental_demand_strength") or raw.get("demand_strength"))

    # --- eight canonical signals ---
    historical_trend_score = (
        _pct_to_score(raw.get("historical_trend_score"), full_point=100.0)
        if raw.get("historical_trend_score") is not None
        else _pct_to_score(growth, full_point=15.0)
    )
    uplift_potential_score = (
        _pct_to_score(raw.get("uplift_potential_score"), full_point=100.0)
        if raw.get("uplift_potential_score") is not None
        else _pct_to_score(uplift_pct, full_point=20.0)
    )
    downside_risk_score = _downside_risk(downside_pct, volatility, risk_text)
    legal_safety_score = _legal_safety(legal_text, approval_signals, text_scorer)
    infra_impact_score = _infra_impact(
        infra_news_text, pipeline_text, proximity, text_scorer
    )
    market_momentum_score = _market_momentum(
        growth, volatility, transaction_velocity, supply_pressure
    )
    news_relevance_score = _news_relevance(
        infra_news_text, news_sentiment_text, news_items, text_scorer
    )
    liquidity_demand_score = _demand_score(demand_enum, yield_pct, sample_sizes)

    components: dict[str, Optional[float]] = {
        "historical_trend":  historical_trend_score,
        "uplift_potential":  uplift_potential_score,
        "downside_risk":     downside_risk_score,
        "legal_safety":      legal_safety_score,
        "infra_impact":      infra_impact_score,
        "market_momentum":   market_momentum_score,
        "news_relevance":    news_relevance_score,
        "liquidity_demand":  liquidity_demand_score,
    }
    final_score, weights_used = _weighted_final(
        components, weights if weights is not None else DEFAULT_WEIGHTS
    )

    # Amenity source: explicit list > livability POI dict.
    amenities_src = raw.get("amenities")
    if amenities_src is None:
        amenities_src = livability_json

    return NormalizedAreaIntelligence(
        area_name=area_name,
        city=city,
        state=state,
        historical_trend_score=historical_trend_score,
        uplift_potential_score=uplift_potential_score,
        downside_risk_score=downside_risk_score,
        legal_safety_score=legal_safety_score,
        infra_impact_score=infra_impact_score,
        market_momentum_score=market_momentum_score,
        news_relevance_score=news_relevance_score,
        liquidity_demand_score=liquidity_demand_score,
        final_area_score=final_score,
        avg_price_per_sqft=price,
        price_growth_pct=growth,
        rental_yield_pct=yield_pct,
        roi_composite_pct=roi_composite_pct,
        volatility_index=volatility,
        demand_strength=demand_enum,
        trend_1yr_pct=_to_float(raw.get("trend_1yr_pct")),
        trend_3yr_pct=_to_float(raw.get("trend_3yr_pct")),
        trend_5yr_pct=_to_float(raw.get("trend_5yr_pct")),
        latest_psf=_to_float(raw.get("latest_psf")),
        amenities=_amenities(amenities_src),
        risk_tags=_risk_tags(risk_text),
        weights_used=weights_used,
    )


def normalize_many(
    records: Iterable[Mapping[str, Any]],
    *,
    text_scorer: Optional[TextScorer] = None,
    weights: Optional[Mapping[str, float]] = None,
) -> list[NormalizedAreaIntelligence]:
    """Batch-normalize a sequence of raw records."""
    return [
        normalize(r, text_scorer=text_scorer, weights=weights)
        for r in records
    ]


if __name__ == "__main__":
    import json

    sample = {
        "area_name": "Kalyani Nagar",
        "city": "Pune",
        "historical_price_trend_pct": 7.8,
        "projected_uplift_pct": 12.0,
        "projected_downside_pct": -4.0,
        "volatility_index": 0.22,
        "rental_demand_strength": "High",
        "roi_trend_pct": 4.1,
        "risk_signals": "Seismic Zone III (medium) | Flood risk: Low",
        "infra_news_impact": "Metro line extension sanctioned; new ring road "
                             "corridor approved near Kalyani Nagar.",
        "legal_regulatory_friction": "No MahaRERA complaints match projects "
                                     "named after Kalyani Nagar.",
        "legal_approval_signals": {"suspended_project_count": 0},
        "infrastructure_proximity": {
            "nearest_railway_station_km": 2.1,
            "nearest_bus_station_km": 0.9,
            "nearest_highway_km": 1.4,
            "nearest_airport_km": 6.2,
        },
        "livability_indicators": {
            "schools": 8, "hospitals_or_clinics": 6, "parks_or_gardens": 3,
            "restaurants_or_cafes": 25, "supermarkets_or_malls": 4,
            "banks_or_atms": 12, "pharmacies": 9, "radius_m": 1500,
        },
        "raw_data_dump": {
            "news_items": [{"title": "x"}] * 6,
            "price_metrics": {
                "median_sale_psf": 14500,
                "sample_sizes": {"sale": 40, "rent": 25},
            },
        },
    }
    print(json.dumps(normalize(sample).model_dump(), indent=2, default=str))
