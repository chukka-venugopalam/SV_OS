"""Runtime helpers for platform initialization and startup status."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.core.config import settings
from app.infrastructure.container.container import PlatformContainer, get_platform_container


@dataclass(slots=True)
class PlatformRuntime:
    """Represents the initialized platform runtime."""

    container: PlatformContainer = field(default_factory=get_platform_container)
    initialized: bool = False
    status: dict[str, Any] = field(default_factory=dict)

    async def initialize(self) -> None:
        self.status = {
            'environment': settings.environment_profile,
            'features': settings.feature_flags,
            'engines': self.container.engine_registry.names(),
            'capabilities': self.container.capability_registry.names(),
        }
        self.initialized = True

    def get_status(self) -> dict[str, Any]:
        return {
            'initialized': self.initialized,
            'environment': settings.environment_profile,
            'features': settings.feature_flags,
            'engines': self.container.engine_registry.names(),
            'capabilities': self.container.capability_registry.names(),
            'plugins': [plugin.name for plugin in self.container.plugin_registry.plugins()],
        }


def initialize_platform_runtime() -> PlatformRuntime:
    return PlatformRuntime()
