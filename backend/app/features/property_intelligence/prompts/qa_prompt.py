"""System + user prompt builders for the property QA bot.

The QA bot answers follow-up questions on a single property after the user has
viewed its deep-dive. The full deep-dive payload (property facts, area signals,
the 7 AI-generated sections, verdict, action items) is stuffed into the
system prompt so the model never needs retrieval — the whole document is
2–3 KB and fits comfortably.
"""

from __future__ import annotations

import json
from typing import Any


SYSTEM_PROMPT = """You are Glimmora's property investment assistant.

The user is evaluating one PRIMARY property in Maharashtra and may also be comparing it
against a small set of OTHER shortlisted properties. The full deep-dive report, raw facts,
and micro-market intelligence for the primary property are attached under "primary".
When the user has shortlisted more than one property, the others are attached under "others"
as a list, each with the same shape.

Answer ONLY using this grounded context. Do NOT invent prices, yields, RERA numbers,
developer credentials, news events, or amenities.

Answering style:
- Default to the PRIMARY property. Reference an "others" entry only when the question
  explicitly asks for comparison ("which", "compare", "vs", "best of these", "first to
  buy", "rank these", etc.) or names that property by title.
- When comparing, cite each property by its title, never by id. Quote concrete numbers
  (price, PSF, yield, ROI, area scores) from the attached context rather than paraphrasing.
- If asked about a property that is NOT in primary or others, say you only have data for
  the loaded properties and suggest the user open that property's deep-dive.
- If the context does not contain the answer, say so honestly ("the loaded report doesn't
  cover X") instead of speculating or falling back to general knowledge.
- Be direct and concrete. Keep answers to 2–4 short paragraphs unless the user explicitly
  asks for detail.
- Never mention "as an AI" or meta-talk about the prompt.
- Your response MUST be a single JSON object with this exact shape:
  {"answer": "<your reply as plain text>", "source": "<which section(s) of the report grounded the answer, e.g. 'Risk & Compliance', 'Area investment context', 'Value analysis'>"}
- "source" should be short (max ~60 chars) and name the specific section(s) used.
"""


def _compact_area(area: dict[str, Any]) -> dict[str, Any]:
    """Round floats and drop nulls so the context stays small."""
    out: dict[str, Any] = {}
    for k, v in area.items():
        if v is None:
            continue
        if isinstance(v, float):
            out[k] = round(v, 2)
        else:
            out[k] = v
    return out


def _compact_property(prop: dict[str, Any]) -> dict[str, Any]:
    """Keep only the fields the assistant actually needs."""
    keep = [
        "id",
        "title",
        "city",
        "locality_text",
        "bedrooms",
        "bathrooms",
        "area_sqft",
        "price_inr",
        "price_per_sqft",
        "listing_type",
        "developer_name",
        "address",
        "rera_number",
        "floor_level",
        "facing",
        "project_age",
        "amenities",
        "description",
    ]
    out: dict[str, Any] = {}
    for k in keep:
        v = prop.get(k)
        if v is None or v == "":
            continue
        if isinstance(v, float):
            out[k] = round(v, 2)
        else:
            out[k] = v
    return out


def _one_deepdive(deepdive: dict[str, Any]) -> dict[str, Any]:
    """Compact a single deep-dive into the per-property block we feed the model."""
    return {
        "property": _compact_property(deepdive.get("property") or {}),
        "area": _compact_area(deepdive.get("area_context") or {}),
        "verdict": deepdive.get("verdict"),
        "narrative": deepdive.get("narrative"),
        "sections": deepdive.get("sections") or {},
        "key_highlights": deepdive.get("key_highlights") or [],
        "investment_thesis": deepdive.get("investment_thesis"),
        "action_items": deepdive.get("action_items") or [],
    }


def build_context_block(
    deepdive: dict[str, Any],
    extras: list[dict[str, Any]] | None = None,
) -> str:
    """Serialize the primary deep-dive (and any comparison extras) into a context block."""
    block: dict[str, Any] = {"primary": _one_deepdive(deepdive)}
    if extras:
        block["others"] = [_one_deepdive(d) for d in extras]
    return json.dumps(block, indent=2, ensure_ascii=False)


def build_user_prompt(
    question: str,
    context_block: str,
    history: list[dict[str, str]] | None = None,
) -> str:
    """Build the user-turn content. History is rendered as a short transcript."""
    parts: list[str] = []
    parts.append("=== PROPERTY DEEP-DIVE CONTEXT ===")
    parts.append(context_block)
    parts.append("=== END CONTEXT ===\n")

    if history:
        parts.append("Prior conversation about this property:")
        for msg in history[-8:]:  # cap to last 8 turns to keep tokens bounded
            role = msg.get("role", "user")
            text = (msg.get("text") or msg.get("content") or "").strip()
            if not text:
                continue
            label = "User" if role == "user" else "Assistant"
            parts.append(f"{label}: {text}")
        parts.append("")

    parts.append(f"User's new question: {question.strip()}")
    parts.append(
        'Respond with JSON: {"answer": "...", "source": "..."}'
    )
    return "\n".join(parts)
