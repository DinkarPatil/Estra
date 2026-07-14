from fastapi import APIRouter

from app.features.roi import service
from app.features.roi.schemas import RoiRequest, RoiResponse

router = APIRouter(prefix="/roi", tags=["ROI"])


@router.post("", response_model=RoiResponse)
def compute_roi(body: RoiRequest) -> RoiResponse:
    return service.compute(body)
