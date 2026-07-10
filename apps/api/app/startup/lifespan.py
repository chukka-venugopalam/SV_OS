"""Application lifespan — startup and shutdown lifecycle management."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from structlog.stdlib import get_logger

from app.api.v1.router import health_checker as router_health_checker
from app.core.config import settings
from app.startup.diagnostics import Diagnostics

logger = get_logger(__name__)


@asynccontextmanager
async def Lifespan(app: FastAPI) -> AsyncGenerator[None, None]:  # noqa: N802
    """FastAPI application lifespan context manager.

    Handles startup initialisation and shutdown teardown.
    Uses the shared ``health_checker`` from the v1 router, which
    is already registered with health checks.
    """
    # ── Startup ──────────────────────────────────────────────────────
    logger.info(
        'app_startup',
        environment=settings.ENVIRONMENT,
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
    )

    # Run startup diagnostics using the shared health checker
    diagnostics = Diagnostics(router_health_checker)
    await diagnostics.run_all()

    # Dispose the database connection pool on shutdown.
    # The pool is created in app.core.database and must be
    # explicitly disposed to release all connections.
    from app.core.database import engine as db_engine

    app.state._db_engine = db_engine

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info(
        'app_shutdown',
        environment=settings.ENVIRONMENT,
    )

    # Dispose database connection pool
    engine = getattr(app.state, '_db_engine', None)
    if engine is not None:
        await engine.dispose()
        logger.info('database_pool_disposed')
