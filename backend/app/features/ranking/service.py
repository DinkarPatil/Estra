from sqlalchemy.orm import Session
from app.features.ranking.pipeline import comparison, scoring, scoring_cache
from app.features.ranking.schemas import (
    CompareRequest,
    CompareResponse,
    RankRequest,
    RankResponse,
    RankedItem,
)

# Per-item LLM explanations were dropped from /analyze: they took 5 sequential
# Gemini calls (~30s) and the frontend reads neither `explanation` nor
# `decision_cues`. The compare flow still uses Gemini via comparison.run.
def rank(db: Session, req: RankRequest) -> RankResponse:
    """Rank properties by score. No per-item LLM call."""
    scored_pairs = scoring.run(db, req.property_ids, req.preferences)
    if not scored_pairs:
        scored_pairs = scoring_cache.run(req.property_ids, req.preferences)

    items = [
        RankedItem(
            property_id=prop_id,
            score=score,
            explanation=["Matches search criteria"],
        )
        for prop_id, score in scored_pairs
    ]
    return RankResponse(items=items)


def compare(_db: Session, req: CompareRequest) -> CompareResponse:
    """Compare 2-5 shortlisted properties and return an AI-driven comparison report."""
    return comparison.run(req.property_ids, req.preferences)
