from app.features.roi.pipeline import appreciation, liquidity, rental_yield, scenario
from app.features.roi.schemas import RoiRequest, RoiResponse


def compute(body: RoiRequest) -> RoiResponse:
    return RoiResponse(
        property_id=body.property_id,
        rental_yield_pct=rental_yield.run(body.property_id),
        appreciation_pct=appreciation.run(body.property_id, body.horizon_years),
        liquidity_score=liquidity.run(body.property_id),
        scenario_summary=scenario.run(body.property_id, body.scenario or "base"),
    )
