"""Tax screening — v1 deterministic.

Stamp duty + registration estimates for Maharashtra (the only state in scope
right now). For non-Indian buyers we additionally flag TDS u/s 195 awareness.
Numbers are illustrative MVP defaults — refine with real conveyancing data
post-demo.
"""

from app.core.logging import get_pipeline_logger

log = get_pipeline_logger("compliance.tax")

# Maharashtra urban-area defaults (Mumbai/Pune municipal limits).
_STAMP_DUTY_RATE = 0.06  # 6% (5% stamp + 1% metro/local cess in Mumbai)
_REGISTRATION_RATE = 0.01  # 1% of agreement value, capped at ₹30k
_REGISTRATION_CAP = 30_000

_INDIA_ALIASES = {"in", "india", "ind", "bharat"}
_OCI_PIO_ALIASES = {"oci", "pio", "nri"}


def run(property_id: str, buyer_country: str | None) -> dict:
    log.info(
        "tax check",
        extra={"property_id": property_id, "buyer_country": buyer_country},
    )

    country = (buyer_country or "").strip().lower()
    is_indian = (not country) or country in _INDIA_ALIASES
    is_oci_pio = country in _OCI_PIO_ALIASES

    notes = [
        f"Stamp duty (Maharashtra urban): ~{_STAMP_DUTY_RATE * 100:.0f}% of agreement value.",
        f"Registration: {_REGISTRATION_RATE * 100:.0f}% (capped at ₹{_REGISTRATION_CAP:,}).",
    ]

    if is_indian:
        return {
            "status": "clear",
            "stamp_duty_rate": _STAMP_DUTY_RATE,
            "registration_rate": _REGISTRATION_RATE,
            "registration_cap_inr": _REGISTRATION_CAP,
            "notes": " ".join(notes),
        }

    if is_oci_pio:
        notes.append(
            "OCI/PIO purchase: same stamp/registration regime as residents. "
            "Repatriation of sale proceeds permitted up to original FX inward remittance."
        )
        return {
            "status": "clear",
            "stamp_duty_rate": _STAMP_DUTY_RATE,
            "registration_rate": _REGISTRATION_RATE,
            "registration_cap_inr": _REGISTRATION_CAP,
            "notes": " ".join(notes),
        }

    notes.append(
        f"Cross-border buyer ({buyer_country}): TDS under Section 195 may apply on "
        "any subsequent sale; double-taxation treaty (DTAA) status needs review."
    )
    return {
        "status": "review",
        "stamp_duty_rate": _STAMP_DUTY_RATE,
        "registration_rate": _REGISTRATION_RATE,
        "registration_cap_inr": _REGISTRATION_CAP,
        "notes": " ".join(notes),
    }
