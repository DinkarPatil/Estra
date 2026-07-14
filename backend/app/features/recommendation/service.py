"""
Orchestrates the comparison + recommendation flow.

Flow:
  1. Resolve property pool (inline → ids → on-disk listings.json fallback)
  2. Parse intent (regex, no LLM)
  3. Rank deterministically via comparator
  4. Send top-N to Gemini with a structured prompt
  5. Merge Gemini's narrative with the deterministic ranking; on failure, fall
     back to a templated narrative so the API is never broken.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

from app.core.logging import get_logger

from .comparator import (
    Intent,
    RankedProperty,
    compare_properties,
    parse_intent,
)
from . import gemini_client
from .gemini_client import generate_json, is_available as gemini_available
from .prompt_builder import SYSTEM_INSTRUCTION, build_prompt

log = get_logger("recommendation.service")

# data/listings.json lives at the repo root (one level above backend/).
_BACKEND_DIR = Path(__file__).resolve().parents[3]
_LISTINGS_PATH = _BACKEND_DIR.parent / "data" / "listings.json"


# ─── property pool resolution ─────────────────────────────────────────


def _load_listings_from_disk() -> List[Dict[str, Any]]:
    if not _LISTINGS_PATH.exists():
        log.warning("listings.json not found at %s", _LISTINGS_PATH)
        return []
    try:
        with _LISTINGS_PATH.open("r", encoding="utf-8") as f:
            data = json.load(f)
        return data if isinstance(data, list) else []
    except (OSError, json.JSONDecodeError) as e:
        log.warning("listings.json unreadable: %s", e)
        return []


def _resolve_pool(
    inline: Optional[List[Dict[str, Any]]],
    ids: Optional[List[str]],
) -> List[Dict[str, Any]]:
    if inline:
        return [p for p in inline if isinstance(p, dict)]

    on_disk = _load_listings_from_disk()
    if ids:
        wanted = {i for i in ids if i}
        return [p for p in on_disk if p.get("id") in wanted]
    return on_disk


# ─── deterministic narrative fallback ─────────────────────────────────


def _offline_narrative(intent: Intent, top: List[RankedProperty]) -> Dict[str, Any]:
    """Templated narrative used when Gemini is unavailable or fails.

    Fully deterministic, drawn from the score breakdown — never invents data.
    """
    ranked_out = []
    for rp in top:
        p = rp.property
        b = rp.breakdown
        pros: List[str] = []
        cons: List[str] = []
        if b.budget >= 0.7:
            pros.append("Fits the user's budget comfortably.")
        elif b.budget < 0.4:
            cons.append("Priced above the user's stated budget.")
        if b.value_for_money >= 0.7:
            pros.append("Cheaper price-per-sqft than peers.")
        elif b.value_for_money < 0.4:
            cons.append("More expensive per sqft than peers.")
        if b.location >= 0.75:
            pros.append(f"Locality {p.get('locality_text')} is highly desirable.")
        if b.risk >= 0.7:
            pros.append(f"Reputed builder ({p.get('builder_name') or 'known'}) lowers risk.")
        elif b.risk < 0.45:
            cons.append("Limited builder/locality data — higher risk profile.")
        if b.size < 0.5 and intent.bhk:
            cons.append(f"Carpet area is small for a {intent.bhk}BHK.")
        if not pros:
            pros = [rp.reason]
        if not cons:
            cons = ["No major drawback identified from the available data."]
        ranked_out.append({
            "id": p.get("id"),
            "title": p.get("title"),
            "score": round(rp.score * 10, 2),
            "reason": rp.reason,
            "pros": pros[:3],
            "cons": cons[:3],
        })

    winner = top[0]
    summary_parts = []
    if len(top) >= 2:
        a, b = top[0], top[1]
        summary_parts.append(
            f"{a.property.get('title')} edges out {b.property.get('title')} on "
            f"{'value-for-money' if a.breakdown.value_for_money > b.breakdown.value_for_money else 'locality fit'}."
        )
    summary_parts.append(
        f"Top score {round(top[0].score * 10, 2)}/10 vs bottom {round(top[-1].score * 10, 2)}/10 in this set."
    )

    final_reco = (
        f"{winner.property.get('title')} is the strongest match for the query "
        f"based on {winner.reason.lower()}"
    )

    tradeoffs: List[str] = []
    if len(top) >= 2:
        a, b = top[0], top[1]
        if a.property.get("price_inr") and b.property.get("price_inr"):
            cheaper, pricier = sorted(
                (a, b), key=lambda r: r.property.get("price_inr") or 0
            )
            tradeoffs.append(
                f"{cheaper.property.get('title')} is cheaper but "
                f"{pricier.property.get('title')} scores higher on locality."
            )
        if a.property.get("area_sqft") and b.property.get("area_sqft"):
            bigger, smaller = sorted(
                (a, b), key=lambda r: -(r.property.get("area_sqft") or 0)
            )
            tradeoffs.append(
                f"{bigger.property.get('title')} is bigger ({bigger.property.get('area_sqft')} sqft) "
                f"vs {smaller.property.get('title')} ({smaller.property.get('area_sqft')} sqft)."
            )
    if not tradeoffs:
        tradeoffs = ["Trade-offs are limited — the candidates score similarly."]

    risks = ["AI narrative offline: ranking is deterministic; verify with a site visit before deciding."]
    return {
        "ranked_properties": ranked_out,
        "comparison_summary": " ".join(summary_parts),
        "final_recommendation": final_reco,
        "tradeoffs": tradeoffs,
        "risks": risks,
    }


# ─── merge AI narrative onto deterministic ranking ────────────────────


def _merge_ai_with_ranking(
    ai_payload: Dict[str, Any],
    ranked: List[RankedProperty],
) -> Dict[str, Any]:
    """Take Gemini's payload but use the deterministic ranking order/scores.

    We only trust Gemini for narrative (reason / pros / cons / summary /
    recommendation / tradeoffs / risks) — not for the ranking itself.
    """
    by_id: Dict[str, Dict[str, Any]] = {}
    for entry in (ai_payload.get("ranked_properties") or []):
        if isinstance(entry, dict) and entry.get("id"):
            by_id[entry["id"]] = entry

    merged_ranked: List[Dict[str, Any]] = []
    for rp in ranked:
        pid = rp.property.get("id")
        ai_entry = by_id.get(pid, {}) if pid else {}
        merged_ranked.append({
            "id": pid,
            "title": rp.property.get("title"),
            "score": round(rp.score * 10, 2),
            "reason": ai_entry.get("reason") or rp.reason,
            "pros": [str(x) for x in (ai_entry.get("pros") or []) if x][:3],
            "cons": [str(x) for x in (ai_entry.get("cons") or []) if x][:3],
        })

    def _str_list(key: str, default: Iterable[str] = ()) -> List[str]:
        v = ai_payload.get(key)
        if isinstance(v, list):
            return [str(x) for x in v if x][:5]
        return list(default)

    return {
        "ranked_properties": merged_ranked,
        "comparison_summary": str(ai_payload.get("comparison_summary") or "").strip()
            or "Ranking based on deterministic scores.",
        "final_recommendation": str(ai_payload.get("final_recommendation") or "").strip()
            or f"Recommend {ranked[0].property.get('title')}.",
        "tradeoffs": _str_list("tradeoffs", ["No major trade-offs identified."]),
        "risks": _str_list("risks"),
    }


# ─── public entry point ──────────────────────────────────────────────


def get_recommendations(
    user_query: str,
    properties: Optional[List[Dict[str, Any]]] = None,
    property_ids: Optional[List[str]] = None,
    top_n: int = 5,
) -> Dict[str, Any]:
    """Main service function. Returns the full response payload as a dict."""
    pool = _resolve_pool(properties, property_ids)
    if not pool:
        return {
            "intent": parse_intent(user_query).to_dict(),
            "ranked_properties": [],
            "comparison_summary": "No properties available to compare.",
            "final_recommendation": "Add at least 2 listings before requesting a recommendation.",
            "tradeoffs": [],
            "risks": ["Empty property pool."],
            "source": "offline",
        }

    intent = parse_intent(user_query)
    ranked_full = compare_properties(pool, intent)

    # When the user explicitly picked properties (Compare page), respect that
    # subset entirely — don't drop any. Otherwise truncate to top_n.
    if properties is not None or property_ids:
        ranked_top = ranked_full
    else:
        ranked_top = ranked_full[: max(2, top_n)]

    # Try Gemini narrative.
    ai_payload: Optional[Dict[str, Any]] = None
    if gemini_available():
        prompt = build_prompt(intent, ranked_top)
        ai_payload = generate_json(
            system_instruction=SYSTEM_INSTRUCTION,
            user_prompt=prompt,
        )

    source_detail: Optional[str] = None
    if ai_payload is not None:
        narrative = _merge_ai_with_ranking(ai_payload, ranked_top)
        source = "gemini"
    else:
        narrative = _offline_narrative(intent, ranked_top)
        source = "offline"
        # Surface why the AI fell through so the frontend badge is informative.
        source_detail = (
            gemini_client.last_failure_reason
            or ("GEMINI_API_KEY not set" if not gemini_available() else "AI call failed")
        )

    # Attach the full property objects + per-dimension breakdowns to the
    # final payload so the frontend can show details without an extra fetch.
    enriched_ranked: List[Dict[str, Any]] = []
    for entry, rp in zip(narrative["ranked_properties"], ranked_top):
        enriched_ranked.append({
            **entry,
            "breakdown": {k: round(v * 10, 2) for k, v in rp.breakdown.__dict__.items()},
            "property": rp.property,
        })

    return {
        "intent": intent.to_dict(),
        "ranked_properties": enriched_ranked,
        "source_detail": source_detail,
        "comparison_summary": narrative["comparison_summary"],
        "final_recommendation": narrative["final_recommendation"],
        "tradeoffs": narrative["tradeoffs"],
        "risks": narrative.get("risks", []),
        "source": source,
    }
