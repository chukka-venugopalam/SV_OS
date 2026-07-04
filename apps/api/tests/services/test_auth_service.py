"""Tests for the AuthService — password hashing, JWT, registration, login, refresh.

These tests verify the core authentication logic without requiring a
running database by mocking the UnitOfWork and UserRepository.
"""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.repositories.errors import DuplicateEntityError, EntityNotFoundError
from app.services.auth import AuthService, AuthenticationError, AuthorizationError, hash_password, verify_password


# ── Fixtures ───────────────────────────────────────────────────────

@pytest.fixture
def mock_uow():
    """Create a mock UnitOfWork with a mock users repository."""
    uow = MagicMock()
    uow.users = AsyncMock()
    uow.flush = AsyncMock()
    uow.commit = AsyncMock()
    uow.rollback = AsyncMock()
    return uow


@pytest.fixture
def auth_service(mock_uow):
    """Create an AuthService instance with a mock UoW."""
    return AuthService(mock_uow)


@pytest.fixture
def sample_user():
    """Create a sample user model mock."""
    user = MagicMock()
    user.id = uuid4()
    user.email = "test@example.com"
    user.username = "testuser"
    user.display_name = "Test User"
    user.password_hash = hash_password("correct-password")
    user.role = MagicMock()
    user.role.value = "learner"
    user.is_active = True
    user.is_deleted = False
    user.last_login_at = None
    return user


# ── Password Hashing Tests ─────────────────────────────────────────

class TestPasswordHashing:
    """Test password hashing and verification."""

    def test_hash_password_returns_string(self):
        """Test hash_password returns a non-empty string."""
        hashed = hash_password("my-password")
        assert isinstance(hashed, str)
        assert len(hashed) > 0

    def test_hash_password_is_different_from_input(self):
        """Test the hash is different from the original password."""
        hashed = hash_password("my-password")
        assert hashed != "my-password"

    def test_verify_password_correct(self):
        """Test verify_password returns True for correct password."""
        hashed = hash_password("my-password")
        assert verify_password("my-password", hashed) is True

    def test_verify_password_incorrect(self):
        """Test verify_password returns False for incorrect password."""
        hashed = hash_password("my-password")
        assert verify_password("wrong-password", hashed) is False

    def test_verify_password_none_hash(self):
        """Test verify_password returns False when hash is None."""
        assert verify_password("password", None) is False

    def test_hash_is_different_for_same_password(self):
        """Test each hash is unique (bcrypt salt)."""
        hash1 = hash_password("same-password")
        hash2 = hash_password("same-password")
        assert hash1 != hash2


# ── Registration Tests ─────────────────────────────────────────────

class TestRegistration:
    """Test user registration logic."""

    @pytest.mark.asyncio
    async def test_register_creates_user(self, auth_service, mock_uow):
        """Test registration creates a user successfully."""
        mock_uow.users.find_by_email = AsyncMock(return_value=None)
        mock_uow.users.find_by_username = AsyncMock(return_value=None)
        mock_uow.users.create = AsyncMock(
            return_value=MagicMock(
                id=uuid4(), email="new@example.com", username="newuser",
            ),
        )

        user = await auth_service.register(
            email="new@example.com",
            username="newuser",
            password="secure-password",
        )

        assert user is not None
        mock_uow.users.create.assert_called_once()

    @pytest.mark.asyncio
    async def test_register_raises_on_duplicate_email(self, auth_service, mock_uow):
        """Test registration raises DuplicateEntityError for existing email."""
        mock_uow.users.find_by_email = AsyncMock(return_value=MagicMock())
        mock_uow.users.find_by_username = AsyncMock(return_value=None)

        with pytest.raises(DuplicateEntityError):
            await auth_service.register(
                email="existing@example.com",
                username="newuser",
                password="secure-password",
            )

    @pytest.mark.asyncio
    async def test_register_raises_on_duplicate_username(self, auth_service, mock_uow):
        """Test registration raises DuplicateEntityError for existing username."""
        mock_uow.users.find_by_email = AsyncMock(return_value=None)
        mock_uow.users.find_by_username = AsyncMock(return_value=MagicMock())

        with pytest.raises(DuplicateEntityError):
            await auth_service.register(
                email="new@example.com",
                username="existing-user",
                password="secure-password",
            )

    @pytest.mark.asyncio
    async def test_register_hashes_password(self, auth_service, mock_uow):
        """Test registration hashes the password before storing."""
        mock_uow.users.find_by_email = AsyncMock(return_value=None)
        mock_uow.users.find_by_username = AsyncMock(return_value=None)

        captured = {}

        async def create_side_effect(**kwargs):
            captured.update(kwargs)
            return MagicMock(id=uuid4(), email=kwargs.get("email"))

        mock_uow.users.create = AsyncMock(side_effect=create_side_effect)

        await auth_service.register(
            email="new@example.com",
            username="newuser",
            password="my-password",
        )

        stored_hash = captured.get("password_hash")
        assert stored_hash is not None
        assert stored_hash != "my-password"
        assert verify_password("my-password", stored_hash) is True


