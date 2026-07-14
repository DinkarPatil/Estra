"""Cache-derived relationship intelligence for a property.

Builds graph-shaped facts (area peers, same-developer peers, similar
listings, PSF position vs the locality median) from the in-memory
property cache. Designed as the precursor to a real graph DB: the
``run(property_id)`` contract stays stable, only the internals change
when (and if) we move to Neo4j.
"""

from __future__ import annotations

from statistics import median
from typing import Any

from app.core.logging import get_pipeline_logger
from app.features.property_intelligence.cache import _all, get_property

log = get_pipeline_logger("property.graph")


_PEER_LIMIT = 5
_SIMILAR_PRICE_BAND = 0.20  # ±20% of subject price
_NEAR_THRESHOLD_PCT = 10.0  # ±10% PSF = "near area median"


def _locality_key(prop: dict[str, Any]) -> str:
    """First comma-segment of locality_text, lower-cased. Mirrors cache._match."""
    loc = prop.get("locality_text") or ""
    return loc.split(",")[0].strip().lower()


def _developer_key(title: str | None) -> str | None:
    """Developer fingerprint = first whitespace-separated token of the title.

    Mirrors deepdive_service._generate_mock_data so a property's "displayed"
    developer and its graph fingerprint stay aligned. "Manav La Moda" → "manav".
    """
    if not title:
        return None
    parts = title.split()
    if not parts:
        return None
    return parts[0].strip().lower() or None


def _peer_summary(p: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": p.get("id"),
        "title": p.get("title"),
        "locality_text": p.get("locality_text"),
        "city": p.get("city"),
        "bedrooms": p.get("bedrooms"),
        "area_sqft": p.get("area_sqft"),
        "price_inr": p.get("price_inr"),
        "price_per_sqft": p.get("price_per_sqft"),
    }


