"""Backward-compatibility shim — re-exports from canonical app.infrastructure.registries.

New code should import directly from ``app.infrastructure.registries``.
"""

from app.infrastructure.registries import (  # noqa: F401
    CapabilityRegistry,
    EngineRegistry,
    PluginManifest,
    PluginRegistry,
)

__all__ = [
    'CapabilityRegistry',
    'EngineRegistry',
    'PluginManifest',
    'PluginRegistry',
]
