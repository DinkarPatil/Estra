import json
from typing import Any
from sqlalchemy.orm import Session
from app.core import llm
from app.core.logging import get_pipeline_logger
from app.features.area_intelligence.cache import find_area_for_property
from app.features.area_intelligence.models import MicroMarket
from app.features.area_intelligence.normalize import normalize
from app.features.property_intelligence.cache import get_property
from app.features.property_intelligence.models import PropertyListing

log = get_pipeline_logger("ranking.explanation")

_SYSTEM_PROMPT = """You are an expert real estate investment analyst for ESTRA Glimmora.
Your task is to provide a brief, data-driven explanation for why a specific property was ranked highly.

You will be given:
1. Property Details (Title, Location, Price, BHK)
2. Area Intelligence (Pillar scores from 0-100: ROI, Uplift, Infra, Risk, etc.)
3. User Intent (What the user is looking for)

Return a JSON object with:
{
  "decision_cues": ["High ROI", "Safe Bet", etc.], // 2-3 short tags
  "explanation": "One or two sentences explaining the property's value proposition."
}

Be specific and professional. Mention infrastructure or trends if they are strong."""

def run(db: Session, property_id: str, preferences: dict) -> dict[str, Any]:
    """Generate an AI-driven explanation for a ranked property.

    Resolves the property from the cache first (covers the 26k cache-backed
    listings used by area-first search) and falls back to the SQL DB
    (covers the smaller seed set used by the legacy flat-search path).
    """
    title: str | None = None
    city: str | None = None
    locality: str | None = None
    price: float | None = None
    bedrooms: int | None = None

    cached = get_property(property_id)
    if cached:
        title = cached.get("title")
        city = cached.get("city")
        locality = cached.get("locality_text")
        price = cached.get("price_inr")
        bedrooms = cached.get("bedrooms")
    else:
        prop = db.query(PropertyListing).filter(PropertyListing.id == property_id).first()
        if not prop:
            return {
                "decision_cues": ["Matches Criteria"],
                "explanation": "This property matches your basic search parameters.",
            }
        title = prop.title
        city = prop.city
        locality = prop.locality_text
        price = prop.price_inr
        bedrooms = prop.bedrooms

    # Gather area context — prefer the cached normalized record (rich, with
    # all eight signal scores). Fall back to the DB MicroMarket lookup.
    area_context: dict[str, Any] = {}
    norm_area = find_area_for_property(locality, city)
    if norm_area is not None:
        area_context = {
            "area_name": norm_area.area_name,
            "uplift_score": norm_area.uplift_potential_score,
            "roi_score": norm_area.historical_trend_score,
            "infra_score": norm_area.infra_impact_score,
            "risk_score": norm_area.downside_risk_score,
            "demand_score": norm_area.liquidity_demand_score,
            "trend_1yr_pct": norm_area.trend_1yr_pct,
            "trend_3yr_pct": norm_area.trend_3yr_pct,
            "rental_yield_pct": norm_area.rental_yield_pct,
            "roi_composite_pct": norm_area.roi_composite_pct,
            "demand_strength": getattr(norm_area.demand_strength, "value", None),
            "risk_tags": list(norm_area.risk_tags or []),
        }
    elif locality:
        base_locality = locality.split(",")[0].strip()
        first_word = base_locality.split()[0].strip() if base_locality else ""
        market = db.query(MicroMarket).filter(
            MicroMarket.city.ilike(city or ""),
            (MicroMarket.name.ilike(f"%{base_locality}%") | MicroMarket.name.ilike(f"%{first_word}%"))
        ).first()
        if market:
            market_data = {c.name: getattr(market, c.name) for c in market.__table__.columns}
            norm = normalize(market_data)
            area_context = {
                "area_name": market.name,
                "uplift_score": norm.uplift_potential_score,
                "roi_score": norm.historical_trend_score,
                "infra_score": norm.infra_impact_score,
                "risk_score": norm.downside_risk_score,
                "demand_score": norm.liquidity_demand_score,
                "historical_trend_pct": market.historical_price_trend_pct,
                "roi_trend_pct": market.roi_trend_pct,
                "volatility": market.volatility_index,
                "infrastructure_evidence": market.upcoming_infra_pipeline or market.infra_news_impact,
                "risk_evidence": market.risk_signals,
                "legal_evidence": market.legal_regulatory_friction,
                "recent_news": market.recent_news_sentiment,
            }

    input_data = {
        "property": {
            "title": title,
            "location": f"{locality}, {city}" if (locality or city) else None,
            "price": price,
            "bhk": bedrooms,
        },
        "area_intelligence": area_context,
        "user_intent": preferences,
    }

    if not llm.is_available():
        return {"decision_cues": ["Good Value"], "explanation": "Ranked high based on area growth and property attributes."}

    text = llm.generate_content(
        system_instruction=_SYSTEM_PROMPT,
        user_prompt=json.dumps(input_data),
        temperature=0.2,
    )
    if not text:
        return {"decision_cues": ["Top Choice"], "explanation": "Strategic investment opportunity in a high-growth corridor."}
    try:
        return json.loads(text)
    except Exception:
        log.exception("Vertex explanation parse failed")
        return {"decision_cues": ["Top Choice"], "explanation": "Strategic investment opportunity in a high-growth corridor."}
