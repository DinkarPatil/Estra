from app.core.logging import get_pipeline_logger
from app.features.area_intelligence import cache as area_cache
from app.features.property_intelligence import cache as property_cache

log = get_pipeline_logger("roi.yield")


def run(property_id: str) -> float:
    log.info("rental yield", extra={"property_id": property_id})

    prop = property_cache.get_property(property_id)
    if prop is None:
        return 0.0

    area = area_cache.find_area_for_property(prop.get("locality_text"), prop.get("city"))
    if area is None:
        return 0.0

    if area.rental_yield_pct is not None:
        return round(area.rental_yield_pct, 2)

    # No rental data for this area. Return the Pune/Mumbai midpoint of the
    # 2–4% Indian range as a neutral fallback rather than 0 (which would
    # falsely imply zero rental income).
    return 3.0
