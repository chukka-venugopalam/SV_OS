"""Application lifespan — startup and shutdown lifecycle management."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

from app.api.v1.router import health_checker as router_health_checker
from app.core.config import settings
from app.core.database import wait_for_database
from app.infrastructure.container import get_platform_container
from app.infrastructure.runtime import initialize_platform_runtime
from app.startup.diagnostics import Diagnostics

if TYPE_CHECKING:
    from collections.abc import AsyncGenerator

    from fastapi import FastAPI

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """FastAPI application lifespan context manager.

    Handles startup initialisation and shutdown teardown.
    Uses the shared ``health_checker`` from the v1 router, which
    is already registered with health checks.

    Startup sequence:
        1. Run diagnostics
        2. Get platform container with engine registry
        3. Validate engine dependency graph (acyclic check)
        4. Initialize all engines in dependency order
        5. Start all engines in dependency order
        6. Subscribe engines to event bus
        7. Load graph metadata into GraphEngine
        8. Report diagnostics
        9. Publish platform.started event

    Shutdown sequence:
        1. Stop all engines in reverse dependency order
        2. Dispose database connection pool
    """
    # ── Startup ──────────────────────────────────────────────────────
    logger.info(
        'app_startup',
        environment=settings.ENVIRONMENT,
        app_name=settings.APP_NAME,
        app_version=settings.APP_VERSION,
    )

    # Wait for the database to be available (retries with backoff)
    db_ready = await wait_for_database(max_retries=10, delay_seconds=3.0)
    if not db_ready:
        logger.warning('database_not_available_on_startup')

    # Run pending Alembic migrations on startup
    if db_ready:
        try:
            from pathlib import Path

            from alembic.config import Config

            from alembic import command

            alembic_cfg = Config(str(Path(__file__).resolve().parent.parent / 'alembic.ini'))
            command.upgrade(alembic_cfg, 'head')
            logger.info('database_migrations_completed')
        except Exception as exc:
            logger.critical('database_migrations_failed', error=str(exc))
            if settings.is_production:
                raise

    # Run startup diagnostics using the shared health checker
    diagnostics = Diagnostics(router_health_checker)
    await diagnostics.run_all()

    container = get_platform_container()
    registry = container.engine_registry
    event_bus = container.event_bus

    # 1. Validate the engine dependency graph is acyclic
    registry.validate_graph()
    logger.info(
        'engine_dependency_graph_validated',
        engine_count=registry.count(),
        startup_order=registry.startup_order(),
    )

    # 2. Inject event bus into all engines
    for name in registry.names():
        engine = registry.get(name)
        if hasattr(engine, 'subscribe_events'):
            await engine.subscribe_events(event_bus)

    # 3. Initialize all engines in dependency order
    init_results = await registry.initialize_all()
    failed_init = [name for name, health in init_results.items() if not health.healthy]
    if failed_init:
        logger.error(
            'engine_initialization_failed',
            failed_engines=failed_init,
        )

    # 4. Start all initialized engines
    start_results = await registry.start_all()
    failed_start = [name for name, health in start_results.items() if not health.healthy]
    if failed_start:
        logger.error(
            'engine_start_failed',
            failed_engines=failed_start,
        )

    # 5. Report diagnostics
    diagnostics_report: dict[str, dict] = {}
    for name in registry.names():
        engine = registry.try_get(name)
        if engine:
            try:
                diagnostics_report[name] = await engine.diagnostics()
            except Exception as exc:
                diagnostics_report[name] = {'error': str(exc)}

    runtime = initialize_platform_runtime()
    await runtime.initialize()

    # Publish platform.started event
    await container.event_bus.publish(
        'platform.started',
        {
            'environment': settings.ENVIRONMENT,
            'app': settings.APP_NAME,
            'engines': registry.names(),
            'engine_count': registry.count(),
            'failed_init': failed_init,
            'failed_start': failed_start,
        },
        correlation_id='startup',
        idempotency_key='platform-startup',
    )

    app.state.platform_runtime = runtime
    app.state.platform_container = container
    app.state.engine_diagnostics = diagnostics_report

    # Dispose the database connection pool on shutdown.
    # The pool is created in app.core.database and must be
    # explicitly disposed to release all connections.
    from app.core.database import engine as db_engine

    app.state._db_engine = db_engine

    logger.info(
        'startup_complete',
        engines_initialized=len(init_results),
        engines_started=len(start_results),
        engine_count=registry.count(),
        failed_init=failed_init,
        failed_start=failed_start,
    )

    yield

    # ── Shutdown ─────────────────────────────────────────────────────
    logger.info(
        'app_shutdown',
        environment=settings.ENVIRONMENT,
    )

    # Stop all engines in reverse dependency order
    registry = getattr(app.state, 'platform_container', None)
    if registry is not None:
        stop_results = await registry.engine_registry.stop_all()
        logger.info('engine_shutdown_complete', engines_stopped=len(stop_results))

    # Dispose database connection pool
    engine = getattr(app.state, '_db_engine', None)
    if engine is not None:
        await engine.dispose()
        logger.info('database_pool_disposed')
