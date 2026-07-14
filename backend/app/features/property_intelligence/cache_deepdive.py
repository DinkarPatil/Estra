"""In-memory cache for AI-generated property deep-dive reports.

Loaded once at startup from ``data/cache/deepdives.json``.
New deepdives are appended and persisted back to disk.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

_CACHE_PATH = Path(__file__).resolve().parents[3] / "data" / "cache" / "deepdives.json"

_deepdives: dict[str, dict[str, Any]] | None = None


def load() -> None:
    """Read deepdives.json into memory. Call once from app lifespan."""
    global _deepdives
    if _deepdives is not None:
        return
    if not _CACHE_PATH.exists():
        _CACHE_PATH.write_text("{}", encoding="utf-8")
    _deepdives = json.loads(_CACHE_PATH.read_text(encoding="utf-8"))


def _all() -> dict[str, dict[str, Any]]:
    if _deepdives is None:
        load()
    return _deepdives


def get(property_id: str) -> dict[str, Any] | None:
    """Fetch a cached deep-dive report by property ID."""
    return _all().get(property_id)


def set(property_id: str, report: dict[str, Any]) -> None:
    """Store a deep-dive report and persist to disk."""
    _all()[property_id] = report
    _CACHE_PATH.write_text(json.dumps(_deepdives, indent=2, ensure_ascii=False), encoding="utf-8")


def _reset_for_test(data: dict[str, dict[str, Any]] | None = None) -> None:
    """Override in-memory cache for unit tests."""
    global _deepdives
    _deepdives = data
