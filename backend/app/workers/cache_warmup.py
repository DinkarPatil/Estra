"""Pre-compute frequently-requested aggregates to keep p99 latency low."""

from app.core.logging import get_logger

log = get_logger("workers.cache_warmup")


def run() -> None:
    log.info("cache warmup tick")
    # TODO: warm top-N property detail + ROI responses