def run(property_id: str) -> dict[str, Any]:
    """Return relationship intelligence for ``property_id``.

    Returns ``{}`` if the property is not in the cache. Otherwise:

      {
        "subject":             {peer-summary of the subject},
        "area_peers":          [up to 5 same-locality peers, by PSF closeness],
        "same_developer_peers":[up to 5 same-first-token peers],
        "similar_listings":    [up to 5 same-BHK ±20% price peers],
        "price_position":      {subject_psf, area_median_psf, delta_pct, label,
                                peer_count},
        "developer_context":   {name, known_project_count, locality_count},
        "relationship_notes":  [short bullets summarising the above],
      }
    """
    log.info("graph lookup %s", property_id)
    subject = get_property(property_id)
    if not subject:
        return {}

    everyone = _all()
    others = [p for p in everyone if p.get("id") != property_id]

    subject_locality = _locality_key(subject)
    subject_psf = subject.get("price_per_sqft")
    subject_price = subject.get("price_inr")
    subject_beds = subject.get("bedrooms")
    subject_dev = _developer_key(subject.get("title"))

    # ------------------------------------------------------------------
    # Area peers (same first locality segment), sorted by PSF closeness.
    # ------------------------------------------------------------------
    area_peers_raw: list[dict[str, Any]] = []
    if subject_locality:
        area_peers_raw = [p for p in others if _locality_key(p) == subject_locality]
    area_psf_values = [
        p["price_per_sqft"]
        for p in area_peers_raw
        if isinstance(p.get("price_per_sqft"), (int, float))
    ]
    if subject_psf:
        area_peers_raw.sort(
            key=lambda p: abs((p.get("price_per_sqft") or 0) - subject_psf)
        )
    area_peers = [_peer_summary(p) for p in area_peers_raw[:_PEER_LIMIT]]

    # ------------------------------------------------------------------
    # Same-developer peers (matched on first-token of title).
    # ------------------------------------------------------------------
    same_dev_peers_raw: list[dict[str, Any]] = []
    if subject_dev:
        same_dev_peers_raw = [
            p for p in others if _developer_key(p.get("title")) == subject_dev
        ]
    same_developer_peers = [_peer_summary(p) for p in same_dev_peers_raw[:_PEER_LIMIT]]

    # ------------------------------------------------------------------
    # Similar listings: same BHK + ±20% price, ranked by absolute price diff.
    # ------------------------------------------------------------------
    similar_raw: list[dict[str, Any]] = []
    if subject_beds is not None and subject_price:
        lo = subject_price * (1 - _SIMILAR_PRICE_BAND)
        hi = subject_price * (1 + _SIMILAR_PRICE_BAND)
        similar_raw = [
            p
            for p in others
            if p.get("bedrooms") == subject_beds
            and isinstance(p.get("price_inr"), (int, float))
            and lo <= p["price_inr"] <= hi
        ]
        similar_raw.sort(key=lambda p: abs((p.get("price_inr") or 0) - subject_price))
    similar_listings = [_peer_summary(p) for p in similar_raw[:_PEER_LIMIT]]

    # ------------------------------------------------------------------
    # Price position vs area-peer median PSF.
    # ------------------------------------------------------------------
    price_position: dict[str, Any] = {
        "subject_psf": subject_psf,
        "area_median_psf": None,
        "delta_pct": None,
        "label": "unknown",
        "peer_count": len(area_psf_values),
    }
    if subject_psf and area_psf_values:
        med = median(area_psf_values)
        delta = round(((subject_psf - med) / med) * 100, 2)
        if delta <= -_NEAR_THRESHOLD_PCT:
            label = "below_area_median"
        elif delta >= _NEAR_THRESHOLD_PCT:
            label = "above_area_median"
        else:
            label = "near_area_median"
        price_position.update(
            {
                "area_median_psf": round(med, 2),
                "delta_pct": delta,
                "label": label,
            }
        )

    # ------------------------------------------------------------------
    # Developer context.
    # ------------------------------------------------------------------
    developer_context: dict[str, Any] = {}
    if subject_dev:
        same_dev_all = [p for p in everyone if _developer_key(p.get("title")) == subject_dev]
        localities = {_locality_key(p) for p in same_dev_all if _locality_key(p)}
        developer_context = {
            "name": (subject.get("title") or "").split()[0],
            "known_project_count": len(same_dev_all),
            "locality_count": len(localities),
        }

    # ------------------------------------------------------------------
    # Relationship notes — short, prompt-friendly bullets.
    # ------------------------------------------------------------------
    notes: list[str] = []
    label = price_position["label"]
    if label == "below_area_median":
        notes.append(
            f"Priced {abs(price_position['delta_pct'])}% below the median PSF of "
            f"{price_position['peer_count']} comparable listings in the same locality."
        )
    elif label == "above_area_median":
        notes.append(
            f"Priced {price_position['delta_pct']}% above the median PSF of "
            f"{price_position['peer_count']} comparable listings in the same locality."
        )
    elif label == "near_area_median":
        notes.append(
            f"Priced within ±{_NEAR_THRESHOLD_PCT:.0f}% of the median PSF of "
            f"{price_position['peer_count']} comparable listings in the same locality."
        )

    if developer_context.get("known_project_count", 0) > 1:
        loc_n = developer_context["locality_count"]
        notes.append(
            f"Developer '{developer_context['name']}' appears in "
            f"{developer_context['known_project_count']} cached listings across "
            f"{loc_n} locality {'cluster' if loc_n == 1 else 'clusters'}."
        )

    if similar_listings:
        notes.append(
            f"{len(similar_listings)} same-BHK listing(s) within ±20% of this price found across the cache."
        )

    if not area_peers:
        notes.append("No same-locality peer listings in cache — comparison is locality-thin.")

    return {
        "subject": _peer_summary(subject),
        "area_peers": area_peers,
        "same_developer_peers": same_developer_peers,
        "similar_listings": similar_listings,
        "price_position": price_position,
        "developer_context": developer_context,
        "relationship_notes": notes,
    }
