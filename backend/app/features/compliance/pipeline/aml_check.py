"""AML / sanctions screening — v1 deterministic stub.

There is no real sanctions list wired up at MVP. We return a 'clear' result by
default with a transparent note, so the orchestrator can compose a complete
ComplianceResponse instead of crashing. Replace this with a real OFAC / UN /
MahaRERA-suspended-developer screen when the data feed is available.
"""

from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("compliance.aml")


def run(property_id: str) -> dict:
    log.info("aml check", extra={"property_id": property_id})
    return {
        "status": "clear",
        "rule": "default_clear",
        "notes": (
            "MVP placeholder — no live AML/sanctions feed is wired. "
            "Treat as advisory; production must screen against OFAC, UN, "
            "and MahaRERA suspension lists."
        ),
    }
