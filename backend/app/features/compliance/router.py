from fastapi import APIRouter, HTTPException

from app.features.compliance.schemas import ComplianceRequest, ComplianceResponse

router = APIRouter(prefix="/compliance", tags=["Compliance"])


@router.post("/screen", response_model=ComplianceResponse, status_code=501)
def screen(_: ComplianceRequest) -> ComplianceResponse:
    # TODO(pooja): wire app.features.compliance.service.screen
    raise HTTPException(
        status_code=501, detail="Compliance pipeline not implemented yet"
    )
