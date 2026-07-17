"""Authentication service — JWT, password hashing, login, register, refresh.

This service is designed so it can later delegate to Supabase Auth
by swapping the internal JWT/password logic for Supabase client calls
without changing the service interface.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from hashlib import sha256
from secrets import token_urlsafe
from typing import Any
from uuid import UUID

from jose import JWTError, jwt
from passlib.context import CryptContext
from structlog.stdlib import get_logger

from app.core.config import settings
from app.exceptions.base import AppError
from app.models.enums import UserRole
from app.models.user import User
from app.repositories import UnitOfWork
from app.repositories.errors import DuplicateEntityError, EntityNotFoundError

logger = get_logger(__name__)

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=['bcrypt'], deprecated='auto')


class AuthenticationError(AppError):
    """Raised when authentication fails (invalid credentials, expired token, etc.)."""

    def __init__(self, message: str = 'Authentication failed') -> None:
        super().__init__(message=message, status_code=401)


class AuthorizationError(AppError):
    """Raised when the user lacks permission for an action."""

    def __init__(self, message: str = 'Not authorized') -> None:
        super().__init__(message=message, status_code=403)


class AuthService:
    """Handles user authentication and authorization.

    Provides password hashing, JWT token management, user registration,
    login, token refresh, and role-based access control.

    Design note: This service encapsulates all auth logic so that a
    future migration to Supabase Auth only requires reimplementing the
    methods in this class — the API layer and frontend remain unchanged.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._secret_key = settings.SECRET_KEY
        self._algorithm = 'HS256'
        self._access_token_expire_minutes = settings.ACCESS_TOKEN_EXPIRE_MINUTES
        self._refresh_token_expire_days = settings.REFRESH_TOKEN_EXPIRE_DAYS

    # ── Password Management ────────────────────────────────────────

    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a plaintext password using bcrypt."""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str | None) -> bool:
        """Verify a plaintext password against its bcrypt hash.

        Returns ``False`` if the hashed password is ``None`` (e.g. for
        OAuth-only users who haven't set a password).
        """
        if not hashed_password:
            return False
        return pwd_context.verify(plain_password, hashed_password)

    # ── JWT Token Management ───────────────────────────────────────

    def _create_token(self, data: dict[str, Any], expires_delta: timedelta) -> str:
        """Create a JWT token with the given payload and expiration."""
        to_encode = data.copy()
        expire = datetime.now(UTC) + expires_delta
        to_encode.update({'exp': expire, 'iat': datetime.now(UTC)})
        return jwt.encode(to_encode, self._secret_key, algorithm=self._algorithm)

    def create_access_token(self, user_id: UUID, role: str | UserRole = 'learner') -> tuple[str, datetime]:
        """Create a short-lived JWT access token.

        Returns a tuple of ``(token, expires_at)``.
        """
        expires_delta = timedelta(minutes=self._access_token_expire_minutes)
        expires_at = datetime.now(UTC) + expires_delta
        token = self._create_token(
            {'sub': str(user_id), 'role': role, 'type': 'access'},
            expires_delta,
        )
        return token, expires_at

    def create_refresh_token(self, user_id: UUID) -> str:
        """Create a long-lived JWT refresh token."""
        expires_delta = timedelta(days=self._refresh_token_expire_days)
        return self._create_token(
            {'sub': str(user_id), 'type': 'refresh'},
            expires_delta,
        )

    def decode_token(self, token: str) -> dict[str, Any]:
        """Decode and validate a JWT token.

        Raises ``AuthenticationError`` if the token is invalid or expired.
        """
        try:
            payload = jwt.decode(token, self._secret_key, algorithms=[self._algorithm])
            return payload
        except JWTError as exc:
            raise AuthenticationError(f'Invalid or expired token: {exc}') from exc

    def get_user_id_from_token(self, token: str) -> UUID:
        """Extract the user ID from a JWT token (access or refresh).

        Raises ``AuthenticationError`` if the token is invalid.
        """
        payload = self.decode_token(token)
        sub = payload.get('sub')
        if not sub:
            raise AuthenticationError('Token missing subject claim')
        try:
            return UUID(sub)
        except ValueError as exc:
            raise AuthenticationError(f'Invalid user ID in token: {exc}') from exc

    # ── Registration ───────────────────────────────────────────────

    async def register(
        self,
        email: str,
        username: str,
        password: str,
        display_name: str | None = None,
    ) -> User:
        """Register a new user account.

        Args:
            email: Verified email address.
            username: Public username (must be unique).
            password: Plaintext password (will be hashed).
            display_name: Optional display name.

        Returns:
            The newly created ``User`` instance.

        Raises:
            ``DuplicateEntityError`` if email or username already exists.
        """
        # Check for existing email
        existing_email = await self._uow.users.find_by_email(email)
        if existing_email:
            raise DuplicateEntityError('User', {'email': email})

        # Check for existing username
        existing_username = await self._uow.users.find_by_username(username)
        if existing_username:
            raise DuplicateEntityError('User', {'username': username})

        # Create user
        password_hash = self.hash_password(password)
        user = await self._uow.users.create(
            email=email,
            username=username,
            display_name=display_name,
            password_hash=password_hash,
            role=UserRole.LEARNER,
            preferences={},
        )

        logger.info('user_registered', user_id=str(user.id), username=username)
        return user

    # ── Login ──────────────────────────────────────────────────────

    async def login(self, email: str, password: str) -> tuple[User, str, str, datetime]:
        """Authenticate a user by email and password.

        Args:
            email: Registered email address.
            password: Plaintext password.

        Returns:
            A tuple of ``(user, access_token, refresh_token, expires_at)``.

        Raises:
            ``AuthenticationError`` if credentials are invalid or
            the account is inactive/deleted.
        """
        user = await self._uow.users.find_by_email(email)
        if not user:
            raise AuthenticationError('Invalid email or password')

        if user.is_deleted:
            raise AuthenticationError('Account not found')

        if not user.is_active:
            raise AuthenticationError('Account is deactivated')

        if not self.verify_password(password, user.password_hash):
            raise AuthenticationError('Invalid email or password')

        # Record login
        user.last_login_at = datetime.now(UTC)
        await self._uow.flush()

        # Generate tokens
        access_token, expires_at = self.create_access_token(user.id, user.role)
        refresh_token = self.create_refresh_token(user.id)

        logger.info('user_logged_in', user_id=str(user.id))
        return user, access_token, refresh_token, expires_at

    # ── Token Refresh ──────────────────────────────────────────────

    async def refresh_tokens(self, refresh_token: str) -> tuple[User, str, str, datetime]:
        """Refresh an expired access token using a valid refresh token.

        Args:
            refresh_token: A valid JWT refresh token.

        Returns:
            A tuple of ``(user, access_token, refresh_token, expires_at)``.
        """
        payload = self.decode_token(refresh_token)
        if payload.get('type') != 'refresh':
            raise AuthenticationError('Invalid token type for refresh')

        user_id = self.get_user_id_from_token(refresh_token)
        user = await self._uow.users.get_by_id(user_id)
        if not user:
            raise AuthenticationError('User not found')

        if not user.is_active:
            raise AuthenticationError('Account is deactivated')

        # Generate new token pair
        access_token, expires_at = self.create_access_token(user.id, user.role)
        new_refresh_token = self.create_refresh_token(user.id)

        return user, access_token, new_refresh_token, expires_at

    # ── Password Change ────────────────────────────────────────────

    async def change_password(
        self,
        user_id: UUID,
        current_password: str,
        new_password: str,
    ) -> None:
        """Change a user's password after verifying the current password."""
        user = await self._uow.users.get_by_id(user_id)
        if not user:
            raise EntityNotFoundError('User', user_id)

        if not self.verify_password(current_password, user.password_hash):
            raise AuthenticationError('Current password is incorrect')

        await self._uow.users.update(
            user_id,
            password_hash=self.hash_password(new_password),
        )

        logger.info('password_changed', user_id=str(user_id))

    # ── User Lookup ────────────────────────────────────────────────

    async def get_authenticated_user(self, user_id: UUID) -> User | None:
        """Get the authenticated user by ID, respecting active/deleted state."""
        user = await self._uow.users.get_by_id(user_id)
        if not user or not user.is_active:
            return None
        return user

    # ── Password Reset ─────────────────────────────────────────

    async def forgot_password(self, email: str) -> str:
        """Generate a password reset token for the user with the given email.

        Args:
            email: Registered email address.

        Returns:
            The plain-text reset token (to be sent via email or returned in dev).

        Raises:
            ``EntityNotFoundError`` if the email is not registered.
            Note: In production, always return success to prevent email enumeration.
        """
        user = await self._uow.users.find_by_email(email)
        if not user:
            # Don't reveal whether the email exists
            raise EntityNotFoundError('User', email)

        # Invalidate any existing tokens for this user
        await self._uow.password_reset_tokens.invalidate_user_tokens(user.id)

        # Generate a secure random token
        raw_token = token_urlsafe(48)
        token_hash = sha256(raw_token.encode()).hexdigest()

        # Token expires in 1 hour
        expires_at = datetime.now(UTC) + timedelta(hours=1)

        await self._uow.password_reset_tokens.create(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )

        logger.info(
            'password_reset_token_generated',
            user_id=str(user.id),
            expires_at=expires_at.isoformat(),
        )

        return raw_token

    async def reset_password(self, token: str, new_password: str) -> None:
        """Reset a user's password using a valid reset token.

        Args:
            token: The plain-text reset token received via email.
            new_password: The new password to set.

        Raises:
            ``AuthenticationError`` if the token is invalid, expired, or already used.
        """
        token_hash = sha256(token.encode()).hexdigest()
        reset_token = await self._uow.password_reset_tokens.find_valid_token(token_hash)

        if not reset_token:
            raise AuthenticationError('Invalid or expired reset token')

        # Change the password
        password_hash = self.hash_password(new_password)
        await self._uow.users.update(
            reset_token.user_id,
            password_hash=password_hash,
        )

        # Mark token as used and invalidate any other active tokens
        await self._uow.password_reset_tokens.mark_as_used(reset_token.id)
        await self._uow.password_reset_tokens.invalidate_user_tokens(reset_token.user_id)

        logger.info('password_reset_completed', user_id=str(reset_token.user_id))

    # ── Role Checking ──────────────────────────────────────────────

    @staticmethod
    def require_role(user: Any, required_role: str) -> None:
        """Check that a user has the required role.

        Raises ``AuthorizationError`` if the role check fails.
        """
        user_role = getattr(user, 'role', None)
        if user_role is None:
            raise AuthorizationError('User has no role assigned')

        role_value = user_role.value if hasattr(user_role, 'value') else str(user_role)
        if role_value != required_role and required_role == 'admin':
            raise AuthorizationError('Admin access required')


# Convenience function for password hashing (used by seed scripts, etc.)
def hash_password(password: str) -> str:
    """Hash a password using bcrypt (standalone utility)."""
    return AuthService.hash_password(password)


def verify_password(plain_password: str, hashed_password: str | None) -> bool:
    """Verify a password against its hash (standalone utility)."""
    return AuthService.verify_password(plain_password, hashed_password)
