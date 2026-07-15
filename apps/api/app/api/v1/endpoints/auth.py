"""Authentication API endpoints.

Provides routes for:
- POST /auth/login       — Authenticate with email + password
- POST /auth/register    — Create a new account
- POST /auth/refresh     — Refresh an expired access token
- GET  /auth/me          — Get the current user's profile
- PUT  /auth/me          — Update the current user's profile
- POST /auth/change-password — Change password (authenticated)
- POST /auth/logout      — Invalidate tokens (no-op for JWT)
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from structlog.stdlib import get_logger

from app.api.deps import get_current_user_id, get_uow
from app.repositories import UnitOfWork
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError
from app.schemas.auth.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)
from app.schemas.response import success_response
from app.schemas.user.profile import ProfileUpdate, UserProfile, UserSettings
from app.services.auth import AuthenticationError, AuthService
from app.services.user import UserService

logger = get_logger(__name__)

router = APIRouter(prefix='/auth', tags=['auth'])


def _build_login_response(user, access_token, refresh_token, expires_at) -> dict:
    """Build the standard login response envelope."""
    return success_response(
        data=LoginResponse(
            user_id=user.id,
            email=user.email,
            username=user.username,
            display_name=user.display_name,
            role=user.role,
            tokens=TokenResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type='bearer',
                expires_at=expires_at,
            ),
        ).model_dump(mode='json'),
        message='Login successful',
    )


def _user_to_profile(user) -> UserProfile:
    """Convert a User ORM model to a UserProfile DTO."""
    return UserProfile(
        id=user.id,
        email=user.email,
        username=user.username,
        display_name=user.display_name,
        avatar_url=user.avatar_url,
        bio=user.bio,
        role=user.role,
        preferences=user.preferences or {},
        is_active=user.is_active,
        last_login_at=user.last_login_at,
        created_at=user.created_at,
    )


# ── Register ───────────────────────────────────────────────────────


@router.post('/register', status_code=status.HTTP_201_CREATED)
async def register(
    body: SignupRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Register a new user account.

    Creates a user with ``role='learner'`` and returns JWT tokens
    so the user is immediately authenticated.
    """
    auth_service = AuthService(uow)

    try:
        user = await auth_service.register(
            email=body.email,
            username=body.username,
            password=body.password,
            display_name=body.display_name,
        )
    except DuplicateEntityError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=exc.message,
        ) from exc

    access_token, expires_at = auth_service.create_access_token(user.id, user.role.value)
    refresh_token = auth_service.create_refresh_token(user.id)

    return _build_login_response(user, access_token, refresh_token, expires_at)


# ── Login ──────────────────────────────────────────────────────────


@router.post('/login')
async def login(
    body: LoginRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Authenticate a user with email and password.

    Returns JWT access and refresh tokens on success.
    """
    auth_service = AuthService(uow)

    try:
        user, access_token, refresh_token, expires_at = await auth_service.login(
            email=body.email,
            password=body.password,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={'WWW-Authenticate': 'Bearer'},
        ) from exc

    return _build_login_response(user, access_token, refresh_token, expires_at)


# ── Token Refresh ──────────────────────────────────────────────────


@router.post('/refresh')
async def refresh(
    body: RefreshRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Refresh an expired access token using a valid refresh token."""
    auth_service = AuthService(uow)

    try:
        user, access_token, refresh_token, expires_at = await auth_service.refresh_tokens(
            refresh_token=body.refresh_token,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=exc.message,
            headers={'WWW-Authenticate': 'Bearer'},
        ) from exc

    return _build_login_response(user, access_token, refresh_token, expires_at)


# ── Get Current User ───────────────────────────────────────────────


@router.get('/me')
async def get_me(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get the authenticated user's profile."""
    user_service = UserService(uow)

    try:
        user = await user_service.get_profile(current_user_id)
    except EntityNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        ) from e

    return success_response(
        data=_user_to_profile(user).model_dump(mode='json'),
        message='Profile retrieved',
    )


# ── Update Profile ─────────────────────────────────────────────────


@router.put('/me')
async def update_me(
    body: ProfileUpdate,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Update the authenticated user's profile."""
    user_service = UserService(uow)

    try:
        user = await user_service.update_profile(
            user_id=current_user_id,
            display_name=body.display_name,
            avatar_url=body.avatar_url,
            bio=body.bio,
            preferences=body.preferences,
        )
    except EntityNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        ) from e

    return success_response(
        data=_user_to_profile(user).model_dump(mode='json'),
        message='Profile updated',
    )


# ── Change Password ────────────────────────────────────────────────


@router.post('/change-password')
async def change_password(
    body: ChangePasswordRequest,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Change the authenticated user's password."""
    auth_service = AuthService(uow)

    try:
        await auth_service.change_password(
            user_id=current_user_id,
            current_password=body.current_password,
            new_password=body.new_password,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        ) from exc
    except EntityNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        ) from e

    return success_response(message='Password changed successfully')


# ── Logout ─────────────────────────────────────────────────────────


# ── Forgot Password ────────────────────────────────────────────


@router.post('/forgot-password')
async def forgot_password(
    body: ForgotPasswordRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Request a password reset.

    Generates a single-use reset token and returns it (in development)
    or sends it via email (in production).
    """
    auth_service = AuthService(uow)

    try:
        token = await auth_service.forgot_password(email=body.email)
    except EntityNotFoundError:
        # Don't reveal whether the email exists
        return success_response(
            message='If the email is registered, you will receive a reset link',
        )

    return success_response(
        data={'reset_token': token},
        message='Password reset token generated',
    )


# ── Reset Password ──────────────────────────────────────────────


@router.post('/reset-password')
async def reset_password(
    body: ResetPasswordRequest,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Reset a password using a valid reset token."""
    auth_service = AuthService(uow)

    try:
        await auth_service.reset_password(
            token=body.token,
            new_password=body.new_password,
        )
    except AuthenticationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=exc.message,
        ) from exc
    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail='Invalid or expired reset token',
        ) from exc

    return success_response(message='Password reset successfully')


# ── Preferences ────────────────────────────────────────────────


@router.get('/me/preferences')
async def get_preferences(
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get the authenticated user's preferences."""
    user_service = UserService(uow)
    try:
        user = await user_service.get_profile(current_user_id)
    except EntityNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        ) from e

    return success_response(
        data=user.preferences or {},
        message='Preferences retrieved',
    )


@router.put('/me/preferences')
async def update_preferences(
    body: UserSettings,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Update the authenticated user's preferences (partial merge).

    Accepts a partial UserSettings object.  Merges with existing
    preferences rather than replacing them.
    """
    user_service = UserService(uow)
    try:
        user = await user_service.get_profile(current_user_id)
    except EntityNotFoundError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail='User not found',
        ) from e

    # Merge new preferences into existing ones
    merged = {**(user.preferences or {}), **body.model_dump(exclude_none=True)}
    updated = await user_service.update_profile(
        user_id=current_user_id,
        preferences=merged,
    )

    return success_response(
        data=updated.preferences or {},
        message='Preferences updated',
    )


@router.post('/logout')
async def logout() -> dict:
    """Log out the current user.

    With stateless JWT tokens, logout is a client-side action
    (discard tokens).  This endpoint exists for API completeness
    and can later implement a token blacklist if needed.
    """
    return success_response(message='Logged out successfully')
