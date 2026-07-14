"""Pune Kaggle dataset loaders — parse CSVs into PropertyListing rows.

Three datasets, all pulled via kagglehub:

    saipavansaketh/pune-house-data                       — sales, ~13K rows
    anantsakhare/rental-price-of-indias-it-capital-*     — rentals, ~10K rows
    rakkesharv/real-estate-data-from-7-indian-cities     — mixed, filter to Pune

Each returns a list[dict] matching the PropertyListing columns; persistence
is handled by the worker so this module stays pure + unit-testable.
"""

from __future__ import annotations

import csv
import json
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import kagglehub

from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("property.kaggle_loader")

SOURCE_PUNE_HOUSE = "kaggle_pune_house"
SOURCE_PUNE_RENTALS = "kaggle_pune_rentals"
SOURCE_7_CITIES = "kaggle_7cities_india"


# ─── helpers ────────────────────────────────────────────────────────────────

_BHK_RE = re.compile(r"(\d+)\s*(?:BHK|Bedroom|Bed)", re.I)
_PRICE_CR_RE = re.compile(r"([\d.]+)\s*Cr", re.I)
_PRICE_LAC_RE = re.compile(r"([\d.]+)\s*(?:Lac|Lakh)", re.I)


def _parse_bhk(text: str) -> int | None:
    if not text:
        return None
    m = _BHK_RE.search(text)
    if m:
        try:
            return int(m.group(1))
        except ValueError:
            return None
    try:
        return int(text.strip())
    except ValueError:
        return None


def _parse_inr_price(text: str) -> float | None:
    """Turn '₹1.99 Cr' / '39.5 Lac' / bare number-in-lakhs into ₹."""
    if not text:
        return None
    m = _PRICE_CR_RE.search(text)
    if m:
        return float(m.group(1)) * 10_000_000
    m = _PRICE_LAC_RE.search(text)
    if m:
        return float(m.group(1)) * 100_000
    try:
        return float(text.strip())
    except ValueError:
        return None


def _parse_sqft(text: str) -> float | None:
    if not text:
        return None
    # Dataset occasionally has '1133 - 1384' (range); take the midpoint.
    t = text.strip()
    if "-" in t:
        parts = [p.strip() for p in t.split("-")]
        try:
            return (float(parts[0]) + float(parts[1])) / 2
        except ValueError:
            return None
    try:
        return float(t)
    except ValueError:
        return None


# ─── pune-house sales ───────────────────────────────────────────────────────

