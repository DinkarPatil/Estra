"""Area shortlisting pipeline stage.

Consumes a SearchIntent and returns the top micro-markets ranked by
normalized area scores + intent signals. Area metadata still comes from
the cached ``normalized_areas.json``; the per-area property count now
comes from the ``broker_listings`` DB so the user sees how many real
broker-listed properties live inside each shortlisted area.

When ``settings.USE_AI_AREA_EXPLANATIONS`` is True the returned reasons
are augmented with AI-generated copy; otherwise heuristic template
reasons are used.
"""

from app.core.config import settings
from app.core.database import SessionLocal
from app.features.area_intelligence.cache import rank_for_intent
from app.features.broker.service import count_listings_for_area
from app.features.search.pipeline import area_explanation
from app.features.search.schemas import AreaCandidate, AreaSignals, SearchIntent


def run(intent: SearchIntent, query: str = "") -> list[AreaCandidate]:
    """Rank micro-markets for the given intent and return top candidates."""
    ranked = rank_for_intent(intent, top_n=10)

    # --- optional AI explanations ---
    ai_explanations: list[dict[str, str]] | None = None
    if settings.USE_AI_AREA_EXPLANATIONS:
        area_payloads = [
            {
                "area_name": area.area_name,
                "city": area.city,
                "final_area_score": area.final_area_score,
                "rental_yield_pct": area.rental_yield_pct,
                "uplift_potential_score": area.uplift_potential_score,
                "downside_risk_score": area.downside_risk_score,
                "historical_trend_score": area.historical_trend_score,
                "demand_strength": area.demand_strength.value,
            }
            for area, _score, _reasons in ranked
        ]
        ai_explanations = area_explanation.run(
            query,
            area_payloads,
        )

    db = SessionLocal()
    try:
        candidates: list[AreaCandidate] = []
        for area, score, reasons in ranked:
            merged_reasons = list(reasons)
            if ai_explanations:
                for exp in ai_explanations:
                    if exp["area_name"] == area.area_name:
                        if exp.get("why_it_matches"):
                            merged_reasons.append(f"Why: {exp['why_it_matches']}")
                        if exp.get("recent_change"):
                            merged_reasons.append(f"Recent: {exp['recent_change']}")
                        if exp.get("attraction"):
                            merged_reasons.append(f"Attractive: {exp['attraction']}")
                        if exp.get("projected_movement"):
                            merged_reasons.append(f"Outlook: {exp['projected_movement']}")
                        break

            candidates.append(
                AreaCandidate(
                    area_name=area.area_name,
                    city=area.city,
                    score=round(score, 2),
                    final_area_score=area.final_area_score,
                    reasons=merged_reasons,
                    signals=AreaSignals(
                        historical_trend_score=area.historical_trend_score,
                        trend_1yr_pct=area.trend_1yr_pct,
                        trend_3yr_pct=area.trend_3yr_pct,
                        trend_5yr_pct=area.trend_5yr_pct,
                        latest_psf=area.latest_psf,
                        uplift_potential_score=area.uplift_potential_score,
                        downside_risk_score=area.downside_risk_score,
                        legal_safety_score=area.legal_safety_score,
                        infra_impact_score=area.infra_impact_score,
                        market_momentum_score=area.market_momentum_score,
                        news_relevance_score=area.news_relevance_score,
                        liquidity_demand_score=area.liquidity_demand_score,
                        rental_yield_pct=area.rental_yield_pct,
                        roi_composite_pct=area.roi_composite_pct,
                        volatility_index=area.volatility_index,
                        demand_strength=area.demand_strength.value,
                    ),
                    property_count=count_listings_for_area(db, area.area_name, area.city),
                )
            )
        return candidates
    finally:
        db.close()
