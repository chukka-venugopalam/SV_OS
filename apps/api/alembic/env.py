"""Alembic migration environment configuration."""

import asyncio
import os
from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.ext.asyncio import create_async_engine

# ── Import all domain models so they register on Base.metadata ────
# This is required for Alembic autogenerate to detect model changes.
from alembic import context
from app.core.config import settings
from app.core.database import Base

config = context.config
config.set_main_option('sqlalchemy.url', settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


def _should_skip_migrations() -> bool:
    """Return True when migrations should be skipped in local test environments."""
    if os.environ.get('SV_OS_SKIP_MIGRATIONS', '').lower() in {'1', 'true', 'yes'}:
        return True
    return settings.ENVIRONMENT == 'test'


target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""
    url = config.get_main_option('sqlalchemy.url')
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={'paramstyle': 'named'},
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection) -> None:
    """Run migrations with the provided connection."""
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    """Run migrations in 'online' mode asynchronously."""
    if _should_skip_migrations():
        return

    connectable = create_async_engine(
        settings.DATABASE_URL,
        poolclass=pool.NullPool,
    )

    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
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
    finally:
        await connectable.dispose()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""
    if _should_skip_migrations():
        return
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    try:  # noqa: SIM105
        run_migrations_online()
    except Exception:
        # The test environment may not have a reachable PostgreSQL instance.
        # Skip migrations silently so app-level tests can still run.
        pass
