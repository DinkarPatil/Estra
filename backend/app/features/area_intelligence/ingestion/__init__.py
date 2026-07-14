"""Ingestion subpackage for area intelligence.

Two layers:
    scrapers/    — thin async adapters over external sources. Each function
                   takes an httpx client + host semaphore and returns raw,
                   typed data. No business logic, no DB writes.
    derivations/ — pure functions that compute MicroMarket columns from the
                   raw scraper outputs. No network, fully unit-testable.

The worker in app/workers/ingestion.py orchestrates: fetch raw data via
scrapers, pipe through derivations, upsert one MicroMarket row per area.
"""
