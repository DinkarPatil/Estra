"""Minimal ntfy.sh push-notification helper.

Reads the target topic from the NTFY_TOPIC env var (server hostname defaults
to ntfy.sh, override via NTFY_HOST). If NTFY_TOPIC is unset the helpers
become no-ops so local runs stay quiet.

Usage:
    from app.core.notify import notify_start, notify_success, notify_failure

    tag = "magicbricks-details"
    notify_start(tag, "24,300 URLs queued")
    try:
        run_scrape()
    except Exception as exc:
        notify_failure(tag, exc)
        raise
    else:
        notify_success(tag, "23,811 ok / 489 failed")
"""

from __future__ import annotations

import os
import socket
import traceback
from typing import Any

import httpx

from app.core.logging import get_logger

log = get_logger("core.notify")


def _topic() -> str | None:
    t = os.getenv("NTFY_TOPIC", "").strip()
    return t or None


def _host() -> str:
    return os.getenv("NTFY_HOST", "ntfy.sh").strip() or "ntfy.sh"


def _send(title: str, body: str, *, priority: str = "default", tag: str | None = None) -> None:
    """Fire-and-forget POST to ntfy. Never raises — logging failure is enough."""
    topic = _topic()
    if not topic:
        return
    url = f"https://{_host()}/{topic}"
    headers = {
        "Title": title,
        "Priority": priority,
    }
    if tag:
        headers["Tags"] = tag
    try:
        httpx.post(url, content=body.encode("utf-8"), headers=headers, timeout=10.0)
    except Exception as exc:  # noqa: BLE001 — notifications must never break the worker
        log.warning("ntfy post failed: %s", exc)


def notify_start(tag: str, note: str = "") -> None:
    host = socket.gethostname()
    body = f"host: {host}\n{note}".strip()
    _send(f"[start] {tag}", body, tag="arrow_forward")


def notify_success(tag: str, note: str = "") -> None:
    host = socket.gethostname()
    body = f"host: {host}\n{note}".strip()
    _send(f"[done] {tag}", body, tag="white_check_mark")


def notify_failure(tag: str, exc: BaseException | None = None, note: str = "") -> None:
    host = socket.gethostname()
    lines = [f"host: {host}"]
    if note:
        lines.append(note)
    if exc is not None:
        tb = "".join(traceback.format_exception(type(exc), exc, exc.__traceback__))
        lines.append(tb[-1500:])  # tail only, ntfy truncates anyway
    _send(f"[FAILED] {tag}", "\n".join(lines), priority="high", tag="rotating_light")


def notify_progress(tag: str, note: str) -> None:
    """Low-priority heartbeat — use sparingly."""
    _send(f"[progress] {tag}", note, priority="low", tag="hourglass_flowing_sand")
