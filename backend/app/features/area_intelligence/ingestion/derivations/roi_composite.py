"""Buy-side ROI composite — replaces rental yield for the product layer.

Formula (v1 heuristic, not calibrated):

    roi = historical_price_trend_pct
        + infra_bonus      (metro/rail/highway/airport within 3 km)
        + commercial_bonus (offices + hotels + malls within 2 km)
        + news_bonus       (development keywords in headlines)

Clamp:  0.0 ≤ roi ≤ historical_price_trend_pct + 5.0

Rental yield (the old roi_trend_pct) is moved to raw_data_dump for
background signal only — the product is buy-side focused.

This is a v1 heuristic.  The numbers are tunable constants, not
calibrated coefficients.  Revisit once we have user-feedback loops.
"""

from __future__ import annotations

import math
from typing import Any

from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("area.roi_composite")

# ── tunables ─────────────────────────────────────────────────────────────────

# Infra bonus: +0.5 per km-bucket closer than 3 km for key infra.
_INFRA_KEYWORDS = {
    "nearest_railway_station_km",
    "nearest_airport_km",
    "nearest_highway_km",
}
_INFRA_MAX_KM = 3.0
_INFRA_BONUS_PER_BUCKET = 0.5
_INFRA_CAP = 2.0

# Commercial bonus: log1p(offices + hotels + malls) * multiplier.
_COMMERCIAL_MULTIPLIER = 0.6
_COMMERCIAL_CAP = 2.0

# News bonus: +0.5 per matched keyword, cap at +1.5.
_NEWS_KEYWORDS = frozenset({
    "metro", "highway", "airport", "expressway", "corridor",
    "it park", "sez", "flyover", "ring road", "monorail",
})
_NEWS_BONUS_PER_HIT = 0.5
_NEWS_CAP = 1.5

# Final clamp.
_FLOOR = 0.0


# ── derivation ───────────────────────────────────────────────────────────────

def compute_roi_composite(
    historical_trend_pct: float | None,
    proximity: dict[str, Any] | None,
    commercial_density: dict[str, Any] | None,
    news_items: list[Any] | None,
) -> float | None:
    """Return the buy-side ROI composite, or None if base trend is missing."""
    if historical_trend_pct is None:
        return None

    # 1. Infra bonus
    infra_bonus = 0.0
    if proximity:
        for key in _INFRA_KEYWORDS:
            d = proximity.get(key)
            if d is not None and d < _INFRA_MAX_KM:
                infra_bonus += _INFRA_BONUS_PER_BUCKET
        infra_bonus = min(infra_bonus, _INFRA_CAP)

    # 2. Commercial bonus
    commercial_bonus = 0.0
    if commercial_density:
        total = (
            commercial_density.get("offices", 0)
            + commercial_density.get("hotels", 0)
            + commercial_density.get("malls", 0)
        )
        commercial_bonus = min(
            _COMMERCIAL_CAP,
            math.log1p(total) * _COMMERCIAL_MULTIPLIER,
        )

    # 3. News bonus
    news_bonus = 0.0
    if news_items:
        matched_keywords: set[str] = set()
        for item in news_items:
            title = getattr(item, "title", None) or ""
            low = title.lower()
            for kw in _NEWS_KEYWORDS:
                if kw in low:
                    matched_keywords.add(kw)
        news_bonus = min(
            _NEWS_CAP,
            len(matched_keywords) * _NEWS_BONUS_PER_HIT,
        )

    raw = historical_trend_pct + infra_bonus + commercial_bonus + news_bonus
    ceiling = historical_trend_pct + 5.0
    clamped = max(_FLOOR, min(raw, ceiling))

    log.info(
        "roi_composite: trend=%.2f infra=%.2f commercial=%.2f news=%.2f "
        "-> raw=%.2f clamped=%.2f",
        historical_trend_pct, infra_bonus, commercial_bonus, news_bonus,
        raw, clamped,
    )
    return round(clamped, 2)
