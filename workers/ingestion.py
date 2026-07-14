"""
ESTRA Glimmora — Step 1 Data Ingestion Pipeline.

Pipeline flow (per spec):
  1. Fetch HTML using requests
  2. Parse using BeautifulSoup
  3. Extract raw fields
  4. Clean & normalize
  5. Deduplicate
  6. Assign UUID
  7. Store in JSON

Run from the project root:

    python workers/ingestion.py

Outputs:
  data/listings.json   — flat list of normalized listings (frontend-ready)
  data/projects.json   — derived list of unique builder projects
"""

import io
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

# Windows consoles default to cp1252 and choke on '→' / '✓'. Force UTF-8.
if sys.stdout.encoding and sys.stdout.encoding.lower() not in ("utf-8", "utf8"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
        sys.stderr.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, io.UnsupportedOperation):
        pass

# Make `import workers.*` work when this file is run directly.
THIS_DIR = Path(__file__).resolve().parent
ROOT_DIR = THIS_DIR.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from workers.scrapers import (  # noqa: E402
    scraper_99acres,
    scraper_housing,
    scraper_magicbricks,
)
from workers.utils.cleaner import clean_listing  # noqa: E402
from workers.utils.storage import (  # noqa: E402
    listing_key,
    merge_save,
    project_key,
)

CITIES = ["Mumbai", "Pune"]
DATA_DIR = ROOT_DIR / "data"
LISTINGS_PATH = DATA_DIR / "listings.json"
PROJECTS_PATH = DATA_DIR / "projects.json"

SOURCES = [
    ("99acres", scraper_99acres.scrape),
    ("magicbricks", scraper_magicbricks.scrape),
    ("housing", scraper_housing.scrape),
]


def _project_from_listing(listing: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    name = listing.get("project_name")
    if not name:
        return None
    return {
        "project_name": name,
        "builder_name": listing.get("builder_name"),
        "city": listing.get("city"),
        "state": listing.get("state"),
        "locality_text": listing.get("locality_text"),
        "source": listing.get("source"),
    }


def run(max_pages: int = 1) -> Dict[str, Any]:
    """Run all scrapers, clean, dedupe, persist. Returns a summary dict."""
    print(
        f"[ingestion] starting — cities={CITIES}, "
        f"sources={[s for s, _ in SOURCES]}, max_pages={max_pages}"
    )
    cleaned: List[Dict[str, Any]] = []
    seen_in_run: set = set()  # in-run dedupe before merge
    counts = {"raw": 0, "cleaned": 0, "dropped": 0, "intra_run_dupes": 0}

    for source, scrape_fn in SOURCES:
        for city in CITIES:
            t0 = time.time()
            try:
                raw_items = scrape_fn(city, max_pages=max_pages)
            except Exception as e:  # scraper-level failures must not kill the run
                print(f"  [{source}] {city} ERROR: {type(e).__name__}: {e}")
                raw_items = []
            elapsed = time.time() - t0
            counts["raw"] += len(raw_items)
            print(f"  [{source}] {city}: {len(raw_items)} raw in {elapsed:.1f}s")

            for raw in raw_items:
                normalized = clean_listing(raw, source=source)
                if normalized is None:
                    counts["dropped"] += 1
                    continue
                k = listing_key(normalized)
                if k in seen_in_run:
                    counts["intra_run_dupes"] += 1
                    continue
                seen_in_run.add(k)
                cleaned.append(normalized)
                counts["cleaned"] += 1

    print(
        f"[ingestion] raw={counts['raw']} cleaned={counts['cleaned']} "
        f"dropped={counts['dropped']} intra_run_dupes={counts['intra_run_dupes']}"
    )

    listing_stats = merge_save(LISTINGS_PATH, cleaned, key_fn=listing_key)
    print(f"[ingestion] {LISTINGS_PATH.name} → {listing_stats}")

    projects = [
        p for p in (_project_from_listing(L) for L in cleaned) if p is not None
    ]
    project_stats = merge_save(PROJECTS_PATH, projects, key_fn=project_key)
    print(f"[ingestion] {PROJECTS_PATH.name} → {project_stats}")

    return {
        "counts": counts,
        "listings": listing_stats,
        "projects": project_stats,
    }


if __name__ == "__main__":
    run()
