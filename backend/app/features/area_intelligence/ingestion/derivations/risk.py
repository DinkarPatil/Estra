"""Compose `risk_signals` from three static risk inputs:
seismic zone (district), crime rate (city), flood risk (district).

Takes the pre-loaded lookup tables from scrapers/risk_local.py and
produces a short, human-readable text string for the MicroMarket row.
Pure function, no I/O.
"""

from __future__ import annotations

from app.features.area_intelligence.ingestion.scrapers.risk_local import (
    CrimeRecord,
    FloodRecord,
    SeismicRecord,
)


def summarize_risk(
    *,
    district: str,
    city: str,
    seismic: dict[str, SeismicRecord],
    crime: dict[str, CrimeRecord],
    flood: dict[str, FloodRecord],
) -> str | None:
    parts: list[str] = []

    s = seismic.get(district.lower())
    if s is not None:
        parts.append(f"Seismic Zone {s.zone} ({s.description.lower()})")

    c = crime.get(city.lower())
    if c is not None:
        parts.append(
            f"IPC crime {c.ipc_per_100k:.0f}/100K ({c.city}, NCRB {c.reference_year})"
        )

    f = flood.get(district.lower())
    if f is not None:
        hist = f" [{f.historic_events}]" if f.historic_events else ""
        parts.append(f"Flood risk: {f.flood_risk}{hist}")

    if not parts:
        return None
    return " | ".join(parts)
