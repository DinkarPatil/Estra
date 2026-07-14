"""Shared GCP Vertex AI client + Gemini call helper.

Single entry point for every Gemini call across the backend. Builds one
``google-genai`` client lazily, authenticates via a base64-encoded
service-account JSON pulled from ``GCP_SERVICE_ACCOUNT_JSON_B64``, and
exposes a thin ``generate_content()`` wrapper that returns plain text.

Callers stay tiny — see ``qa_service.py`` etc. — and gracefully fall
back when Vertex isn't configured (helper returns ``None``).
"""

from __future__ import annotations

import base64
import json
import threading
import time
from typing import Any

from app.core.config import settings
from app.core.logging import get_logger

log = get_logger("app.core.llm")

_client: Any | None = None
_client_lock = threading.Lock()
_client_init_attempted = False


def _decode_credentials() -> tuple[Any | None, str | None]:
    """Decode the base64 service-account JSON into google.oauth2 Credentials.

    Returns ``(creds, project_id)``. Both are ``None`` if the env var is
    missing or the payload is malformed. ``project_id`` is read out of the
    decoded JSON so callers can use it as a fallback when ``GCP_PROJECT_ID``
    isn't set explicitly.
    """
    if not settings.GCP_SERVICE_ACCOUNT_JSON_B64:
        return None, None
    try:
        from google.oauth2 import service_account

        raw = base64.b64decode(settings.GCP_SERVICE_ACCOUNT_JSON_B64)
        info = json.loads(raw)
        creds = service_account.Credentials.from_service_account_info(
            info,
            scopes=["https://www.googleapis.com/auth/cloud-platform"],
        )
        return creds, info.get("project_id")
    except Exception:
        log.exception("failed to decode GCP service account credentials")
        return None, None


def get_client() -> Any | None:
    """Lazily build and cache a Vertex AI ``google-genai`` Client.

    Returns ``None`` (without raising) when Vertex isn't configured, so
    callers can use a deterministic fallback path during local dev / CI.
    """
    global _client, _client_init_attempted
    if _client is not None:
        return _client
    with _client_lock:
        if _client is not None:
            return _client
        if _client_init_attempted:
            return None  # don't keep retrying after a known failure
        _client_init_attempted = True

        creds, derived_project = _decode_credentials()
        if creds is None:
            log.warning("GCP service account credentials missing or invalid")
            return None

        project = settings.GCP_PROJECT_ID or derived_project
        if not project:
            log.warning(
                "GCP_PROJECT_ID not set and project_id missing from service-account JSON; "
                "Vertex AI client unavailable"
            )
            return None

        try:
            from google import genai  # type: ignore

            _client = genai.Client(
                vertexai=True,
                project=project,
                location=settings.GCP_LOCATION,
                credentials=creds,
            )
            log.info(
                "Vertex AI client initialised (project=%s location=%s model=%s)",
                project,
                settings.GCP_LOCATION,
                settings.GEMINI_MODEL,
            )
            return _client
        except Exception:
            log.exception("failed to construct Vertex AI client")
            return None


def is_available() -> bool:
    """True iff a Vertex AI client could be constructed."""
    return get_client() is not None


def _is_retryable(exc: BaseException) -> bool:
    """Heuristic: only retry on transient throttling / unavailability."""
    msg = repr(exc).lower()
    return "429" in msg or "503" in msg or "rate" in msg or "unavailable" in msg


def generate_content(
    *,
    system_instruction: str,
    user_prompt: str,
    model: str | None = None,
    temperature: float = 0.3,
    response_mime_type: str = "application/json",
) -> str | None:
    """Run a single Gemini generation through Vertex AI.

    Returns the response text, or ``None`` on failure (caller decides what
    to do — usually fall back to a deterministic template).

    Retries only on 429 / 503 per ``LLM_MAX_RETRIES``; other failures fail
    fast so the calling endpoint stays snappy.
    """
    client = get_client()
    if client is None:
        return None

    try:
        from google.genai import types  # type: ignore
    except Exception:
        log.exception("google.genai.types import failed")
        return None

    config = types.GenerateContentConfig(
        system_instruction=system_instruction,
        response_mime_type=response_mime_type,
        temperature=temperature,
    )

    model_name = model or settings.GEMINI_MODEL
    attempts = max(1, settings.LLM_MAX_RETRIES + 1)
    backoff = settings.LLM_INITIAL_BACKOFF

    last_exc: BaseException | None = None
    for attempt in range(1, attempts + 1):
        try:
            response = client.models.generate_content(
                model=model_name,
                contents=user_prompt,
                config=config,
            )
            text = getattr(response, "text", None)
            if text:
                return text
            log.warning("Vertex returned empty response (model=%s)", model_name)
            return None
        except Exception as exc:
            last_exc = exc
            if attempt < attempts and _is_retryable(exc):
                log.warning(
                    "Vertex generate_content transient error (attempt %d/%d, model=%s): %s",
                    attempt,
                    attempts,
                    model_name,
                    exc,
                )
                time.sleep(backoff)
                backoff *= 2
                continue
            break

    if last_exc is not None:
        log.warning("Vertex generate_content failed (model=%s): %s", model_name, last_exc)
    return None
