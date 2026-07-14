"""Deep-dive report generation service.

Orchestrates:
1. Cache lookup (fast path)
2. Property + area data fetch
3. Mock data injection
4. Gemini prompt generation
5. AI response parsing + caching
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from app.core import llm
from app.core.logging import get_pipeline_logger
from app.features.area_intelligence.cache import find_area_for_property
from app.features.property_intelligence.cache import get_property
from app.features.property_intelligence.cache_deepdive import get as get_cached, set as set_cached
from app.features.property_intelligence.pipeline import graph_lookup
from app.features.property_intelligence.prompts.deepdive_prompt import SYSTEM_PROMPT, build_user_prompt
from app.features.property_intelligence.schemas import DeepDiveResponse, DeepDiveSections

log = get_pipeline_logger("property_intelligence.deepdive")


def _generate_mock_data(prop: dict) -> dict[str, str]:
    """Generate realistic mock data for missing fields.

    Derives developer name from project title, generates address from locality.
    """
    title = prop.get("title", "")
    locality = prop.get("locality_text", "")
    city = prop.get("city", "")

    # Derive developer from project name: "Manav La Moda" → "Manav Group"
    developer = "Reputed Developer"
    if title:
        first_word = title.split()[0] if title.split() else ""
        if first_word:
            developer = f"{first_word} Group"

    # Generate address from locality
    address_parts = [p.strip() for p in locality.split(",") if p.strip()]
    if address_parts and city:
        address = f"{address_parts[0]}, {city}"
    elif city:
        address = f"{city} (exact address on site visit)"
    else:
        address = "Exact address available on site visit"

    return {
        "contact": "+91-98765-43210",
        "broker_name": "Estra Verified Partner",
        "developer_name": developer,
        "address": address,
    }


def _safe_get(raw: Any, key: str, default: Any = None) -> Any:
    if isinstance(raw, dict):
        return raw.get(key, default)
    return default


def _parse_ai_response(text: str) -> dict[str, Any]:
    """Parse Gemini JSON response, handling common formatting issues."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    if text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        log.warning("Gemini returned non-JSON deep-dive: %r", text[:200])
        return {}


def _build_fallback_response(property_id: str, prop_for_prompt: dict, area_data: dict) -> DeepDiveResponse:
    """Build a fallback response when AI generation fails or is unavailable."""
    price = prop_for_prompt.get("price_inr", "N/A")
    psf = prop_for_prompt.get("price_per_sqft", "N/A")
    title = prop_for_prompt.get("title", "N/A")
    bedrooms = prop_for_prompt.get("bedrooms", "N/A")
    area_name = area_data.get("area_name", "N/A")
    area_psf = area_data.get("latest_psf", "N/A")
    rera = prop_for_prompt.get("rera_number", "NOT VERIFIED")

    rera_status = f"RERA: {rera}" if rera and rera != "NOT VERIFIED" else "RERA: NOT VERIFIED"

    return DeepDiveResponse(
        property_id=property_id,
        property=prop_for_prompt,
        area_context=area_data,
        verdict="NEUTRAL",
        narrative=f"AI analysis temporarily unavailable for {title}. Below are the raw property and area metrics for your review.",
        sections=DeepDiveSections(
            property_overview=f"{bedrooms} BHK in {title}, {area_name}. Price: ₹{price} (₹{psf}/sqft).",
            area_investment_context=f"{area_name} area PSF: ₹{area_psf}. Trends and scores available in area_context below.",
            value_analysis="Please compare property PSF to area PSF manually.",
            risk_compliance=rera_status,
            developer_project_quality="Verify developer credentials on MahaRERA.",
            amenities_lifestyle="Amenities not analyzed.",
            final_recommendation="AI generation failed — review data below and make an independent assessment.",
        ),
        action_items=[
            "Review property and area data below",
            "Verify RERA status on MahaRERA",
            "Visit site before making a decision",
        ],
        key_highlights=["AI analysis unavailable"],
        investment_thesis="Unable to generate thesis — AI service temporarily down.",
    )


def _call_vertex_sync(user_prompt: str) -> dict[str, Any]:
    """Run a single deep-dive generation through the shared Vertex client."""
    text = llm.generate_content(
        system_instruction=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.3,
    )
    if not text:
        return {}
    return _parse_ai_response(text)


