"""Derive `legal_regulatory_friction` and `legal_approval_signals` from
MahaRERA complaint + suspended-project records.

Area attribution is substring-based on project names (the only identifier
MahaRERA's public tables expose). Known limitation: projects named after
people or brands rather than localities won't match any area; and a project
named "Hadapsar Infra" may be registered elsewhere. Raw matched lists are
returned in the approval-signals dict so downstream normalization can
refine the match.
"""

from __future__ import annotations

from typing import Any

from app.features.area_intelligence.ingestion.scrapers.maharera import (
    Complaint,
    SuspendedProject,
)

_MAX_NAMED_EXAMPLES = 3


def _match(project_name: str, area: str) -> bool:
    return area.lower() in project_name.lower()


def friction_text(complaints: list[Complaint], *, area: str) -> str:
    matches = [c for c in complaints if _match(c.project_name, area)]
    if not matches:
        return f"No MahaRERA complaints match projects named after {area}."

    total = sum(c.count for c in matches)
    project_count = len(matches)
    top = sorted(matches, key=lambda c: c.count, reverse=True)[:_MAX_NAMED_EXAMPLES]
    examples = ", ".join(f"{c.project_name} ({c.count})" for c in top)
    return (
        f"{total} MahaRERA complaints across {project_count} "
        f"{area}-named project(s). Notable: {examples}. "
        f"(Match is by project-name substring; location-based match requires "
        f"the JS-locked project-search endpoint.)"
    )


def approval_signals(
    suspended: list[SuspendedProject], *, area: str
) -> dict[str, Any]:
    matches = [s for s in suspended if _match(s.project_name, area)]
    return {
        "suspended_project_count": len(matches),
        "suspended_projects": [
            {
                "name": s.project_name,
                "promoter": s.promoter,
                "registration_no": s.registration_no,
                "planning_authority": s.planning_authority,
            }
            for s in matches
        ],
        "match_method": "project_name_substring",
    }
