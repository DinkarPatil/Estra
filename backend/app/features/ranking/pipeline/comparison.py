"""Property comparison pipeline (cache-backed).

Fetches 2-5 properties from cache, overlays area intelligence,
computes highlights, and generates an AI comparison summary.
"""

from __future__ import annotations

import json
import re
from typing import Any

from app.core import llm
from app.core.logging import get_pipeline_logger
from app.features.area_intelligence.cache import find_area_for_property
from app.features.property_intelligence.cache import get_property
from app.features.ranking.schemas import (
    CompareResponse,
    Highlights,
    PropertySnapshot,
)

log = get_pipeline_logger("ranking.comparison")

_SYSTEM_PROMPT = """You are an expert real estate investment analyst for ESTRA Glimmora.
Your task is to compare 2-5 shortlisted properties and help the buyer make an informed decision.

You will be given:
1. Property details (price, sqft, BHK, floor, amenities, etc.)
2. Area intelligence for each property (1yr/3yr/5yr price trends, rental yield, risk scores, infrastructure)
3. User's original search intent / preferences (if any)

Return a JSON object with:
{
  "ai_summary": "3-5 sentences comparing the properties as investment options. Be specific about numbers. Mention which property wins on what dimension. If one is clearly better overall, say so. If they serve different goals, explain that.",
  "decision_cues": ["Pick X for rental income", "Pick Y for capital appreciation", "Z is the safest bet"], // 2-4 short actionable tags
}

Be data-driven. Reference specific numbers (price per sqft, trend %, rental yield). Keep it concise but informative."""


def _extract_from_raw(raw_json: str) -> dict[str, Any]:
    """Pull useful fields from the raw JSON blob."""
    try:
        raw = json.loads(raw_json) if isinstance(raw_json, str) else raw_json
    except Exception:
        return {}

    result: dict[str, Any] = {}

    # Floor level
    result["floor_level"] = raw.get("floor_level")

    # RERA
    result["rera_number"] = raw.get("rera_number")

    # Facing direction (east/west/north/south)
    desc = raw.get("description", "")
    facing_match = re.search(r"\b(east|west|north|south)[\s-]facing", desc, re.IGNORECASE)
    if facing_match:
        result["facing"] = facing_match.group(1).capitalize()

    # Age
    age_match = re.search(r"(\d+-\d+)\s*years?\s*old", desc, re.IGNORECASE)
    if age_match:
        result["project_age"] = age_match.group(1) + " years"
    elif "ready to move" in desc.lower():
        result["project_age"] = "Ready to move"

    # Amenities
    amenities = []
    amenity_keywords = [
        "swimming pool", "fitness centre", "gym", "club house", "park",
        "lift", "security guard", "maintenance staff", "shopping centre",
        "grocery shop", "water softening plant",
    ]
    desc_lower = desc.lower()
    for kw in amenity_keywords:
        if kw in desc_lower:
            amenities.append(kw.title())
    result["amenities"] = amenities

    return result


def _build_snapshot(prop: dict[str, Any]) -> PropertySnapshot:
    """Convert a raw cached property dict into a PropertySnapshot."""
    raw_extra = _extract_from_raw(prop.get("raw", "{}"))

    # Price per sqft fallback calculation
    price = prop.get("price_inr")
    area = prop.get("area_sqft")
    psf = prop.get("price_per_sqft")
    if psf is None and price is not None and area is not None and area > 0:
        psf = round(price / area, 2)

    # Area intelligence
    area_intel = find_area_for_property(prop.get("locality_text"), prop.get("city"))
    area_name = None
    trend_1yr = trend_3yr = trend_5yr = latest_psf = rental_yield = risk = uplift = infra = liquidity = None
    if area_intel:
        area_name = area_intel.area_name
        trend_1yr = area_intel.trend_1yr_pct
        trend_3yr = area_intel.trend_3yr_pct
        trend_5yr = area_intel.trend_5yr_pct
        latest_psf = area_intel.latest_psf
        rental_yield = area_intel.rental_yield_pct
        risk = area_intel.downside_risk_score
        uplift = area_intel.uplift_potential_score
        infra = area_intel.infra_impact_score
        liquidity = area_intel.liquidity_demand_score

    return PropertySnapshot(
        property_id=prop["id"],
        title=prop.get("title"),
        locality=prop.get("locality_text"),
        city=prop.get("city"),
        price_inr=price,
        price_per_sqft=psf,
        area_sqft=area,
        bedrooms=prop.get("bedrooms"),
        bathrooms=prop.get("bathrooms"),
        floor_level=raw_extra.get("floor_level") or prop.get("floor_level"),
        rera_number=raw_extra.get("rera_number") or prop.get("rera_number"),
        project_age=raw_extra.get("project_age"),
        facing=raw_extra.get("facing"),
        amenities=raw_extra.get("amenities", []),
        area_name=area_name,
        trend_1yr_pct=trend_1yr,
        trend_3yr_pct=trend_3yr,
        trend_5yr_pct=trend_5yr,
        latest_psf=latest_psf,
        rental_yield_pct=rental_yield,
        downside_risk_score=risk,
        uplift_potential_score=uplift,
        infra_impact_score=infra,
        liquidity_demand_score=liquidity,
    )


