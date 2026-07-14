"""Compute per-area price statistics from PropertyListing rows.

Pure functions. Takes a list[PropertyListing] (loaded once by the worker)
and an area name; returns median ₹/sqft and volatility (coefficient of
variation) over listings whose locality_text contains the area name.

Outlier filtering: hard sanity bounds on price_per_sqft are applied
before any stats are computed. Raw Kaggle data contains a handful of
garbage rows (e.g. ₹12M/sqft — likely a NULL area / bad divide) that
would swamp a mean or blow up a stddev. Bounds are wide enough to cover
luxury micro-markets without letting junk through.
"""

from __future__ import annotations

from dataclasses import dataclass
from statistics import mean, median, stdev

# Real Pune ranges: ~₹5,000–₹20,000 /sqft for sale; a luxury
# outlier like Koregaon Park can hit ~₹25,000. Pad on both sides.
SALE_PSF_MIN = 1000.0
SALE_PSF_MAX = 50000.0

# Pune rentals: ₹10–₹60/sqft/month typical; ultra-premium goes higher.
RENT_PSF_MONTH_MIN = 5.0
RENT_PSF_MONTH_MAX = 200.0

MIN_SAMPLE = 3  # fewer listings → skip direct calc, let imputation handle it


@dataclass(frozen=True)
class AreaPriceMetrics:
    median_psf: float | None
    volatility_cv: float | None  # coefficient of variation, not %
    sample_size: int


def _match_area(locality_text: str | None, area_name: str) -> bool:
    if not locality_text:
        return False
    return area_name.lower() in locality_text.lower()


def _sale_psf_valid(psf: float | None) -> bool:
    return psf is not None and SALE_PSF_MIN <= psf <= SALE_PSF_MAX


def _rent_psf_valid(psf: float | None) -> bool:
    return psf is not None and RENT_PSF_MONTH_MIN <= psf <= RENT_PSF_MONTH_MAX


def compute_sale_metrics(listings: list, area_name: str) -> AreaPriceMetrics:
    """listings is a list of PropertyListing ORM objects (or anything with
    the same attributes)."""
    psfs = [
        l.price_per_sqft
        for l in listings
        if l.listing_type == "sale"
        and _match_area(l.locality_text, area_name)
        and _sale_psf_valid(l.price_per_sqft)
    ]
    return _stats(psfs)


def compute_rent_metrics(listings: list, area_name: str) -> AreaPriceMetrics:
    psfs = [
        l.price_per_sqft
        for l in listings
        if l.listing_type == "rent"
        and _match_area(l.locality_text, area_name)
        and _rent_psf_valid(l.price_per_sqft)
    ]
    return _stats(psfs)


def _stats(psfs: list[float]) -> AreaPriceMetrics:
    n = len(psfs)
    if n < MIN_SAMPLE:
        return AreaPriceMetrics(median_psf=None, volatility_cv=None, sample_size=n)
    med = median(psfs)
    mu = mean(psfs)
    sd = stdev(psfs)
    cv = round(sd / mu, 4) if mu > 0 else None
    return AreaPriceMetrics(
        median_psf=round(med, 2),
        volatility_cv=cv,
        sample_size=n,
    )


def city_median_sale_psf(listings: list, city: str) -> float | None:
    """City-wide fallback baseline for imputation."""
    psfs = [
        l.price_per_sqft
        for l in listings
        if l.listing_type == "sale"
        and (l.city or "").lower() == city.lower()
        and _sale_psf_valid(l.price_per_sqft)
    ]
    return round(median(psfs), 2) if len(psfs) >= MIN_SAMPLE else None


def city_median_rent_psf(listings: list, city: str) -> float | None:
    psfs = [
        l.price_per_sqft
        for l in listings
        if l.listing_type == "rent"
        and (l.city or "").lower() == city.lower()
        and _rent_psf_valid(l.price_per_sqft)
    ]
    return round(median(psfs), 2) if len(psfs) >= MIN_SAMPLE else None
