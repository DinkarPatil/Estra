"""Property candidate retrieval pipeline stage (DB-backed).

Queries the ``broker_listings`` table — the canonical source for
properties listed by brokers. Replaces the old JSON-cache + scrape paths.
Used by the area-first flow after the user has selected 3–4 areas.
"""

from __future__ import annotations

import re
from typing import Any

from sqlalchemy import or_
from sqlalchemy.orm import Session, selectinload

from app.features.area_intelligence.cache import find_area_for_property
from app.features.broker.models import BrokerListing
from app.features.property_intelligence.schemas import PropertySummary
from app.features.search.schemas import SearchCandidate, SearchIntent


_BHK_RE = re.compile(r"(\d+)\s*bhk", re.IGNORECASE)


def _row_to_summary(row: BrokerListing) -> PropertySummary:
    locality_text = row.locality
    if row.address and row.address != row.locality:
        locality_text = f"{row.locality}, {row.address}" if row.locality else row.address

    psf = None
    if row.area_sqft and row.area_sqft > 0 and row.price_inr:
        psf = round(float(row.price_inr) / float(row.area_sqft), 2)

    return PropertySummary(
        id=row.id,
        source="broker",
        listing_type=row.listing_type,
        title=row.title,
        city=row.city,
        state=None,
        locality_text=locality_text,
        bedrooms=row.bedrooms,
        bathrooms=row.bathrooms,
        area_sqft=row.area_sqft,
        price_inr=row.price_inr,
        price_per_sqft=psf,
    )


def _build_reasons(row: BrokerListing, intent: SearchIntent, area) -> list[str]:
    reasons: list[str] = []
    raw = intent.raw_entities or {}

    price = row.price_inr
    if price is not None:
        if intent.budget_max is not None and price <= intent.budget_max:
            reasons.append(f"Within budget (₹{price:,.0f})")
        elif intent.budget_max is not None and price > intent.budget_max:
            reasons.append(f"Slightly over budget (₹{price:,.0f})")
        else:
            reasons.append(f"Priced at ₹{price:,.0f}")

    bhk = raw.get("bhk")
    if bhk is not None and row.bedrooms == bhk:
        reasons.append(f"{int(bhk)} BHK matches your requirement")
    elif row.bedrooms is not None:
        reasons.append(f"{int(row.bedrooms)} BHK configuration")

    if intent.property_type and row.property_type:
        if intent.property_type.lower() in row.property_type.lower():
            reasons.append(f"{row.property_type.title()} matches your search")

    if area:
        if area.trend_3yr_pct is not None:
            reasons.append(f"Area grew {area.trend_3yr_pct:.1f}% in 3 years")
        if area.rental_yield_pct and area.rental_yield_pct > 4:
            reasons.append(f"High rental yield corridor ({area.rental_yield_pct:.1f}%)")
        if area.uplift_potential_score and area.uplift_potential_score > 70:
            reasons.append("Strong appreciation potential")

    if not reasons:
        reasons.append("Matches your selected area")
    return reasons


def _apply_area_filter(query, area_names: list[str]):
    """Build a forgiving locality LIKE filter for any of the selected area names."""
    clauses = []
    for name in area_names:
        if not name:
            continue
        first = name.split(",")[0].strip().split()[0] if name.split(",")[0].strip() else ""
        if not first:
            continue
        like = f"%{first.lower()}%"
        from sqlalchemy import func
        clauses.append(func.lower(BrokerListing.locality).like(like))
    if clauses:
        query = query.filter(or_(*clauses))
    return query


def run(
    db: Session,
    intent: SearchIntent,
    overrides: dict[str, Any] | None,
    area_names: list[str],
) -> list[SearchCandidate]:
    """Retrieve broker listings matching the parsed intent + selected areas."""
    raw = intent.raw_entities or {}

    query = (
        db.query(BrokerListing)
        .options(selectinload(BrokerListing.images))
        .filter(BrokerListing.status == "published")
    )

    if area_names:
        query = _apply_area_filter(query, area_names)
    elif intent.location:
        from sqlalchemy import func
        query = query.filter(func.lower(BrokerListing.city) == intent.location.lower())

    if intent.budget_min is not None:
        query = query.filter(BrokerListing.price_inr >= intent.budget_min)
    if intent.budget_max is not None:
        query = query.filter(BrokerListing.price_inr <= intent.budget_max)

    bhk = raw.get("bhk")
    if isinstance(bhk, (int, float)):
        query = query.filter(BrokerListing.bedrooms == int(bhk))
    elif intent.property_type:
        m = _BHK_RE.search(intent.property_type)
        if m:
            query = query.filter(BrokerListing.bedrooms == int(m.group(1)))

    pt = (intent.property_type or "").lower()
    if pt and not _BHK_RE.search(pt):
        if "villa" in pt:
            query = query.filter(BrokerListing.property_type == "villa")
        elif "plot" in pt or "land" in pt:
            query = query.filter(BrokerListing.property_type == "plot")
        elif "commercial" in pt or "office" in pt or "shop" in pt:
            query = query.filter(BrokerListing.property_type == "commercial")
        elif "apartment" in pt or "flat" in pt:
            query = query.filter(BrokerListing.property_type == "apartment")

    listing_type = raw.get("listing_type")
    if not listing_type and raw.get("investment_intent") == "rental":
        listing_type = "rent"
    elif not listing_type and raw.get("investment_intent") == "resale":
        listing_type = "sale"
    if listing_type:
        query = query.filter(BrokerListing.listing_type == listing_type)

    if overrides:
        for key, value in overrides.items():
            if value is None:
                continue
            if key == "city":
                from sqlalchemy import func
                query = query.filter(func.lower(BrokerListing.city) == str(value).lower())
            elif key == "min_price":
                query = query.filter(BrokerListing.price_inr >= value)
            elif key == "max_price":
                query = query.filter(BrokerListing.price_inr <= value)
            elif key == "min_bedrooms":
                query = query.filter(BrokerListing.bedrooms >= value)
            elif key == "max_bedrooms":
                query = query.filter(BrokerListing.bedrooms <= value)
            elif key == "listing_type":
                query = query.filter(BrokerListing.listing_type == value)
            elif key == "property_type":
                query = query.filter(BrokerListing.property_type == value)

    rows = query.order_by(BrokerListing.created_at.desc()).limit(100).all()

    candidates: list[SearchCandidate] = []
    for row in rows:
        area = find_area_for_property(row.locality, row.city)
        summary = _row_to_summary(row)
        reasons = _build_reasons(row, intent, area)

        # Property AI score = area base + value-buy delta.
        # Base: matched area's 0–100 final score (neutral 50 when no area).
        # Delta: ±8 points based on price/sqft vs area median PSF — rewards
        # below-market pricing, penalizes overpriced listings. Without this,
        # all properties in the same area share an identical score.
        base = area.final_area_score if area and area.final_area_score is not None else 50.0

        value_term = 0.0
        prop_psf = (row.price_inr / row.area_sqft) if row.area_sqft else None
        area_psf = area.latest_psf if area else None
        if prop_psf and area_psf and area_psf > 0:
            value_term = max(-8.0, min(8.0, (1 - prop_psf / area_psf) * 30))

        score = max(0.0, min(100.0, base + value_term))

        candidates.append(
            SearchCandidate(
                property_id=row.id,
                score=score,
                reasons=reasons,
                property=summary,
            )
        )
    return candidates
