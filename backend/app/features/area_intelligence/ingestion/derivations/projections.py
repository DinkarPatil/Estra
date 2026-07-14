"""Forward-looking uplift/downside projections.

Transparent heuristics, not a forecasting model:

    projected_uplift_pct   = trend + min(volatility, 1.0) * 2
    projected_downside_pct = max(-15, min(5, trend - min(volatility, 1.0) * 3))

Intuition: higher volatility = wider bands on both sides of the trend.
Both functions return None if either input is None — honest NULL, no
invented values. Pooja's normalisation / Harsh's scoring layer can swap
in a better model later; this keeps the column populated with something
defensible today.
"""

from __future__ import annotations


def projected_uplift_pct(
    historical_trend_pct: float | None, volatility_cv: float | None
) -> float | None:
    if historical_trend_pct is None:
        return None
    vol = max(0.0, volatility_cv or 0.0)
    bonus = min(vol, 1.0) * 2.0
    return round(historical_trend_pct + bonus, 2)


def projected_downside_pct(
    historical_trend_pct: float | None, volatility_cv: float | None
) -> float | None:
    if historical_trend_pct is None:
        return None
    vol = max(0.0, volatility_cv or 0.0)
    penalty = min(vol, 1.0) * 3.0
    raw = historical_trend_pct - penalty
    return round(max(-15.0, min(5.0, raw)), 2)
