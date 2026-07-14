"""Loader for the target-areas seed list."""

from __future__ import annotations

import json
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

_SEED_PATH = Path(__file__).with_name("target_areas.json")


@dataclass(frozen=True)
class TargetArea:
    name: str
    city: str
    state: str
    lat: float | None = None
    lon: float | None = None
    # District defaults to city — overrideable per-area when they differ
    # (e.g. Navi Mumbai micro-markets are in Thane/Raigad districts).
    district: str | None = None

    @property
    def district_for_lookup(self) -> str:
        return self.district or self.city


@lru_cache(maxsize=1)
def load_target_areas() -> list[TargetArea]:
    payload = json.loads(_SEED_PATH.read_text(encoding="utf-8"))
    return [TargetArea(**row) for row in payload["areas"]]
