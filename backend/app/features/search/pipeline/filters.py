from typing import Any

from app.core.logging import get_pipeline_logger
from app.features.search.schemas import SearchIntent

log = get_pipeline_logger("search.filters")


def run(intent: SearchIntent, overrides: dict[str, Any] | None) -> dict[str, Any]:
    """Merge parsed intent with explicit filter overrides from the request."""
    log.info("building filters")
    
    # Base filters from intent
    filters = {
        "city": intent.location,
        "min_price": intent.budget_min,
        "max_price": intent.budget_max,
        "property_type": intent.property_type,
    }

    # Extract additional signals from raw_entities
    if intent.raw_entities:
        if "bhk" in intent.raw_entities:
            filters["min_bedrooms"] = intent.raw_entities["bhk"]
            filters["max_bedrooms"] = intent.raw_entities["bhk"]
        
        # Add other potential filters here
        if "listing_type" in intent.raw_entities:
            filters["listing_type"] = intent.raw_entities["listing_type"]
        elif intent.raw_entities.get("investment_intent") == "rental":
            filters["listing_type"] = "rent"
        elif intent.raw_entities.get("investment_intent") == "resale":
            filters["listing_type"] = "sale"

    # Apply overrides
    if overrides:
        filters.update(overrides)

    # Clean up None values
    return {k: v for k, v in filters.items() if v is not None}
