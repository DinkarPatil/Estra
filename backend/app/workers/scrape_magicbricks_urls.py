"""MagicBricks URL harvester worker.

Paginates the MB city-wide SRP for each Maharashtra city and writes every
discovered /propertyDetails URL to a resumable text file. The companion
`scrape_magicbricks_details` worker then enriches each URL.

Output:
    backend/data/exports/magicbricks/urls_YYYY-MM.txt   (one URL per line)
    backend/data/exports/magicbricks/srp_log_YYYY-MM.jsonl  (per-page audit)

Usage:
    python -m app.workers.scrape_magicbricks_urls                    # all MH cities
    python -m app.workers.scrape_magicbricks_urls --city Pune        # single city
    python -m app.workers.scrape_magicbricks_urls --max-pages 5      # cap per city
"""

from __future__ import annotations

import argparse
import asyncio
import json
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
from app.features.area_intelligence.ingestion.scrapers.magicbricks_srp import (
    harvest_city,
)
from app.features.area_intelligence.ingestion.scrapers.magicbricks_property import (
    HOST,
)

log = get_logger("workers.scrape_magicbricks_urls")

OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports" / "magicbricks"

# Maharashtra cities as MagicBricks knows them. cityName param is case-sensitive
# slug with spaces removed (Navi-Mumbai would become NaviMumbai — verify by
# probing if coverage looks thin).
MH_CITIES = [
    "Mumbai", "Pune", "Nagpur", "Nashik", "Thane", "Aurangabad",
    "Navi-Mumbai", "Kalyan", "Vasai", "Virar", "Kolhapur", "Solapur",
    "Sangli", "Ahmednagar", "Amravati", "Akola", "Nanded", "Latur",
    "Chandrapur", "Dhule", "Jalgaon", "Parbhani", "Ratnagiri", "Satara",
    "Jalna", "Bhiwandi", "Ulhasnagar",
]


def _month_tag() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _load_existing_urls(path: Path) -> set[str]:
    if not path.exists():
        return set()
    return {line.strip() for line in path.read_text(encoding="utf-8").splitlines() if line.strip()}


async def _run(cities: list[str], max_pages: int, out_urls: Path, out_log: Path) -> tuple[int, int]:
    """Harvest cities sequentially. Returns (new_url_count, pages_fetched)."""
    limiter = HostLimiter()
    limiter.set_limit(HOST, 3)

    existing = _load_existing_urls(out_urls)
    log.info("starting from %d existing URLs in %s", len(existing), out_urls)

    new_count = pages = 0
    out_urls.parent.mkdir(parents=True, exist_ok=True)
    with out_urls.open("a", encoding="utf-8") as urls_fh, \
         out_log.open("a", encoding="utf-8") as log_fh:
        async with new_client() as client:
            for city in cities:
                log.info("harvesting %s (max_pages=%d)", city, max_pages)
                urls, page_records = await harvest_city(
                    client, limiter, city, max_pages=max_pages,
                )
                pages += len(page_records)
                added = 0
                for u in urls:
                    if u in existing:
                        continue
                    existing.add(u)
                    urls_fh.write(u + "\n")
                    added += 1
                urls_fh.flush()
                for rec in page_records:
                    row = asdict(rec)
                    row["_scraped_at"] = datetime.now(timezone.utc).isoformat()
                    log_fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                log_fh.flush()
                log.info("city %s done — +%d new URLs (total tracked: %d)", city, added, len(existing))
                new_count += added
                # Between-city politeness sleep
                await asyncio.sleep(2.0)
    return new_count, pages


def run() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--city", action="append", dest="cities", help="City (can repeat); default = all Maharashtra cities")
    parser.add_argument("--max-pages", type=int, default=30, help="Max SRP pages per city (default 30 ≈ 900 listings)")
    parser.add_argument("--out-month", type=str, default=None)
    args = parser.parse_args()

    month = args.out_month or _month_tag()
    out_urls = OUT_DIR / f"urls_{month}.txt"
    out_log = OUT_DIR / f"srp_log_{month}.jsonl"

    cities = args.cities or MH_CITIES
    log.info("cities to harvest: %d (%s)", len(cities), ", ".join(cities))

    tag = "mb-urls"
    notify_start(tag, f"{len(cities)} cities, max_pages={args.max_pages}")
    try:
        new_count, pages = asyncio.run(_run(cities, args.max_pages, out_urls, out_log))
    except BaseException as exc:
        notify_failure(tag, exc, f"cities so far: {cities}")
        raise
    notify_success(tag, f"+{new_count} URLs across {pages} pages → {out_urls.name}")
    print(f"\nDone. +{new_count} new URLs across {pages} SRP pages → {out_urls}")


if __name__ == "__main__":
    run()