def _compute_highlights(snapshots: list[PropertySnapshot]) -> Highlights:
    """Compute highlight winners across dimensions."""
    if not snapshots:
        return Highlights()

    best_value = None
    highest_growth = None
    safest = None
    best_rental = None
    most_affordable = None

    best_psf = float("inf")
    best_3yr = float("-inf")
    lowest_risk = float("inf")
    highest_yield = float("-inf")
    lowest_price = float("inf")

    for s in snapshots:
        if s.price_per_sqft is not None and s.price_per_sqft < best_psf:
            best_psf = s.price_per_sqft
            best_value = s.property_id

        if s.trend_3yr_pct is not None and s.trend_3yr_pct > best_3yr:
            best_3yr = s.trend_3yr_pct
            highest_growth = s.property_id

        if s.downside_risk_score is not None and s.downside_risk_score < lowest_risk:
            lowest_risk = s.downside_risk_score
            safest = s.property_id

        if s.rental_yield_pct is not None and s.rental_yield_pct > highest_yield:
            highest_yield = s.rental_yield_pct
            best_rental = s.property_id

        if s.price_inr is not None and s.price_inr < lowest_price:
            lowest_price = s.price_inr
            most_affordable = s.property_id

    return Highlights(
        best_value=best_value,
        highest_growth=highest_growth,
        safest_bet=safest,
        best_rental=best_rental,
        most_affordable=most_affordable,
    )


def run(property_ids: list[str], preferences: dict) -> CompareResponse:
    """Compare 2-5 properties and return a rich comparison report."""
    log.info("comparing %d properties", len(property_ids))

    # 1. Fetch properties
    snapshots: list[PropertySnapshot] = []
    for pid in property_ids:
        prop = get_property(pid)
        if prop:
            snapshots.append(_build_snapshot(prop))

    if len(snapshots) < 2:
        return CompareResponse(
            properties=snapshots,
            highlights=Highlights(),
            ai_summary="Not enough properties found to compare.",
            decision_cues=["Add more properties"],
        )

    # 2. Compute highlights
    highlights = _compute_highlights(snapshots)

    # 3. Generate AI summary via shared Vertex client
    ai_summary = ""
    decision_cues: list[str] = []

    if llm.is_available():
        input_data = {
            "properties": [
                {
                    "id": s.property_id,
                    "title": s.title,
                    "location": f"{s.locality}, {s.city}",
                    "price_inr": s.price_inr,
                    "price_per_sqft": s.price_per_sqft,
                    "area_sqft": s.area_sqft,
                    "bedrooms": s.bedrooms,
                    "bathrooms": s.bathrooms,
                    "floor": s.floor_level,
                    "facing": s.facing,
                    "age": s.project_age,
                    "rera": s.rera_number is not None,
                    "amenities": s.amenities,
                    "area": {
                        "name": s.area_name,
                        "1yr_trend_pct": s.trend_1yr_pct,
                        "3yr_trend_pct": s.trend_3yr_pct,
                        "5yr_trend_pct": s.trend_5yr_pct,
                        "latest_psf": s.latest_psf,
                        "rental_yield_pct": s.rental_yield_pct,
                        "downside_risk": s.downside_risk_score,
                        "uplift_potential": s.uplift_potential_score,
                    },
                }
                for s in snapshots
            ],
            "user_intent": preferences,
        }
        text = llm.generate_content(
            system_instruction=_SYSTEM_PROMPT,
            user_prompt=json.dumps(input_data),
            temperature=0.3,
        )
        if text:
            try:
                parsed = json.loads(text)
                ai_summary = parsed.get("ai_summary", "")
                decision_cues = parsed.get("decision_cues", [])
            except Exception:
                log.exception("Vertex comparison response parse failed")

    if not ai_summary:
        # Fallback: build a simple comparison text
        parts = []
        for s in snapshots:
            parts.append(
                f"{s.title or s.property_id}: "
                f"{'₹' + str(s.price_inr) if s.price_inr else 'Price N/A'} | "
                f"{s.bedrooms}BHK | {s.area_sqft} sqft | "
                f"Area: {s.area_name} (3yr trend: {s.trend_3yr_pct}%)"
            )
        ai_summary = "Comparison:\n" + "\n".join(parts)
        decision_cues = ["Review price per sqft and area trends"]

    return CompareResponse(
        properties=snapshots,
        highlights=highlights,
        ai_summary=ai_summary,
        decision_cues=decision_cues,
    )
