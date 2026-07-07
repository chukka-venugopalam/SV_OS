"""Global exception handlers registered on the FastAPI application.

All exception handlers return responses in the standard API format:

.. code-block:: json

    {
        "success": false,
        "message": "Error description",
        "data": null,
        "errors": [...],
        "timestamp": "2026-01-01T00:00:00",
        "request_id": "req_..."
    }
"""

from __future__ import annotations

from datetime import datetime, timezone

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from structlog.stdlib import get_logger

from app.exceptions.base import AppException, ErrorDetail
from app.repositories.errors import (
    DuplicateEntityError,
    EntityNotFoundError,
    RepositoryError,
)

logger = get_logger(__name__)


def _request_id(request: Request) -> str | None:
    """Safely extract the request ID from request state."""
    return getattr(request.state, 'request_id', None)


def _now_utc() -> str:
    """Return current UTC timestamp as ISO 8601 string."""
    return datetime.now(timezone.utc).isoformat()


def _error_response(
    message: str,
    errors: list[ErrorDetail] | None = None,
    request_id: str | None = None,
) -> dict:
    """Build a standard error response dict."""
    return {
        'success': False,
        'message': message,
        'data': None,
        'errors': (
            [{'field': e.field, 'message': e.message} for e in errors]
            if errors
            else None
        ),
        'timestamp': _now_utc(),
        'request_id': request_id,
    }


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handler for all custom ``AppException`` subclasses."""
    logger.warning(
        'app_exception',
        message=exc.message,
        status_code=exc.status_code,
        request_id=_request_id(request),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_response(
            message=exc.message,
            errors=exc.errors if exc.errors else None,
            request_id=_request_id(request),
        ),
    )


async def validation_exception_handler(
    request: Request, exc: RequestValidationError
) -> JSONResponse:
    """Handler for Pydantic/FastAPI request validation errors."""
    errors: list[ErrorDetail] = [
        ErrorDetail(
            field=str(err.get('loc', ['body'])),
            message=err.get('msg', 'Invalid value'),
        )
        for err in exc.errors()
    ]

    logger.warning(
        'validation_exception',
        errors=[e.message for e in errors],
        request_id=_request_id(request),
    )

    return JSONResponse(
        status_code=422,
        content=_error_response(
            message='Request validation failed',
            errors=errors,
            request_id=_request_id(request),
        ),
    )


async def http_exception_handler(
    request: Request, exc: StarletteHTTPException
) -> JSONResponse:
    """Handler for Starlette HTTP exceptions (e.g. 405 Method Not Allowed)."""
    logger.warning(
        'http_exception',
        status_code=exc.status_code,
        detail=exc.detail,
        request_id=_request_id(request),
    )
    return JSONResponse(
        status_code=exc.status_code,
        content=_error_response(
            message=str(exc.detail) if exc.detail else 'HTTP error',
            request_id=_request_id(request),
        ),
    )


async def repository_error_handler(
    request: Request, exc: RepositoryError
) -> JSONResponse:
    """Handler for repository-layer errors.

    Maps known repository errors to appropriate HTTP status codes:
    - ``EntityNotFoundError`` → 404
    - ``DuplicateEntityError`` → 409
    - All other ``RepositoryError`` → 400

    This is a safety net — endpoints should still catch specific
    errors when they need custom behaviour.  Without this handler
    these errors would produce 500 responses.
    """
    status_code = 400
    if isinstance(exc, EntityNotFoundError):
        status_code = 404
    elif isinstance(exc, DuplicateEntityError):
        status_code = 409

    logger.warning(
        'repository_error',
        error_type=type(exc).__name__,
        message=exc.message,
        status_code=status_code,
        request_id=_request_id(request),
    )
    return JSONResponse(
        status_code=status_code,
        content=_error_response(
            message=exc.message,
            request_id=_request_id(request),
        ),
    )


async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all handler for unhandled exceptions (no stack trace leak)."""
    logger.error(
        'unhandled_exception',
        exc_info=exc,
        request_id=_request_id(request),
    )
    return JSONResponse(
        status_code=500,
        content=_error_response(
            message='An unexpected error occurred',
            request_id=_request_id(request),
        ),
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers on the FastAPI application.

    Must be called during application initialisation, *after* middleware
    has been added so that ``request.state.request_id`` is available.
    """
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RepositoryError, repository_error_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
