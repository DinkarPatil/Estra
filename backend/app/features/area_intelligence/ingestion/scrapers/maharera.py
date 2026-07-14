"""MahaRERA public-record scrapers.

Two server-rendered Drupal tables on maharera.maharashtra.gov.in carry
structured data usable today:

    /project-complaint-report                       — paginated (~670 pages of 10)
    /list-projects-suspended-abeyance-deregistered  — single page of ~50 rows

Both expose project name but NOT project location. Area attribution is done
downstream in derivations/legal_signals.py by substring-matching the project
name against target-area names — imperfect; the raw lists are preserved in
raw_data_dump so a better match can be applied later.

The richer project-search endpoint (/projects-search-result) is
JavaScript-rendered and not reachable via plain HTTP; supply_pressure and
developer_concentration wait on a separate commit that either reverse-
engineers its XHR API or adds a headless browser.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass

import httpx
from bs4 import BeautifulSoup

from app.core.logging import get_pipeline_logger

from ._http import HostLimiter

log = get_pipeline_logger("area.maharera")

HOST = "maharera.maharashtra.gov.in"
_BASE = f"https://{HOST}"
_COMPLAINTS_PATH = "/project-complaint-report"
_SUSPENDED_PATH = "/list-projects-suspended-abeyance-deregistered"

DEFAULT_COMPLAINT_PAGES = 50  # 500 most-listed complaints


@dataclass(frozen=True)
class Complaint:
    project_name: str
    count: int


@dataclass(frozen=True)
class SuspendedProject:
    project_name: str
    promoter: str
    registration_no: str
    planning_authority: str


def _parse_rows(html: str, expected_cols: int) -> list[list[str]]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table")
    if table is None:
        return []
    out: list[list[str]] = []
    for tr in table.find_all("tr"):
        cells = [td.get_text(" ", strip=True) for td in tr.find_all(["td", "th"])]
        if len(cells) >= expected_cols and cells[0].isdigit():
            out.append(cells)
    return out


async def _get(
    client: httpx.AsyncClient, limiter: HostLimiter, url: str
) -> str | None:
    sem = limiter.for_host(HOST)
    async with sem:
        try:
            r = await client.get(url)
            r.raise_for_status()
            return r.text
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            log.warning("MahaRERA fetch failed (%s): %s", url, exc)
            return None


async def fetch_complaints(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    *,
    max_pages: int = DEFAULT_COMPLAINT_PAGES,
) -> list[Complaint]:
    """Fetch up to `max_pages` of the MahaRERA complaint report."""
    # Page 0 and page 1 return identical data; start at 1 for clarity.
    urls = [f"{_BASE}{_COMPLAINTS_PATH}?page={p}" for p in range(1, max_pages + 1)]
    htmls = await asyncio.gather(
        *(_get(client, limiter, u) for u in urls), return_exceptions=False
    )

    seen: set[tuple[str, int]] = set()
    results: list[Complaint] = []
    for html in htmls:
        if not html:
            continue
        for row in _parse_rows(html, expected_cols=4):
            # row = [sr_no, project_name, complaint_count, view]
            name = row[1].strip()
            try:
                count = int(row[2])
            except ValueError:
                continue
            key = (name, count)
            if name and key not in seen:
                seen.add(key)
                results.append(Complaint(project_name=name, count=count))

    log.info("fetched %d MahaRERA complaints across %d pages", len(results), max_pages)
    return results


async def fetch_suspended(
    client: httpx.AsyncClient, limiter: HostLimiter
) -> list[SuspendedProject]:
    """Fetch the suspended/deregistered projects list (single page, ~50 rows)."""
    html = await _get(client, limiter, f"{_BASE}{_SUSPENDED_PATH}")
    if not html:
        return []

    results: list[SuspendedProject] = []
    for row in _parse_rows(html, expected_cols=6):
        # row = [sr_no, project_name, promoter, reg_no, planning_authority, view_order]
        results.append(
            SuspendedProject(
                project_name=row[1].strip(),
                promoter=row[2].strip(),
                registration_no=row[3].strip(),
                planning_authority=row[4].strip(),
            )
        )
    log.info("fetched %d MahaRERA suspended projects", len(results))
    return results
