"""Shared HTTP primitives for area-intelligence scrapers.

All scrapers share one httpx.AsyncClient (connection pool reuse) and a
HostLimiter that vends per-host asyncio semaphores so concurrent scrapers
against the same domain stay polite.
"""

from __future__ import annotations

import asyncio

import httpx

USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)
REQUEST_TIMEOUT = 15.0
DEFAULT_PER_HOST = 3


def new_client(timeout: float = REQUEST_TIMEOUT) -> httpx.AsyncClient:
    return httpx.AsyncClient(
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en-IN,en;q=0.9"},
        timeout=timeout,
        follow_redirects=True,
    )


class HostLimiter:
    """Vends a stable asyncio.Semaphore per host, created on first request."""

    def __init__(self, default: int = DEFAULT_PER_HOST) -> None:
        self._default = default
        self._sems: dict[str, asyncio.Semaphore] = {}
        self._overrides: dict[str, int] = {}

    def set_limit(self, host: str, limit: int) -> None:
        """Pin a non-default limit for a host. Must be called before first use."""
        self._overrides[host] = limit

    def for_host(self, host: str) -> asyncio.Semaphore:
        if host not in self._sems:
            limit = self._overrides.get(host, self._default)
            self._sems[host] = asyncio.Semaphore(limit)
        return self._sems[host]
