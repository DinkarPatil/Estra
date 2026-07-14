"""Pure functions that compute MicroMarket columns from scraped primitives.

No network, no DB. Each derivation takes raw scraper outputs as input and
returns the value for one (or a small cluster of) MicroMarket columns.
Tests for this module run without any I/O.

Populated incrementally as scrapers come online. Expected modules:
    news_summary.py  — headline list → infra_news_impact string
    sentiment.py     — headlines → recent_news_sentiment
    price_metrics.py — listings → historical_price_trend_pct, volatility_index
    roi.py           — sale + rent medians → roi_trend_pct
    demand.py        — sale/rent listing counts → rental_demand_strength
"""
