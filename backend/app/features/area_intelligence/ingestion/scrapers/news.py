"""Google News RSS scraper.

Replaces the DuckDuckGo HTML approach. RSS is structured, has no anti-bot
defenses, and Google News already aggregates across Indian publications
(TOI, Hindustan Times, Indian Express, Pune Mirror, Economic Times, etc.).

Returns raw NewsItem records — derivation into `infra_news_impact` and
`recent_news_sentiment` lives in derivations/.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass
from urllib.parse import quote_plus
from xml.etree import ElementTree as ET

import httpx

from app.core.logging import get_pipeline_logger

from ._http import HostLimiter

log = get_pipeline_logger("area.news")

HOST = "news.google.com"
_BASE_URL = "https://news.google.com/rss/search"


@dataclass(frozen=True)
class NewsItem:
    title: str
    source: str | None
    published: str | None
    link: str


def _build_url(area: str, city: str) -> str:
    query = f"{area} {city} real estate OR infrastructure OR metro"
    return (
        f"{_BASE_URL}?q={quote_plus(query)}"
        f"&hl=en-IN&gl=IN&ceid=IN:en"
    )


def _parse_rss(xml_bytes: bytes, limit: int) -> list[NewsItem]:
    root = ET.fromstring(xml_bytes)
    items: list[NewsItem] = []
    for it in root.findall(".//item")[:limit]:
        items.append(
            NewsItem(
                title=(it.findtext("title") or "").strip(),
                # Google News emits <source url="...">Publication Name</source>
                source=(
                    (it.find("source").text or "").strip()
                    if it.find("source") is not None
                    else None
                ),
                published=(it.findtext("pubDate") or None),
                link=(it.findtext("link") or "").strip(),
            )
        )
    return items


async def fetch_news(
    client: httpx.AsyncClient,
    limiter: HostLimiter,
    area: str,
    city: str,
    *,
    limit: int = 8,
) -> list[NewsItem]:
    url = _build_url(area, city)
    sem = limiter.for_host(HOST)
    async with sem:
        try:
            response = await client.get(url)
            response.raise_for_status()
        except (httpx.HTTPError, asyncio.TimeoutError) as exc:
            log.warning("news fetch failed for %s: %s", area, exc)
            return []

    try:
        return _parse_rss(response.content, limit)
    except ET.ParseError as exc:
        log.warning("news RSS parse failed for %s: %s", area, exc)
        return []
