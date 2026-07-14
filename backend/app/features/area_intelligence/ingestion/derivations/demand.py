"""Rental demand strength from listing-volume ratio.

High rent:sale ratio means many rental listings per sale listing — a
proxy for tenant-heavy (IT-hub, migratory-population) micro-markets.
Low ratio suggests end-user / owner-occupier dominance.

Buckets are set on observed Pune distributions; calibrate later if
normalization wants a continuous score instead.
"""

from __future__ import annotations

MIN_TOTAL_LISTINGS = 10  # below this, call it "Insufficient data"
MIN_RENT_LISTINGS = 3    # without some rent signal, ratio is meaningless


def rental_demand_strength(sale_count: int, rent_count: int) -> str:
    if sale_count + rent_count < MIN_TOTAL_LISTINGS:
        return "Insufficient data"
    if rent_count < MIN_RENT_LISTINGS:
        # 0-or-near-0 rentals against plentiful sales is a dataset gap,
        # not genuine low demand. Honest NULL is better than misleading "Very Low".
        return "Insufficient rental data"
    ratio = rent_count / max(sale_count, 1)
    if ratio >= 3.0:
        return "Very High"
    if ratio >= 1.5:
        return "High"
    if ratio >= 0.8:
        return "Moderate"
    if ratio >= 0.3:
        return "Low"
    return "Very Low"
