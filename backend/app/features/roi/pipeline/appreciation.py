from app.core.logging import get_pipeline_logger
from app.features.area_intelligence import cache as area_cache
from app.features.property_intelligence import cache as property_cache

log = get_pipeline_logger("roi.appreciation")


def run(property_id: str, horizon_years: int) -> float:
    log.info(
        "appreciation",
        extra={"property_id": property_id, "horizon": horizon_years},
    )

    prop = property_cache.get_property(property_id)
    if prop is None:
        return 0.0

    area = area_cache.find_area_for_property(prop.get("locality_text"), prop.get("city"))
    if area is None:
        return 0.0

    if horizon_years == 1:
        trend = area.trend_1yr_pct
    elif horizon_years == 3:
        trend = area.trend_3yr_pct
    elif horizon_years == 5:
        trend = area.trend_5yr_pct
    elif area.trend_1yr_pct is not None:
        trend = area.trend_1yr_pct
    else:
        trend = area.price_growth_pct

    if trend is not None:
        return round(trend, 2)

    # roi_composite_pct is a 3-year total-return proxy. Annualise it for the
    # caller's horizon so we don't return e.g. 30% when they asked for 1 year.
    if area.roi_composite_pct is not None and horizon_years > 0:
        return round(area.roi_composite_pct / horizon_years, 2)

    return 0.0
