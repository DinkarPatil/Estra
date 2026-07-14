"""Rebuild search indexes over the property corpus."""

from app.core.logging import get_logger

log = get_logger("workers.reindex")


def run() -> None:
    log.info("reindex tick")
    # TODO: refresh full-text + vector indexes