async def generate(property_id: str) -> DeepDiveResponse:
    """Generate a deep-dive investment report for a single property.

    Checks cache first, falls back to Gemini generation.
    """
    log.info("deepdive requested for %s", property_id)

    # 1. Cache check
    cached = get_cached(property_id)
    if cached:
        log.info("deepdive cache hit for %s", property_id)
        return DeepDiveResponse.model_validate(cached)

    # 2. Fetch property
    prop = get_property(property_id)
    if not prop:
        log.warning("property not found for deepdive: %s", property_id)
        return DeepDiveResponse(
            property_id=property_id,
            narrative="Property not found in cache.",
            action_items=["Try a different property"],
        )

    # 3. Parse raw JSON
    raw = prop.get("raw", "{}")
    try:
        raw_data = json.loads(raw) if isinstance(raw, str) else raw
    except Exception:
        raw_data = {}

    # 4. Merge prop + raw + mock fields into a single dict for prompt builder
    prop_for_prompt = dict(prop)
    prop_for_prompt.update(_generate_mock_data(prop))
    for key in ["description", "floor_level", "rera_number", "amenities", "facing", "project_age", "url"]:
        if key not in prop_for_prompt or prop_for_prompt[key] is None:
            prop_for_prompt[key] = _safe_get(raw_data, key)

    # 5. Fetch area intelligence
    area = find_area_for_property(prop.get("locality_text"), prop.get("city"))
    area_data = {}
    if area:
        area_data = {
            "area_name": area.area_name,
            "city": area.city,
            "trend_1yr_pct": area.trend_1yr_pct,
            "trend_3yr_pct": area.trend_3yr_pct,
            "trend_5yr_pct": area.trend_5yr_pct,
            "latest_psf": area.latest_psf,
            "rental_yield_pct": area.rental_yield_pct,
            "downside_risk_score": area.downside_risk_score,
            "uplift_potential_score": area.uplift_potential_score,
            "infra_impact_score": area.infra_impact_score,
            "liquidity_demand_score": area.liquidity_demand_score,
            "historical_trend_score": area.historical_trend_score,
            "legal_safety_score": area.legal_safety_score,
            "market_momentum_score": area.market_momentum_score,
            "news_relevance_score": area.news_relevance_score,
            "volatility_index": area.volatility_index,
        }

    # 6. Graph-shaped relationship intelligence (cache-derived peers, dev context)
    try:
        graph_data = graph_lookup.run(property_id)
    except Exception:
        log.exception("graph_lookup failed for %s", property_id)
        graph_data = {}

    # 7. Build prompt
    user_prompt = build_user_prompt(prop_for_prompt, area_data, graph_data)

    # 8. Call Vertex (offloaded to thread pool to not block event loop)
    ai_result: dict[str, Any] = {}

    if llm.is_available():
        try:
            ai_result = await asyncio.to_thread(_call_vertex_sync, user_prompt)
        except Exception:
            log.exception("Vertex deep-dive generation failed for %s", property_id)

    # 9. Build response (AI success or fallback)
    if not ai_result:
        log.warning("deepdive fallback for %s (AI unavailable)", property_id)
        result = _build_fallback_response(property_id, prop_for_prompt, area_data)
        result.graph_context = graph_data
        set_cached(property_id, result.model_dump(mode="json"))
        return result

    sections_data = ai_result.get("sections", {})
    if isinstance(sections_data, str):
        try:
            sections_data = json.loads(sections_data)
        except Exception:
            sections_data = {}

    result = DeepDiveResponse(
        property_id=property_id,
        property=prop_for_prompt,
        area_context=area_data,
        graph_context=graph_data,
        verdict=ai_result.get("verdict", "NEUTRAL"),
        narrative=ai_result.get("narrative", "Deep-dive analysis unavailable. Review property and area data below."),
        sections=DeepDiveSections(
            property_overview=sections_data.get("property_overview", ""),
            area_investment_context=sections_data.get("area_investment_context", ""),
            value_analysis=sections_data.get("value_analysis", ""),
            risk_compliance=sections_data.get("risk_compliance", ""),
            developer_project_quality=sections_data.get("developer_project_quality", ""),
            amenities_lifestyle=sections_data.get("amenities_lifestyle", ""),
            final_recommendation=sections_data.get("final_recommendation", ""),
        ),
        action_items=ai_result.get("action_items", ["Verify all details on site visit", "Check latest MahaRERA status"]),
        key_highlights=ai_result.get("key_highlights", []),
        investment_thesis=ai_result.get("investment_thesis", ""),
    )

    # 10. Cache result
    set_cached(property_id, result.model_dump(mode="json"))
    log.info("deepdive cached for %s", property_id)

    return result
