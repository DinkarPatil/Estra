from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AuthError, ConflictError, DomainError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    utcnow_naive,
    verify_password,
)
from app.features.auth.models import BlockedToken, RefreshToken, User
from app.features.auth.schemas import (
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)

SELF_REGISTER_ROLES = {"user", "broker"}


def register_user(db: Session, body: RegisterRequest) -> User:
    email = body.email.lower()

    if body.role not in SELF_REGISTER_ROLES:
        raise DomainError(
            f"Cannot self-register as '{body.role}'. Only 'user' or 'broker' allowed.",
            status_code=400,
        )

    if db.query(User).filter(User.email == email).first():
        raise ConflictError("Email already registered")

    user = User(
        email=email,
        name=body.name,
        country=body.country,
        role=body.role,
        hashed_password=hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def _issue_tokens(db: Session, user: User) -> TokenResponse:
    token_data = {"sub": user.id, "role": user.role, "email": user.email.lower()}
    access_token, access_jti = create_access_token(token_data)
    refresh_token = create_refresh_token(token_data)

    db.add(
        RefreshToken(
            token=refresh_token,
            user_id=user.id,
            expires_at=utcnow_naive()
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
    )
    db.commit()

    return TokenResponse(
        access_token=access_token,
        access_jti=access_jti,
        refresh_token=refresh_token,
    )


def login_user(db: Session, body: LoginRequest) -> TokenResponse:
    user = db.query(User).filter(User.email == body.email.lower()).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise AuthError("Invalid email or password")
    return _issue_tokens(db, user)


def refresh_tokens(db: Session, body: RefreshRequest) -> TokenResponse:
    payload = decode_token(body.refresh_token)
    if not payload:
        raise AuthError("Invalid or expired refresh token")
    if payload.get("type") != "refresh":
        raise AuthError("Invalid token type: expected refresh token")

    db_token = (
        db.query(RefreshToken).filter(RefreshToken.token == body.refresh_token).first()
    )
    if not db_token:
        raise AuthError("Refresh token revoked")

    if db_token.expires_at < utcnow_naive():
        db.delete(db_token)
        db.commit()
        raise AuthError("Refresh token expired")

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user:
        raise AuthError("User not found")

    db.delete(db_token)
    db.flush()

    return _issue_tokens(db, user)


def logout_user(db: Session, token: str) -> None:
    payload = decode_token(token)
    if not payload or payload.get("type") != "access":
        raise AuthError("Invalid or expired token")

    jti = payload.get("jti")
    if not jti:
        raise DomainError("Token missing jti", status_code=400)

    exp = payload.get("exp")
    if exp:
        expires_at = datetime.fromtimestamp(exp, tz=timezone.utc).replace(tzinfo=None)
    else:
        expires_at = utcnow_naive() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    db.add(
        BlockedToken(
            jti=jti,
            user_id=payload["sub"],
            expires_at=expires_at,
        )
    )
    db.commit()
