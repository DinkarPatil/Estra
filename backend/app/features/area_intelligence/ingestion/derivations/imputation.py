"""K-nearest-neighbor weighted imputation for per-area numeric values.

Used when an area's direct data is missing (e.g. a micro-market without
enough property listings to compute a reliable median). Falls back
cascading: direct value → k-nearest weighted mean → city baseline.

Pure functions, no I/O. Coordinates come from target_areas.json.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

from app.features.area_intelligence.ingestion.derivations.geo_signals import (
    haversine_km,
)

ImputationSource = Literal["direct", "knn_weighted", "city_baseline", "missing"]


@dataclass(frozen=True)
class ImputedValue:
    value: float | None
    source: ImputationSource
    neighbors_used: list[str]  # empty unless source == "knn_weighted"


def knn_weighted_mean(
    values: dict[str, float],
    target_area: str,
    coords: dict[str, tuple[float, float]],
    *,
    k: int = 5,
    city_baseline: float | None = None,
) -> ImputedValue:
    """Return the value for target_area using a direct→KNN→baseline cascade.

    values: {area_name: known_value} for areas that already have data.
    coords: {area_name: (lat, lon)} for every area in the cohort.
    city_baseline: optional city-wide fallback if no neighbors have data.
    """
    direct = values.get(target_area)
    if direct is not None:
        return ImputedValue(value=direct, source="direct", neighbors_used=[])

    target_coords = coords.get(target_area)
    if target_coords is None:
        return _city_fallback(city_baseline)

    # Rank every *other* area with a known value by distance to target.
    ranked: list[tuple[float, str, float]] = []
    for name, val in values.items():
        if name == target_area:
            continue
        c = coords.get(name)
        if c is None:
            continue
        d_km = haversine_km(target_coords[0], target_coords[1], c[0], c[1])
        ranked.append((d_km, name, val))
    ranked.sort(key=lambda r: r[0])

    if not ranked:
        return _city_fallback(city_baseline)

    top = ranked[:k]
    # Inverse-distance weighting with +0.1 km floor so co-located areas
    # don't produce divide-by-zero and distant ones still contribute.
    total_weight = 0.0
    weighted_sum = 0.0
    neighbors: list[str] = []
    for d, name, val in top:
        w = 1.0 / (d + 0.1)
        total_weight += w
        weighted_sum += w * val
        neighbors.append(name)

    return ImputedValue(
        value=weighted_sum / total_weight,
        source="knn_weighted",
        neighbors_used=neighbors,
    )


def _city_fallback(baseline: float | None) -> ImputedValue:
    if baseline is None:
        return ImputedValue(value=None, source="missing", neighbors_used=[])
    return ImputedValue(value=baseline, source="city_baseline", neighbors_used=[])
