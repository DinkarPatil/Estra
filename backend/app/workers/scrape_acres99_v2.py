"""99acres v2 scraper — fetches listings + trends + POIs from SSR pages.

Usage:
    python -m app.workers.scrape_acres99_v2                     # scrape all targets
    python -m app.workers.scrape_acres99_v2 --discover-mumbai   # just get locality IDs
    python -m app.workers.scrape_acres99_v2 --area "Baner" --city Pune  # single area

Output:
    backend/data/exports/99acres/
      listings_YYYY-MM.csv      — all property listings
      trends_YYYY-MM.json       — price trends per locality
      pois_YYYY-MM.json         — nearby POIs per locality
      mumbai_localities.json    — discovered locality IDs (if --discover)
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import json
import sys
from dataclasses import asdict
from datetime import datetime, timezone
from pathlib import Path

import app.features  # noqa: F401
from app.core.logging import get_logger
from app.core.notify import notify_failure, notify_start, notify_success
from app.features.area_intelligence.ingestion.scrapers._http import (
    HostLimiter,
    new_client,
)
from app.features.area_intelligence.ingestion.scrapers.acres99_v2 import (
    HOST,
    AreaScrapeResult,
    discover_localities,
    fetch_area,
)

log = get_logger("workers.scrape_acres99_v2")

OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports" / "99acres"

# ── target areas ─────────────────────────────────────────────────────────────
# Format: (area_name, city, url)
# - ffid URLs work for Pune/Nagpur/Aurangabad
# - search URLs work for Mumbai (need locality IDs)

def _month_tag() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _slug(s: str) -> str:
    """99acres URL-slug convention: lowercase, spaces→hyphens, drop punct."""
    out = []
    for ch in s.lower():
        if ch.isalnum():
            out.append(ch)
        elif ch in (" ", "-", "_", "/"):
            out.append("-")
    slug = "".join(out)
    while "--" in slug:
        slug = slug.replace("--", "-")
    return slug.strip("-")


def _ffid(locality: str, city: str, *, slug_override: str | None = None) -> tuple[str, str, str]:
    """Build a (locality, city, ffid_url) target.

    99acres ffid pages work across Maharashtra cities — we only fall back to
    the search/locality-id format for Mumbai hotspots where ffid is missing.
    """
    loc_slug = slug_override or _slug(locality)
    city_slug = _slug(city)
    # Avoid degenerate `/property-in-malegaon-malegaon-ffid` — when locality
    # equals the city name, use the city-wide ffid page instead.
    if loc_slug == city_slug:
        url = f"https://www.99acres.com/property-in-{city_slug}-ffid"
    else:
        url = f"https://www.99acres.com/property-in-{loc_slug}-{city_slug}-ffid"
    return (locality, city, url)


# ── Pune metropolitan (comprehensive) ─────────────────────────────────────────

_PUNE_FFID = [_ffid(n, "Pune") for n in [
    # Core Pune east/central
    "Kalyani Nagar", "Viman Nagar", "Kharadi", "Hadapsar", "Magarpatta",
    "Koregaon Park", "Camp", "Yerwada", "Keshav Nagar", "Mohammed Wadi",
    "NIBM Road", "Kondhwa", "Undri", "Dhanori", "Wagholi", "Lohegaon",
    "Tingre Nagar", "Vishrantwadi", "Manjri", "Kalas", "Charholi",
    # Pune west / Hinjewadi corridor
    "Hinjewadi", "Hinjewadi Phase 1", "Hinjewadi Phase 2", "Hinjewadi Phase 3",
    "Wakad", "Tathawade", "Punawale", "Ravet", "Marunji", "Mhalunge",
    "Baner", "Balewadi", "Sus", "Pashan", "Bavdhan", "Aundh",
    "Pimple Saudagar", "Kalewadi", "Dange Chowk", "Kiwale",
    # Kothrud / Karve / deccan
    "Kothrud", "Warje", "Erandwane", "Deccan Gymkhana", "Model Colony",
    "Prabhat Road", "Shivaji Nagar",
    # Pimpri-Chinchwad belt
    "Pimpri-Chinchwad", "Pimpri", "Chinchwad", "Nigdi", "Akurdi",
    "Bhosari", "Moshi", "Sangvi", "Dapodi", "Kasarwadi", "Dudulgaon",
    # Pune south / southwest
    "Sinhagad Road", "Dhayari", "Katraj", "Bibwewadi", "Swargate",
    "Sahakar Nagar", "Wanowrie", "Salunke Vihar", "Kondhwa Budruk",
    # Pune outer ring
    "Chakan", "Talegaon Dabhade", "Pirangut", "Bhukum", "Uruli Kanchan",
    "Shirur", "Khed Shivapur",
]]

# ── Mumbai Metropolitan Region (ffid + search hybrid) ─────────────────────────

# Known locality IDs — kept as search format for backwards-compat with
# existing listings URLs and because these hit high-volume Mumbai hubs.
_MUMBAI_SEARCH = [
    ("Worli", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4924&preference=S&res_com=R"),
    ("Andheri West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4954&preference=S&res_com=R"),
    ("Andheri East", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4872&preference=S&res_com=R"),
    ("Powai", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4879&preference=S&res_com=R"),
    ("Bandra West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4878&preference=S&res_com=R"),
    ("Goregaon West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4970&preference=S&res_com=R"),
    ("Goregaon East", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4969&preference=S&res_com=R"),
    ("Thane West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=1107&preference=S&res_com=R"),
    ("Kharghar", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=1064&preference=S&res_com=R"),
    ("Mulund West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4881&preference=S&res_com=R"),
    ("Kandivali East", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4967&preference=S&res_com=R"),
    ("Kandivali West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4968&preference=S&res_com=R"),
    ("Bhandup West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4880&preference=S&res_com=R"),
    ("Vashi", "Navi Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=4884&preference=S&res_com=R"),
    ("Nerul", "Navi Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=1065&preference=S&res_com=R"),
    ("Dombivli East", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=3246&preference=S&res_com=R"),
    ("Panvel", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=1452&preference=S&res_com=R"),
    ("Virar West", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=12180&preference=S&res_com=R"),
    ("Mira Road East", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=12006&preference=S&res_com=R"),
    ("Ulwe", "Navi Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=7907&preference=S&res_com=R"),
    ("Hiranandani Estate", "Mumbai", "https://www.99acres.com/search/property/buy?city=12&locality=5102&preference=S&res_com=R"),
]

# Additional Mumbai localities (ffid) — where we don't have the locality ID handy.
_MUMBAI_FFID = [_ffid(n, "Mumbai") for n in [
    # South / Central Mumbai
    "Dadar West", "Dadar East", "Lower Parel", "Prabhadevi", "Parel", "Sewri",
    "Byculla", "Marine Drive", "Colaba", "Churchgate", "Tardeo",
    "Matunga East", "Matunga West", "Mahalaxmi", "Wadala",
    # Western suburbs
    "Juhu", "Versova", "Oshiwara", "Jogeshwari East", "Jogeshwari West",
    "Santacruz East", "Santacruz West", "Khar West", "Khar East",
    "Bandra East", "Vile Parle East", "Vile Parle West",
    "Malad East", "Malad West", "Borivali East", "Borivali West",
    "Dahisar East", "Dahisar West", "Charni Road", "Grant Road",
    # Central / eastern suburbs
    "Chembur", "Ghatkopar East", "Ghatkopar West", "Vikhroli East", "Vikhroli West",
    "Kanjurmarg East", "Kanjurmarg West", "Kurla West", "Kurla East",
    "Mulund East", "Sion",
]]

# Thane proper
_THANE_FFID = [_ffid(n, "Thane") for n in [
    "Naupada", "Majiwada", "Kolshet Road", "Ghodbunder Road", "Kasarvadavali",
    "Manpada", "Pokhran Road 1", "Pokhran Road 2", "Vasant Vihar",
    "Balkum", "Wagle Estate", "Dhokali", "Owale", "Bhayanderpada",
    "Hiranandani Estate",
]]

# Navi Mumbai
_NAVI_MUMBAI_FFID = [_ffid(n, "Navi Mumbai") for n in [
    "Belapur", "Airoli", "Ghansoli", "Kopar Khairane", "Juinagar", "Sanpada",
    "Seawoods", "Kamothe", "New Panvel", "Kalamboli", "Taloja", "Dronagiri",
    "CBD Belapur", "Sector 10 Kharghar", "Sector 20 Kharghar",
]]

# Kalyan-Dombivli
_KALYAN_FFID = [_ffid(n, "Kalyan") for n in [
    "Kalyan West", "Kalyan East", "Shil Phata", "Nilje Gaon",
]] + [_ffid(n, "Dombivli") for n in [
    "Dombivli West", "Thakurli",
]]

# Vasai-Virar
_VASAI_VIRAR_FFID = [_ffid(n, "Vasai") for n in [
    "Vasai West", "Vasai East", "Nalasopara West", "Nalasopara East",
    "Naigaon East", "Naigaon West",
]] + [_ffid(n, "Virar") for n in [
    "Virar East",
]]

# MMR fringe (Bhiwandi, Ulhasnagar, Ambernath, Badlapur, Bhayandar)
_MMR_FRINGE_FFID = [
    *[_ffid(n, "Bhiwandi") for n in ["Bhiwandi", "Anjurphata", "Kalher"]],
    *[_ffid(n, "Ulhasnagar") for n in ["Ulhasnagar 1", "Ulhasnagar 4", "Ulhasnagar 5"]],
    *[_ffid(n, "Ambernath") for n in ["Ambernath East", "Ambernath West"]],
    *[_ffid(n, "Badlapur") for n in ["Badlapur East", "Badlapur West"]],
    *[_ffid(n, "Bhayandar") for n in ["Bhayandar East", "Bhayandar West"]],
    *[_ffid(n, "Mira Road") for n in ["Mira Road"]],
]

# Nagpur
_NAGPUR_FFID = [_ffid(n, "Nagpur") for n in [
    "Dharampeth", "Civil Lines", "Manish Nagar", "Wardha Road", "Hingna Road",
    "Khamla", "Pratap Nagar", "Ramdaspeth", "Sadar", "Koradi Road", "Besa",
    "Trimurti Nagar", "Jaitala", "Hudkeshwar", "Narendra Nagar", "Khapri",
    "Mihan", "Friends Colony", "Ajni", "Bajaj Nagar", "Dabha",
    "Shankar Nagar", "Ring Road", "Nara", "Gondkhairi",
]]

# Nashik
_NASHIK_FFID = [_ffid(n, "Nashik") for n in [
    "Indira Nagar", "College Road", "Gangapur Road", "Panchavati",
    "Cidco Nashik", "Mumbai Naka", "Ashok Nagar", "Adgaon", "Pathardi Phata",
    "Dwarka", "Nashik Road", "Makhmalabad", "Nandur Naka", "Satpur",
    "Ambad", "Deolali", "Chehedi", "Govind Nagar", "Trimbak Road",
]]

# Aurangabad / Chhatrapati Sambhajinagar
_AURANGABAD_FFID = [_ffid(n, "Aurangabad") for n in [
    "Cidco", "Jalna Road", "Waluj", "Garkheda", "Beed Bypass",
    "N-1 Cidco", "N-2 Cidco", "N-5 Cidco", "Mhada Colony", "Shahanoorwadi",
    "Kanchanwadi", "Ramnagar", "Chikalthana", "Osmanpura", "Jyoti Nagar",
]]

# Kolhapur
_KOLHAPUR_FFID = [_ffid(n, "Kolhapur") for n in [
    "Rajarampuri", "Shahupuri", "Tarabai Park", "Laxmipuri", "Shivaji Peth",
    "Mahadwar Road", "Kawala Naka", "Nagala Park", "Ruikar Colony",
    "Uchgaon",
]]

# Solapur
_SOLAPUR_FFID = [_ffid(n, "Solapur") for n in [
    "Majrewadi", "Akkalkot Road", "Dadar Peth", "Vijapur Road", "Ashok Chowk",
    "Hotgi Road", "New Pacha Peth",
]]

# Sangli-Miraj-Ichalkaranji
_SANGLI_FFID = [
    *[_ffid(n, "Sangli") for n in ["Sangli", "Vishrambag", "Kupwad"]],
    *[_ffid(n, "Miraj") for n in ["Miraj"]],
    *[_ffid(n, "Ichalkaranji") for n in ["Ichalkaranji"]],
]

# Ahmednagar / Jalgaon / Amravati / Akola / Nanded / Latur / Chandrapur / Dhule /
# Parbhani / Ratnagiri / Satara / Karad / Jalna
_OTHER_MH_FFID = [
    *[_ffid(n, "Ahmednagar") for n in ["Pipeline Road", "Savedi", "Kedgaon", "Station Road", "Nagapur"]],
    *[_ffid(n, "Jalgaon") for n in ["Jalgaon", "Ring Road", "MIDC Jalgaon", "Mehrun"]],
    *[_ffid(n, "Amravati") for n in ["Badnera Road", "Rajapeth", "Rajkamal Chowk", "Camp Amravati"]],
    *[_ffid(n, "Akola") for n in ["Akola", "Civil Lines Akola", "Ratanlal Plot"]],
    *[_ffid(n, "Nanded") for n in ["Nanded", "Vazirabad", "Shivaji Nagar Nanded"]],
    *[_ffid(n, "Latur") for n in ["Latur", "Ausa Road", "Barshi Road"]],
    *[_ffid(n, "Chandrapur") for n in ["Chandrapur", "Bhanapeth", "Tukum"]],
    *[_ffid(n, "Dhule") for n in ["Dhule", "Deopur", "Mohadi Road"]],
    *[_ffid(n, "Parbhani") for n in ["Parbhani", "Vasmat Road"]],
    *[_ffid(n, "Ratnagiri") for n in ["Ratnagiri", "Mirya"]],
    *[_ffid(n, "Satara") for n in ["Satara", "Powai Naka", "Godoli"]],
    *[_ffid(n, "Karad") for n in ["Karad"]],
    *[_ffid(n, "Jalna") for n in ["Jalna", "Old Jalna"]],
    *[_ffid(n, "Bhusawal") for n in ["Bhusawal"]],
    *[_ffid(n, "Malegaon") for n in ["Malegaon"]],
    *[_ffid(n, "Wardha") for n in ["Wardha"]],
]

# Kept for backwards compatibility — older names/aliases already used by the
# ingestion worker via `trends_*.json`. Preserve them so no area names break.
_LEGACY_ALIASES = [
    # The old target list called it "Pimpri-Chinchwad" at the umbrella level —
    # keep even though the new Pune list has more granular Pimpri/Chinchwad.
    ("Talegaon", "Pune", "https://www.99acres.com/property-in-talegaon-dabhade-pune-ffid"),
]

# Aggregate (dedupe by (name, city)).
_RAW_TARGETS = (
    _PUNE_FFID + _MUMBAI_SEARCH + _MUMBAI_FFID + _THANE_FFID +
    _NAVI_MUMBAI_FFID + _KALYAN_FFID + _VASAI_VIRAR_FFID + _MMR_FRINGE_FFID +
    _NAGPUR_FFID + _NASHIK_FFID + _AURANGABAD_FFID + _KOLHAPUR_FFID +
    _SOLAPUR_FFID + _SANGLI_FFID + _OTHER_MH_FFID + _LEGACY_ALIASES
)


def _dedupe(targets: list[tuple[str, str, str]]) -> list[tuple[str, str, str]]:
    seen: set[tuple[str, str]] = set()
    out: list[tuple[str, str, str]] = []
    for name, city, url in targets:
        key = (name.strip().lower(), city.strip().lower())
        if key in seen:
            continue
        seen.add(key)
        out.append((name, city, url))
    return out


ALL_TARGETS = _dedupe(_RAW_TARGETS)


# ── storage ──────────────────────────────────────────────────────────────────

def _save_listings(results: list[AreaScrapeResult], month: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"listings_{month}.csv"
    fields = [
        "name", "locality", "city", "bhk", "price_min", "price_max",
        "price_label", "price_psf", "builder", "possession", "url",
        "latitude", "longitude", "source_url", "scraped_at",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        for r in results:
            for p in r.properties:
                row = asdict(p)
                w.writerow({k: row.get(k) for k in fields})
    total = sum(len(r.properties) for r in results)
    log.info("saved %d listings to %s", total, path)
    return path


def _save_trends(results: list[AreaScrapeResult], month: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"trends_{month}.json"
    trends = []
    for r in results:
        if r.trend:
            t = asdict(r.trend)
            t["area_name"] = r.area_name
            t["city"] = r.city
            trends.append(t)
    path.write_text(json.dumps(trends, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("saved %d trends to %s", len(trends), path)
    return path


def _save_pois(results: list[AreaScrapeResult], month: str) -> Path:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / f"pois_{month}.json"
    all_pois = []
    for r in results:
        for poi in r.pois:
            d = asdict(poi)
            d["locality"] = r.area_name
            d["city"] = r.city
            all_pois.append(d)
    path.write_text(json.dumps(all_pois, indent=2, ensure_ascii=False), encoding="utf-8")
    log.info("saved %d POIs to %s", len(all_pois), path)
    return path


# ── runners ──────────────────────────────────────────────────────────────────

async def _run_scrape(targets: list[tuple[str, str, str]]) -> list[AreaScrapeResult]:
    limiter = HostLimiter()
    limiter.set_limit(HOST, 3)  # polite — 3 concurrent requests

    results: list[AreaScrapeResult] = []
    async with new_client() as client:
        # Process in batches of 5 to avoid overwhelming
        for i in range(0, len(targets), 5):
            batch = targets[i : i + 5]
            tasks = [
                fetch_area(client, limiter, area_name, city, url)
                for area_name, city, url in batch
            ]
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            for res in batch_results:
                if isinstance(res, BaseException):
                    log.error("task failed: %s", res)
                else:
                    results.append(res)
            if i + 5 < len(targets):
                await asyncio.sleep(2)  # politeness between batches

    return results


async def _run_discover():
    """Discover Mumbai locality IDs."""
    limiter = HostLimiter()
    async with new_client() as client:
        localities = await discover_localities(client, limiter, "Mumbai", 12)

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUT_DIR / "mumbai_localities.json"
    path.write_text(json.dumps(localities, indent=2), encoding="utf-8")
    log.info("discovered %d Mumbai localities → %s", len(localities), path)
    for loc in localities[:25]:
        print(f"  {loc['label']}: {loc['count']} listings (id={loc['id']})")


def run():
    parser = argparse.ArgumentParser()
    parser.add_argument("--discover-mumbai", action="store_true")
    parser.add_argument("--area", type=str, help="Scrape single area")
    parser.add_argument("--city", type=str, help="City for single area")
    parser.add_argument("--url", type=str, help="URL for single area")
    parser.add_argument("--all", action="store_true", help="Scrape all targets (default)")
    args = parser.parse_args()

    if args.discover_mumbai:
        asyncio.run(_run_discover())
        return

    if args.area and args.city and args.url:
        targets = [(args.area, args.city, args.url)]
    else:
        targets = ALL_TARGETS

    month = _month_tag()
    log.info("scraping %d areas (month=%s)", len(targets), month)

    tag = "99acres-srp"
    notify_start(tag, f"{len(targets)} targets, month={month}")
    try:
        results = asyncio.run(_run_scrape(targets))
    except BaseException as exc:
        notify_failure(tag, exc, f"targets: {len(targets)}")
        raise

    # Filter out errors
    ok = [r for r in results if not r.error]
    failed = [r for r in results if r.error]
    log.info("completed: %d ok, %d failed", len(ok), len(failed))
    for r in failed:
        log.warning("  FAILED: %s (%s) — %s", r.area_name, r.city, r.error)

    if ok:
        _save_listings(ok, month)
        _save_trends(ok, month)
        _save_pois(ok, month)

    total_listings = sum(len(r.properties) for r in ok)
    total_pois = sum(len(r.pois) for r in ok)
    areas_with_trends = sum(1 for r in ok if r.trend)
    notify_success(
        tag,
        f"{len(ok)}/{len(targets)} areas, {total_listings} listings, "
        f"{areas_with_trends} trends, {total_pois} POIs ({len(failed)} failed)",
    )
    print(f"\nDone. {len(ok)} areas, {total_listings} listings, {areas_with_trends} trends, {total_pois} POIs")


if __name__ == "__main__":
    run()
