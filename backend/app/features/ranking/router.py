from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.ranking import service
from app.features.ranking.schemas import (
    CompareRequest,
    CompareResponse,
    RankRequest,
    RankResponse,
)

router = APIRouter(prefix="/ranking", tags=["Ranking"])


@router.post("/rank", response_model=RankResponse)
def rank(body: RankRequest, db: Session = Depends(get_db)) -> RankResponse:
    """Rank a list of properties based on user preferences and area intelligence."""
    return service.rank(db, body)


@router.post("/compare", response_model=CompareResponse)
def compare(body: CompareRequest, db: Session = Depends(get_db)) -> CompareResponse:
    """Compare 2-5 shortlisted properties with AI-driven investment analysis."""
    return service.compare(db, body)
