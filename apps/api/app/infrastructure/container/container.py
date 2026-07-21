"""Platform container for shared services and registries."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.engines.analytics_engine import AnalyticsEngine
from app.engines.assessment_engine import AssessmentEngine
from app.engines.base import EngineDependency
from app.engines.career_engine import CareerEngine
from app.engines.dependency_engine import DependencyEngine
from app.engines.event_engine import EventEngine as EventEngineImpl
from app.engines.export_engine import ExportEngine
from app.engines.graph_engine import GraphEngine
from app.engines.import_engine import ImportEngine
from app.engines.knowledge_engine import KnowledgeEngine
from app.engines.learning_path_engine import LearningPathEngine
from app.engines.plugin_engine import PluginEngine
from app.engines.query_engine import QueryEngine
from app.engines.recommendation_engine import RecommendationEngine
from app.engines.revision_engine import RevisionEngine
from app.engines.scheduling_engine import SchedulingEngine
from app.engines.state_engine import StateEngine
from app.engines.traversal_engine import TraversalEngine
from app.engines.validation_engine import ValidationEngine
from app.engines.versioning_engine import VersioningEngine
from app.events.bus import EventBus
from app.infrastructure.audit import AuditLogger
from app.infrastructure.cache import CacheBackend, InMemoryCache
from app.infrastructure.cache.graph_cache import GraphCache
from app.infrastructure.notifications import NotificationService
from app.infrastructure.registries.registries import (
    CapabilityRegistry,
    EngineRegistry,
    PluginRegistry,
)
from app.infrastructure.websocket import WebSocketManager
from app.infrastructure.workers import WorkerManager


@dataclass(slots=True)
class PlatformContainer:
    """Central dependency container for platform-level services."""

    engine_registry: EngineRegistry = field(default_factory=EngineRegistry)
    capability_registry: CapabilityRegistry = field(default_factory=CapabilityRegistry)
    plugin_registry: PluginRegistry = field(default_factory=PluginRegistry)
    event_bus: EventBus = field(default_factory=EventBus)
    cache: CacheBackend = field(default_factory=InMemoryCache)
    graph_cache: GraphCache = field(default_factory=GraphCache)
    worker_manager: WorkerManager = field(default_factory=WorkerManager)
    notification_service: NotificationService = field(default_factory=NotificationService)
    audit_logger: AuditLogger = field(default_factory=AuditLogger)
    websocket_manager: WebSocketManager = field(default_factory=WebSocketManager)

    def register_engine(self, name: str, factory: Any) -> None:
        self.engine_registry.register(name, factory)

    def register_capability(self, name: str, dependencies: list[str] | None = None) -> None:
        self.capability_registry.register_capability(name, dependencies)


_container: PlatformContainer | None = None


def build_platform_container() -> PlatformContainer:
    """Build the platform container with all canonical engines registered.

    Engines are registered with their dependency declarations so the
    EngineRegistry can validate the dependency graph and determine
    startup/shutdown ordering.
    """
    container = PlatformContainer()

    # ── Register Canonical Engines ────────────────────────────────
    # Core engines (no dependencies on other engines)
    container.engine_registry.register('event', EventEngineImpl, dependencies=[])
    container.engine_registry.register('graph', GraphEngine, dependencies=[])

    # Second-layer engines (depend on graph)
    container.engine_registry.register(
        'knowledge',
        lambda: KnowledgeEngine(graph_engine=container.engine_registry.try_get('graph')),
        dependencies=[EngineDependency('graph', required=True)],
    )
    container.engine_registry.register(
        'dependency',
        lambda: DependencyEngine(graph_engine=container.engine_registry.try_get('graph')),
        dependencies=[EngineDependency('graph', required=True)],
    )
    container.engine_registry.register(
        'traversal',
        lambda: TraversalEngine(graph_engine=container.engine_registry.try_get('graph')),
        dependencies=[EngineDependency('graph', required=True)],
    )
    container.engine_registry.register(
        'query',
        lambda: QueryEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            traversal_engine=container.engine_registry.try_get('traversal'),
            knowledge_engine=container.engine_registry.try_get('knowledge'),
        ),
        dependencies=[
            EngineDependency('graph', required=True),
            EngineDependency('traversal', required=True),
        ],
    )
    container.engine_registry.register(
        'state',
        StateEngine,
        dependencies=[EngineDependency('event', required=False)],
    )
    container.engine_registry.register(
        'recommendation',
        lambda: RecommendationEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            state_engine=container.engine_registry.try_get('state'),
            dependency_engine=container.engine_registry.try_get('dependency'),
            knowledge_engine=container.engine_registry.try_get('knowledge'),
            traversal_engine=container.engine_registry.try_get('traversal'),
        ),
        dependencies=[
            EngineDependency('graph', required=True),
            EngineDependency('traversal', required=False),
            EngineDependency('state', required=False),
        ],
    )
    container.engine_registry.register(
        'learning_path',
        lambda: LearningPathEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            traversal_engine=container.engine_registry.try_get('traversal'),
            state_engine=container.engine_registry.try_get('state'),
        ),
        dependencies=[
            EngineDependency('graph', required=True),
            EngineDependency('traversal', required=True),
        ],
    )
    container.engine_registry.register(
        'assessment',
        lambda: AssessmentEngine(
            state_engine=container.engine_registry.try_get('state'),
            graph_engine=container.engine_registry.try_get('graph'),
        ),
        dependencies=[EngineDependency('state', required=False)],
    )
    container.engine_registry.register(
        'career',
        lambda: CareerEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            traversal_engine=container.engine_registry.try_get('traversal'),
            state_engine=container.engine_registry.try_get('state'),
            knowledge_engine=container.engine_registry.try_get('knowledge'),
        ),
        dependencies=[
            EngineDependency('graph', required=True),
            EngineDependency('traversal', required=False),
        ],
    )
    container.engine_registry.register(
        'versioning',
        lambda: VersioningEngine(graph_engine=container.engine_registry.try_get('graph')),
        dependencies=[EngineDependency('graph', required=True)],
    )
    container.engine_registry.register(
        'export',
        lambda: ExportEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            traversal_engine=container.engine_registry.try_get('traversal'),
        ),
        dependencies=[
            EngineDependency('graph', required=True),
            EngineDependency('traversal', required=False),
        ],
    )
    container.engine_registry.register(
        'scheduler',
        SchedulingEngine,
        dependencies=[EngineDependency('event', required=False)],
    )
    container.engine_registry.register(
        'revision',
        lambda: RevisionEngine(
            state_engine=container.engine_registry.try_get('state'),
            graph_engine=container.engine_registry.try_get('graph'),
        ),
        dependencies=[
            EngineDependency('state', required=False),
            EngineDependency('graph', required=False),
        ],
    )
    container.engine_registry.register(
        'analytics',
        lambda: AnalyticsEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            state_engine=container.engine_registry.try_get('state'),
            cache=container.cache,
        ),
        dependencies=[
            EngineDependency('graph', required=False),
            EngineDependency('state', required=False),
        ],
    )
    container.engine_registry.register(
        'plugin',
        lambda: PluginEngine(engine_registry=container.engine_registry),
        dependencies=[EngineDependency('event', required=False)],
    )
    container.engine_registry.register(
        'validation',
        lambda: ValidationEngine(
            graph_engine=container.engine_registry.try_get('graph'),
            knowledge_engine=container.engine_registry.try_get('knowledge'),
        ),
        dependencies=[EngineDependency('graph', required=True)],
    )
    container.engine_registry.register(
        'import',
        lambda: ImportEngine(
            validation_engine=container.engine_registry.try_get('validation'),
            graph_engine=container.engine_registry.try_get('graph'),
            knowledge_engine=container.engine_registry.try_get('knowledge'),
        ),
        dependencies=[
            EngineDependency('validation', required=True),
            EngineDependency('graph', required=True),
        ],
    )

    # ── Register Capabilities ─────────────────────────────────────
    container.register_capability('auth')
    container.register_capability('search', dependencies=['auth'])
    container.register_capability('analytics', dependencies=['search'])
    container.register_capability('graph', dependencies=['auth'])
    container.register_capability('import', dependencies=['auth', 'graph'])

    return container


def get_platform_container() -> PlatformContainer:
    global _container
    if _container is None:
        _container = build_platform_container()
    return _container
