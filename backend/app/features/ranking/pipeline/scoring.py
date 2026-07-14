from sqlalchemy.orm import Session
from app.core.logging import get_pipeline_logger
from app.features.property_intelligence.models import PropertyListing
from app.features.area_intelligence.models import MicroMarket
from app.features.area_intelligence.normalize import normalize

log = get_pipeline_logger("ranking.scoring")


def run(db: Session, property_ids: list[str], preferences: dict) -> list[tuple[str, float]]:
    """Score a set of properties against user preferences using the official normalization logic."""
    log.info("scoring %d properties", len(property_ids))
    
    if not property_ids:
        return []

    # 1. Fetch properties
    properties = db.query(PropertyListing).filter(PropertyListing.id.in_(property_ids)).all()
    
    # 2. Score them
    scored_results = []
    for p in properties:
        # Start with a base score based on property attributes
        score = 1.0
        
        # A. Use Pooja's Normalization logic for Area Intelligence
        market = None
        if p.locality_text:
            base_locality = p.locality_text.split(',')[0].strip()
            first_word = base_locality.split()[0].strip()
            
            market = db.query(MicroMarket).filter(
                MicroMarket.city.ilike(p.city),
                (MicroMarket.name.ilike(f"%{base_locality}%") | MicroMarket.name.ilike(f"%{first_word}%"))
            ).first()
        
        if market:
            # Convert SQLAlchemy model to dict for normalize()
            market_data = {c.name: getattr(market, c.name) for c in market.__table__.columns}
            normalized = normalize(market_data)
            
            # Use the final_area_score (0-100) to boost the property score
            if normalized.final_area_score:
                # Add up to 2.0 to the score based on area strength (0-100 scale)
                score += (normalized.final_area_score / 50.0)

        # B. Property-Specific Match (Micro factors)
        # 1. Price Value Check (if price_per_sqft is below area median - future work)
        
        # 2. Preferences Match
        if preferences.get("investment_intent") == "rental" and market and market.rental_demand_strength == "High":
            score += 0.5
            
        scored_results.append((p.id, score))
        
    # Sort by score descending
    scored_results.sort(key=lambda x: x[1], reverse=True)
    
    return scored_results