def parse_pune_house(csv_path: Path) -> Iterable[dict]:
    with csv_path.open(encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            sqft = _parse_sqft(row.get("total_sqft", ""))
            # `price` is in lakhs (INR) — 39.07 = ₹39.07L
            try:
                price = float(row["price"]) * 100_000 if row.get("price") else None
            except ValueError:
                price = None
            psf = (price / sqft) if (price and sqft) else None

            yield {
                "source": SOURCE_PUNE_HOUSE,
                "external_id": None,
                "listing_type": "sale",
                "city": "Pune",
                "state": "Maharashtra",
                "locality_text": (row.get("site_location") or "").strip(),
                "title": f"{row.get('size','?')} in {row.get('site_location','')}",
                "bedrooms": _parse_bhk(row.get("size", "")),
                "bathrooms": int(row["bath"]) if row.get("bath", "").isdigit() else None,
                "area_sqft": sqft,
                "price_inr": price,
                "price_per_sqft": psf,
                "raw": json.dumps(row),
            }


# ─── pune-rentals ───────────────────────────────────────────────────────────

def _extract_locality_from_address(address: str) -> str:
    """Address pattern: 'Society, Locality, Pune, Maharashtra' — keep locality."""
    parts = [p.strip() for p in address.split(",") if p.strip()]
    # Drop trailing 'Pune' / 'Maharashtra' (and empty tokens)
    parts = [p for p in parts if p.lower() not in {"pune", "maharashtra", ""}]
    if len(parts) >= 2:
        return parts[-1]  # 'Locality' comes right before 'Pune'
    if parts:
        return parts[0]
    return ""


def parse_pune_rentals(csv_path: Path) -> Iterable[dict]:
    with csv_path.open(encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            area = _parse_sqft(row.get("area", ""))
            try:
                rent = float(row["rent"]) if row.get("rent") else None
            except ValueError:
                rent = None
            # Rent ₹/sqft/month — callers convert to annual as needed.
            psf_month = (rent / area) if (rent and area) else None
            locality = _extract_locality_from_address(row.get("address", ""))

            yield {
                "source": SOURCE_PUNE_RENTALS,
                "external_id": None,
                "listing_type": "rent",
                "city": "Pune",
                "state": "Maharashtra",
                "locality_text": locality,
                "title": f"{row.get('bedroom','?')} BHK rental in {locality}",
                "bedrooms": _parse_bhk(row.get("bedroom", "")),
                "bathrooms": (
                    int(row["bathrooms"]) if row.get("bathrooms", "").isdigit() else None
                ),
                "area_sqft": area,
                "price_inr": rent,
                "price_per_sqft": psf_month,
                "raw": json.dumps(row),
            }


# ─── 7-cities (filtered to Pune) ────────────────────────────────────────────

_MH_CITIES = {
    "pune", "mumbai", "thane", "nashik", "nagpur", "aurangabad",
    "solapur", "kolhapur", "amravati", "navi mumbai",
}


def parse_7cities_india(csv_path: Path) -> Iterable[dict]:
    """All rows; city + state detected from Location field.

    Location pattern is 'Sublocality, City' or 'Sublocality City'. Last
    comma-separated token is taken as the city. For MVP we store state
    as 'Maharashtra' for known Maharashtra cities and None otherwise —
    keeps the table usable for cross-state expansion later.
    """
    with csv_path.open(encoding="utf-8", errors="replace") as f:
        for row in csv.DictReader(f):
            location = row.get("Location", "")
            if not location:
                continue

            # Last comma-separated token is the city.
            if "," in location:
                locality, city = location.rsplit(",", 1)
                city = city.strip()
                locality = locality.strip()
            else:
                # Rare case: no comma — treat whole string as city.
                city = location.strip()
                locality = ""

            if not city:
                continue

            state = "Maharashtra" if city.lower() in _MH_CITIES else None

            sqft = _parse_sqft(row.get("Total_Area", ""))
            price = _parse_inr_price(row.get("Price", ""))
            try:
                psf_from_col = (
                    float(row["Price_per_SQFT"])
                    if row.get("Price_per_SQFT")
                    else None
                )
            except ValueError:
                psf_from_col = None
            psf = psf_from_col or ((price / sqft) if (price and sqft) else None)

            yield {
                "source": SOURCE_7_CITIES,
                "external_id": None,
                "listing_type": "sale",
                "city": city,
                "state": state,
                "locality_text": locality or location.strip(),
                "title": (row.get("Property Title") or row.get("Name") or "").strip(),
                "bedrooms": _parse_bhk(row.get("Property Title", "")),
                "bathrooms": (
                    int(row["Baths"]) if row.get("Baths", "").isdigit() else None
                ),
                "area_sqft": sqft,
                "price_inr": price,
                "price_per_sqft": psf,
                "raw": json.dumps(row),
            }


# ─── dataset-download orchestration ─────────────────────────────────────────

@dataclass(frozen=True)
class DatasetPaths:
    pune_house: Path
    pune_rentals: Path
    seven_cities: Path


def download_all() -> DatasetPaths:
    """Pull all three Kaggle datasets via kagglehub. Uses the kagglehub cache,
    so repeat calls are free.
    """
    log.info("fetching Kaggle datasets via kagglehub")
    house_dir = Path(kagglehub.dataset_download("saipavansaketh/pune-house-data"))
    rentals_dir = Path(
        kagglehub.dataset_download(
            "anantsakhare/rental-price-of-indias-it-capital-pune-mh-ind"
        )
    )
    seven_dir = Path(
        kagglehub.dataset_download("rakkesharv/real-estate-data-from-7-indian-cities")
    )
    return DatasetPaths(
        pune_house=house_dir / "Pune house data.csv",
        pune_rentals=rentals_dir / "train.csv",
        seven_cities=seven_dir / "Real Estate Data V21.csv",
    )
