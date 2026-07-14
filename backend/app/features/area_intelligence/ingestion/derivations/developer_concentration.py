"""Compute `developer_concentration` from PropertyListing names.

The Kaggle datasets don't expose a clean 'developer' field. What they do
have is society / project / title strings that correlate with the
developer but aren't one-to-one. This derivation surfaces the top-N most
frequently-listed project names per area as a building-density proxy,
explicitly labelled as such in the output JSON.

True developer reputation scoring needs a separate dataset (MahaRERA
project registry with promoter mapping, or delivery-history data) —
out of scope for MVP.
"""

from __future__ import annotations

import json
from collections import Counter
from typing import Any

from app.features.area_intelligence.ingestion.derivations.price_metrics import (
    _match_area,
)
from app.features.property_intelligence.pipeline.kaggle_loader import (
    SOURCE_7_CITIES,
    SOURCE_PUNE_HOUSE,
    SOURCE_PUNE_RENTALS,
)

MIN_NAMED_LISTINGS = 5  # below this we don't report — too sparse to infer
TOP_N = 5

# 99acres rows use monthly-tagged sources like "99acres_2026_04".
SOURCE_99ACRES_PREFIX = "99acres_"


def _clean(s: str | None) -> str | None:
    if not s:
        return None
    s = s.strip()
    return s if s and s not in {"?", "", "-"} else None


def _extract_project_name(raw_json: str | None, source: str) -> str | None:
    """Best-effort project/society name from the per-dataset raw row."""
    if not raw_json:
        return None
    try:
        raw = json.loads(raw_json)
    except (ValueError, TypeError):
        return None

    if source == SOURCE_PUNE_HOUSE:
        return _clean(raw.get("society"))

    if source == SOURCE_PUNE_RENTALS:
        address = raw.get("address") or ""
        parts = [p.strip() for p in address.split(",") if p.strip()]
        # Address pattern: "Society Name, Locality, Pune, Maharashtra"
        return _clean(parts[0]) if parts else None

    if source == SOURCE_7_CITIES:
        # Name tends to be cleaner than Property Title for project extraction.
        name = raw.get("Name") or raw.get("Property Title") or ""
        # Drop trailing location tail ("Casagrand ECR 14, Chennai" → "Casagrand ECR 14")
        head = name.split(",", 1)[0]
        return _clean(head)

    if source.startswith(SOURCE_99ACRES_PREFIX):
        # 99acres raw payload stores the project name directly under "name".
        return _clean(raw.get("name"))

    return None


def compute(listings: list, area_name: str) -> dict[str, Any] | None:
    """Return the developer_concentration JSON payload, or None if too sparse."""
    matched = [l for l in listings if _match_area(l.locality_text, area_name)]
    if not matched:
        return None

    names: list[str] = []
    for l in matched:
        name = _extract_project_name(l.raw, l.source)
        if name:
            names.append(name)

    if len(names) < MIN_NAMED_LISTINGS:
        return None

    counter = Counter(names)
    total = len(names)
    top = counter.most_common(TOP_N)

    return {
        "top_projects": [
            {
                "name": name,
                "listing_count": count,
                "share_pct": round(count / total * 100, 1),
            }
            for name, count in top
        ],
        "total_named_listings": total,
        "unique_projects": len(counter),
        "source": "kaggle_listings_society_title",
        "methodology_note": (
            "Frequency of society/project names in scraped listings. "
            "Proxy for supply-side project density — NOT developer "
            "reputation. Replace when MahaRERA full project registry "
            "(promoter→project mapping) is ingested."
        ),
    }
