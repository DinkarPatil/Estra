from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.orchestrator import composition
from app.orchestrator.schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    AreasRequest,
    AreasResponse,
)

router = APIRouter(prefix="/orchestrator", tags=["Orchestrator"])


@router.post("/areas", response_model=AreasResponse)
async def analyze_areas(body: AreasRequest) -> AreasResponse:
    """Area-first flow stage 1 — rank micro-markets for the query."""
    return composition.analyze_areas(body)


@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze(body: AnalyzeRequest, db: Session = Depends(get_db)) -> AnalyzeResponse:
    """Area-first flow stage 2 (when ``area_names`` is set) or flat search."""
    return composition.analyze(db, body)
