import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String
from sqlalchemy.orm import relationship

from app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    # SQLite doesn't store tzinfo, use naive UTC
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    name = Column(String, nullable=False)
    country = Column(String, nullable=False)
    role = Column(String, nullable=False, default="user")
    hashed_password = Column(String, nullable=False)
    is_active = Column(String, default="true")
    created_at = Column(DateTime, default=utcnow)
    updated_at = Column(DateTime, default=utcnow, onupdate=utcnow)

    refresh_tokens = relationship(
        "RefreshToken", back_populates="user", cascade="all, delete-orphan"
    )


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    token = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=utcnow)

    user = relationship("User", back_populates="refresh_tokens")


class BlockedToken(Base):
    __tablename__ = "blocked_tokens"

    id = Column(String, primary_key=True, default=generate_uuid)
    jti = Column(String, unique=True, nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    expires_at = Column(DateTime, nullable=False)
    blocked_at = Column(DateTime, default=utcnow)
