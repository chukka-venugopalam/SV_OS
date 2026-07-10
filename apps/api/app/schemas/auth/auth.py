"""Authentication request/response DTOs.

These schemas define the API contract for authentication endpoints:
login, signup, token refresh, and password management.
"""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserRole


class LoginRequest(BaseModel):
    """Request body for user login."""

    email: EmailStr = Field(description='Registered email address')
    password: str = Field(description='User password', min_length=6, max_length=128)


class SignupRequest(BaseModel):
    """Request body for user registration."""

    email: EmailStr = Field(description='Email address')
    username: str = Field(
        description='Public username', min_length=3, max_length=100, pattern=r'^[a-zA-Z0-9_]+$'
    )
    password: str = Field(description='Password', min_length=8, max_length=128)
    display_name: str | None = Field(default=None, description='Display name', max_length=200)

    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v.strip():
            raise ValueError('Username cannot be empty')
        return v.strip().lower()

    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class TokenResponse(BaseModel):
    """JWT token pair returned on successful authentication."""

    access_token: str = Field(description='JWT access token')
    refresh_token: str = Field(description='JWT refresh token')
    token_type: str = Field(default='bearer', description='Token type')
    expires_at: datetime = Field(description='Access token expiration timestamp')


class LoginResponse(BaseModel):
    """Response returned after successful login."""

    user_id: UUID = Field(description='Authenticated user ID')
    email: str = Field(description='User email')
    username: str = Field(description='Username')
    display_name: str | None = Field(default=None, description='Display name')
    role: UserRole = Field(description='User role')
    tokens: TokenResponse = Field(description='JWT token pair')


class RefreshRequest(BaseModel):
    """Request body for token refresh."""

    refresh_token: str = Field(description='Valid refresh token')


class ChangePasswordRequest(BaseModel):
    """Request body for password change (authenticated)."""

    current_password: str = Field(description='Current password', min_length=1)
    new_password: str = Field(description='New password', min_length=8, max_length=128)


class ForgotPasswordRequest(BaseModel):
    """Request body for password reset email."""

    email: EmailStr = Field(description='Registered email address')


class ResetPasswordRequest(BaseModel):
    """Request body for password reset with token."""

    token: str = Field(description='Password reset token')
    new_password: str = Field(description='New password', min_length=8, max_length=128)
