from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("ranking.explain")


def run(property_id: str, preferences: dict) -> list[str]:
    """Produce a short list of human-readable reasons for a score."""
    log.info("explaining", extra={"property_id": property_id})
    # TODO(ritesh): surface top contributing factors
    raise NotImplementedError
