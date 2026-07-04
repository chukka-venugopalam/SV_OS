"""Structured logging configuration using structlog.

Supports:
- Development (console) and production (JSON) output
- Request ID and correlation ID context propagation
- Log rotation readiness (via standard ``logging.handlers``)
- Performance timing

Log rotation readiness
----------------------
The root logger uses a standard ``StreamHandler`` by default. For
production deployments that need log rotation, replace the handler
with ``logging.handlers.RotatingFileHandler`` or
``logging.handlers.WatchedFileHandler``::

    from logging.handlers import RotatingFileHandler
    handler = RotatingFileHandler(
        'logs/api.log', maxBytes=10_485_760, backupCount=5,
    )

The ``ProcessorFormatter`` wrapper ensures structured JSON output
is preserved when using file-based handlers.
"""

from __future__ import annotations

import logging
import sys

import structlog

from app.core.config import settings


def configure_logging() -> None:
    """Configure structured logging for the application.

    Must be called **once** during application startup, before any
    loggers are used.
    """
    timestamper = structlog.processors.TimeStamper(fmt='iso', utc=True)

    shared_processors: list[structlog.types.Processor] = [
        structlog.contextvars.merge_contextvars,
        structlog.stdlib.add_log_level,
        structlog.stdlib.add_logger_name,
        timestamper,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    # Determine log format based on environment
    log_format = settings.LOG_FORMAT
    if log_format == 'auto':
        log_format = 'console' if sys.stderr.isatty() else 'json'

    if log_format == 'json':
        log_renderer: structlog.types.Processor = structlog.processors.JSONRenderer()
    else:
        log_renderer = structlog.dev.ConsoleRenderer()

    structlog.configure(
        processors=[
            *shared_processors,
            structlog.stdlib.ProcessorFormatter.wrap_for_formatter,
        ],
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )

    handler = logging.StreamHandler()
    handler.setFormatter(
        structlog.stdlib.ProcessorFormatter(
            processors=[
                *shared_processors,
                log_renderer,
            ],
        ),
    )

    root_logger = logging.getLogger()
    root_logger.addHandler(handler)
    root_logger.setLevel(_resolve_log_level(settings.LOG_LEVEL))

    # Suppress noisy third-party loggers
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('httpx').setLevel(logging.WARNING)


def _resolve_log_level(level: str) -> int:
    """Convert a log level string to a ``logging`` constant."""
    return getattr(logging, level.upper(), logging.INFO)


def add_request_context(request_id: str, correlation_id: str | None = None) -> None:
    """Add request-scoped context to the current log context.

    Call this at the start of each request so that all subsequent
    log entries include the request and correlation IDs.
    """
    structlog.contextvars.bind_contextvars(
        request_id=request_id,
        correlation_id=correlation_id or request_id,
    )


def clear_request_context() -> None:
    """Clear request-scoped log context at the end of each request."""
    structlog.contextvars.clear_contextvars()
