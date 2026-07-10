"""User profile, settings, and summary DTOs."""

from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.enums import UserRole


class UserSummary(BaseModel):
    """Minimal user reference for embedding in other DTOs."""

    id: UUID = Field(description='Unique user identifier')
    username: str = Field(description='Public username', max_length=100)
    display_name: str | None = Field(default=None, description='Display name shown in UI')
    avatar_url: str | None = Field(default=None, description='Profile picture URL')


class UserProfile(BaseModel):
    """Full user profile returned by GET /me and GET /users/{id}."""

    id: UUID = Field(description='Unique user identifier')
    email: EmailStr = Field(description='Verified email address')
    username: str = Field(description='Public username', max_length=100)
    display_name: str | None = Field(
        default=None, description='Display name shown in UI', max_length=200
    )
    avatar_url: str | None = Field(default=None, description='Profile picture URL')
    bio: str | None = Field(default=None, description='Short biography', max_length=5000)
    role: UserRole = Field(description='Authorization role')
    preferences: dict = Field(default_factory=dict, description='User preferences')
    is_active: bool = Field(description='Whether the account is active')
    last_login_at: datetime | None = Field(default=None, description='Most recent login timestamp')
    created_at: datetime = Field(description='When the account was created')


class UserSettings(BaseModel):
    """User preferences and settings.

    Returned as part of the profile and accepted for updates.
    """

    theme: str | None = Field(
        default=None, description='UI theme preference', examples=['light', 'dark', 'system']
    )
    language: str | None = Field(
        default=None, description='UI language preference', examples=['en', 'es', 'fr']
    )
    email_notifications: bool | None = Field(
        default=None, description='Whether to receive email notifications'
    )
    learning_reminders: bool | None = Field(
        default=None, description='Whether to receive learning reminders'
    )

    @field_validator('theme')
    @classmethod
    def validate_theme(cls, v: str | None) -> str | None:
        if v is not None and v.lower() not in ('light', 'dark', 'system'):
            raise ValueError("Theme must be 'light', 'dark', or 'system'")
        return v.lower() if v else v


class ProfileUpdate(BaseModel):
    """Request contract for updating user profile."""

    display_name: str | None = Field(default=None, max_length=200, min_length=1)
    avatar_url: str | None = Field(default=None, description='New profile picture URL')
    bio: str | None = Field(default=None, max_length=5000)
    preferences: dict | None = Field(default=None, description='Updated preferences')