# ── Login Tests ────────────────────────────────────────────────────

class TestLogin:
    """Test login logic."""

    @pytest.mark.asyncio
    async def test_login_success(self, auth_service, mock_uow, sample_user):
        """Test successful login returns user and tokens."""
        mock_uow.users.find_by_email = AsyncMock(return_value=sample_user)

        result = await auth_service.login(
            email="test@example.com",
            password="correct-password",
        )

        user, access_token, refresh_token, expires_at = result
        assert user is not None
        assert isinstance(access_token, str)
        assert isinstance(refresh_token, str)
        assert expires_at is not None

    @pytest.mark.asyncio
    async def test_login_invalid_email(self, auth_service, mock_uow):
        """Test login raises AuthenticationError for unknown email."""
        mock_uow.users.find_by_email = AsyncMock(return_value=None)

        with pytest.raises(AuthenticationError, match="Invalid email or password"):
            await auth_service.login(
                email="unknown@example.com",
                password="any-password",
            )

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, auth_service, mock_uow, sample_user):
        """Test login raises AuthenticationError for wrong password."""
        mock_uow.users.find_by_email = AsyncMock(return_value=sample_user)

        with pytest.raises(AuthenticationError, match="Invalid email or password"):
            await auth_service.login(
                email="test@example.com",
                password="wrong-password",
            )

    @pytest.mark.asyncio
    async def test_login_inactive_user(self, auth_service, mock_uow, sample_user):
        """Test login raises AuthenticationError for inactive user."""
        sample_user.is_active = False
        mock_uow.users.find_by_email = AsyncMock(return_value=sample_user)

        with pytest.raises(AuthenticationError, match="deactivated"):
            await auth_service.login(
                email="test@example.com",
                password="correct-password",
            )

    @pytest.mark.asyncio
    async def test_login_deleted_user(self, auth_service, mock_uow, sample_user):
        """Test login raises AuthenticationError for deleted user."""
        sample_user.is_deleted = True
        mock_uow.users.find_by_email = AsyncMock(return_value=sample_user)

        with pytest.raises(AuthenticationError, match="not found"):
            await auth_service.login(
                email="test@example.com",
                password="correct-password",
            )

    @pytest.mark.asyncio
    async def test_login_updates_last_login(self, auth_service, mock_uow, sample_user):
        """Test login updates the last_login_at timestamp."""
        mock_uow.users.find_by_email = AsyncMock(return_value=sample_user)

        await auth_service.login(
            email="test@example.com",
            password="correct-password",
        )

        assert sample_user.last_login_at is not None
        mock_uow.flush.assert_called_once()


# ── JWT Token Tests ────────────────────────────────────────────────

class TestJWT:
    """Test JWT token creation and validation."""

    def test_create_access_token_returns_string(self, auth_service):
        """Test create_access_token returns a token string."""
        token, expires_at = auth_service.create_access_token(uuid4(), "learner")
        assert isinstance(token, str)
        assert len(token) > 0
        assert expires_at is not None

    def test_create_refresh_token_returns_string(self, auth_service):
        """Test create_refresh_token returns a token string."""
        token = auth_service.create_refresh_token(uuid4())
        assert isinstance(token, str)
        assert len(token) > 0

    def test_decode_valid_token(self, auth_service):
        """Test decode_token returns the payload for a valid token."""
        user_id = uuid4()
        token, _ = auth_service.create_access_token(user_id, "learner")
        payload = auth_service.decode_token(token)
        assert payload["sub"] == str(user_id)
        assert payload["type"] == "access"
        assert payload["role"] == "learner"

    def test_decode_invalid_token(self, auth_service):
        """Test decode_token raises AuthenticationError for invalid token."""
        with pytest.raises(AuthenticationError):
            auth_service.decode_token("invalid-token")

    def test_get_user_id_from_token(self, auth_service):
        """Test get_user_id_from_token extracts the user ID."""
        user_id = uuid4()
        token, _ = auth_service.create_access_token(user_id, "learner")
        extracted = auth_service.get_user_id_from_token(token)
        assert extracted == user_id

    def test_access_and_refresh_tokens_differ(self, auth_service):
        """Test access and refresh tokens are different."""
        user_id = uuid4()
        access_token, _ = auth_service.create_access_token(user_id, "learner")
        refresh_token = auth_service.create_refresh_token(user_id)
        assert access_token != refresh_token


