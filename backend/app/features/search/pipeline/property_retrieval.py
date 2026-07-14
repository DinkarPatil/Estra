"""Property candidate retrieval pipeline stage (cache-backed).

Queries the in-memory property cache instead of the DB. Used by the
area-first flow after the user has selected 3–4 areas.
"""

from typing import Any

from app.features.area_intelligence.cache import find_area_for_property
from app.features.property_intelligence.cache import get_property, list_properties as cache_list_properties
from app.features.search.schemas import SearchCandidate, SearchIntent


def _build_reasons(
    item,
    intent: SearchIntent,
    area,
) -> list[str]:
    """Generate human-readable reasons why this property matches the user.

    Covers the lead's required points:
    - why it ranked high
    - risk & compliance notes
    - ROI summary
    - simple decision cues
    """
    reasons = []
    raw = intent.raw_entities or {}

    # ---- Why it ranked high ----
    price = item.price_inr
    area_psf = area.latest_psf if area else None
    prop_psf = item.price_per_sqft

    if price is not None:
        if intent.budget_max is not None and price <= intent.budget_max:
            reasons.append(f"Within budget (₹{price:,.0f})")
        elif intent.budget_max is not None and price > intent.budget_max:
            reasons.append(f"Slightly over budget (₹{price:,.0f})")
        else:
            reasons.append(f"Priced at ₹{price:,.0f}")

    # Value check: if property PSF is below area PSF, it's a deal
    if prop_psf is not None and area_psf is not None and area_psf > 0:
        discount = ((area_psf - prop_psf) / area_psf) * 100
        if discount > 5:
            reasons.append(f"Priced {discount:.0f}% below area PSF (deal)")
        elif discount < -10:
            reasons.append(f"Premium pricing ({abs(discount):.0f}% above area PSF)")

    bhk = raw.get("bhk")
    if bhk is not None and item.bedrooms == bhk:
        reasons.append(f"{int(bhk)} BHK matches your requirement")
    elif item.bedrooms is not None:
        reasons.append(f"{int(item.bedrooms)} BHK configuration")

    if intent.property_type and item.title:
        pt = intent.property_type.lower()
        if pt in item.title.lower():
            reasons.append(f"{intent.property_type.title()} matches your search")

    # Area signals (why it ranked high)
    if area:
        if area.trend_3yr_pct is not None:
            reasons.append(f"Area grew {area.trend_3yr_pct:.1f}% in 3 years")
        # Real rental yields in India run 2-4%; >4% is notable, >5% is high.
        if area.rental_yield_pct and area.rental_yield_pct > 4:
            reasons.append(f"High rental yield corridor ({area.rental_yield_pct:.1f}%)")
        if area.uplift_potential_score and area.uplift_potential_score > 70:
            reasons.append("Strong appreciation potential")
        if area.demand_strength.value == "High":
            reasons.append("High rental demand locality")

    # ---- ROI summary ----
    if area:
        roi_parts = []
        if area.trend_1yr_pct is not None:
            roi_parts.append(f"1yr: {area.trend_1yr_pct:.1f}%")
        if area.trend_3yr_pct is not None:
            roi_parts.append(f"3yr: {area.trend_3yr_pct:.1f}%")
        if area.rental_yield_pct is not None:
            roi_parts.append(f"yield: {area.rental_yield_pct:.1f}%")
        if roi_parts:
            reasons.append(f"ROI summary — {' | '.join(roi_parts)}")

    # ---- Risk & compliance notes ----
    # Get full raw property data for RERA and description
    full_prop = get_property(item.id) or {}
    raw_data = {}
    try:
        import json
        raw_str = full_prop.get("raw") if isinstance(full_prop, dict) else getattr(full_prop, "raw", None)
        raw_data = json.loads(raw_str) if raw_str else {}
    except Exception:
        pass

    rera = raw_data.get("rera_number")
    if rera:
        reasons.append(f"RERA registered ({rera})")
    else:
        reasons.append("RERA status: unverified — verify before booking")

    # Project age / readiness
    desc = raw_data.get("description", "")
    if "ready to move" in desc.lower():
        reasons.append("Ready to move — immediate possession")
    elif "under construction" in desc.lower():
        reasons.append("Under construction — check delivery timeline")
    elif "new launch" in desc.lower():
        reasons.append("New launch — early bird pricing possible")

    # Risk signals from area
    if area:
        if area.downside_risk_score is not None and area.downside_risk_score > 50:
            reasons.append(f"Elevated risk score ({area.downside_risk_score:.0f}/100) — proceed with caution")
        elif area.downside_risk_score is not None and area.downside_risk_score < 25:
            reasons.append(f"Low risk profile ({area.downside_risk_score:.0f}/100)")

    # ---- Decision cues ----
    if area and area.rental_yield_pct and area.rental_yield_pct > 5:
        reasons.append("CUE: Strong rental play")
    if area and area.trend_3yr_pct and area.trend_3yr_pct > 30:
        reasons.append("CUE: High appreciation bet")
    if prop_psf and area_psf and prop_psf < area_psf * 0.9:
        reasons.append("CUE: Value buy — below market rate")

    if not reasons:
        reasons.append("Matches your selected area")

    return reasons


def run(
    intent: SearchIntent,
    overrides: dict[str, Any] | None,
    area_names: list[str],
) -> list[SearchCandidate]:
    """Retrieve properties matching intent + selected areas."""
    # When the user has shortlisted areas, those names already nail the
    # geography (matched against locality_text). Layering ``city=intent.location``
    # on top is harmful: ``intent.location`` is often a locality string
    # ("Hinjewadi") that won't match any property's ``city`` field ("Pune"),
    # collapsing the result set to zero.
    filters: dict[str, Any] = {
        "min_price": intent.budget_min,
        "max_price": intent.budget_max,
        "property_type": intent.property_type,
        "area_names": area_names,
    }
    if not area_names:
        filters["city"] = intent.location

    raw = intent.raw_entities or {}
    if "bhk" in raw:
        filters["min_bedrooms"] = raw["bhk"]
        filters["max_bedrooms"] = raw["bhk"]
    if "listing_type" in raw:
        filters["listing_type"] = raw["listing_type"]
    elif raw.get("investment_intent") == "rental":
        filters["listing_type"] = "rent"
    elif raw.get("investment_intent") == "resale":
        filters["listing_type"] = "sale"

    if overrides:
        filters.update(overrides)

    filters = {k: v for k, v in filters.items() if v is not None}

    resp = cache_list_properties(**filters, limit=100)

    candidates = []
    for item in resp.items:
        area = find_area_for_property(item.locality_text, item.city)
        reasons = _build_reasons(item, intent, area)

        candidates.append(
            SearchCandidate(
                property_id=item.id,
                score=1.0,
                reasons=reasons,
                property=item,
            )
        )

    return candidates
