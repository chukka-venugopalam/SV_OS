"""Test configuration and fixtures.

Provides pytest fixtures for:
- FastAPI test application
- Async HTTP test client
- Database session (when database is available)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest
from httpx import ASGITransport, AsyncClient

from app.main import create_app

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from fastapi import FastAPI


@pytest.fixture(scope='session', autouse=True)
def _setup_database() -> None:
    """Ensure the database schema is ready before tests run.

    In local development and CI environments that do not have a reachable
    PostgreSQL instance, the migration step is skipped gracefully so the
    HTTP-layer tests can still exercise the app without failing during
    bootstrapping.
    """
    from pathlib import Path

    from alembic.config import Config

    from alembic import command

    # Resolve paths relative to this conftest file (apps/api/tests/conftest.py)
    api_dir = Path(__file__).resolve().parent.parent  # apps/api/
    alembic_ini_path = api_dir / 'alembic.ini'
    alembic_script_path = api_dir / 'alembic'  # apps/api/alembic/

    if not alembic_ini_path.exists() or not alembic_script_path.exists():
        # No alembic config found — skip migrations
        return

    alembic_cfg = Config(str(alembic_ini_path))
    # Override script_location to absolute path so it works from any CWD
    alembic_cfg.set_main_option('script_location', str(alembic_script_path))
    try:
        command.upgrade(alembic_cfg, 'head')
    except Exception as exc:
        message = str(exc).lower()
        if any(
            token in message
            for token in (
                'connection refused',
                'could not connect',
                'database does not exist',
                'no such host',
                'timeout',
            )
        ):
            return
        raise


@pytest.fixture(scope='session')
def app() -> FastAPI:
    """Create a test application instance.

    The app is created once per test session and reused.
    """
    return create_app()


@pytest.fixture
async def client(app: FastAPI) -> AsyncGenerator[AsyncClient, None]:
    """Create an async HTTP test client.

    Each test gets a fresh client instance.
    """
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url='http://test') as ac:
        yield ac


@pytest.fixture
def app_settings():
    """Provide access to the application settings singleton."""
    from app.core.config import settings

    return settings
