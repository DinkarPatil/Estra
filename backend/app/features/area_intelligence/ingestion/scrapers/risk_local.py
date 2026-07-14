"""Loaders for static risk-factor CSVs shipped in app/seed_data/.

These are small, hand-curated tables (~35 districts, ~10 cities) sourced
from public references:

    risk_seismic_zones.csv  — IS 1893:2016 district-wise zone mapping
    risk_crime_rates.csv    — NCRB Crime in India 2022, Table 2A.1
    risk_flood_prone.csv    — Maharashtra State Disaster Management Authority

All three are authoritative, static, and don't need scraping. Refresh is
a yearly chore (NCRB publishes annual reports) handled by manually
updating the CSV.
"""

from __future__ import annotations

import csv
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

_SEED_DIR = Path(__file__).resolve().parents[4] / "seed_data"


@dataclass(frozen=True)
class SeismicRecord:
    district: str
    zone: str
    description: str


@dataclass(frozen=True)
class CrimeRecord:
    city: str
    ipc_per_100k: float
    reference_year: int


@dataclass(frozen=True)
class FloodRecord:
    district: str
    flood_risk: str  # Low | Medium | High
    historic_events: str


@lru_cache(maxsize=1)
def load_seismic() -> dict[str, SeismicRecord]:
    path = _SEED_DIR / "risk_seismic_zones.csv"
    out: dict[str, SeismicRecord] = {}
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[row["district"].strip().lower()] = SeismicRecord(
                district=row["district"].strip(),
                zone=row["zone"].strip(),
                description=row["description"].strip(),
            )
    return out


@lru_cache(maxsize=1)
def load_crime() -> dict[str, CrimeRecord]:
    path = _SEED_DIR / "risk_crime_rates.csv"
    out: dict[str, CrimeRecord] = {}
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[row["city"].strip().lower()] = CrimeRecord(
                city=row["city"].strip(),
                ipc_per_100k=float(row["ipc_crimes_per_100k"]),
                reference_year=int(row["reference_year"]),
            )
    return out


@lru_cache(maxsize=1)
def load_flood() -> dict[str, FloodRecord]:
    path = _SEED_DIR / "risk_flood_prone.csv"
    out: dict[str, FloodRecord] = {}
    with path.open(encoding="utf-8") as f:
        for row in csv.DictReader(f):
            out[row["district"].strip().lower()] = FloodRecord(
                district=row["district"].strip(),
                flood_risk=row["flood_risk"].strip(),
                historic_events=row["historic_events"].strip(),
            )
    return out
