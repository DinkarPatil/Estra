"""Ranking sensitivity tests for ``area_intelligence.cache.rank_for_intent``.

The earlier ranker dominated by ``final_area_score`` and small flat boosts,
so different intents produced near-identical top-5 lists. These tests
ensure the gradient scoring actually moves the ordering when the user's
ROI / risk / budget / investment-intent signals differ.
"""
from __future__ import annotations

from app.features.area_intelligence import cache
from app.features.area_intelligence.normalize import (
    DemandStrength,
    NormalizedAreaIntelligence,
)
from app.features.search.schemas import SearchIntent


def _area(
    name: str,
    *,
    city: str = "Pune",
    final: float = 80.0,
    roi: float | None = None,
    yield_pct: float | None = None,
    downside: float | None = None,
    uplift: float | None = None,
    vol: float | None = None,
    psf: float | None = None,
    demand: DemandStrength = DemandStrength.MEDIUM,
) -> NormalizedAreaIntelligence:
    return NormalizedAreaIntelligence(
        area_name=name,
        city=city,
        final_area_score=final,
        roi_composite_pct=roi,
        rental_yield_pct=yield_pct,
        downside_risk_score=downside,
        uplift_potential_score=uplift,
        volatility_index=vol,
        latest_psf=psf,
        demand_strength=demand,
    )


def _intent(**kw) -> SearchIntent:
    raw = kw.pop("raw_entities", {})
    return SearchIntent(raw_entities=raw, **kw)


def _names(ranked):
    return [a.area_name for a, _, _ in ranked]


def setup_module() -> None:  # noqa: D401
    """Seed an in-memory pool of fictional Pune areas for every test."""
    pool = [
        _area("Aundh",          final=85, roi=12, yield_pct=3.5, downside=20, uplift=70, vol=0.2, psf=18000, demand=DemandStrength.HIGH),
        _area("Hinjewadi",      final=86, roi=30, yield_pct=2.8, downside=45, uplift=80, vol=0.4, psf=11000, demand=DemandStrength.HIGH),
        _area("Wagholi",        final=72, roi=22, yield_pct=2.2, downside=55, uplift=85, vol=0.6, psf=7000,  demand=DemandStrength.MEDIUM),
        _area("Koregaon Park",  final=88, roi=10, yield_pct=4.2, downside=15, uplift=55, vol=0.15, psf=22000, demand=DemandStrength.HIGH),
        _area("Moshi",          final=68, roi=35, yield_pct=2.5, downside=70, uplift=88, vol=0.75, psf=6000,  demand=DemandStrength.LOW),
        # Mumbai distractor — must be excluded when intent.location is Pune.
        _area("Bandra",         city="Mumbai", final=92, roi=18, yield_pct=3.0, downside=25, uplift=72, vol=0.25, psf=45000, demand=DemandStrength.HIGH),
    ]
    cache._reset_for_test(pool)


def teardown_module() -> None:
    cache._reset_for_test(None)


def test_location_filter_excludes_other_cities() -> None:
    intent = _intent(location="Pune")
    ranked = cache.rank_for_intent(intent, top_n=10)
    assert all(a.city == "Pune" for a, _, _ in ranked)
    assert "Bandra" not in _names(ranked)


def test_high_roi_target_promotes_high_roi_area() -> None:
    high_roi = _intent(location="Pune", raw_entities={"roi_target": "high"})
    no_signal = _intent(location="Pune")
    ranked_high = _names(cache.rank_for_intent(high_roi, top_n=5))
    ranked_neutral = _names(cache.rank_for_intent(no_signal, top_n=5))

    # With a "high ROI" ask, Moshi (roi=35) and Hinjewadi (roi=30) must
    # outrank the otherwise-stronger Koregaon Park (roi=10).
    moshi_idx = ranked_high.index("Moshi")
    kp_idx = ranked_high.index("Koregaon Park") if "Koregaon Park" in ranked_high else 99
    assert moshi_idx < kp_idx, f"Moshi should beat Koregaon Park under high-ROI ask: {ranked_high}"

    # And the ordering must differ from the no-signal baseline.
    assert ranked_high != ranked_neutral, (
        f"Rankings should shift when ROI ask is added: {ranked_high} vs {ranked_neutral}"
    )


