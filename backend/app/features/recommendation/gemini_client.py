"""
Thin client for Google's free Gemini API (developer key, not Vertex).

Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
Auth:     ?key=<GEMINI_API_KEY> from app.core.config

Returns the parsed JSON object from the model's response text, or None on
any failure. Callers must always have a deterministic fallback (see
service.py) so the API never breaks the frontend even when:
  - GEMINI_API_KEY is not set
  - the network call fails
  - Gemini returns text that doesn't parse as JSON

## Resilience

Free-tier Gemini frequently returns 503 UNAVAILABLE during demand spikes.
generate_json() handles this with two layers:

  1. Retry with exponential-backoff jitter on 429 / 503 / 500 (transient).
  2. Model fallback chain — when the primary model is overloaded after
     retries, fail over to other free-tier flash models that share the
     same free quota but typically have spare capacity:
         gemini-2.5-flash  →  gemini-2.0-flash  →  gemini-1.5-flash
                                                →  gemini-1.5-flash-8b
"""

from __future__ import annotations

import json
import random
import re
import time
from typing import Any, Dict, Iterable, Optional

import requests

from app.core import llm as core_llm
from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("recommendation.gemini")

_GEMINI_URL_TEMPLATE = (
    "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
)

# Free-tier flash chain. We try the primary model first, then fail over to
# alternates that share the same free quota but normally have spare capacity.
_DEFAULT_MODEL = "gemini-2.5-flash"
_MODEL_FALLBACK_CHAIN = (
    "gemini-2.5-flash",
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
)

_TIMEOUT_SECONDS = 25.0
_MAX_RETRIES_PER_MODEL = 2  # initial + 2 retries → 3 attempts before failover
_INITIAL_BACKOFF_S = 0.8

_FENCE_RE = re.compile(r"^```(?:json)?\s*|\s*```\s*$", re.MULTILINE)
_TRANSIENT_STATUS = {429, 500, 502, 503, 504}

# Last failure summary — read by the service layer so the frontend can show
# *why* it went offline (key missing vs. capacity exhausted) instead of a
# generic offline badge.
last_failure_reason: Optional[str] = None


def is_available() -> bool:
    """True iff some Gemini path is reachable — free-tier API key or Vertex."""
    return bool(settings.GEMINI_API_KEY) or core_llm.is_available()


def _strip_code_fence(text: str) -> str:
    """Strip leading/trailing ```json fences if Gemini ignored responseMimeType."""
    return _FENCE_RE.sub("", text).strip()


def _safe_json_loads(text: str) -> Optional[Dict[str, Any]]:
    if not text:
        return None
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass
    cleaned = _strip_code_fence(text)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        m = re.search(r"\{.*\}", cleaned, re.DOTALL)
        if m:
            try:
                return json.loads(m.group(0))
            except json.JSONDecodeError:
                return None
    return None


