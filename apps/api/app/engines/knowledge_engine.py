"""Knowledge Engine — manage node content, resources, tags, skills, and metadata.

Supports:
- Node retrieval by ID
- Node registration and lookup
- Relationship lookup (via GraphEngine)
- Metadata access
- Content lookup (in-memory)
- Career, Project, Simulator lookups
- Hidden and cross-domain relationship lookup
- Content indexing
- Node metadata synchronization
- Content cache
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any

from app.engines.base import EngineBase, EngineDependency, EngineHealth

if TYPE_CHECKING:
    from uuid import UUID


@dataclass
class NodeContentRecord:
    """In-memory record for a knowledge node's content."""

    node_id: UUID
    title: str = ''
    description: str = ''
    content: str | None = None
    content_type: str = 'markdown'
    estimated_minutes: int = 30
    icon: str | None = None
    color: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass
class ResourceRecord:
    """In-memory record for a learning resource."""

    resource_id: UUID
    node_id: UUID
    title: str = ''
    url: str = ''
    resource_type: str = 'article'
    platform: str = ''
    is_free: bool = True
    duration_minutes: int | None = None


@dataclass
class ContentIndexEntry:
    """An entry in the content index for fast lookups."""

    node_id: UUID
    title: str
    description: str
    tags: list[str]
    skills: list[str]
    indexed_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


