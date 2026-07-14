"""
Prompt construction for the Gemini comparison/recommendation call.

Key constraints (from spec):
  - structured prompt
  - include user intent + top properties + key metrics
  - ask for: comparison, ranking explanation, recommendation, risks
  - DO NOT hallucinate missing data — explicitly tell Gemini to use only what is given
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from .comparator import Intent, RankedProperty


SYSTEM_INSTRUCTION = (
    "You are a senior real-estate analyst helping an Indian residential buyer "
    "compare 2-5 specific listings. Use ONLY the data provided in the user prompt. "
    "Do not invent prices, areas, builders, addresses, or market trends. "
    "When the data does not support a claim, say so plainly. "
    "Keep language concise, factual, and useful — no marketing fluff. "
    "All currency is INR. Always respond with a single JSON object that matches "
    "the requested schema exactly."
)


def _format_property_for_prompt(rp: RankedProperty, rank: int) -> Dict[str, Any]:
    """Compact, AI-friendly view of a ranked property."""
    p = rp.property
    return {
        "rank": rank,
        "id": p.get("id"),
        "title": p.get("title"),
        "city": p.get("city"),
        "locality": p.get("locality_text"),
        "bedrooms": p.get("bedrooms"),
        "bathrooms": p.get("bathrooms"),
        "area_sqft": p.get("area_sqft"),
        "price_inr": p.get("price_inr"),
        "price_per_sqft": p.get("price_per_sqft"),
        "project_name": p.get("project_name"),
        "builder_name": p.get("builder_name"),
        "deterministic_score_out_of_10": round(rp.score * 10, 2),
        "score_breakdown": {k: round(v * 10, 2) for k, v in rp.breakdown.__dict__.items()},
        "deterministic_reason": rp.reason,
    }


_RESPONSE_SCHEMA_DESCRIPTION = """{
  "ranked_properties": [
    {
      "id": "<property id from the input>",
      "title": "<property title>",
      "score": <number 0-10 — keep within 0.5 of the deterministic score>,
      "reason": "<one sentence — why this rank>",
      "pros": ["<short bullet>", "<short bullet>"],
      "cons": ["<short bullet>", "<short bullet>"]
    }
  ],
  "comparison_summary": "<2-3 sentences contrasting the properties on what matters most for this user>",
  "final_recommendation": "<which property to pick and why, max 3 sentences>",
  "tradeoffs": ["<one tradeoff>", "<another tradeoff>"],
  "risks": ["<risk specific to the chosen property or the data gaps>"]
}"""


def build_prompt(intent: Intent, ranked: List[RankedProperty]) -> str:
    """Construct the user-prompt body for Gemini.

    Includes the parsed intent, a normalized property table, and the JSON schema
    Gemini must return.
    """
    properties_block = [_format_property_for_prompt(rp, i + 1) for i, rp in enumerate(ranked)]

    intent_block = {
        "raw_query": intent.raw_query,
        "city": intent.city,
        "bhk": intent.bhk,
        "budget_inr": intent.budget_inr,
        "target_area_sqft": intent.target_area_sqft,
        "wants_high_roi": intent.wants_high_roi,
        "wants_low_risk": intent.wants_low_risk,
        "wants_high_risk": intent.wants_high_risk,
    }

    return (
        "## USER INTENT\n"
        f"```json\n{json.dumps(intent_block, indent=2, ensure_ascii=False)}\n```\n\n"
        "## CANDIDATE PROPERTIES (already ranked by a deterministic scorer; you may agree or disagree by ≤0.5)\n"
        f"```json\n{json.dumps(properties_block, indent=2, ensure_ascii=False)}\n```\n\n"
        "## SCORE DIMENSIONS\n"
        "- budget: how well the price fits the user's budget\n"
        "- value_for_money: price-per-sqft vs the peer set\n"
        "- size: area vs target / BHK norm (~450 sqft/BHK)\n"
        "- location: locality desirability\n"
        "- roi: inferred upside from price-per-sqft + locality (NOT a forecast)\n"
        "- risk: lower risk = higher score; uses builder reputation + locality stability\n\n"
        "## TASK\n"
        "Compare the candidates against the user intent. For each: 2 short pros + 2 short cons "
        "(only from the data above). Then write a 2-3 sentence comparison summary, a 1-3 sentence "
        "final recommendation, 2-3 concrete tradeoffs, and 1-3 risks (including any data gaps you noticed).\n\n"
        "## OUTPUT — JSON ONLY, MATCHING THIS SHAPE EXACTLY\n"
        f"```json\n{_RESPONSE_SCHEMA_DESCRIPTION}\n```\n"
        "Return ONLY the JSON. No prose before or after."
    )
