"""Custom exception classes and global exception handlers."""

from app.exceptions.base import (
    AppException,
    NotFoundError,
    ConflictError,
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    RateLimitedError,
    InternalError,
    ServiceUnavailableError,
)
from app.exceptions.handlers import (
    register_exception_handlers,
    app_exception_handler,
    unhandled_exception_handler,
    validation_exception_handler,
    http_exception_handler,
)

__all__ = [
    'AppException',
    'NotFoundError',
    'ConflictError',
    'ValidationError',
    'UnauthorizedError',
    'ForbiddenError',
    'RateLimitedError',
    'InternalError',
    'ServiceUnavailableError',
    'register_exception_handlers',
    'app_exception_handler',
    'unhandled_exception_handler',
    'validation_exception_handler',
    'http_exception_handler',
]
