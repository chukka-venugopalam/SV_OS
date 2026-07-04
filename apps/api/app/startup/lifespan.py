"""Application lifespan — startup and shutdown lifecycle management."""

from __future__ import annotations

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from structlog.stdlib import get_logger

from app.core.config import settings
from app.startup.diagnostics import Diagnostics
from app.telemetry.health import HealthChecker

logger = get_logger(__name__)

# Global health checker shared across the application
health_checker = HealthChecker()


@asynccontextmanager
async def Lifespan(app: FastAPI) -> AsyncGenerator[None, None]:  # noqa: N802
    """FastAPI application lifespan context manager.

    Handles startup initialisation and shutdown teardown.
    """
    # ── Startup ──────────────────────────────────────────────────────
    logger.info(
        'app_startup',
        environment=settings.ENVIRONMENT,
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
    )

    # Run startup diagnostics
    diagnostics = Diagnostics(health_checker)
    await diagnostics.run_all()

    # TODO: Initialise database connection pool
    # TODO: Initialise cache client
    # TODO: Initialise metrics/tracing providers

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info(
        'app_shutdown',
        environment=settings.ENVIRONMENT,
    )

    # TODO: Dispose database connection pool
    # TODO: Close cache connections
    # TODO: Flush and shutdown metrics/tracing providers
