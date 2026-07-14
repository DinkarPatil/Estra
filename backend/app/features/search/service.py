from sqlalchemy.orm import Session

from app.features.search.pipeline import intent_parser
from app.features.search.schemas import (
    AreaSearchResponse,
    SearchCandidate,
    SearchRequest,
    SearchResponse,
)


def run_area_search(body: SearchRequest) -> AreaSearchResponse:
    """Area-first search: rank micro-markets against the user intent."""
    from app.features.search.pipeline import area_retrieval

    intent = intent_parser.run(body.query)
    areas = area_retrieval.run(intent, body.query)
    return AreaSearchResponse(intent=intent, areas=areas)


def run_search(db: Session, body: SearchRequest) -> SearchResponse:
    """Property search backed by the broker_listings DB.

    The flow is now strictly DB-first: the user picks 3–4 areas and we
    return only properties that brokers have actually listed under those
    localities. Web scraping and JSON caches are no longer consulted.
    """
    intent = intent_parser.run(body.query)

    from app.features.search.pipeline import property_retrieval_db

    candidates = property_retrieval_db.run(
        db,
        intent,
        body.filters,
        body.area_names or [],
    )

    final_candidates = [
        SearchCandidate(
            property_id=c.property_id,
            score=c.score,
            reasons=c.reasons,
            property=c.property,
        )
        for c in candidates
    ]
    return SearchResponse(intent=intent, candidates=final_candidates)
