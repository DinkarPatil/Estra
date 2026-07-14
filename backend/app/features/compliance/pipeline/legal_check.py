"""Legal screening — v1 deterministic.

For Indian residential property:
  - Indian buyers (or unspecified): no FEMA restriction → status 'clear'.
  - OCI / PIO buyers: permitted residential purchase → status 'clear' with note.
  - Foreign nationals (non-OCI/PIO) resident outside India: RBI/FEMA restricts
    direct purchase → status 'review' with explanation. Not 'blocked' because
    exceptions exist (long-term resident, inheritance) — flag for human review.

Returns a dict the orchestrator can serialize verbatim.
"""

from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("compliance.legal")

_INDIA_ALIASES = {"in", "india", "ind", "bharat"}
_OCI_PIO_ALIASES = {"oci", "pio", "nri"}


def run(property_id: str, buyer_country: str | None) -> dict:
    log.info(
        "legal check",
        extra={"property_id": property_id, "buyer_country": buyer_country},
    )

    country = (buyer_country or "").strip().lower()

    if not country or country in _INDIA_ALIASES:
        return {
            "status": "clear",
            "rule": "indian_resident_residential_purchase",
            "notes": "Indian residents may freely purchase residential property.",
        }

    if country in _OCI_PIO_ALIASES:
        return {
            "status": "clear",
            "rule": "oci_pio_residential_purchase",
            "notes": (
                "OCI/PIO buyers may purchase residential or commercial property "
                "in India under FEMA. Agricultural land, plantation, and farmhouse "
                "are excluded."
            ),
        }

    return {
        "status": "review",
        "rule": "foreign_buyer_fema_restriction",
        "notes": (
            f"Buyer country '{buyer_country}' is outside India. RBI/FEMA generally "
            "restricts direct residential property purchase by non-residents who "
            "are not OCI/PIO. Manual review required to confirm eligibility."
        ),
    }
