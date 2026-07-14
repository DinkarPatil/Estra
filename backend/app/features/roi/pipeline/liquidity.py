from app.core.logging import get_pipeline_logger
from app.features.area_intelligence import cache as area_cache
from app.features.property_intelligence import cache as property_cache

log = get_pipeline_logger("roi.liquidity")


def run(property_id: str) -> float:
    log.info("liquidity", extra={"property_id": property_id})

    prop = property_cache.get_property(property_id)
    if prop is None:
        return 0.0

    area = area_cache.find_area_for_property(prop.get("locality_text"), prop.get("city"))
    if area is None:
        return 0.0

    demand = area.liquidity_demand_score                            # 0–100
    stability = (1.0 - area.volatility_index) * 100.0 \
        if area.volatility_index is not None else None              # 0–100

    # Blend whichever signals are available so a single missing signal
    # doesn't artificially cap the score.
    parts = [p for p in (demand, stability) if p is not None]
    if not parts:
        return 0.0
    if len(parts) == 1:
        return round(min(100.0, max(0.0, parts[0])), 2)

    # Both present: weight demand higher (0.7) than stability (0.3).
    score = demand * 0.7 + stability * 0.3
    return round(min(100.0, max(0.0, score)), 2)
