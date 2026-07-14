"""Derive the `infra_news_impact` column from raw news items."""

from __future__ import annotations

from app.features.area_intelligence.ingestion.scrapers.news import NewsItem

_MAX_HEADLINES = 5


def summarize(items: list[NewsItem], *, area: str) -> str:
    if not items:
        return f"No recent news found for {area}."
    headlines: list[str] = []
    for it in items[:_MAX_HEADLINES]:
        title = it.title.strip()
        if not title:
            continue
        if it.source:
            headlines.append(f"{title} — {it.source}")
        else:
            headlines.append(title)
    if not headlines:
        return f"No recent news found for {area}."
    return " | ".join(headlines)