def test_numeric_roi_target_peaks_near_match() -> None:
    intent = _intent(location="Pune", raw_entities={"roi_target": 12})
    ranked = _names(cache.rank_for_intent(intent, top_n=5))
    # Aundh (roi=12) is the exact match. It should outrank Moshi (roi=35,
    # way over the ask) thanks to the gradient roi_term.
    assert ranked.index("Aundh") < ranked.index("Moshi"), ranked


def test_low_risk_tolerance_demotes_volatile_areas() -> None:
    intent = _intent(location="Pune", raw_entities={"risk_tolerance": "low"})
    ranked = _names(cache.rank_for_intent(intent, top_n=5))
    # Moshi (downside=70, vol=0.75) is the riskiest by both measures and
    # should not lead under a low-risk ask.
    assert ranked.index("Moshi") > ranked.index("Aundh"), ranked
    assert ranked.index("Moshi") > ranked.index("Koregaon Park"), ranked


def test_rental_intent_rewards_yield() -> None:
    rental = _intent(location="Pune", raw_entities={"investment_intent": "rental"})
    resale = _intent(location="Pune", raw_entities={"investment_intent": "resale"})
    ranked_rental = _names(cache.rank_for_intent(rental, top_n=5))
    ranked_resale = _names(cache.rank_for_intent(resale, top_n=5))
    # Koregaon Park has the best rental yield (4.2%); rental intent must
    # rank it higher than the resale intent does (where ROI matters more).
    assert ranked_rental.index("Koregaon Park") <= ranked_resale.index("Koregaon Park"), (
        ranked_rental,
        ranked_resale,
    )


def test_budget_max_demotes_unaffordable_areas() -> None:
    # 90 lakh budget for a 2 BHK (~900 sqft).
    # Koregaon Park at 22000 psf → ~1.98 cr → way over budget.
    cheap = _intent(location="Pune", budget_max=9_000_000)
    no_budget = _intent(location="Pune")
    ranked_cheap = _names(cache.rank_for_intent(cheap, top_n=5))
    ranked_open = _names(cache.rank_for_intent(no_budget, top_n=5))

    kp_cheap = ranked_cheap.index("Koregaon Park") if "Koregaon Park" in ranked_cheap else 99
    kp_open = ranked_open.index("Koregaon Park") if "Koregaon Park" in ranked_open else 99
    assert kp_cheap > kp_open, (
        f"Koregaon Park should fall when budget can't afford it: cheap={ranked_cheap} open={ranked_open}"
    )


def test_locality_name_resolves_to_city_pool_and_boosts_exact() -> None:
    """A locality typed as ``intent.location`` (e.g. "Hinjewadi") used to
    collapse the pool to zero (no city is named "Hinjewadi") and silently
    fall back to the global ranking. Now it should resolve to the
    locality's city pool AND surface the named area at #1."""
    intent = _intent(location="Hinjewadi")
    ranked = cache.rank_for_intent(intent, top_n=5)
    assert _names(ranked)[0] == "Hinjewadi", _names(ranked)
    # Pool must restrict to Pune (Hinjewadi's city), not leak Mumbai.
    assert all(a.city == "Pune" for a, _, _ in ranked)


def test_top_one_changes_with_intent() -> None:
    """Smoke test: very different intents should not all yield the same #1."""
    yield_chaser = _intent(location="Pune", raw_entities={"investment_intent": "rental"})
    growth_chaser = _intent(location="Pune", raw_entities={"roi_target": "high", "risk_tolerance": "high"})
    safety_first = _intent(location="Pune", raw_entities={"risk_tolerance": "low"})
    tops = {
        cache.rank_for_intent(yield_chaser, top_n=1)[0][0].area_name,
        cache.rank_for_intent(growth_chaser, top_n=1)[0][0].area_name,
        cache.rank_for_intent(safety_first, top_n=1)[0][0].area_name,
    }
    assert len(tops) >= 2, f"Top-1 must vary across opposing intents, got {tops}"
