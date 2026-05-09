from __future__ import annotations

import re
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.exceptions import BadRequestError, ConflictError, UnauthorizedError
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.models.tenant import Tenant
from app.models.user import User
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    SignupRequest,
    TokenResponse,
    UserResponse,
)
from app.dependencies import get_current_user
from app.services.system_email_service import send_verification_email

router = APIRouter(prefix="/auth", tags=["auth"])

VERIFICATION_TOKEN_EXPIRE_HOURS = 24


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_-]+", "-", text)
    return text[:100]


def _make_verification_token() -> tuple[str, datetime]:
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=VERIFICATION_TOKEN_EXPIRE_HOURS)
    return token, expires_at


@router.post("/signup", response_model=TokenResponse)
async def signup(request: SignupRequest, db: AsyncSession = Depends(get_db)):
    # Check if email already exists
    result = await db.execute(select(User).where(User.email == request.email))
    if result.scalar_one_or_none():
        raise ConflictError("Email already registered")

    # Create tenant
    slug = slugify(request.company_name)
    existing = await db.execute(select(Tenant).where(Tenant.slug == slug))
    if existing.scalar_one_or_none():
        slug = f"{slug}-{uuid.uuid4().hex[:6]}"

    tenant = Tenant(
        name=request.company_name,
        slug=slug,
        settings={
            "widget_color": "#6366f1",
            "widget_position": "bottom-right",
            "greeting_message": "Hi! How can I help you today?",
            "onboarding_completed": False,
        },
    )
    db.add(tenant)
    await db.flush()

    # Generate verification token
    token, expires_at = _make_verification_token()

    # Create owner user (unverified)
    user = User(
        tenant_id=tenant.id,
        email=request.email,
        password_hash=hash_password(request.password),
        full_name=request.full_name,
        role="owner",
        is_email_verified=False,
        email_verification_token=token,
        email_verification_expires_at=expires_at,
    )
    db.add(user)
    await db.flush()
    await db.commit()

    # Send verification email (non-blocking — don't fail signup if email fails)
    await send_verification_email(request.email, request.full_name, token)

    token_data = {"sub": str(user.id), "tenant_id": str(tenant.id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == request.email))
    user = result.scalar_one_or_none()

    if user is None or not verify_password(request.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    if not user.is_active:
        raise UnauthorizedError("Account is disabled")

    token_data = {"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshRequest, db: AsyncSession = Depends(get_db)):
    payload = decode_token(request.refresh_token)
    if payload is None or payload.get("type") != "refresh":
        raise UnauthorizedError("Invalid refresh token")

    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()

    if user is None or not user.is_active:
        raise UnauthorizedError("User not found or inactive")

    token_data = {"sub": str(user.id), "tenant_id": str(user.tenant_id), "role": user.role}
    return TokenResponse(
        access_token=create_access_token(token_data),
        refresh_token=create_refresh_token(token_data),
    )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/verify-email")
async def verify_email(token: str, db: AsyncSession = Depends(get_db)):
    """Verify email address via token from the verification email."""
    result = await db.execute(
        select(User).where(User.email_verification_token == token)
    )
    user = result.scalar_one_or_none()

    if not user:
        raise BadRequestError("Invalid or expired verification link")

    if user.is_email_verified:
        return {"detail": "Email already verified"}

    if user.email_verification_expires_at and user.email_verification_expires_at < datetime.now(timezone.utc):
        raise BadRequestError("Verification link has expired. Please request a new one.")

    user.is_email_verified = True
    user.email_verification_token = None
    user.email_verification_expires_at = None
    await db.commit()

    return {"detail": "Email verified successfully"}


@router.post("/resend-verification")
async def resend_verification(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Resend the email verification link."""
    if current_user.is_email_verified:
        return {"detail": "Email already verified"}

    token, expires_at = _make_verification_token()
    current_user.email_verification_token = token
    current_user.email_verification_expires_at = expires_at
    await db.commit()

    await send_verification_email(current_user.email, current_user.full_name or "", token)
    return {"detail": "Verification email sent"}
