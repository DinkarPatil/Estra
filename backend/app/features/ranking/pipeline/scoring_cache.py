"""Property scoring stage (cache-backed).

Mirrors ``scoring.run`` but reads from the in-memory JSON caches instead
of the DB. Used by the area-first flow after property retrieval.
"""

from app.features.area_intelligence.cache import find_area_for_property
from app.features.property_intelligence.cache import get_property


def run(property_ids: list[str], preferences: dict) -> list[tuple[str, float]]:
    """Score a set of properties against user preferences using cache data."""
    if not property_ids:
        return []

    scored_results = []
    for pid in property_ids:
        prop = get_property(pid)
        if not prop:
            continue

        score = 1.0

        area = find_area_for_property(prop.get("locality_text"), prop.get("city"))
        if area and area.final_area_score is not None:
            score += area.final_area_score / 50.0

        if preferences.get("investment_intent") == "rental" and area and area.demand_strength.value == "High":
            score += 0.5

        scored_results.append((pid, score))

    scored_results.sort(key=lambda x: x[1], reverse=True)
    return scored_results
