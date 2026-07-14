"""Recompute ranking/ROI/risk scores on a cadence."""

from app.core.logging import get_logger

log = get_logger("workers.scoring_refresh")


def run() -> None:
    log.info("scoring refresh tick")
    # TODO: batch recompute scores, cache to scoring tables
