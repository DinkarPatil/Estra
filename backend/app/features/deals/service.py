from sqlalchemy.orm import Session

from app.core.exceptions import NotFoundError
from app.features.deals import state_machine
from app.features.deals.models import Deal, DealEvent
from app.features.deals.schemas import DealCreate, DealStatusUpdate


def create_deal(db: Session, buyer_user_id: str, body: DealCreate) -> Deal:
    deal = Deal(
        property_id=body.property_id,
        buyer_user_id=buyer_user_id,
        offer_amount=body.offer_amount,
        offer_currency=body.offer_currency,
        status="lead",
    )
    db.add(deal)
    db.flush()
    db.add(
        DealEvent(
            deal_id=deal.id,
            from_status=None,
            to_status="lead",
            actor_user_id=buyer_user_id,
        )
    )
    db.commit()
    db.refresh(deal)
    return deal


def update_status(
    db: Session, deal_id: str, actor_user_id: str, body: DealStatusUpdate
) -> Deal:
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise NotFoundError("Deal not found")

    state_machine.assert_transition(deal.status, body.status)

    db.add(
        DealEvent(
            deal_id=deal.id,
            from_status=deal.status,
            to_status=body.status,
            actor_user_id=actor_user_id,
        )
    )
    deal.status = body.status
    db.commit()
    db.refresh(deal)
    return deal


def list_user_deals(db: Session, buyer_user_id: str) -> list[Deal]:
    return (
        db.query(Deal)
        .filter(Deal.buyer_user_id == buyer_user_id)
        .order_by(Deal.created_at.desc())
        .all()
    )
