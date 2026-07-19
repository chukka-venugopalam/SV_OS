"""Shared helpers for converting ORM models to API-friendly dictionaries.

These functions extract common serialization patterns to eliminate
duplicate _node_to_dict and _edge_to_dict implementations found across
multiple service files.

Usage:
    from app.utils.node_helpers import node_to_dict, edge_to_dict
"""

from __future__ import annotations

from typing import Any


def node_to_dict(node: Any) -> dict[str, Any]:
    """Convert a KnowledgeNode ORM model to an API-friendly dictionary.

    Args:
        node: A KnowledgeNode ORM instance (or any object with similar attributes).

    Returns:
        Dict with id, slug, title, description, node_type, difficulty,
        estimated_minutes, icon, color, and optional view_count.
    """
    if node is None:
        return {}

    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': _enum_value(node.node_type),
        'difficulty': _enum_value(node.difficulty),
        'estimated_minutes': getattr(node, 'estimated_minutes', None),
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
        'view_count': getattr(node, 'view_count', 0),
    }


def node_to_dict_short(node: Any) -> dict[str, Any]:
    """Convert a node to a shorter dict (no description or view_count).

    Useful for listing contexts where only minimal info is needed.
    """
    if node is None:
        return {}

    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'node_type': _enum_value(node.node_type),
        'difficulty': _enum_value(node.difficulty),
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
    }


def node_to_dict_detailed(node: Any, max_description_length: int | None = None) -> dict[str, Any]:
    """Convert a node to a dict with optional description truncation."""
    result = node_to_dict(node)
    if max_description_length and result.get('description'):
        result['description'] = result['description'][:max_description_length]
    return result


def edge_to_dict(edge: Any) -> dict[str, Any]:
    """Convert a KnowledgeEdge ORM model to an API-friendly dictionary.

    Args:
        edge: A KnowledgeEdge ORM instance.

    Returns:
        Dict with id, source_id, target_id, relationship_type, direction.
    """
    if edge is None:
        return {}

    return {
        'id': str(edge.id),
        'source_id': str(edge.source_node_id),
        'target_id': str(edge.target_node_id),
        'relationship_type': _enum_value(edge.relationship_type),
        'direction': _enum_value(
            getattr(edge, 'direction', None)
        ) or 'forward',
    }


def cosine_similarity(vec_a: list[float], vec_b: list[float]) -> float:
    """Compute cosine similarity between two vectors.

    Returns a value between 0.0 and 1.0 (higher = more similar).
    Returns 0.0 if either vector is empty or zero-norm.
    """
    import math

    if not vec_a or not vec_b:
        return 0.0

    dot_product = sum(a * b for a, b in zip(vec_a, vec_b, strict=False))
    norm_a = math.sqrt(sum(a * a for a in vec_a))
    norm_b = math.sqrt(sum(b * b for b in vec_b))

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return dot_product / (norm_a * norm_b)


def safe_description(description: str | None, max_length: int = 300) -> str:
    """Safely truncate a description to max_length characters."""
    if not description:
        return ''
    return description[:max_length]


def _enum_value(value: Any) -> str:
    """Extract the string value from an enum or return the value itself."""
    if value is None:
        return ''
    if hasattr(value, 'value'):
        return value.value
    return str(value)


__all__ = [
    'cosine_similarity',
    'edge_to_dict',
    'node_to_dict',
    'node_to_dict_detailed',
    'node_to_dict_short',
    'safe_description',
]
