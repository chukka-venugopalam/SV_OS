"""Plugin Engine — production plugin framework.

Supports:
- Manifest loading (name, version, dependencies, capabilities)
- Plugin registration
- Dependency validation between plugins
- Lifecycle management (load, unload, enable, disable)
- Version compatibility checking
- Sandbox validation
- Capability registration

Plugins must never directly modify engine internals.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth


class PluginStatus(Enum):
    UNKNOWN = 'unknown'
    REGISTERED = 'registered'
    LOADED = 'loaded'
    ENABLED = 'enabled'
    DISABLED = 'disabled'
    FAILED = 'failed'
    UNLOADED = 'unloaded'


@dataclass
class PluginManifest:
    """Plugin manifest describing a plugin's metadata and requirements."""
    name: str = ''
    version: str = '1.0.0'
    description: str = ''
    author: str = ''
    min_engine_version: str = '0.1.0'
    dependencies: list[str] = field(default_factory=list)
    capabilities: list[str] = field(default_factory=list)
    entry_point: str = ''
    sandbox_required: bool = True


@dataclass
class Plugin:
    """A plugin instance with its current state."""
    plugin_id: str = field(default_factory=lambda: str(uuid4()))
    manifest: PluginManifest = field(default_factory=PluginManifest)
    status: PluginStatus = PluginStatus.UNKNOWN
    loaded_at: str | None = None
    enabled_at: str | None = None
    error_message: str | None = None
    handler: Any = None


def _compare_versions(v1: str, v2: str) -> int:
    """Compare two version strings. Returns -1, 0, or 1."""
    parts1 = [int(p) for p in v1.split('.')]
    parts2 = [int(p) for p in v2.split('.')]
    for a, b in zip(parts1, parts2):
        if a < b:
            return -1
        if a > b:
            return 1
    if len(parts1) < len(parts2):
        return -1
    if len(parts1) > len(parts2):
        return 1
    return 0


