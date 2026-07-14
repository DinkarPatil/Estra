"""MagicBricks locality-level URL harvester.

City-wide SRP scraping caps out at MB's city-level dedupe ceiling (~9-10k
for Maharashtra combined). Locality-level SRPs give much richer inventory
per page and tag each listing with an obvious locality in the URL shape.

Writes to the same urls_YYYY-MM.txt as the city worker, so the detail
scraper auto-picks up the new rows on its next run.

Usage:
    python -m app.workers.scrape_magicbricks_locality_urls
    python -m app.workers.scrape_magicbricks_locality_urls --max-pages 20
    python -m app.workers.scrape_magicbricks_locality_urls --city Pune
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
from app.core.notify import notify_failure, notify_progress, notify_start, notify_success
from app.features.area_intelligence.ingestion.scrapers._http import (
    HostLimiter,
    new_client,
)
from app.features.area_intelligence.ingestion.scrapers.magicbricks_property import (
    HOST,
)
from app.features.area_intelligence.ingestion.scrapers.magicbricks_srp import (
    harvest_locality,
)

log = get_logger("workers.scrape_magicbricks_locality_urls")

OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports" / "magicbricks"

# (locality, city) pairs. Slug format follows MB's SEO URL pattern — hyphenated,
# lowercased. locality_srp_url() normalises these to the canonical slug form.
LOCALITY_TARGETS: list[tuple[str, str]] = [
    # Pune
    ("Hinjewadi", "Pune"), ("Wakad", "Pune"), ("Baner", "Pune"),
    ("Balewadi", "Pune"), ("Aundh", "Pune"), ("Pashan", "Pune"),
    ("Bavdhan", "Pune"), ("Sus", "Pune"), ("Pimple Saudagar", "Pune"),
    ("Pimple Nilakh", "Pune"), ("Pimple Gurav", "Pune"), ("Pimpri", "Pune"),
    ("Chinchwad", "Pune"), ("Ravet", "Pune"), ("Tathawade", "Pune"),
    ("Punawale", "Pune"), ("Moshi", "Pune"),
    ("Hadapsar", "Pune"), ("Kharadi", "Pune"), ("Viman Nagar", "Pune"),
    ("Koregaon Park", "Pune"), ("Kalyani Nagar", "Pune"),
    ("Magarpatta", "Pune"), ("Wagholi", "Pune"), ("Keshav Nagar", "Pune"),
    ("Mundhwa", "Pune"), ("Dhanori", "Pune"), ("Tingre Nagar", "Pune"),
    ("Kondhwa", "Pune"), ("NIBM", "Pune"), ("Undri", "Pune"),
    ("Mohammadwadi", "Pune"), ("Wanowrie", "Pune"),
    ("Sinhagad Road", "Pune"), ("Warje", "Pune"), ("Kothrud", "Pune"),
    ("Talegaon", "Pune"),
    # Mumbai — western suburbs
    ("Andheri West", "Mumbai"), ("Andheri East", "Mumbai"),
    ("Bandra West", "Mumbai"), ("Bandra East", "Mumbai"),
    ("Khar West", "Mumbai"), ("Santacruz West", "Mumbai"),
    ("Santacruz East", "Mumbai"), ("Vile Parle West", "Mumbai"),
    ("Vile Parle East", "Mumbai"), ("Juhu", "Mumbai"), ("Versova", "Mumbai"),
    ("Jogeshwari West", "Mumbai"), ("Jogeshwari East", "Mumbai"),
    ("Goregaon West", "Mumbai"), ("Goregaon East", "Mumbai"),
    ("Malad West", "Mumbai"), ("Malad East", "Mumbai"),
    ("Kandivali West", "Mumbai"), ("Kandivali East", "Mumbai"),
    ("Borivali West", "Mumbai"), ("Borivali East", "Mumbai"),
    ("Dahisar West", "Mumbai"), ("Dahisar East", "Mumbai"),
    # Mumbai — central / island
    ("Dadar West", "Mumbai"), ("Dadar East", "Mumbai"),
    ("Worli", "Mumbai"), ("Lower Parel", "Mumbai"),
    ("Prabhadevi", "Mumbai"), ("Mahim", "Mumbai"), ("Parel", "Mumbai"),
    ("Byculla", "Mumbai"), ("Wadala", "Mumbai"),
    # Mumbai — eastern / harbour
    ("Powai", "Mumbai"), ("Chembur", "Mumbai"),
    ("Ghatkopar West", "Mumbai"), ("Ghatkopar East", "Mumbai"),
    ("Mulund West", "Mumbai"), ("Mulund East", "Mumbai"),
    ("Vikhroli", "Mumbai"), ("Bhandup", "Mumbai"),
    ("Kanjurmarg", "Mumbai"), ("Kurla", "Mumbai"), ("Sion", "Mumbai"),
    # Thane
    ("Thane West", "Thane"), ("Thane East", "Thane"),
    ("Ghodbunder Road", "Thane"), ("Kasarvadavali", "Thane"),
    ("Kolshet", "Thane"), ("Majiwada", "Thane"), ("Balkum", "Thane"),
    ("Owale", "Thane"),
    # Navi Mumbai
    ("Vashi", "Navi-Mumbai"), ("Nerul", "Navi-Mumbai"),
    ("Belapur", "Navi-Mumbai"), ("Kharghar", "Navi-Mumbai"),
    ("Panvel", "Navi-Mumbai"), ("Kamothe", "Navi-Mumbai"),
    ("Taloja", "Navi-Mumbai"), ("Ulwe", "Navi-Mumbai"),
    ("Dronagiri", "Navi-Mumbai"), ("Airoli", "Navi-Mumbai"),
    ("Ghansoli", "Navi-Mumbai"), ("Koparkhairane", "Navi-Mumbai"),
    ("Turbhe", "Navi-Mumbai"), ("Sanpada", "Navi-Mumbai"),
    ("Seawoods", "Navi-Mumbai"),
    # Weekend-home belt
    ("Lonavala", "Pune"), ("Khandala", "Pune"), ("Karjat", "Mumbai"),
]


def _month_tag() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _load_existing_urls(path: Path) -> set[str]:
    if not path.exists():
        return set()
    return {ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()}


async def _run(
    targets: list[tuple[str, str]],
    max_pages: int,
    out_urls: Path,
    out_log: Path,
    notify_every: int,
) -> tuple[int, int]:
    limiter = HostLimiter()
    limiter.set_limit(HOST, 3)

    existing = _load_existing_urls(out_urls)
    log.info("starting from %d existing URLs in %s", len(existing), out_urls)

    new_count = pages_total = 0
    last_milestone = 0
    out_urls.parent.mkdir(parents=True, exist_ok=True)
    with out_urls.open("a", encoding="utf-8") as urls_fh, \
         out_log.open("a", encoding="utf-8") as log_fh:
        async with new_client() as client:
            for idx, (locality, city) in enumerate(targets, start=1):
                log.info("[%d/%d] harvesting %s-%s (max_pages=%d)",
                         idx, len(targets), locality, city, max_pages)
                try:
                    urls, page_records = await harvest_locality(
                        client, limiter, locality, city, max_pages=max_pages,
                    )
                except Exception as exc:  # noqa: BLE001
                    log.warning("locality %s-%s failed: %s", locality, city, exc)
                    continue

                pages_total += len(page_records)
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
                    row["_locality"] = locality
                    row["_scraped_at"] = datetime.now(timezone.utc).isoformat()
                    log_fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                log_fh.flush()

                log.info("%s-%s done — +%d new URLs (running total: %d)",
                         locality, city, added, new_count + added)
                new_count += added

                if notify_every > 0 and new_count // notify_every > last_milestone // notify_every:
                    last_milestone = new_count
                    notify_progress(
                        "mb-loc-urls",
                        f"{new_count} new URLs, locality {idx}/{len(targets)} done",
                    )
                await asyncio.sleep(2.0)

    return new_count, pages_total


def run() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--max-pages", type=int, default=20,
                        help="Max SRP pages per locality (default 20 ≈ 600 listings)")
    parser.add_argument("--city", type=str, default=None,
                        help="Only harvest localities within this city (e.g. Pune)")
    parser.add_argument("--out-month", type=str, default=None)
    parser.add_argument("--notify-every", type=int, default=500,
                        help="Push a phone ping every N new URLs (0=off)")
    args = parser.parse_args()

    month = args.out_month or _month_tag()
    out_urls = OUT_DIR / f"urls_{month}.txt"
    out_log = OUT_DIR / f"srp_log_locality_{month}.jsonl"

    targets = LOCALITY_TARGETS
    if args.city:
        targets = [t for t in targets if t[1].lower() == args.city.lower()]

    log.info("locality targets: %d (max_pages=%d)", len(targets), args.max_pages)

    tag = "mb-loc-urls"
    notify_start(tag, f"{len(targets)} localities, max_pages={args.max_pages}")
    try:
        new_count, pages = asyncio.run(_run(
            targets, args.max_pages, out_urls, out_log, args.notify_every,
        ))
    except BaseException as exc:
        notify_failure(tag, exc, f"output: {out_urls.name}")
        raise
    notify_success(tag, f"+{new_count} URLs across {pages} pages → {out_urls.name}")
    print(f"\nDone. +{new_count} new URLs across {pages} SRP pages → {out_urls}")


if __name__ == "__main__":
    run()
