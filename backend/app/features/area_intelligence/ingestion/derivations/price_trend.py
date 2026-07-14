"""Historical price trend (CAGR) from two-time-point per-area medians.

Inputs:
  - OLD: Kaggle sale listings (pune-house + 7-cities, both 2021 vintage).
         price_per_sqft is taken directly — Kaggle rows are individual
         mid-market flats.
  - NEW: 99acres project rows (monthly, current year). The NEW bucket
         uses the entry_psf stashed in raw (price_min / area_max) rather
         than the midpoint price_per_sqft. 99acres SEO pages over-index
         on premium new developments; the midpoint psf reflects luxury,
         the entry psf reflects what a mid-market buyer would pay at the
         same project's cheapest unit. That segment-matches Kaggle's
         2021 mid-market baseline.

    CAGR = (NEW_median_psf / OLD_median_psf) ^ (1/years) - 1

Returns None when either time-point is sparse (below MIN_SAMPLE).
"""

from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime, timezone
from statistics import median

from app.features.area_intelligence.ingestion.derivations.price_metrics import (
    SALE_PSF_MAX,
    SALE_PSF_MIN,
    _match_area,
)

# Authoritative vintage map — confirmed with Ritesh on 2026-04-21.
# These drive the CAGR window; get them wrong and the trend % lies.
SOURCE_VINTAGE_YEAR: dict[str, int] = {
    "kaggle_pune_house": 2021,
    "kaggle_7cities_india": 2021,
    "kaggle_pune_rentals": 2023,  # unused here; rental trend is a future commit
    # 99acres rows: current year, tagged via prefix matching below.
}
# Match both the legacy bare tag (99acres_2026_04) and the new subtyped
# variants (99acres_2026_04_project, 99acres_2026_04_individual). Only
# project rows feed the trend — individuals lack prices in JSON-LD.
_NEW_SOURCE_PREFIX = "99acres_"
_NEW_SOURCE_INDIVIDUAL_SUFFIX = "_individual"

MIN_SAMPLE = 3


@dataclass(frozen=True)
class HistoricalTrend:
    cagr_pct: float | None  # annualised % change
    old_median_psf: float | None
    new_median_psf: float | None
    old_vintage_year: int | None
    new_vintage_year: int | None
    old_sample_size: int
    new_sample_size: int
    window_years: int | None
    provisional: bool = False  # True while NEW bucket is mixed-segment
    methodology_note: str | None = None


def _is_old_kaggle(source: str) -> bool:
    return SOURCE_VINTAGE_YEAR.get(source) == 2021


def _is_new_project_scrape(source: str) -> bool:
    # Accept both legacy "99acres_YYYY_MM" and the new
    # "99acres_YYYY_MM_project"; explicitly exclude "_individual".
    return (
        source.startswith(_NEW_SOURCE_PREFIX)
        and not source.endswith(_NEW_SOURCE_INDIVIDUAL_SUFFIX)
    )


def _psf_valid(psf) -> bool:
    return psf is not None and SALE_PSF_MIN <= psf <= SALE_PSF_MAX


def _extract_entry_psf(raw_json: str | None) -> float | None:
    """99acres project rows stash entry_psf in the raw blob. Falls back to
    computing it from price_min / area_max if only those are present."""
    if not raw_json:
        return None
    try:
        d = json.loads(raw_json)
    except (ValueError, TypeError):
        return None
    v = d.get("entry_psf")
    if v is not None:
        try:
            return float(v)
        except (TypeError, ValueError):
            pass
    pmin = d.get("price_min_inr")
    amax = d.get("area_max_sqft")
    if pmin and amax:
        try:
            return float(pmin) / float(amax)
        except (TypeError, ValueError, ZeroDivisionError):
            return None
    return None


def _current_year() -> int:
    return datetime.now(timezone.utc).year


def compute(listings: list, area_name: str) -> HistoricalTrend:
    """Return the trend for one area. listings is the full property_listings
    table (sale + rent); we filter to sale + area + valid psf per bucket.
    """
    old_psfs: list[float] = []
    new_psfs: list[float] = []

    for l in listings:
        if l.listing_type != "sale":
            continue
        if not _match_area(l.locality_text, area_name):
            continue
        if _is_old_kaggle(l.source):
            # Kaggle rows carry psf directly.
            if _psf_valid(l.price_per_sqft):
                old_psfs.append(l.price_per_sqft)
        elif _is_new_project_scrape(l.source):
            # 99acres project rows: use entry_psf, not midpoint psf.
            entry = _extract_entry_psf(l.raw)
            if _psf_valid(entry):
                new_psfs.append(entry)

    _METHODOLOGY_NOTE = (
        "OLD = Kaggle 2021 mid-market individual-flat psf. "
        "NEW = 99acres project entry_psf (price_min / area_max), a "
        "segment-matched mid-market proxy rather than the midpoint "
        "(which is inflated by premium new developments featured on "
        "99acres SEO pages). Still a CAGR on a 5-year window — point "
        "estimate, not a forecast."
    )

    if len(old_psfs) < MIN_SAMPLE or len(new_psfs) < MIN_SAMPLE:
        return HistoricalTrend(
            cagr_pct=None,
            old_median_psf=round(median(old_psfs), 2) if old_psfs else None,
            new_median_psf=round(median(new_psfs), 2) if new_psfs else None,
            old_vintage_year=2021 if old_psfs else None,
            new_vintage_year=_current_year() if new_psfs else None,
            old_sample_size=len(old_psfs),
            new_sample_size=len(new_psfs),
            window_years=None,
            provisional=False,
            methodology_note=None,
        )

    old_med = median(old_psfs)
    new_med = median(new_psfs)
    years = _current_year() - 2021  # Kaggle sales are all 2021 vintage
    cagr = ((new_med / old_med) ** (1 / years) - 1) * 100

    return HistoricalTrend(
        cagr_pct=round(cagr, 2),
        old_median_psf=round(old_med, 2),
        new_median_psf=round(new_med, 2),
        old_vintage_year=2021,
        new_vintage_year=_current_year(),
        old_sample_size=len(old_psfs),
        new_sample_size=len(new_psfs),
        window_years=years,
        provisional=True,
        methodology_note=_METHODOLOGY_NOTE,
    )
