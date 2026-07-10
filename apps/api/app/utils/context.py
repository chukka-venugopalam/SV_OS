"""Context managers for common backend patterns."""

from __future__ import annotations

import time
from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from sqlalchemy.ext.asyncio import AsyncSession


@asynccontextmanager
async def database_transaction(
    session: AsyncSession,
) -> AsyncGenerator[AsyncSession, None]:
    """Context manager wrapping a database session with commit/rollback.

    Usage::

        async with DatabaseTransaction(session) as db:
            db.add(some_object)
            # Auto-commits on success, rolls back on exception
    """
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise


@asynccontextmanager
async def timer(label: str = 'operation') -> AsyncGenerator[None, None]:
    """Context manager that logs the duration of a code block.

    Usage::

        async with timer('expensive_query'):
            results = await run_expensive_query()
    """
    from structlog.stdlib import get_logger

    logger = get_logger(__name__)
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed = (time.perf_counter() - start) * 1000
        logger.debug('timing', label=label, duration_ms=f'{elapsed:.2f}')
