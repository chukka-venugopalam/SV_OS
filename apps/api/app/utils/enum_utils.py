"""Enum serialization utilities.

Centralises the pattern of converting SQLAlchemy-mapped enum columns
(PgEnum-backed) to their string values for JSON serialization.

The ``PgEnum`` type stores enum values as strings in PostgreSQL and
reconstitutes them via an ``after_load`` listener.  This module
provides safe, consistent accessors for both cases:

- When the ``after_load`` listener has run: the attribute is a
  proper Python enum member, and ``.value`` gives the string.
- When the listener has NOT run (edge case): the attribute is
  already a plain string, which is returned as-is.

Usage::

    from app.utils.enum_utils import enum_value

    # Instead of:
    #   value = obj.node_type.value if hasattr(obj.node_type, 'value') else obj.node_type

    # Use:
    value = enum_value(obj.node_type)
"""

from __future__ import annotations

import enum
from typing import Any


def enum_value(value: Any) -> str:
    """Safely extract the string value from an enum member.

    Handles:
    - Proper Python ``enum.Enum`` members (returns ``.value``)
    - Plain strings (returns as-is)
    - ``None`` (returns ``None``)

    Args:
        value: An enum member, a string, or ``None``.

    Returns:
        The string value, or ``None`` if input was ``None``.
    """
    if value is None:
        return None  # type: ignore[return-value]
    if isinstance(value, enum.Enum):
        return str(value.value)
    if isinstance(value, str):
        return value
    return str(value)


def enum_dict(obj: Any, fields: list[str]) -> dict[str, Any]:
    """Convert selected enum fields of an object to their string values.

    Useful when building response dicts from ORM models::

        data = enum_dict(node, ['node_type', 'difficulty'])

    Args:
        obj: Any object with attributes matching ``fields``.
        fields: List of attribute names to extract and convert.

    Returns:
        Dict mapping field names to their enum-string values.
    """
    return {field: enum_value(getattr(obj, field, None)) for field in fields}
