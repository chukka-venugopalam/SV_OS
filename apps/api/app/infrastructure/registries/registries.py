"""Production-ready registries for engines, capabilities, and plugins.

EngineRegistry supports:
- registration with dependency declaration
- dependency graph with cycle detection
- startup ordering (topological sort)
- shutdown ordering (reversed startup order)
- health aggregation across all engines
- engine lookup by name
- lazy initialization
- duplicate detection
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

from app.engines.base import EngineBase, EngineDependency, EngineHealth, EngineState

# ── Cycle Detection Error ──────────────────────────────────────────


class DependencyCycleError(ValueError):
    """Raised when a circular dependency is detected in the engine graph."""

    def __init__(self, cycle: list[str]) -> None:
        self.cycle = cycle
        super().__init__(f'Circular dependency detected: {" -> ".join(cycle)}')


# ── Plugin Manifest ────────────────────────────────────────────────


@dataclass(slots=True)
class PluginManifest:
    """Minimal plugin manifest representation."""

    name: str
    version: str
    description: str = ''
    entrypoint: str = ''
    capabilities: list[str] = field(default_factory=list)


# ── Dependency Graph ───────────────────────────────────────────────


class DependencyGraph:
    """Tracks engine dependencies and resolves startup/shutdown ordering."""

    def __init__(self) -> None:
        self._nodes: dict[str, set[str]] = {}  # engine -> set of dependency names
        self._reverse: dict[str, set[str]] = {}  # engine -> set of dependents

    def add_node(self, name: str, dependencies: list[str]) -> None:
        self._nodes.setdefault(name, set())
        self._reverse.setdefault(name, set())
        for dep in dependencies:
            self._nodes[name].add(dep)
            self._reverse.setdefault(dep, set()).add(name)

    def has_cycle(self) -> list[str] | None:
        """Detect cycles using DFS. Returns the cycle path if found, None otherwise."""
        visited: set[str] = set()
        in_stack: set[str] = set()
        parent: dict[str, str | None] = {}

        def dfs(node: str) -> list[str] | None:
            visited.add(node)
            in_stack.add(node)
            for neighbor in self._nodes.get(node, set()):
                if neighbor not in visited:
                    parent[neighbor] = node
                    result = dfs(neighbor)
                    if result:
                        return result
                elif neighbor in in_stack:
                    # Cycle detected: reconstruct the cycle path
                    cycle: list[str] = []
                    current: str | None = node
                    while current is not None:
                        cycle.append(current)
                        if current == neighbor:
                            break
                        current = parent.get(current)
                    if current is None:
                        cycle.append(neighbor)
                    cycle.reverse()
                    return cycle
            in_stack.discard(node)
            return None

        for node in list(self._nodes):
            if node not in visited:
                result = dfs(node)
                if result:
                    return result
        return None

    def validate_acyclic(self) -> None:
        """Raise DependencyCycleError if the graph contains a cycle."""
        cycle = self.has_cycle()
        if cycle is not None:
            raise DependencyCycleError(cycle)

    def startup_order(self) -> list[str]:
        """Topological sort: dependencies first, dependents later."""
        self.validate_acyclic()
        visited: set[str] = set()
        order: list[str] = []

        def dfs(node: str) -> None:
            if node in visited:
                return
            visited.add(node)
            for dep in self._nodes.get(node, set()):
                dfs(dep)
            order.append(node)

        for node in list(self._nodes):
            dfs(node)
        return order

    def shutdown_order(self) -> list[str]:
        """Reverse of startup order: stop dependents before dependencies."""
        return list(reversed(self.startup_order()))

    def dependencies_for(self, name: str) -> set[str]:
        return self._nodes.get(name, set())

    def dependents_for(self, name: str) -> set[str]:
        return self._reverse.get(name, set())

    def names(self) -> list[str]:
        return sorted(self._nodes)


# ── Engine Registry ────────────────────────────────────────────────


class EngineRegistry:
    """Production-ready engine registry with dependency management.

    Supports:
    - registration with dependency declaration
    - dependency graph with cycle detection
    - startup ordering (topological sort)
    - shutdown ordering (reversed startup)
    - health aggregation
    - engine lookup by name
    - lazy initialization
    - duplicate detection
    """

    def __init__(self) -> None:
        self._engines: dict[str, EngineBase] = {}
        self._factories: dict[str, type[EngineBase]] = {}
        self._dependencies: dict[str, list[EngineDependency]] = {}
        self._graph = DependencyGraph()

    # ── Registration ───────────────────────────────────────────────

    def register(
        self,
        name: str,
        engine_cls: type[EngineBase],
        dependencies: list[EngineDependency] | None = None,
    ) -> None:
        """Register an engine class with optional dependency metadata.

        Args:
            name: Canonical engine name (e.g. 'graph', 'event').
            engine_cls: The engine class (not an instance).
            dependencies: Optional list of engine dependencies.

        Raises:
            ValueError: If the engine is already registered.

        """
        if name in self._factories:
            msg = f"Engine '{name}' is already registered"
            raise ValueError(msg)
        self._factories[name] = engine_cls
        self._dependencies[name] = list(dependencies or [])
        dep_names = [d.engine_name for d in (dependencies or [])]
        self._graph.add_node(name, dep_names)

    def validate_graph(self) -> None:
        """Validate the full dependency graph is acyclic.

        Raises DependencyCycleError if a cycle is detected.
        """
        self._graph.validate_acyclic()

    # ── Initialization ─────────────────────────────────────────────

    def startup_order(self) -> list[str]:
        """Return engines in startup order (dependencies first).

        Raises DependencyCycleError if a cycle is detected.
        """
        return self._graph.startup_order()

    def shutdown_order(self) -> list[str]:
        """Return engines in shutdown order (dependents first).

        Raises DependencyCycleError if a cycle is detected.
        """
        return self._graph.shutdown_order()

    async def initialize_all(self) -> dict[str, EngineHealth]:
        """Initialize all registered engines in dependency order.

        Returns:
            Dict mapping engine names to their health status after init.

        """
        results: dict[str, EngineHealth] = {}
        order = self.startup_order()

        for name in order:
            engine = self.get(name)
            try:
                await engine.initialize()
            except Exception as exc:
                results[name] = EngineHealth(
                    engine_name=name,
                    state=EngineState.FAILED,
                    healthy=False,
                    message=f'Initialization failed: {exc}',
                )
                continue
            results[name] = await engine.health()

        return results

    async def start_all(self) -> dict[str, EngineHealth]:
        """Start all initialized engines in dependency order.

        Returns:
            Dict mapping engine names to their health status after start.

        """
        results: dict[str, EngineHealth] = {}
        order = self.startup_order()

        for name in order:
            engine = self.get(name)
            try:
                await engine.start()
            except Exception as exc:
                results[name] = EngineHealth(
                    engine_name=name,
                    state=EngineState.FAILED,
                    healthy=False,
                    message=f'Start failed: {exc}',
                )
                continue
            results[name] = await engine.health()

        return results

    async def stop_all(self) -> dict[str, EngineHealth]:
        """Stop all engines in shutdown order (reverse of startup).

        Returns:
            Dict mapping engine names to their health status after stop.

        """
        results: dict[str, EngineHealth] = {}
        order = self.shutdown_order()

        for name in order:
            engine = self._engines.get(name)
            if engine is None:
                continue
            try:  # noqa: SIM105
                await engine.stop()
            except Exception:
                pass  # Don't let one engine's stop failure cascade
            results[name] = await engine.health()

        return results

    async def health_all(self) -> dict[str, EngineHealth]:
        """Run health checks on all initialized engines.

        Returns:
            Dict mapping engine names to their health status.

        """
        results: dict[str, EngineHealth] = {}
        for name, engine in self._engines.items():
            results[name] = await engine.health()
        return results

    async def diagnostics_all(self) -> dict[str, dict[str, Any]]:
        """Get diagnostics for all initialized engines."""
        results: dict[str, dict[str, Any]] = {}
        for name, engine in self._engines.items():
            results[name] = await engine.diagnostics()
        return results

    # ── Engine Lookup ──────────────────────────────────────────────

    def get(self, name: str) -> EngineBase:
        """Get or lazy-initialize an engine by name.

        Args:
            name: Canonical engine name.

        Returns:
            The engine instance.

        Raises:
            KeyError: If the engine is not registered.

        """
        if name not in self._engines:
            if name not in self._factories:
                msg = f"Engine '{name}' is not registered"
                raise KeyError(msg)
            self._engines[name] = self._factories[name]()
        return self._engines[name]

    def try_get(self, name: str) -> EngineBase | None:
        """Get an engine by name, returning None if not registered."""
        try:
            return self.get(name)
        except KeyError:
            return None

    def names(self) -> list[str]:
        """Return sorted list of registered engine names."""
        return sorted(set(self._factories) | set(self._engines))

    def count(self) -> int:
        return len(self._factories)

    def is_registered(self, name: str) -> bool:
        return name in self._factories or name in self._engines

    def iter_engines(self) -> list[tuple[str, EngineBase]]:
        """Return list of (name, engine) tuples for all initialized engines."""
        return sorted(self._engines.items())

    # ── Engine Discovery ───────────────────────────────────────────

    def discover_engines(self) -> list[str]:
        """Discover available engines via scanning the app.engines module.

        Returns a list of engine names found (stub for future auto-discovery).
        """
        # Auto-discovery can be implemented by scanning app.engines for EngineBase subclasses
        return list(self._factories.keys())


# ── Capability Registry ────────────────────────────────────────────


class CapabilityRegistry:
    """Registers capabilities and resolves dependency order."""

    def __init__(self) -> None:
        self._capabilities: dict[str, list[str]] = {}

    def register_capability(self, name: str, dependencies: list[str] | None = None) -> None:
        self._capabilities[name] = list(dependencies or [])

    def resolve_dependencies(self, names: list[str] | str) -> list[str]:
        if isinstance(names, str):
            names = [names]

        ordered: list[str] = []
        visited: set[str] = set()

        def visit(name: str) -> None:
            if name in visited:
                return
            visited.add(name)
            deps = self._capabilities.get(name, [])
            for dep in deps:
                if dep not in visited:
                    visit(dep)
            ordered.append(name)

        for name in names:
            visit(name)

        return ordered

    def names(self) -> list[str]:
        return sorted(self._capabilities)


# ── Plugin Registry ────────────────────────────────────────────────


class PluginRegistry:
    """Loads plugin manifests and validates compatibility."""

    def __init__(self) -> None:
        self._plugins: dict[str, PluginManifest] = {}

    def load_manifest(self, manifest_path: str | Path) -> PluginManifest:
        path = Path(manifest_path)
        data = json.loads(path.read_text(encoding='utf-8'))
        manifest = PluginManifest(
            name=data['name'],
            version=data['version'],
            description=data.get('description', ''),
            entrypoint=data.get('entrypoint', ''),
            capabilities=list(data.get('capabilities', [])),
        )
        self._plugins[manifest.name] = manifest
        return manifest

    def is_version_compatible(self, version: str, requirement: str) -> bool:
        if requirement.startswith('>='):
            return version >= requirement[2:]
        if requirement.startswith('<='):
            return version <= requirement[2:]
        if requirement.startswith('>'):
            return version > requirement[1:]
        if requirement.startswith('<'):
            return version < requirement[1:]
        return version == requirement

    def plugins(self) -> list[PluginManifest]:
        return list(self._plugins.values())
