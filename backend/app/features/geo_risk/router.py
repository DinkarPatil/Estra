from fastapi import APIRouter, HTTPException

from app.features.geo_risk.schemas import GeoRiskResponse

router = APIRouter(prefix="/geo-risk", tags=["Geo Risk"])


@router.get("/{property_id}", response_model=GeoRiskResponse, status_code=501)
def get_geo_risk(property_id: str) -> GeoRiskResponse:
    # TODO(pooja): wire app.features.geo_risk.service.summarize
    raise HTTPException(
        status_code=501, detail="Geo-risk pipeline not implemented yet"
    )
