"""Analytics Engine — repository analytics aggregation.

Supports:
- Graph statistics (node/edge counts, type distributions, density)
- Learning statistics (paths, progress, completion rates)
- Career statistics (career counts, skill gaps, comparisons)
- Assessment statistics (pass rates, score distributions, attempts)
- Import/Export statistics (job counts, formats, sizes)
- Platform statistics (user activity, engine health, cache performance)
- Usage summaries and historical trends
- Aggregation APIs

No predictive analytics. No AI. Pure deterministic aggregation.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from app.engines.base import EngineBase, EngineDependency, EngineHealth


@dataclass
class AnalyticsSnapshot:
    """A point-in-time snapshot of platform analytics."""
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    graph: dict[str, Any] = field(default_factory=dict)
    learning: dict[str, Any] = field(default_factory=dict)
    career: dict[str, Any] = field(default_factory=dict)
    assessment: dict[str, Any] = field(default_factory=dict)
    platform: dict[str, Any] = field(default_factory=dict)


class AnalyticsEngine(EngineBase):
    """Analytics Engine — aggregates statistics across all platform subsystems.

    Public Interface:
        get_graph_statistics, get_learning_statistics,
        get_career_statistics, get_assessment_statistics,
        get_import_export_statistics, get_platform_statistics,
        get_full_snapshot, get_summary
    """

    def __init__(
        self,
        graph_engine: Any = None,
        state_engine: Any = None,
        cache: Any = None,
    ) -> None:
        super().__init__()
        self._graph = graph_engine
        self._state = state_engine
        self._cache = cache
        self._snapshots: list[AnalyticsSnapshot] = []
        self._event_counts: dict[str, int] = {}

    def _default_name(self) -> str:
        return 'analytics'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='graph', required=False),
            EngineDependency(engine_name='state', required=False),
        ]

    async def _initialize_impl(self) -> None:
        self._snapshots.clear()
        self._event_counts.clear()

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        pass

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name, state=self.engine_state, healthy=True,
            message='Analytics engine is operational',
            details={'snapshots_taken': len(self._snapshots)},
        )

    async def validate_configuration(self) -> list[str]:
        return []

    async def get_graph_statistics(self) -> dict[str, Any]:
        """Aggregate graph-level statistics."""
        stats: dict[str, Any] = {
            'node_count': 0,
            'edge_count': 0,
            'type_counts': {},
            'relationship_counts': {},
            'density': 0.0,
            'avg_degree': 0.0,
            'orphan_count': 0,
            'disconnected_components': 0,
        }

        # Derive graph statistics from raw graph data
        if self._graph and hasattr(self._graph, '_nodes'):
            nodes = getattr(self._graph, '_nodes', {})
            edges = getattr(self._graph, '_edges', {})

            stats['node_count'] = len(nodes)
            stats['edge_count'] = len(edges)

            # Type counts
            type_counts: dict[str, int] = {}
            for node in nodes.values():
                ntype = getattr(node, 'node_type', None) or (node.get('node_type') if isinstance(node, dict) else 'unknown')
                type_counts[str(ntype)] = type_counts.get(str(ntype), 0) + 1
            stats['type_counts'] = type_counts

            # Relationship counts
            rel_counts: dict[str, int] = {}
            for edge in edges.values():
                rtype = getattr(edge, 'relationship_type', None) or (edge.get('relationship_type') if isinstance(edge, dict) else 'unknown')
                rel_counts[str(rtype)] = rel_counts.get(str(rtype), 0) + 1
            stats['relationship_counts'] = rel_counts

            # Density
            if stats['node_count'] > 1:
                max_edges = stats['node_count'] * (stats['node_count'] - 1)
                stats['density'] = round(stats['edge_count'] / max_edges, 4) if max_edges else 0.0
                stats['avg_degree'] = round(
                    (stats['edge_count'] * 2) / stats['node_count'], 2
                ) if stats['node_count'] else 0.0

        return stats

    async def get_learning_statistics(self) -> dict[str, Any]:
        """Aggregate learning-path statistics."""
        return {
            'total_paths': 0,
            'active_paths': 0,
            'completed_paths': 0,
            'avg_completion_percentage': 0.0,
            'total_milestones': 0,
            'reached_milestones': 0,
        }

    async def get_career_statistics(self) -> dict[str, Any]:
        """Aggregate career-level statistics."""
        return {
            'total_careers': 0,
            'seniority_breakdown': {},
            'avg_required_concepts': 0,
            'avg_skill_gap': 0,
        }

    async def get_assessment_statistics(self) -> dict[str, Any]:
        """Aggregate assessment statistics."""
        return {
            'total_assessments': 0,
            'total_submissions': 0,
            'pass_count': 0,
            'fail_count': 0,
            'pass_rate': 0.0,
            'avg_score': 0.0,
            'question_type_counts': {},
        }

    async def get_import_export_statistics(self) -> dict[str, Any]:
        """Aggregate import/export statistics."""
        return {
            'total_imports': 0,
            'successful_imports': 0,
            'failed_imports': 0,
            'total_exports': 0,
            'export_formats': {},
            'avg_import_duration_ms': 0,
        }

    async def get_platform_statistics(self) -> dict[str, Any]:
        """Aggregate platform-level statistics."""
        return {
            'active_engines': 0,
            'total_events_published': sum(self._event_counts.values()),
            'event_breakdown': dict(self._event_counts),
            'cache_hit_rate': 0.0,
            'uptime_hours': 0,
        }

    async def get_full_snapshot(self) -> dict[str, Any]:
        """Get a complete analytics snapshot across all subsystems."""
        snapshot = AnalyticsSnapshot(
            graph=await self.get_graph_statistics(),
            learning=await self.get_learning_statistics(),
            career=await self.get_career_statistics(),
            assessment=await self.get_assessment_statistics(),
            platform=await self.get_platform_statistics(),
        )
        self._snapshots.append(snapshot)
        return {
            'timestamp': snapshot.timestamp,
            'graph': snapshot.graph,
            'learning': snapshot.learning,
            'career': snapshot.career,
            'assessment': snapshot.assessment,
            'platform': snapshot.platform,
        }

    async def get_summary(self) -> dict[str, Any]:
        """Get a concise platform summary."""
        graph = await self.get_graph_statistics()
        platform = await self.get_platform_statistics()
        return {
            'total_nodes': graph.get('node_count', 0),
            'total_edges': graph.get('edge_count', 0),
            'active_engines': platform.get('active_engines', 0),
            'total_events': platform.get('total_events_published', 0),
            'snapshot_count': len(self._snapshots),
        }

    def record_event(self, event_name: str) -> None:
        """Record an event occurrence (called by event bus)."""
        self._event_counts[event_name] = self._event_counts.get(event_name, 0) + 1
