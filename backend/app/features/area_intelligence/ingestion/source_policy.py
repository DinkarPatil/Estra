"""Source classification for property_listings rows.

Kaggle rows (2021 sales, 2023 rentals) are vintage baseline data used ONLY for
CAGR trend computation and city-baseline imputation.  They must never appear in
user-facing lead CSVs or property shortlists.

Scraped rows (99acres, nobroker, etc.) are the displayable listings that feed
the shortlisting layer.

Usage::

    from app.features.area_intelligence.ingestion.source_policy import (
        is_displayable,
        is_historical_sale,
        is_current_project,
    )
"""

from __future__ import annotations

# ── Kaggle (historical-only) ─────────────────────────────────────────────────

HISTORICAL_SALE_SOURCES: frozenset[str] = frozenset({
    "kaggle_pune_house",
    "kaggle_7cities_india",
})

HISTORICAL_RENT_SOURCES: frozenset[str] = frozenset({
    "kaggle_pune_rentals",
})

HISTORICAL_SOURCES: frozenset[str] = HISTORICAL_SALE_SOURCES | HISTORICAL_RENT_SOURCES

# ── Scraped (displayable) ────────────────────────────────────────────────────
# Prefix-based: any source starting with one of these is a live scrape.

DISPLAY_SOURCE_PREFIXES: tuple[str, ...] = (
    "99acres_",
    "nobroker_",
)


# ── Helpers ──────────────────────────────────────────────────────────────────

def is_historical(source: str | None) -> bool:
    """True for Kaggle vintage rows (trend/imputation only)."""
    return source in HISTORICAL_SOURCES


def is_historical_sale(source: str | None) -> bool:
    return source in HISTORICAL_SALE_SOURCES


def is_historical_rent(source: str | None) -> bool:
    return source in HISTORICAL_RENT_SOURCES


def is_displayable(source: str | None) -> bool:
    """True for scraped rows that should appear in lead CSV / shortlists."""
    if not source:
        return False
    return source.startswith(DISPLAY_SOURCE_PREFIXES)


def is_current_project(source: str | None) -> bool:
    """True for scraped project-level aggregates (e.g. 99acres_2026_04_project)."""
    return bool(source and is_displayable(source) and source.endswith("_project"))


def is_current_individual(source: str | None) -> bool:
    """True for scraped individual listings (e.g. 99acres_2026_04_individual)."""
    return bool(source and is_displayable(source) and source.endswith("_individual"))
