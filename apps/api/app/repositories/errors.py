"""Repository-level exceptions.

All database exceptions raised outside the repository layer must use
these exception classes.  SQLAlchemy exceptions are never propagated
past the repository boundary.
"""

from __future__ import annotations

from typing import Any


class RepositoryError(Exception):
    """Base exception for all repository-layer errors."""

    def __init__(self, message: str = 'A repository error occurred', detail: Any = None) -> None:
        self.message = message
        self.detail = detail
        super().__init__(self.message)


class EntityNotFoundError(RepositoryError):
    """Raised when a requested entity does not exist."""

    def __init__(self, entity_name: str, entity_id: Any) -> None:
        self.entity_name = entity_name
        self.entity_id = entity_id
        super().__init__(
            message=f'{entity_name} with id={entity_id!r} not found',
            detail={'entity_name': entity_name, 'entity_id': str(entity_id)},
        )


class DuplicateEntityError(RepositoryError):
    """Raised when attempting to create an entity that violates a uniqueness constraint."""

    def __init__(self, entity_name: str, fields: dict[str, Any]) -> None:
        self.entity_name = entity_name
        self.fields = fields
        super().__init__(
            message=f'{entity_name} with {fields!r} already exists',
            detail={'entity_name': entity_name, 'fields': {k: str(v) for k, v in fields.items()}},
        )


class ConcurrentModificationError(RepositoryError):
    """Raised when an optimistic-lock version conflict is detected."""

    def __init__(self, entity_name: str, entity_id: Any, expected_version: int) -> None:
        self.entity_name = entity_name
        self.entity_id = entity_id
        self.expected_version = expected_version
        super().__init__(
            message=f'{entity_name} id={entity_id!r} was modified by another transaction '
                    f'(expected version={expected_version})',
            detail={
                'entity_name': entity_name,
                'entity_id': str(entity_id),
                'expected_version': expected_version,
            },
        )


class DatabaseConnectionError(RepositoryError):
    """Raised when the database connection fails."""

    def __init__(self, message: str = 'Database connection failed') -> None:
        super().__init__(message=message)


class QueryError(RepositoryError):
    """Raised when a query execution fails (invalid syntax, constraint violation, etc.)."""

    def __init__(self, message: str, original_error: str = '') -> None:
        self.original_error = original_error
        super().__init__(
            message=message,
            detail={'original_error': original_error},
        )
