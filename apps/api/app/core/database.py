"""Database engine, session management, and health utilities.

Provides:
- Async engine creation
- Session factory
- Declarative ``Base``
- Database health check
- Transaction wrapper
"""

from __future__ import annotations

from collections.abc import AsyncGenerator

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings
from app.telemetry.health import HealthStatus

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.db_echo_enabled,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
)

async_session_factory = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base model class for all SQLAlchemy database models."""


# ── Naming Convention ─────────────────────────────────────────────
# Ensures all constraints and indexes use consistent, predictable
# names so that Alembic autogenerate produces deterministic migrations.
Base.metadata.naming_convention = {
    'ix': 'ix_%(table_name)s_%(column_0_N_name)s',
    'uq': 'uq_%(table_name)s_%(column_0_N_name)s',
    'ck': 'ck_%(table_name)s_%(constraint_name)s',
    'fk': 'fk_%(table_name)s_%(column_0_N_name)s_%(referred_table_name)s',
    'pk': 'pk_%(table_name)s',
}


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a database session.

    Yields a session.  Commits and rollbacks are managed by the
    Unit of Work layer, **not** by this generator, to avoid
    double-commit or double-rollback conflicts.

    Intended for use as a FastAPI dependency::

        async def my_endpoint(db: AsyncSession = Depends(get_db_session)):
            ...
    """
    async with async_session_factory() as session:
        yield session
        # NOTE: session.close() is handled by the async_session_factory context manager


async def check_database_connection() -> bool:
    """Check whether the database is reachable and responsive.

    Returns ``True`` if a simple query succeeds, ``False`` otherwise.
    Delegates to ``get_database_health`` to avoid duplication.
    """
    status = await get_database_health()
    return status.healthy


async def get_database_health() -> HealthStatus:
    """Run a database health check and return a ``HealthStatus``.

    Intended for registration with the ``HealthChecker``.
    """
    try:
        async with async_session_factory() as session:
            await session.execute(text('SELECT 1'))
        host = settings.DATABASE_URL
        if '@' in host:
            host = host.split('@')[1]
        return HealthStatus(
            name='database',
            healthy=True,
            message='Database connection is healthy',
            details={'url': host},
        )
    except Exception as exc:
        return HealthStatus(
            name='database',
            healthy=False,
            message=f'Database connection failed: {exc}',
        )
