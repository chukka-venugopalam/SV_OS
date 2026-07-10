"""Custom exception classes and global exception handlers."""

from app.exceptions.base import (
    AppError,
    ConflictError,
    ForbiddenError,
    InternalError,
    NotFoundError,
    RateLimitedError,
    ServiceUnavailableError,
    UnauthorizedError,
    ValidationError,
)
from app.exceptions.handlers import (
    app_exception_handler,
    http_exception_handler,
    register_exception_handlers,
    unhandled_exception_handler,
    validation_exception_handler,
)

__all__ = [
    'AppError',
    'ConflictError',
    'ForbiddenError',
    'InternalError',
    'NotFoundError',
    'RateLimitedError',
    'ServiceUnavailableError',
    'UnauthorizedError',
    'ValidationError',
    'app_exception_handler',
    'http_exception_handler',
    'register_exception_handlers',
    'unhandled_exception_handler',
    'validation_exception_handler',
]