class KnowledgeEngine(EngineBase):
    """Knowledge Engine — content and metadata management for knowledge nodes.

    Provides in-memory storage for node content, resources, and metadata.
    Synchronizes with the GraphEngine for structural operations.

    Public Interface:
        get_content, get_content_blocks, get_resources,
        get_tags, get_skills_for_node, get_assessments_for_node,
        get_careers_for_node, get_projects_for_node, get_simulators_for_node,
        get_hidden_relationships, get_cross_domain_relationships,
        rebuild_content_index, search_content, sync_with_graph
    """

    def __init__(self, graph_engine: Any | None = None) -> None:
        super().__init__()
        self._graph: Any = graph_engine  # GraphEngine reference
        self._contents: dict[UUID, NodeContentRecord] = {}
        self._resources: dict[UUID, ResourceRecord] = {}
        self._node_resources: dict[UUID, list[UUID]] = {}  # node_id -> resource_ids
        self._tags: dict[UUID, list[str]] = {}  # node_id -> tag list
        self._skills: dict[UUID, list[dict]] = {}  # node_id -> skill list

        # Phase 3 additions: career/project/simulator/progress lookups
        self._node_careers: dict[UUID, list[dict]] = {}  # node_id -> career list
        self._node_projects: dict[UUID, list[dict]] = {}  # node_id -> project list
        self._node_simulators: dict[UUID, list[dict]] = {}  # node_id -> simulator list
        self._node_progress: dict[UUID, dict] = {}  # node_id -> progress data
        self._hidden_relationships: dict[UUID, list[dict]] = {}  # node_id -> hidden rels
        self._cross_domain_relationships: dict[
            UUID,
            list[dict],
        ] = {}  # node_id -> cross-domain rels

        # Content index for fast search
        self._content_index: dict[str, list[ContentIndexEntry]] = {}  # keyword -> entries

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'knowledge'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='graph',
                required=True,
                description='Graph engine for node structure',
            ),
        ]

    # ── Lifecycle ──────────────────────────────────────────────────

    async def _initialize_impl(self) -> None:
        """Initialize the knowledge engine."""

    async def _start_impl(self) -> None:
        """Start the knowledge engine."""

    async def _stop_impl(self) -> None:
        """Stop the knowledge engine."""
        self._contents.clear()
        self._resources.clear()
        self._node_resources.clear()
        self._tags.clear()
        self._skills.clear()
        self._node_careers.clear()
        self._node_projects.clear()
        self._node_simulators.clear()
        self._node_progress.clear()
        self._hidden_relationships.clear()
        self._cross_domain_relationships.clear()
        self._content_index.clear()

    async def health_impl(self) -> EngineHealth:
        """Check knowledge engine health."""
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Knowledge engine is operational',
            details={
                'content_count': len(self._contents),
                'resource_count': len(self._resources),
                'tagged_nodes': len(self._tags),
                'indexed_terms': len(self._content_index),
                'careers_mapped': len(self._node_careers),
            },
        )

    async def validate_configuration(self) -> list[str]:
        """Validate configuration."""
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ── Content ────────────────────────────────────────────────────

    async def get_content(self, node_id: UUID) -> str | None:
        """Get the full content body for a knowledge node."""
        record = self._contents.get(node_id)
        return record.content if record else None

    async def register_content(self, node_id: UUID, content: NodeContentRecord) -> None:
        """Register or update content for a node."""
        self._contents[node_id] = content

    async def get_content_blocks(self, node_id: UUID) -> list[dict]:
        """Get structured content blocks for a knowledge node."""
        record = self._contents.get(node_id)
        if record is None or not record.content:
            return []
        return [
            {
                'type': 'text',
                'content': record.content,
                'metadata': {'content_type': record.content_type},
            },
        ]

    async def content_exists(self, node_id: UUID) -> bool:
        """Check if content exists for a node."""
        return node_id in self._contents

    # ── Content Indexing (Phase 3) ─────────────────────────────────

    async def rebuild_content_index(self) -> dict[str, Any]:
        """Rebuild the full-text content index from all registered content.

        Returns stats about the indexing process.
        """
        self._content_index.clear()
        indexed_count = 0

        for node_id, record in self._contents.items():
            tags = self._tags.get(node_id, [])
            skills = [
                s.get('name', '') for s in self._skills.get(node_id, []) if isinstance(s, dict)
            ]

            entry = ContentIndexEntry(
                node_id=node_id,
                title=record.title,
                description=record.description,
                tags=tags,
                skills=skills,
            )

            # Index title words
            for word in record.title.lower().split():
                self._content_index.setdefault(word, []).append(entry)

            # Index description words
            if record.description:
                for word in record.description.lower().split():
                    self._content_index.setdefault(word, []).append(entry)

            # Index tags
            for tag in tags:
                self._content_index.setdefault(tag.lower(), []).append(entry)

            # Index skills
            for skill in skills:
                self._content_index.setdefault(skill.lower(), []).append(entry)

            indexed_count += 1

        return {
            'indexed_terms': len(self._content_index),
            'indexed_nodes': indexed_count,
            'total_entries': sum(len(v) for v in self._content_index.values()),
        }

    async def search_content(self, query: str, limit: int = 20) -> list[dict]:
        """Search indexed content by keyword.

        Args:
            query: Search keyword.
            limit: Maximum results to return.

        Returns:
            List of matching node dicts with relevance scores.

        """
        if not query or not self._content_index:
            return []

        query_lower = query.lower()
        results: dict[UUID, float] = {}

        # Direct term match
        for term, entries in self._content_index.items():
            if query_lower in term:
                for entry in entries:
                    results[entry.node_id] = results.get(entry.node_id, 0.0) + 1.0

        # Partial term match
        for term, entries in self._content_index.items():
            for word in query_lower.split():
                if word in term:
                    for entry in entries:
                        results[entry.node_id] = results.get(entry.node_id, 0.0) + 0.5

        # Sort by score descending
        sorted_results = sorted(results.items(), key=lambda x: x[1], reverse=True)

        # Build response
        items = []
        for node_id, score in sorted_results[:limit]:
            record = self._contents.get(node_id)
            if record:
                items.append(
                    {
                        'node_id': str(node_id),
                        'title': record.title,
                        'description': record.description,
                        'relevance_score': round(score, 2),
                        'tags': self._tags.get(node_id, []),
                    },
                )

        return items

    # ── Resources ──────────────────────────────────────────────────

    async def get_resources(self, node_id: UUID) -> list[dict]:
        """Get learning resources attached to a node."""
        resource_ids = self._node_resources.get(node_id, [])
        return [
            {
                'id': str(self._resources[rid].resource_id),
                'title': self._resources[rid].title,
                'url': self._resources[rid].url,
                'resource_type': self._resources[rid].resource_type,
                'platform': self._resources[rid].platform,
                'is_free': self._resources[rid].is_free,
                'duration_minutes': self._resources[rid].duration_minutes,
            }
            for rid in resource_ids
            if rid in self._resources
        ]

    async def register_resource(self, node_id: UUID, resource: ResourceRecord) -> None:
        """Register a learning resource for a node."""
        self._resources[resource.resource_id] = resource
        self._node_resources.setdefault(node_id, []).append(resource.resource_id)

    # ── Tags ───────────────────────────────────────────────────────

    async def get_tags(self, node_id: UUID) -> list[dict]:
        """Get tags associated with a node."""
        tags = self._tags.get(node_id, [])
        return [{'name': tag, 'node_id': str(node_id)} for tag in tags]

    async def set_tags(self, node_id: UUID, tags: list[str]) -> None:
        """Set tags for a node."""
        self._tags[node_id] = list(tags)

    async def add_tag(self, node_id: UUID, tag: str) -> None:
        """Add a single tag to a node."""
        self._tags.setdefault(node_id, []).append(tag)

    # ── Skills ─────────────────────────────────────────────────────

    async def get_skills_for_node(self, node_id: UUID) -> list[dict]:
        """Get skills associated with a node."""
        return list(self._skills.get(node_id, []))

    async def set_skills_for_node(self, node_id: UUID, skills: list[dict]) -> None:
        """Set skills for a node."""
        self._skills[node_id] = list(skills)

    # ── Assessments ────────────────────────────────────────────────

    async def get_assessments_for_node(self, _node_id: UUID) -> list[dict]:
        """Get assessments associated with a node."""
        return []

    # ── Career Lookup (Phase 3) ────────────────────────────────────

    async def get_careers_for_node(self, node_id: UUID) -> list[dict]:
        """Get careers associated with a knowledge node.

        Returns careers that require or are related to this node.
        """
        return list(self._node_careers.get(node_id, []))

    async def set_careers_for_node(self, node_id: UUID, careers: list[dict]) -> None:
        """Set careers for a node."""
        self._node_careers[node_id] = list(careers)

    async def get_all_careers(self) -> list[dict]:
        """Get all unique careers across all nodes."""
        seen: set[str] = set()
        careers: list[dict] = []
        for node_careers in self._node_careers.values():
            for career in node_careers:
                name = career.get('name', '')
                if name and name not in seen:
                    seen.add(name)
                    careers.append(career)
        return careers

    # ── Project Lookup (Phase 3) ───────────────────────────────────

    async def get_projects_for_node(self, node_id: UUID) -> list[dict]:
        """Get projects that exercise or are related to this node."""
        return list(self._node_projects.get(node_id, []))

    async def set_projects_for_node(self, node_id: UUID, projects: list[dict]) -> None:
        """Set projects for a node."""
        self._node_projects[node_id] = list(projects)

    # ── Simulator Lookup (Phase 3) ─────────────────────────────────

    async def get_simulators_for_node(self, node_id: UUID) -> list[dict]:
        """Get simulator exercises related to this node."""
        return list(self._node_simulators.get(node_id, []))

    async def set_simulators_for_node(self, node_id: UUID, simulators: list[dict]) -> None:
        """Set simulators for a node."""
        self._node_simulators[node_id] = list(simulators)

    # ── Hidden Relationships (Phase 3) ─────────────────────────────

    async def get_hidden_relationships(self, node_id: UUID) -> list[dict]:
        """Get hidden (implicit) relationships for a node.

        Hidden relationships are derived from shared tags, skills, or content
        rather than being explicitly declared as edges in the graph.
        """
        return list(self._hidden_relationships.get(node_id, []))

    async def add_hidden_relationship(
        self,
        source_id: UUID,
        target_id: UUID,
        relationship_type: str = 'implied_by',
        reason: str = '',
    ) -> None:
        """Add a hidden relationship between two nodes."""
        rel = {
            'source_id': str(source_id),
            'target_id': str(target_id),
            'relationship_type': relationship_type,
            'reason': reason,
            'discovered_at': datetime.now(UTC).isoformat(),
        }
        self._hidden_relationships.setdefault(source_id, []).append(rel)
        self._hidden_relationships.setdefault(target_id, []).append(rel)

    # ── Cross-Domain Relationships (Phase 3) ───────────────────────

    async def get_cross_domain_relationships(self, node_id: UUID) -> list[dict]:
        """Get relationships that cross domain boundaries.

        Cross-domain relationships connect nodes of different types
        (e.g., a 'technology' node related to a 'career' node).
        """
        return list(self._cross_domain_relationships.get(node_id, []))

    async def add_cross_domain_relationship(
        self,
        source_id: UUID,
        target_id: UUID,
        relationship_type: str = 'cross_domain',
        source_type: str = '',
        target_type: str = '',
    ) -> None:
        """Add a cross-domain relationship between two nodes."""
        rel = {
            'source_id': str(source_id),
            'target_id': str(target_id),
            'relationship_type': relationship_type,
            'source_type': source_type,
            'target_type': target_type,
            'discovered_at': datetime.now(UTC).isoformat(),
        }
        self._cross_domain_relationships.setdefault(source_id, []).append(rel)
        self._cross_domain_relationships.setdefault(target_id, []).append(rel)

    # ── Node Metadata Synchronization (Phase 3) ────────────────────

    async def sync_with_graph(self) -> dict[str, Any]:
        """Synchronize content state with the graph engine.

        Ensures every node in the content store has a matching node in
        the graph engine, and vice versa.
        """
        errors: list[str] = []
        synced_content = 0
        synced_resources = 0

        if self._graph is None:
            return {
                'synced_content': 0,
                'synced_resources': 0,
                'errors': ['No GraphEngine reference set'],
            }

        # Check each content record against graph
        for node_id in list(self._contents.keys()):
            exists = await self._graph.node_exists(node_id)
            if not exists:
                errors.append(f'Content for node {node_id} has no matching graph node')
                self._contents.pop(node_id, None)
            else:
                synced_content += 1

        # Check each resource's node against graph
        for node_id in list(self._node_resources.keys()):
            exists = await self._graph.node_exists(node_id)
            if not exists:
                errors.append(f'Resources for node {node_id} have no matching graph node')
                self._node_resources.pop(node_id, None)

        # Count resources synced
        for resource_ids in self._node_resources.values():
            synced_resources += len(resource_ids)

        return {
            'synced_content': synced_content,
            'synced_resources': synced_resources,
            'errors': errors,
        }

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        """Register event subscriptions."""
        await super().subscribe_events(event_bus)
