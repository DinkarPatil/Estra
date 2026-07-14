from fastapi import APIRouter, HTTPException

from app.features.deals.schemas import DealCreate, DealResponse, DealStatusUpdate

router = APIRouter(prefix="/deals", tags=["Deals"])


@router.post("", response_model=DealResponse, status_code=501)
def create_deal(_: DealCreate) -> DealResponse:
    # TODO(pooja): wire app.features.deals.service.create_deal (auth: require current user)
    raise HTTPException(
        status_code=501, detail="Deal workflow not implemented yet"
    )


@router.patch("/{deal_id}/status", response_model=DealResponse, status_code=501)
def update_status(deal_id: str, _: DealStatusUpdate) -> DealResponse:
    # TODO(pooja): wire app.features.deals.service.update_status
    raise HTTPException(
        status_code=501, detail="Deal workflow not implemented yet"
    )


@router.get("", response_model=list[DealResponse], status_code=501)
def list_deals() -> list[DealResponse]:
    # TODO(pooja): wire app.features.deals.service.list_user_deals
    raise HTTPException(
        status_code=501, detail="Deal workflow not implemented yet"
    )
