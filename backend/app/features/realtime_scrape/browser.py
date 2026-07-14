"""
Lazy Playwright browser pool for sites that block plain ``requests``.

Strategy:
  - One async Chromium browser instance, reused across calls (heavy startup).
  - Each scrape opens a fresh BrowserContext (cookies isolated, fast to spin).
  - Realistic UA + viewport + locale to defeat basic bot fingerprints.
  - 18s timeout per page; failures bubble up so the orchestrator can fall back
    to the requests path.

Playwright is an OPTIONAL dependency. If `playwright` is not installed or the
browser binary is missing, ``fetch_rendered`` returns None and the scraper
falls back to plain HTTP. This keeps the backend bootable even when the
extras aren't installed.
"""

from __future__ import annotations

import asyncio
import random
from typing import Optional

from app.core.logging import get_logger

log = get_logger("realtime_scrape.browser")

_VIEWPORTS = [
    {"width": 1366, "height": 768},
    {"width": 1440, "height": 900},
    {"width": 1536, "height": 864},
]
_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_5) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

_lock = asyncio.Lock()
_pw = None
_browser = None
_disabled = False  # turns True once we've established Playwright isn't usable


async def _ensure_browser():
    """Lazily start Playwright + a single Chromium instance. Cached."""
    global _pw, _browser, _disabled
    if _disabled:
        return None
    if _browser is not None:
        return _browser
    async with _lock:
        if _browser is not None:
            return _browser
        try:
            from playwright.async_api import async_playwright  # type: ignore
        except ImportError:
            log.warning("playwright not installed; browser pool disabled")
            _disabled = True
            return None
        try:
            _pw = await async_playwright().start()
            _browser = await _pw.chromium.launch(
                headless=True,
                args=[
                    "--disable-blink-features=AutomationControlled",
                    "--disable-dev-shm-usage",
                    "--no-sandbox",
                ],
            )
            log.info("playwright chromium launched")
            return _browser
        except Exception as e:
            log.warning("playwright launch failed: %s — disabling", e)
            _disabled = True
            return None


async def fetch_rendered(
    url: str,
    *,
    wait_for_selector: Optional[str] = None,
    wait_until: str = "domcontentloaded",
    timeout_ms: int = 18_000,
    extra_wait_ms: int = 1500,
    scroll: bool = False,
) -> Optional[str]:
    """Render a URL with Chromium and return final HTML, or None on failure.

    When ``scroll`` is true, scrolls the page after the initial render to
    trigger lazy-load hydration in SPA listings (NoBroker, etc.).
    """
    browser = await _ensure_browser()
    if browser is None:
        return None

    context = None
    try:
        context = await browser.new_context(
            viewport=random.choice(_VIEWPORTS),
            user_agent=random.choice(_USER_AGENTS),
            locale="en-IN",
            timezone_id="Asia/Kolkata",
            extra_http_headers={
                "Accept-Language": "en-IN,en;q=0.9",
            },
        )
        page = await context.new_page()
        # Apply stealth patches to defeat headless-Chromium fingerprinting
        # (navigator.webdriver, plugin/language props, WebGL vendor, etc.)
        # used by Akamai + similar bot walls (99acres, Housing).
        try:
            from playwright_stealth import stealth_async  # type: ignore
            await stealth_async(page)
        except Exception:
            pass  # not fatal — falls back to plain Chromium
        # Block heavy assets to keep latency tight (we still allow images for
        # card thumbnails — but block fonts, media, analytics).
        async def _route(route):
            r_type = route.request.resource_type
            if r_type in ("font", "media", "websocket"):
                await route.abort()
            else:
                await route.continue_()
        await page.route("**/*", _route)

        await page.goto(url, wait_until=wait_until, timeout=timeout_ms)
        if wait_for_selector:
            try:
                await page.wait_for_selector(wait_for_selector, timeout=timeout_ms)
            except Exception:
                pass  # not fatal — we still capture whatever rendered
        if extra_wait_ms > 0:
            await page.wait_for_timeout(extra_wait_ms)
        if scroll:
            # Trigger lazy-loaded cards by scrolling the page in stages.
            for y in (600, 1200, 1800, 2400):
                try:
                    await page.evaluate(f"window.scrollTo(0, {y});")
                    await page.wait_for_timeout(800)
                except Exception:
                    break
        html = await page.content()
        return html
    except Exception as e:
        log.warning("rendered fetch failed for %s: %s", url, e)
        return None
    finally:
        if context is not None:
            try:
                await context.close()
            except Exception:
                pass


async def shutdown():
    """Optional clean-shutdown hook for the FastAPI lifespan."""
    global _pw, _browser
    if _browser is not None:
        try:
            await _browser.close()
        except Exception:
            pass
        _browser = None
    if _pw is not None:
        try:
            await _pw.stop()
        except Exception:
            pass
        _pw = None
