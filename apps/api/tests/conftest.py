"""Test configuration and fixtures.

Provides pytest fixtures for:
- FastAPI test application
- Async HTTP test client
- Database session (when database is available)
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from app.main import create_app


@pytest.fixture(scope='session', autouse=True)
def _setup_database() -> None:
    """Ensure a fresh PostgreSQL schema before any tests run.

    Runs ``alembic upgrade head`` once per test session to create
    all tables, enums, extensions, triggers, and views defined by
    the migration chain.

    This fixture is synchronous and runs outside pytest-asyncio's
    event loop, so ``alembic.command.upgrade()`` can safely call
    ``asyncio.run()`` internally.
    """
    from alembic.config import Config

    from alembic import command

    alembic_cfg = Config('alembic.ini')
    command.upgrade(alembic_cfg, 'head')


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