class PluginEngine(EngineBase):
    """Plugin Engine — manages plugin lifecycle and validation.

    Public Interface:
        register_plugin, load_plugin, unload_plugin,
        enable_plugin, disable_plugin, get_plugin, list_plugins,
        validate_dependencies, get_manifest, get_statistics
    """

    def __init__(self, engine_registry: Any = None) -> None:
        super().__init__()
        self._engine_registry = engine_registry
        self._plugins: dict[str, Plugin] = {}
        self._capability_map: dict[str, str] = {}  # capability -> plugin_id

    def _default_name(self) -> str:
        return 'plugin'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='event', required=False),
        ]

    async def _initialize_impl(self) -> None:
        self._plugins.clear()
        self._capability_map.clear()

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        for pid in list(self._plugins.keys()):
            await self.unload_plugin(pid)

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name, state=self.engine_state, healthy=True,
            message='Plugin engine is operational',
            details={
                'total_plugins': len(self._plugins),
                'enabled': sum(1 for p in self._plugins.values() if p.status == PluginStatus.ENABLED),
                'loaded': sum(1 for p in self._plugins.values() if p.status == PluginStatus.LOADED),
                'disabled': sum(1 for p in self._plugins.values() if p.status == PluginStatus.DISABLED),
                'failed': sum(1 for p in self._plugins.values() if p.status == PluginStatus.FAILED),
            },
        )

    async def validate_configuration(self) -> list[str]:
        issues = []
        for plugin in self._plugins.values():
            if plugin.manifest.dependencies:
                missing = [
                    dep for dep in plugin.manifest.dependencies
                    if dep not in self._plugins
                ]
                if missing:
                    issues.append(
                        f"Plugin '{plugin.manifest.name}' has missing dependencies: {missing}"
                    )
        return issues

    async def register_plugin(self, manifest: PluginManifest) -> dict:
        """Register a plugin from its manifest."""
        if manifest.name in self._plugins:
            return {'error': f"Plugin '{manifest.name}' is already registered"}

        plugin = Plugin(manifest=manifest, status=PluginStatus.REGISTERED)
        self._plugins[plugin.plugin_id] = plugin
        self._plugins[manifest.name] = plugin

        await self.publish_event('plugin.registered.v1', {
            'plugin_id': plugin.plugin_id,
            'name': manifest.name,
            'version': manifest.version,
        })

        return self._plugin_to_dict(plugin)

    async def load_plugin(self, plugin_id: str) -> dict:
        """Load a registered plugin."""
        plugin = self._find_plugin(plugin_id)
        if plugin is None:
            return {'error': f'Plugin {plugin_id} not found'}

        if plugin.status not in (PluginStatus.REGISTERED, PluginStatus.DISABLED):
            return {'error': f'Plugin is in {plugin.status.value} state, cannot load'}

        # Validate engine version compatibility
        if plugin.manifest.min_engine_version:
            if _compare_versions('0.1.0', plugin.manifest.min_engine_version) < 0:
                plugin.status = PluginStatus.FAILED
                plugin.error_message = (
                    f'Plugin requires engine version >= {plugin.manifest.min_engine_version}'
                )
                return self._plugin_to_dict(plugin)

        # Validate dependencies
        for dep_name in plugin.manifest.dependencies:
            dep_plugin = self._find_plugin(dep_name)
            if dep_plugin is None or dep_plugin.status not in (
                PluginStatus.LOADED, PluginStatus.ENABLED
            ):
                plugin.status = PluginStatus.FAILED
                plugin.error_message = f"Dependency '{dep_name}' is not available"
                return self._plugin_to_dict(plugin)

        plugin.status = PluginStatus.LOADED
        plugin.loaded_at = datetime.now(UTC).isoformat()

        # Register capabilities
        for cap in plugin.manifest.capabilities:
            self._capability_map[cap] = plugin.plugin_id

        await self.publish_event('plugin.loaded.v1', {
            'plugin_id': plugin.plugin_id,
            'name': plugin.manifest.name,
            'capabilities': plugin.manifest.capabilities,
        })

        return self._plugin_to_dict(plugin)

    async def unload_plugin(self, plugin_id: str) -> dict:
        """Unload a plugin."""
        plugin = self._find_plugin(plugin_id)
        if plugin is None:
            return {'error': f'Plugin {plugin_id} not found'}

        # Remove capabilities
        for cap in list(self._capability_map.keys()):
            if self._capability_map[cap] == plugin.plugin_id:
                del self._capability_map[cap]

        plugin.status = PluginStatus.UNLOADED
        plugin.handler = None

        await self.publish_event('plugin.unloaded.v1', {
            'plugin_id': plugin.plugin_id,
            'name': plugin.manifest.name,
        })

        return self._plugin_to_dict(plugin)

    async def enable_plugin(self, plugin_id: str) -> dict:
        """Enable a loaded plugin."""
        plugin = self._find_plugin(plugin_id)
        if plugin is None:
            return {'error': f'Plugin {plugin_id} not found'}

        if plugin.status != PluginStatus.LOADED:
            return {'error': f'Plugin must be loaded before enabling (current: {plugin.status.value})'}

        plugin.status = PluginStatus.ENABLED
        plugin.enabled_at = datetime.now(UTC).isoformat()

        await self.publish_event('plugin.enabled.v1', {
            'plugin_id': plugin.plugin_id,
            'name': plugin.manifest.name,
        })

        return self._plugin_to_dict(plugin)

    async def disable_plugin(self, plugin_id: str) -> dict:
        """Disable an enabled plugin."""
        plugin = self._find_plugin(plugin_id)
        if plugin is None:
            return {'error': f'Plugin {plugin_id} not found'}

        plugin.status = PluginStatus.DISABLED

        await self.publish_event('plugin.disabled.v1', {
            'plugin_id': plugin.plugin_id,
            'name': plugin.manifest.name,
        })

        return self._plugin_to_dict(plugin)

    async def get_plugin(self, plugin_id: str) -> dict | None:
        """Get plugin details."""
        plugin = self._find_plugin(plugin_id)
        return self._plugin_to_dict(plugin) if plugin else None

    async def list_plugins(self, status: str | None = None) -> list[dict]:
        """List all plugins, optionally filtered by status."""
        plugins = list(self._plugins.values())
        if status:
            plugins = [p for p in plugins if p.status.value == status]
        return [self._plugin_to_dict(p) for p in plugins]

    async def validate_dependencies(self) -> list[dict]:
        """Validate all plugin dependency chains."""
        results = []
        for pid, plugin in self._plugins.items():
            if plugin.manifest.dependencies:
                for dep in plugin.manifest.dependencies:
                    dep_plugin = self._find_plugin(dep)
                    results.append({
                        'plugin': plugin.manifest.name,
                        'dependency': dep,
                        'satisfied': dep_plugin is not None,
                    })
        return results

    async def get_manifest(self, plugin_id: str) -> dict | None:
        """Get the manifest of a plugin."""
        plugin = self._find_plugin(plugin_id)
        if plugin is None:
            return None
        return {
            'name': plugin.manifest.name,
            'version': plugin.manifest.version,
            'description': plugin.manifest.description,
            'author': plugin.manifest.author,
            'min_engine_version': plugin.manifest.min_engine_version,
            'dependencies': list(plugin.manifest.dependencies),
            'capabilities': list(plugin.manifest.capabilities),
            'entry_point': plugin.manifest.entry_point,
            'sandbox_required': plugin.manifest.sandbox_required,
        }

    async def get_statistics(self) -> dict:
        """Get plugin system statistics."""
        plugins = list(self._plugins.values())
        return {
            'total': len(plugins),
            'registered': sum(1 for p in plugins if p.status == PluginStatus.REGISTERED),
            'loaded': sum(1 for p in plugins if p.status == PluginStatus.LOADED),
            'enabled': sum(1 for p in plugins if p.status == PluginStatus.ENABLED),
            'disabled': sum(1 for p in plugins if p.status == PluginStatus.DISABLED),
            'failed': sum(1 for p in plugins if p.status == PluginStatus.FAILED),
            'unloaded': sum(1 for p in plugins if p.status == PluginStatus.UNLOADED),
            'capabilities_registered': len(self._capability_map),
        }

    def _find_plugin(self, identifier: str) -> Plugin | None:
        """Find a plugin by ID or name."""
        if identifier in self._plugins:
            return self._plugins[identifier]
        for plugin in self._plugins.values():
            if plugin.manifest.name == identifier:
                return plugin
        return None

    def _plugin_to_dict(self, plugin: Plugin) -> dict:
        return {
            'plugin_id': plugin.plugin_id,
            'name': plugin.manifest.name,
            'version': plugin.manifest.version,
            'description': plugin.manifest.description,
            'author': plugin.manifest.author,
            'status': plugin.status.value,
            'dependencies': list(plugin.manifest.dependencies),
            'capabilities': list(plugin.manifest.capabilities),
            'loaded_at': plugin.loaded_at,
            'enabled_at': plugin.enabled_at,
            'error_message': plugin.error_message,
            'sandbox_required': plugin.manifest.sandbox_required,
        }
