"""MagicBricks property-detail enrichment worker.

Reads the URL list produced by scrape_magicbricks_urls and fetches each
listing's detail page into a rich JSONL output.

Output:
    backend/data/exports/magicbricks/property_details_YYYY-MM.jsonl

Usage:
    python -m app.workers.scrape_magicbricks_details
    python -m app.workers.scrape_magicbricks_details --limit 20
    python -m app.workers.scrape_magicbricks_details --month 2026-04
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
    fetch_mb_property,
)

log = get_logger("workers.scrape_magicbricks_details")

OUT_DIR = Path(__file__).resolve().parents[2] / "data" / "exports" / "magicbricks"


def _month_tag() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m")


def _load_urls(path: Path) -> list[str]:
    if not path.exists():
        raise SystemExit(f"URL list missing: {path} — run scrape_magicbricks_urls first")
    return [ln.strip() for ln in path.read_text(encoding="utf-8").splitlines() if ln.strip()]


def _load_done(path: Path) -> set[str]:
    if not path.exists():
        return set()
    done: set[str] = set()
    with path.open(encoding="utf-8") as fh:
        for line in fh:
            try:
                obj = json.loads(line)
                if obj.get("url"):
                    done.add(obj["url"])
            except json.JSONDecodeError:
                continue
    return done


async def _run(
    urls: list[str], out_path: Path, *,
    concurrency: int, batch: int, sleep: float, notify_every: int,
) -> tuple[int, int]:
    limiter = HostLimiter()
    limiter.set_limit(HOST, concurrency)
    ok = fail = 0
    last_notify_milestone = 0  # Last ok-count at which we pushed progress
    total = len(urls)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open("a", encoding="utf-8") as out_fh:
        async with new_client() as client:
            for i in range(0, total, batch):
                chunk = urls[i : i + batch]
                tasks = [fetch_mb_property(client, limiter, u) for u in chunk]
                results = await asyncio.gather(*tasks, return_exceptions=True)
                for u, res in zip(chunk, results):
                    if isinstance(res, BaseException):
                        log.error("task failed for %s: %s", u, res)
                        fail += 1
                        continue
                    out_fh.write(json.dumps(asdict(res), ensure_ascii=False, default=str) + "\n")
                    out_fh.flush()
                    if res.error:
                        fail += 1
                    else:
                        ok += 1
                log.info(
                    "batch %d/%d — cumulative ok=%d fail=%d",
                    (i // batch) + 1, (total + batch - 1) // batch, ok, fail,
                )
                # Phone ping at every 100-listing milestone (configurable).
                if notify_every > 0 and ok // notify_every > last_notify_milestone // notify_every:
                    last_notify_milestone = ok
                    notify_progress(
                        "mb-details",
                        f"{ok}/{total} scraped ({fail} failed so far)",
                    )
                if i + batch < len(urls):
                    await asyncio.sleep(sleep)
    return ok, fail


def run() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--month", type=str, default=None)
    parser.add_argument("--limit", type=int, default=None)
    parser.add_argument("--concurrency", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=10)
    parser.add_argument("--batch-sleep", type=float, default=2.0)
    parser.add_argument("--notify-every", type=int, default=100,
                        help="Push a phone progress notification every N successful listings (0=off)")
    parser.add_argument("--force", action="store_true", help="Rescrape already-done URLs")
    args = parser.parse_args()

    month = args.month or _month_tag()
    urls_path = OUT_DIR / f"urls_{month}.txt"
    out_path = OUT_DIR / f"property_details_{month}.jsonl"

    urls = _load_urls(urls_path)
    if not args.force:
        done = _load_done(out_path)
        if done:
            before = len(urls)
            urls = [u for u in urls if u not in done]
            log.info("resume: %d already done, %d remaining", len(done), len(urls))

    if args.limit is not None:
        urls = urls[: args.limit]
    log.info("scraping %d MagicBricks detail pages → %s", len(urls), out_path)

    if not urls:
        print("nothing to scrape")
        return

    tag = "mb-details"
    notify_start(tag, f"{len(urls)} URLs queued")
    try:
        ok, fail = asyncio.run(_run(
            urls, out_path,
            concurrency=args.concurrency, batch=args.batch_size, sleep=args.batch_sleep,
            notify_every=args.notify_every,
        ))
    except BaseException as exc:
        notify_failure(tag, exc, f"output: {out_path.name}")
        raise
    notify_success(tag, f"{ok}/{ok + fail} ok, {fail} failed → {out_path.name}")
    print(f"\nDone. {ok}/{ok + fail} ok, {fail} failed → {out_path}")


if __name__ == "__main__":
    run()
