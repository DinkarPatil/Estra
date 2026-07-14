"""QA bot service for property deep-dive follow-up questions.

Flow:
1. Ensure the deep-dive for this property is available (generate on miss, cache hit otherwise).
2. Serialize the full deep-dive into a JSON context block.
3. Call Gemini with the question + prior conversation history.
4. Return a grounded answer + which section(s) backed it.
"""

from __future__ import annotations

import asyncio
import json
from typing import Any

from app.core import llm
from app.core.logging import get_pipeline_logger
from app.features.property_intelligence import deepdive_service
from app.features.property_intelligence.prompts.qa_prompt import (
    SYSTEM_PROMPT,
    build_context_block,
    build_user_prompt,
)
from app.features.property_intelligence.schemas import (
    DeepDiveResponse,
    QAMessage,
    QAResponse,
)

log = get_pipeline_logger("property_intelligence.qa")


def _parse_response(text: str) -> dict[str, Any]:
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
        log.warning("Gemini QA returned non-JSON: %r", text[:200])
        return {"answer": text, "source": ""}


def _call_vertex_sync(user_prompt: str) -> dict[str, Any]:
    """Run a single QA generation through the shared Vertex client."""
    text = llm.generate_content(
        system_instruction=SYSTEM_PROMPT,
        user_prompt=user_prompt,
        temperature=0.4,
    )
    if not text:
        return {}
    return _parse_response(text)


def _fallback_answer(question: str, deepdive: DeepDiveResponse) -> tuple[str, str]:
    """Keyword-driven fallback that mirrors the frontend's client-side parser.

    Used when Gemini is unavailable so the endpoint never 500s during the demo.
    """
    q = question.lower()
    s = deepdive.sections

    if "area" in q and any(w in q for w in ("why", "selected", "pick")):
        return s.area_investment_context, "Area investment context"
    if any(w in q for w in ("risk", "safe", "danger", "compliance", "rera")):
        return s.risk_compliance, "Risk & compliance"
    if "rank" in q or ("why" in q and ("property" in q or "this" in q)):
        hl = " · ".join(deepdive.key_highlights) if deepdive.key_highlights else ""
        text = s.property_overview + (f"\n\nKey highlights: {hl}" if hl else "")
        return text, "Property overview"
    if any(w in q for w in ("recent", "change", "news")):
        return deepdive.narrative, "Executive summary"
    if any(w in q for w in ("value", "price", "worth", "psf")):
        return s.value_analysis, "Value analysis"
    if any(w in q for w in ("developer", "builder", "project")):
        return s.developer_project_quality, "Developer & project"
    if any(w in q for w in ("amenit", "lifestyle")):
        return s.amenities_lifestyle, "Amenities & lifestyle"
    if any(w in q for w in ("recommend", "should i", "buy", "final")):
        return s.final_recommendation, "Final recommendation"
    return deepdive.investment_thesis or deepdive.narrative, "Investment thesis"


_MAX_EXTRA_PROPERTIES = 4  # cap fan-out so prompt stays in budget and cold-cache latency stays sane


async def answer(
    property_id: str,
    question: str,
    history: list[QAMessage] | None = None,
    additional_property_ids: list[str] | None = None,
) -> QAResponse:
    """Answer a user question about a property, optionally with comparison context.

    ``additional_property_ids`` lets the caller include other shortlisted
    properties so the bot can answer cross-property comparison questions
    ("which has the best ROI?"). Each extra deep-dive is loaded in parallel
    and tolerant of failures — a missing extra is silently dropped rather
    than failing the whole request.
    """
    extras_in = [pid for pid in (additional_property_ids or []) if pid and pid != property_id]
    extras_in = extras_in[:_MAX_EXTRA_PROPERTIES]
    log.info(
        "qa requested for primary=%s extras=%s: %r",
        property_id, extras_in, question[:80],
    )

    deepdive = await deepdive_service.generate(property_id)
    if not deepdive.property:
        answer_text = "I couldn't find this property in the catalogue. Try reopening it from the search results."
        log.info(
            "qa answered [mode=not-found] for %s: question=%r answer=%r",
            property_id,
            question[:80],
            answer_text[:200],
        )
        return QAResponse(
            property_id=property_id,
            question=question,
            answer=answer_text,
            source="",
        )

    extras: list = []
    if extras_in:
        results = await asyncio.gather(
            *(deepdive_service.generate(pid) for pid in extras_in),
            return_exceptions=True,
        )
        for pid, r in zip(extras_in, results):
            if isinstance(r, Exception):
                log.warning("extra deepdive failed for %s: %s", pid, r)
                continue
            if r.property:
                extras.append(r)

    context_block = build_context_block(
        deepdive.model_dump(mode="json"),
        extras=[d.model_dump(mode="json") for d in extras],
    )
    history_dicts = [m.model_dump() for m in (history or [])]
    user_prompt = build_user_prompt(question, context_block, history_dicts)

    ai_result: dict[str, Any] = {}
    if llm.is_available():
        try:
            ai_result = await asyncio.to_thread(_call_vertex_sync, user_prompt)
        except Exception:
            log.exception("QA generation failed for %s", property_id)

    if ai_result and ai_result.get("answer"):
        answer_text = str(ai_result.get("answer", "")).strip()
        source_text = str(ai_result.get("source", "")).strip()
        log.info(
            "qa answered [mode=ai] for %s: question=%r source=%r answer=%r",
            property_id,
            question[:80],
            source_text,
            answer_text[:200],
        )
        return QAResponse(
            property_id=property_id,
            question=question,
            answer=answer_text,
            source=source_text,
        )

    # Fallback path — AI unavailable or returned empty
    text, src = _fallback_answer(question, deepdive)
    answer_text = text or "The loaded report doesn't cover that. Try a different question."
    source_text = f"{src} (offline)"
    log.info(
        "qa answered [mode=fallback] for %s: question=%r source=%r answer=%r",
        property_id,
        question[:80],
        source_text,
        answer_text[:200],
    )
    return QAResponse(
        property_id=property_id,
        question=question,
        answer=answer_text,
        source=source_text,
    )
