"""Application configuration via Pydantic Settings.

All environment variables are loaded from ``.env`` and validated
at startup.  Sensible defaults are provided for development.
"""

from __future__ import annotations

import json
from typing import Any, ClassVar

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class FeatureFlags(dict):
    """Dictionary-like wrapper for simple feature flags."""

    def __init__(self, values: dict[str, bool] | None = None) -> None:
        super().__init__(values or {})

    def get(self, key: str, default: bool = False) -> bool:  # type: ignore[override]
        value = super().get(key, default)
        if isinstance(value, str):
            return value.lower() in {'1', 'true', 'yes', 'on'}
        return bool(value)


class Settings(BaseSettings):
    """Application settings loaded from environment variables.

    Settings are validated on instantiation.  Use the global ``settings``
    singleton defined at module level.
    """

    model_config: ClassVar[SettingsConfigDict] = SettingsConfigDict(
        env_file='.env',
        env_file_encoding='utf-8',
        case_sensitive=False,
        extra='ignore',
    )

    # ── Application Metadata ─────────────────────────────────────────
    APP_NAME: str = 'SV-OS API'
    APP_DESCRIPTION: str = 'Silicon Valley Learning OS — Backend API'
    APP_VERSION: str = '0.3.0'
    ENVIRONMENT: str = 'development'

    # ── Database ─────────────────────────────────────────────────────
    DATABASE_URL: str = 'postgresql+asyncpg://svos:svos_dev_password@localhost:5432/svos'
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_PRE_PING: bool = True
    DB_ECHO: bool = False

    # ── Supabase ─────────────────────────────────────────────────────
    SUPABASE_URL: str = ''
    SUPABASE_SERVICE_KEY: str = ''

    # ── Security ─────────────────────────────────────────────────────
    SECRET_KEY: str = 'change-me-in-production'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12

    # ── CORS ─────────────────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ['http://localhost:3000']

    # ── Rate Limiting ────────────────────────────────────────────────
    API_RATE_LIMIT: int = 100  # requests per minute (authenticated)
    API_RATE_LIMIT_ANON: int = 20  # requests per minute (anonymous)
    GRAPH_RATE_LIMIT: int = 30  # requests per minute (graph endpoints)

    # ── Logging ──────────────────────────────────────────────────────
    LOG_LEVEL: str = 'INFO'
    LOG_FORMAT: str = 'auto'  # 'json' | 'console' | 'auto'

    # ── Platform / Feature Flags ────────────────────────────────────
    FEATURE_FLAGS: str = 'analytics:on,search:on,plugins:off'

    # ── Caching ──────────────────────────────────────────────────────
    CACHE_TTL_SECONDS: int = 300
    CACHE_MAX_SIZE: int = 1000

    # ── Trusted Hosts ────────────────────────────────────────────────
    TRUSTED_HOSTS: list[str] = []

    # ── Sentry ───────────────────────────────────────────────────────
    SENTRY_DSN: str = ''

    # ── Deployment ───────────────────────────────────────────────────
    ROOT_PATH: str = ''  # e.g. '/api/v1' when behind a reverse proxy
    FORWARDED_ALLOW_IPS: str = '127.0.0.1'

    # ── Validators ───────────────────────────────────────────────────

    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Ensure environment is one of the allowed values."""
        allowed = {'development', 'staging', 'production', 'test'}
        if v.lower() not in allowed:
            msg = f'ENVIRONMENT must be one of {allowed}'
            raise ValueError(msg)
        return v.lower()

    @field_validator('DATABASE_URL')
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        """Ensure the database URL starts with the async scheme."""
        if not v.startswith('postgresql+asyncpg://'):
            msg = 'DATABASE_URL must use the asyncpg driver (postgresql+asyncpg://)'
            raise ValueError(msg)
        return v

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v: str, info) -> str:
        """Warn (but don't block) if the default secret key is used in production."""
        environment = info.data.get('ENVIRONMENT', 'development')
        if environment == 'production' and v == 'change-me-in-production':
            msg = 'SECRET_KEY must be changed from the default in production'
            raise ValueError(msg)
        return v

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def parse_cors_origins(cls, v: Any) -> list[str]:
        """Parse CORS_ORIGINS from environment variable into a list of origins.

        Handles all formats that Pydantic v2 BaseSettings and various
        deployment platforms (Render, Fly.io, Railway, etc.) may produce:

        - JSON array string:  ``["https://a.com","http://localhost:3000"]``
        - Comma-separated:    ``https://a.com,http://localhost:3000``
        - Single origin:      ``https://a.com``
        - Already a list:     (Pydantic v2 JSON auto-decoded value)
        - Python list string: ``['https://a.com']`` (repr from debug logs)
        """
        if isinstance(v, str):
            v_stripped = v.strip()
            # Attempt 1: if it looks like a JSON array, parse it as JSON
            if v_stripped.startswith('[') and v_stripped.endswith(']'):
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return [str(item).strip() for item in parsed if str(item).strip()]
                except json.JSONDecodeError:
                    pass  # fall through to comma-separated

            # Attempt 2: treat as comma-separated (supports single origin too)
            return [origin.strip() for origin in v.split(',') if origin.strip()]

        if isinstance(v, list):
            return [str(item).strip() for item in v if str(item).strip()]

        msg = f'CORS_ORIGINS must be a string or list, got {type(v).__name__}: {v!r}'
        raise ValueError(msg)

    @field_validator('TRUSTED_HOSTS', mode='before')
    @classmethod
    def parse_trusted_hosts(cls, v: str | list[str]) -> list[str]:
        """Allow TRUSTED_HOSTS to be a comma-separated string or a list."""
        if isinstance(v, str):
            return [host.strip() for host in v.split(',') if host.strip()]
        return v

    @field_validator('FEATURE_FLAGS', mode='before')
    @classmethod
    def parse_feature_flags(cls, v: Any) -> str:
        """Normalize feature flags from a string or mapping into a simple string format."""
        if isinstance(v, dict):
            return ','.join(f'{key}:{value}' for key, value in v.items())
        if isinstance(v, list):
            return ','.join(str(item) for item in v)
        return str(v)

    # ── Computed properties ──────────────────────────────────────────

    @property
    def is_development(self) -> bool:
        return self.ENVIRONMENT == 'development'

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == 'production'

    @property
    def is_testing(self) -> bool:
        return self.ENVIRONMENT == 'test'

    @property
    def db_echo_enabled(self) -> bool:
        """Enable SQL echo in non-production environments."""
        return self.DB_ECHO or (not self.is_production and self.ENVIRONMENT != 'test')

    @property
    def environment_profile(self) -> str:
        """Return the resolved environment profile name."""
        return self.ENVIRONMENT

    @property
    def feature_flags(self) -> FeatureFlags:
        """Parse FEATURE_FLAGS into a simple boolean map."""
        parsed: dict[str, bool] = {}
        for item in self.FEATURE_FLAGS.split(','):
            if not item:
                continue
            key, _, value = item.partition(':')
            parsed[key.strip()] = value.strip().lower() in {'1', 'true', 'yes', 'on'}
        return FeatureFlags(parsed)

    def is_feature_enabled(self, name: str, default: bool = False) -> bool:
        """Return whether a feature flag is enabled."""
        return self.feature_flags.get(name, default)


settings = Settings()
