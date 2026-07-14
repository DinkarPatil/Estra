from app.core.logging import get_pipeline_logger
from app.features.area_intelligence import cache as area_cache
from app.features.property_intelligence import cache as property_cache

log = get_pipeline_logger("roi.scenario")


def run(property_id: str, scenario: str) -> dict:
    log.info("scenario", extra={"property_id": property_id, "scenario": scenario})

    prop = property_cache.get_property(property_id)
    if prop is None:
        return _empty_summary()

    area = area_cache.find_area_for_property(prop.get("locality_text"), prop.get("city"))
    if area is None:
        return _empty_summary()

    roi = (
        area.roi_composite_pct
        if area.roi_composite_pct is not None
        else area.rental_yield_pct
        if area.rental_yield_pct is not None
        else 0.0
    )
    base_rent_yield = area.rental_yield_pct if area.rental_yield_pct is not None else 3.0
    risk = area.downside_risk_score if area.downside_risk_score is not None else 50.0

    if scenario == "bull":
        appreciation = roi * 1.5
        rent_yield = base_rent_yield
        narrative = (
            f"Best-case: strong macro tailwinds, high demand, and developer momentum "
            f"drive {appreciation:.1f}% appreciation."
        )
    elif scenario == "bear":
        appreciation = roi * 0.3
        rent_yield = max(base_rent_yield * 0.7, 1.5)
        risk_note = "elevated risk" if risk > 60 else "moderate risk"
        narrative = (
            f"Downside scenario with {risk_note}. Expect {appreciation:.1f}% appreciation, "
            f"rental income buffers downside."
        )
    else:
        scenario = "base"
        appreciation = roi
        rent_yield = base_rent_yield
        narrative = (
            f"Base case: {appreciation:.1f}% annual appreciation plus {rent_yield:.1f}% rental yield."
        )

    return {
        "scenario": scenario,
        "appreciation_pct": round(appreciation, 2),
        "rental_yield_pct": round(rent_yield, 2),
        "total_return_pct": round(appreciation + rent_yield, 2),
        "narrative": narrative,
    }


def _empty_summary() -> dict:
    return {
        "scenario": "base",
        "appreciation_pct": 0.0,
        "rental_yield_pct": 0.0,
        "total_return_pct": 0.0,
        "narrative": "Insufficient data for scenario analysis.",
    }