def _try_one_model(
    *,
    model: str,
    api_key: str,
    payload: Dict[str, Any],
) -> tuple[Optional[Dict[str, Any]], Optional[int]]:
    """Try a single model with retries on transient failures.

    Returns (parsed_json, status_code). status_code is the *last* HTTP code
    seen (None on network exception). The orchestrator uses status_code to
    decide whether to fail over to the next model.
    """
    url = _GEMINI_URL_TEMPLATE.format(model=model)
    last_status: Optional[int] = None
    backoff = _INITIAL_BACKOFF_S

    for attempt in range(_MAX_RETRIES_PER_MODEL + 1):
        try:
            resp = requests.post(
                url,
                params={"key": api_key},
                json=payload,
                timeout=_TIMEOUT_SECONDS,
                headers={"Content-Type": "application/json"},
            )
        except requests.RequestException as e:
            log.warning("Gemini[%s] network error (attempt %d): %s", model, attempt + 1, e)
            last_status = None
            if attempt < _MAX_RETRIES_PER_MODEL:
                time.sleep(backoff + random.uniform(0, 0.4))
                backoff *= 2
                continue
            break

        last_status = resp.status_code
        if resp.status_code == 200:
            try:
                data = resp.json()
            except ValueError:
                log.warning("Gemini[%s] returned non-JSON envelope", model)
                return None, last_status

            candidates = data.get("candidates") or []
            if not candidates:
                log.warning("Gemini[%s] no candidates: %s", model, str(data)[:200])
                return None, last_status

            parts = (candidates[0].get("content") or {}).get("parts") or []
            text = "".join(p.get("text", "") for p in parts if isinstance(p, dict))
            parsed = _safe_json_loads(text)
            if parsed is None:
                log.warning("Gemini[%s] response unparseable: %s", model, text[:200])
            return parsed, last_status

        if resp.status_code in _TRANSIENT_STATUS:
            log.warning(
                "Gemini[%s] HTTP %s (attempt %d/%d) — backing off %.1fs",
                model, resp.status_code, attempt + 1, _MAX_RETRIES_PER_MODEL + 1, backoff,
            )
            if attempt < _MAX_RETRIES_PER_MODEL:
                time.sleep(backoff + random.uniform(0, 0.4))
                backoff *= 2
                continue
            break

        # Non-transient error (4xx other than 429) — fail fast, no retry.
        log.warning("Gemini[%s] HTTP %s (non-retryable): %s",
                    model, resp.status_code, resp.text[:200])
        return None, last_status

    return None, last_status


def generate_json(
    *,
    system_instruction: str,
    user_prompt: str,
    model: Optional[str] = None,
    temperature: float = 0.3,
    fallback_chain: Optional[Iterable[str]] = None,
) -> Optional[Dict[str, Any]]:
    """Call Gemini and return the parsed JSON dict, or None on any failure.

    Tries the primary model first, with retries on transient errors. Then
    fails over to alternate free-tier flash models when the primary is
    overloaded — covers the 503 UNAVAILABLE case during demand spikes.
    """
    global last_failure_reason
    api_key = settings.GEMINI_API_KEY
    if not api_key:
        # No free-tier key — try the Vertex client (service-account auth)
        # if it's been configured.
        if core_llm.is_available():
            text = core_llm.generate_content(
                system_instruction=system_instruction,
                user_prompt=user_prompt,
                model=model,
                temperature=temperature,
            )
            parsed = _safe_json_loads(text or "")
            if parsed is None:
                last_failure_reason = "Vertex returned empty/unparseable response"
                return None
            last_failure_reason = None
            return parsed
        log.info("Neither GEMINI_API_KEY nor Vertex configured — skipping Gemini call")
        last_failure_reason = "no Gemini provider configured"
        return None

    primary = model or _DEFAULT_MODEL
    chain = list(fallback_chain) if fallback_chain is not None else list(_MODEL_FALLBACK_CHAIN)
    if primary in chain:
        chain.remove(primary)
    chain.insert(0, primary)

    payload: Dict[str, Any] = {
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "contents": [{"role": "user", "parts": [{"text": user_prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "responseMimeType": "application/json",
        },
    }

    last_status: Optional[int] = None
    for m_name in chain:
        result, last_status = _try_one_model(model=m_name, api_key=api_key, payload=payload)
        if result is not None:
            if m_name != primary:
                log.info("Gemini failover succeeded on model=%s (primary=%s)", m_name, primary)
            last_failure_reason = None
            return result
        # Only fail over for transient capacity issues.
        if last_status not in _TRANSIENT_STATUS and last_status is not None:
            log.warning("Gemini terminal error %s on %s — not failing over", last_status, m_name)
            last_failure_reason = f"HTTP {last_status} on {m_name}"
            break

    if last_status in _TRANSIENT_STATUS:
        last_failure_reason = (
            f"All Gemini free-tier models overloaded (last HTTP {last_status}) — "
            "try again in a minute"
        )
    elif last_status is None:
        last_failure_reason = "Network error reaching Gemini"
    log.warning("Gemini exhausted all models in chain (last_status=%s)", last_status)
    return None
