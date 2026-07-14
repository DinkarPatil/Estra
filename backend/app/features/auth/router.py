from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.features.auth import service
from app.features.auth.dependencies import get_current_user, get_token_from_header
from app.features.auth.models import User
from app.features.auth.schemas import (
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/register", response_model=UserResponse, status_code=201)
def register(body: RegisterRequest, db: Session = Depends(get_db)) -> User:
    return service.register_user(db, body)


@router.post("/login", response_model=TokenResponse)
def login(body: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return service.login_user(db, body)


@router.post("/refresh", response_model=TokenResponse)
def refresh(body: RefreshRequest, db: Session = Depends(get_db)) -> TokenResponse:
    return service.refresh_tokens(db, body)


@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)) -> User:
    return current_user


@router.post("/logout", response_model=MessageResponse)
def logout(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db),
) -> MessageResponse:
    service.logout_user(db, token)
    return MessageResponse(message="Logged out successfully")
