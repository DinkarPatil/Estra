"""Rental yield as the MVP ROI proxy.

    yield_pct = (median_rent_per_sqft_per_month × 12) / median_sale_per_sqft × 100

Typical Pune yields run 2%–4%. Higher yields often signal either
under-priced sale markets or distressed tenants (both interesting
signals for downstream scoring).

Capital-appreciation ROI (the other half of real-estate return)
requires historical price data we don't yet have — that's a separate
commit once we load RBI RESIDEX or stitch Wayback snapshots.
"""

from __future__ import annotations


def rental_yield_pct(
    median_sale_psf: float | None,
    median_rent_psf_month: float | None,
) -> float | None:
    if not median_sale_psf or not median_rent_psf_month:
        return None
    annual_rent_psf = median_rent_psf_month * 12
    return round((annual_rent_psf / median_sale_psf) * 100, 2)
