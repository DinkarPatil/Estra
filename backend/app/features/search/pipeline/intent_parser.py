"""Natural-language → SearchIntent via Google Gemini.

Stage 1 of the search pipeline. Converts a free-text user query
("2 BHK in Mumbai under 1 crore") into a structured SearchIntent that
downstream stages (filters → candidate_retrieval) consume.
"""

from __future__ import annotations

import json
import re
from typing import Any

from pydantic import ValidationError

from app.core import llm
from app.core.logging import get_pipeline_logger
from app.features.area_intelligence import cache as area_cache
from app.features.search.schemas import SearchIntent

log = get_pipeline_logger("search.intent")

_SYSTEM_PROMPT = """You extract structured real-estate search intent from natural-language queries.

Return ONLY a single JSON object. No prose, no markdown fences, no explanation.

Schema (all fields required; use null when unknown):
{
  "location": string | null,          // Indian city or locality, e.g. "Mumbai", "Pune", "Bandra West"
  "budget_min": number | null,        // INR, absolute rupees (not lakhs/crores)
  "budget_max": number | null,        // INR, absolute rupees
  "property_type": string | null,     // "2 BHK", "villa", "apartment", "plot", "flat", etc.
  "raw_entities": object              // any other signals (see below); {} if none
}

Currency normalization (MANDATORY):
  "1 lakh"   = 100000
  "50 lakh"  = 5000000
  "1 crore"  = 10000000
  "1 cr"     = 10000000
  "2 cr"     = 20000000
  "2.5 cr"   = 25000000

Range handling:
  "under 1 crore"              → budget_min=null, budget_max=10000000
  "above 50 lakh"              → budget_min=5000000, budget_max=null
  "2 to 3 cr"                  → budget_min=20000000, budget_max=30000000
  "between 50 lakh and 1 cr"   → budget_min=5000000, budget_max=10000000

raw_entities MAY include (only when mentioned):
  - "roi_target": "high" | "medium" | "low" | number  (numeric ROI percent if given)
  - "timeframe_years": number
  - "risk_tolerance": "low" | "medium" | "high"
  - "investment_intent": "rental" | "resale" | "self_use" | "investment"
  - "bhk": number
  - "near": string   (e.g. "IT hubs", "metro")
  - any other relevant signal not covered by the top-level fields

If the query is gibberish, empty, or unrelated to real estate, return:
  {"location": null, "budget_min": null, "budget_max": null, "property_type": null, "raw_entities": {"clarification_needed": true}}

Output JSON only."""


_FALLBACK_INTENT = SearchIntent(
    location=None,
    budget_min=None,
    budget_max=None,
    property_type=None,
    raw_entities={"clarification_needed": True},
)


def _fallback() -> SearchIntent:
    return _FALLBACK_INTENT.model_copy(deep=True)


def _coerce_intent(payload: dict[str, Any]) -> SearchIntent:
    """Validate LLM payload against SearchIntent. Unknown top-level keys are folded into raw_entities."""
    allowed = {"location", "budget_min", "budget_max", "property_type", "raw_entities"}
    raw_entities = dict(payload.get("raw_entities") or {})
    for key, value in payload.items():
        if key not in allowed and value is not None:
            raw_entities.setdefault(key, value)

    return SearchIntent(
        location=payload.get("location"),
        budget_min=payload.get("budget_min"),
        budget_max=payload.get("budget_max"),
        property_type=payload.get("property_type"),
        raw_entities=raw_entities,
    )


_BHK_RE = re.compile(r"\b(\d{1,2})\s*[- ]?\s*bhk\b", re.IGNORECASE)


def _patch_bhk_from_query(intent: SearchIntent, query: str) -> SearchIntent:
    """If raw_entities lacks `bhk`, scan the query for a `<N> BHK` token.

    Gemini inconsistently populates `raw_entities.bhk` — it often drops the
    count into `property_type` as free text ("2 BHK") or normalizes the type
    to "apartment" and discards the bedroom signal entirely. Without a
    structured count, `property_retrieval` can't apply min/max_bedrooms,
    and the result mixes 2/3/4 BHK rows.
    """
    raw = dict(intent.raw_entities or {})
    if raw.get("bhk") is not None:
        return intent
    m = _BHK_RE.search(query)
    if not m:
        return intent
    bhk = int(m.group(1))
    if not 1 <= bhk <= 10:
        return intent
    raw["bhk"] = bhk
    log.info("bhk heuristic patched: %r → %d", query, bhk)
    return intent.model_copy(update={"raw_entities": raw})


def _patch_location_from_query(intent: SearchIntent, query: str) -> SearchIntent:
    """If the LLM didn't extract a location, scan the query for a known city.

    Defensive: short queries ("2bhk in pune") sometimes slip through with
    location=None, which collapses the ranker to the global pool and lets
    higher-PSF cities dominate the result.
    """
    if intent.location:
        return intent
    city = area_cache.find_city_in_text(query)
    if city:
        log.info("location heuristic patched: %r → %r", query, city)
        return intent.model_copy(update={"location": city})
    return intent


def run(query: str) -> SearchIntent:
    """Parse a natural-language query into a structured SearchIntent.

    On any failure (missing API key, LLM error, malformed JSON, validation error)
    returns a fallback intent with raw_entities={"clarification_needed": True}.
    """
    log.info("parsing intent", extra={"query_len": len(query)})

    if not query or not query.strip():
        return _fallback()

    if not llm.is_available():
        return _patch_bhk_from_query(_patch_location_from_query(_fallback(), query), query)

    text = llm.generate_content(
        system_instruction=_SYSTEM_PROMPT,
        user_prompt=query,
        temperature=0.0,
    )
    if not text:
        log.warning("Vertex returned empty intent response")
        return _patch_bhk_from_query(_patch_location_from_query(_fallback(), query), query)

    try:
        payload = json.loads(text)
    except json.JSONDecodeError:
        log.warning("Vertex returned non-JSON intent payload: %r", text[:200])
        return _patch_bhk_from_query(_patch_location_from_query(_fallback(), query), query)

    if not isinstance(payload, dict):
        log.warning("Gemini payload was not a JSON object: %r", type(payload).__name__)
        return _patch_bhk_from_query(_patch_location_from_query(_fallback(), query), query)

    try:
        intent = _coerce_intent(payload)
    except ValidationError:
        log.exception("Gemini payload failed SearchIntent validation: %r", payload)
        return _patch_bhk_from_query(_patch_location_from_query(_fallback(), query), query)

    return _patch_bhk_from_query(_patch_location_from_query(intent, query), query)
