"""Unit of Work — transaction management for the persistence layer.

New code should import ``UnitOfWork`` from this package.
For backward compatibility, ``app.repositories.unit_of_work`` re-exports these symbols.
"""

from app.repositories.unit_of_work import UnitOfWork, unit_of_work

__all__ = [
    'UnitOfWork',
    'unit_of_work',
]