# ── Token Refresh Tests ────────────────────────────────────────────

class TestTokenRefresh:
    """Test token refresh logic."""

    @pytest.mark.asyncio
    async def test_refresh_with_valid_token(self, auth_service, mock_uow, sample_user):
        """Test refresh_tokens returns new tokens for a valid refresh token."""
        refresh_token = auth_service.create_refresh_token(sample_user.id)
        mock_uow.users.get_by_id = AsyncMock(return_value=sample_user)

        user, new_access, new_refresh, expires_at = await auth_service.refresh_tokens(refresh_token)

        assert user.id == sample_user.id
        assert isinstance(new_access, str)
        assert isinstance(new_refresh, str)

    @pytest.mark.asyncio
    async def test_refresh_with_access_token_fails(self, auth_service):
        """Test refresh_tokens fails when using an access token."""
        access_token, _ = auth_service.create_access_token(uuid4(), "learner")

        with pytest.raises(AuthenticationError, match="Invalid token type"):
            await auth_service.refresh_tokens(access_token)

    @pytest.mark.asyncio
    async def test_refresh_with_expired_token_fails(self, auth_service):
        """Test refresh_tokens fails with an expired token."""
        # Create a token that's already expired by manipulating time
        with patch("app.services.auth.datetime") as mock_datetime:
            mock_datetime.now.return_value = datetime.now(timezone.utc).replace(year=2020)
            mock_datetime.side_effect = lambda *args, **kw: datetime(*args, **kw) if args else datetime.now(timezone.utc)

            token = auth_service.create_refresh_token(uuid4())

        with pytest.raises(AuthenticationError):
            await auth_service.refresh_tokens(token)


# ── Password Change Tests ──────────────────────────────────────────

class TestPasswordChange:
    """Test password change logic."""

    @pytest.mark.asyncio
    async def test_change_password_success(self, auth_service, mock_uow, sample_user):
        """Test changing password with correct current password."""
        mock_uow.users.get_by_id = AsyncMock(return_value=sample_user)
        mock_uow.users.update = AsyncMock()

        await auth_service.change_password(
            user_id=sample_user.id,
            current_password="correct-password",
            new_password="new-password",
        )

        mock_uow.users.update.assert_called_once()
        # Verify the new password hash is for the new password
        call_kwargs = mock_uow.users.update.call_args[1]
        assert "password_hash" in call_kwargs
        assert verify_password("new-password", call_kwargs["password_hash"]) is True

    @pytest.mark.asyncio
    async def test_change_password_wrong_current(self, auth_service, mock_uow, sample_user):
        """Test changing password fails with wrong current password."""
        mock_uow.users.get_by_id = AsyncMock(return_value=sample_user)

        with pytest.raises(AuthenticationError, match="Current password is incorrect"):
            await auth_service.change_password(
                user_id=sample_user.id,
                current_password="wrong-password",
                new_password="new-password",
            )

    @pytest.mark.asyncio
    async def test_change_password_user_not_found(self, auth_service, mock_uow):
        """Test changing password fails for non-existent user."""
        mock_uow.users.get_by_id = AsyncMock(return_value=None)

        with pytest.raises(EntityNotFoundError):
            await auth_service.change_password(
                user_id=uuid4(),
                current_password="any-password",
                new_password="new-password",
            )


# ── Authorization Tests ────────────────────────────────────────────

class TestAuthorization:
    """Test role-based authorization logic."""

    def test_require_role_admin_allowed(self):
        """Test require_role passes for admin users."""
        user = MagicMock()
        user.role = MagicMock()
        user.role.value = "admin"
        AuthService.require_role(user, "admin")  # Should not raise

    def test_require_role_learner_denied_admin(self):
        """Test require_role raises for non-admin users."""
        user = MagicMock()
        user.role = MagicMock()
        user.role.value = "learner"
        with pytest.raises(AuthorizationError, match="Admin access required"):
            AuthService.require_role(user, "admin")

    def test_require_role_no_role(self):
        """Test require_role raises for users without role."""
        user = MagicMock(spec=[])  # No role attribute
        with pytest.raises(AuthorizationError, match="has no role"):
            AuthService.require_role(user, "admin")
