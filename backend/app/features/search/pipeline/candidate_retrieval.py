from typing import Any

from sqlalchemy.orm import Session

from app.core.logging import get_pipeline_logger
from app.features.property_intelligence import service as prop_service
from app.features.area_intelligence.models import MicroMarket
from app.features.search.schemas import SearchCandidate

log = get_pipeline_logger("search.retrieval")


def run(db: Session, filters: dict[str, Any]) -> list[SearchCandidate]:
    """Retrieve candidate properties matching the given filters."""
    log.info("retrieving candidates with filters: %s", filters)
    
    # 1. Fetch properties matching the base filters (city, budget, bhk)
    resp = prop_service.list_properties(db, **filters)
    
    candidates = []
    for item in resp.items:
        reasons = ["Matches basic search criteria"]
        
        # 2. Area Shortlisting Logic
        # Try a more forgiving match for the micro market
        market = None
        if item.locality_text:
            # Extract first part before comma to improve match rate (e.g., 'Wagholi, Pune' -> 'Wagholi')
            base_locality = item.locality_text.split(',')[0].strip()
            # If there's still a space, we can also try the first word just to be safe
            first_word = base_locality.split()[0].strip()
            
            market = db.query(MicroMarket).filter(
                MicroMarket.city.ilike(item.city),
                (MicroMarket.name.ilike(f"%{base_locality}%") | MicroMarket.name.ilike(f"%{first_word}%"))
            ).first()
            
        if market:
            if market.roi_trend_pct and market.roi_trend_pct > 8:
                reasons.append(f"Located in high-yield area ({market.roi_trend_pct}% ROI trend)")
            if market.projected_uplift_pct and market.projected_uplift_pct > 8:
                reasons.append(f"Area has high growth potential (+{market.projected_uplift_pct}% projected)")
            if market.upcoming_infra_pipeline:
                reasons.append("Benefiting from upcoming infrastructure pipeline")
            if market.rental_demand_strength == "High":
                reasons.append("High rental demand locality")
        
        candidates.append(
            SearchCandidate(
                property_id=item.id,
                score=1.0,
                reasons=reasons if len(reasons) > 1 else reasons
            )
        )
    
    log.info("found %d candidates", len(candidates))
    return candidates
