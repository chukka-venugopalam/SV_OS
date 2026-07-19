"""Enum serialization utilities.

Centralises the pattern of converting ``StrEnum`` members to their
string values for JSON serialization.

The ``PgEnumType`` (via ``TypeDecorator``) ensures that all enum
attributes on ORM instances are always proper Python ``StrEnum``
members.  This module provides consistent accessors that handle
both enum members and plain strings defensively.

Usage::

    from app.utils.enum_utils import enum_value

    # For a StrEnum attribute that is guaranteed to be an enum member:
    value = obj.role.value  # Always works (attribute is always an enum)

    # For defensive access when the type is uncertain:
    value = enum_value(obj.role)  # Handles enum, string, and None
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
