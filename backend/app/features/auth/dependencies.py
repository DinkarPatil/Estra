from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.exceptions import AuthError, ForbiddenError
from app.core.security import decode_token
from app.features.auth.models import BlockedToken, User

bearer_scheme = HTTPBearer(auto_error=False)


def get_token_from_header(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> str:
    if not credentials:
        raise AuthError("Missing authorization header")
    return credentials.credentials


def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db),
) -> User:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise AuthError("Invalid or expired token")

    jti = payload.get("jti")
    if jti and db.query(BlockedToken).filter(BlockedToken.jti == jti).first():
        raise AuthError("Token has been revoked")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise AuthError("User not found")
    return user


def require_role(*allowed: str):
    def _check(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed:
            raise ForbiddenError(
                f"Role '{user.role}' not permitted (requires {list(allowed)})"
            )
        return user

    return _check
