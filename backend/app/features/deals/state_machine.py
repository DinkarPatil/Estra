from app.core.exceptions import DomainError

ALLOWED: dict[str, set[str]] = {
    "lead": {"offer", "rejected"},
    "offer": {"accepted", "rejected"},
    "accepted": {"closed"},
    "closed": set(),
    "rejected": set(),
}


def assert_transition(current: str, target: str) -> None:
    allowed = ALLOWED.get(current)
    if allowed is None:
        raise DomainError(f"Unknown deal status '{current}'", status_code=400)
    if target not in allowed:
        raise DomainError(
            f"Illegal transition {current} → {target}", status_code=400
        )
