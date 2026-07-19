"""Graph Engine — production-ready graph runtime for the knowledge graph.

Supports:
- Graph loading, unloading, rebuilding, snapshots
- Complete CRUD: add/remove/update node and edge
- Node and edge registries with indexes
- Graph statistics, version tracking, metadata
- Graph cache synchronization
- Graph integrity hooks
- Indexes: node type, slug, relationship type
"""

from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth, EngineState


@dataclass
class GraphNodeRecord:
    """In-memory record for a knowledge graph node."""
    node_id: UUID
    slug: str = ''
    title: str = ''
    node_type: str = ''
    difficulty: str = 'beginner'
    description: str = ''
    estimated_minutes: int = 30
    metadata: dict[str, Any] = field(default_factory=dict)
    is_published: bool = True
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


@dataclass
class GraphEdgeRecord:
    """In-memory record for a knowledge graph edge."""
    edge_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relationship_type: str = 'related_to'
    weight: float = 1.0
    metadata: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


@dataclass
class GraphSnapshot:
    """A point-in-time snapshot of the graph state."""
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    nodes: list[GraphNodeRecord] = field(default_factory=list)
    edges: list[GraphEdgeRecord] = field(default_factory=list)
    version: str = ''
    metadata: dict[str, Any] = field(default_factory=dict)


class GraphEngine(EngineBase):
    """Graph Engine — production graph runtime.

    Manages the complete knowledge graph state including nodes, edges,
    indexes, versioning, snapshots, and integrity hooks.

    Public Interface:
        add_node, remove_node, update_node, get_node, get_nodes
        add_edge, remove_edge, update_edge, get_edge, get_edges
        get_neighbors, get_reverse_neighbors, get_outgoing, get_incoming
        graph_statistics, graph_version, graph_snapshot, graph_rebuild
        load_graph, unload_graph, is_loaded, count, all_nodes, all_edges
    """

    def __init__(self) -> None:
        super().__init__()
        self._nodes: dict[UUID, GraphNodeRecord] = {}
        self._edges: dict[UUID, GraphEdgeRecord] = {}
        self._outgoing: dict[UUID, list[UUID]] = defaultdict(list)  # node_id -> edge_ids
        self._incoming: dict[UUID, list[UUID]] = defaultdict(list)  # node_id -> edge_ids

        # ── Indexes ────────────────────────────────────────────────
        self._slug_index: dict[str, UUID] = {}       # slug -> node_id
        self._type_index: dict[str, list[UUID]] = defaultdict(list)  # node_type -> node_ids
        self._rel_type_index: dict[str, list[UUID]] = defaultdict(list)  # rel_type -> edge_ids

        # ── Version & Metadata ─────────────────────────────────────
        self._graph_version: str = '1.0.0'
        self._graph_name: str = 'sv-os-knowledge-graph'
        self._graph_loaded: bool = False
        self._snapshot_history: list[GraphSnapshot] = []
        self._max_snapshots: int = 10

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'graph'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='event', required=True, description='Event backbone'),
        ]

    # ── Lifecycle ──────────────────────────────────────────────────

    async def _initialize_impl(self) -> None:
        self._graph_version = '1.0.0'

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._clear_state()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Graph engine is operational',
            details={
                'node_count': len(self._nodes),
                'edge_count': len(self._edges),
                'graph_loaded': self._graph_loaded,
                'graph_version': self._graph_version,
                'index_slugs': len(self._slug_index),
            },
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if not self._graph_name:
            issues.append('Graph name is empty')
        return issues

    # ── Graph Loading / Unloading / Rebuilding ────────────────────

    async def load_graph(
        self,
        nodes: list[GraphNodeRecord],
        edges: list[GraphEdgeRecord],
        version: str | None = None,
    ) -> int:
        """Load nodes and edges into the graph, rebuilding indexes."""
        self._clear_state()
        for node in nodes:
            self._add_node_to_registry(node)
        for edge in edges:
            self._add_edge_to_registry(edge)
        if version:
            self._graph_version = version
        self._graph_loaded = True
        return len(nodes) + len(edges)

    async def unload_graph(self) -> None:
        """Unload all graph data from memory."""
        self._clear_state()

    async def graph_rebuild(self) -> dict[str, Any]:
        """Rebuild all indexes from the raw node/edge data.

        Returns stats about the rebuild.
        """
        # Preserve raw data, rebuild indexes
        nodes = list(self._nodes.values())
        edges = list(self._edges.values())

        self._slug_index.clear()
        self._type_index.clear()
        self._rel_type_index.clear()
        self._outgoing.clear()
        self._incoming.clear()

        for node in nodes:
            self._index_node(node)
        for edge in edges:
            self._index_edge(edge)

        return {
            'nodes_reindexed': len(nodes),
            'edges_reindexed': len(edges),
            'slug_index_size': len(self._slug_index),
            'type_index_size': sum(len(v) for v in self._type_index.values()),
        }

    async def is_loaded(self) -> bool:
        return self._graph_loaded

    # ── Node Mutations ─────────────────────────────────────────────

    async def add_node(
        self,
        slug: str,
        title: str,
        node_type: str,
        difficulty: str = 'beginner',
        description: str = '',
        estimated_minutes: int = 30,
        metadata: dict[str, Any] | None = None,
        node_id: UUID | None = None,
    ) -> dict:
        """Add a new node to the graph.

        Args:
            slug: URL-safe unique identifier.
            title: Human-readable title.
            node_type: Type of node (subject, concept, technology, etc.)
            difficulty: Educational difficulty level.
            description: Short description.
            estimated_minutes: Estimated learning time in minutes.
            metadata: Optional metadata dict.
            node_id: Optional UUID (auto-generated if not provided).

        Returns:
            The created node as a dict.

        Raises:
            ValueError: If slug already exists.
        """
        if slug in self._slug_index:
            raise ValueError(f"Node with slug '{slug}' already exists")

        nid = node_id or uuid4()
        now = datetime.now(UTC).isoformat()
        record = GraphNodeRecord(
            node_id=nid,
            slug=slug,
            title=title,
            node_type=node_type,
            difficulty=difficulty,
            description=description,
            estimated_minutes=estimated_minutes,
            metadata=metadata or {},
            created_at=now,
            updated_at=now,
        )
        self._add_node_to_registry(record)
        return self._node_to_dict(record)

    async def remove_node(self, node_id: UUID) -> bool:
        """Remove a node and all its edges from the graph.

        Returns True if the node existed and was removed.
        """
        if node_id not in self._nodes:
            return False

        # Remove all edges connected to this node
        edge_ids = list(self._outgoing.get(node_id, [])) + list(self._incoming.get(node_id, []))
        for eid in edge_ids:
            await self.remove_edge(eid)

        # Remove from registry
        record = self._nodes.pop(node_id, None)
        if record:
            self._slug_index.pop(record.slug, None)
            type_list = self._type_index.get(record.node_type, [])
            if node_id in type_list:
                type_list.remove(node_id)

        self._outgoing.pop(node_id, None)
        self._incoming.pop(node_id, None)
        return True

    async def update_node(
        self,
        node_id: UUID,
        *,
        slug: str | None = None,
        title: str | None = None,
        node_type: str | None = None,
        difficulty: str | None = None,
        description: str | None = None,
        metadata: dict[str, Any] | None = None,
        is_published: bool | None = None,
    ) -> dict | None:
        """Update an existing node.

        Returns the updated node dict, or None if not found.
        """
        record = self._nodes.get(node_id)
        if record is None:
            return None

        if slug is not None and slug != record.slug:
            if slug in self._slug_index and self._slug_index[slug] != node_id:
                raise ValueError(f"Node with slug '{slug}' already exists")
            self._slug_index.pop(record.slug, None)
            record.slug = slug
            self._slug_index[slug] = node_id

        if title is not None:
            record.title = title
        if node_type is not None:
            # Update type index
            old_type = record.node_type
            if node_type != old_type:
                type_list = self._type_index.get(old_type, [])
                if node_id in type_list:
                    type_list.remove(node_id)
                self._type_index[node_type].append(node_id)
            record.node_type = node_type
        if difficulty is not None:
            record.difficulty = difficulty
        if description is not None:
            record.description = description
        if metadata is not None:
            record.metadata.update(metadata)
        if is_published is not None:
            record.is_published = is_published

        record.updated_at = datetime.now(UTC).isoformat()
        self._bump_version()
        return self._node_to_dict(record)

    async def get_node(self, node_id: UUID) -> dict | None:
        """Retrieve a single node by ID."""
        record = self._nodes.get(node_id)
        return self._node_to_dict(record) if record else None

    async def get_node_by_slug(self, slug: str) -> dict | None:
        """Retrieve a node by its slug."""
        node_id = self._slug_index.get(slug)
        if node_id is None:
            return None
        return await self.get_node(node_id)

    async def get_nodes(self, node_ids: list[UUID]) -> list[dict]:
        """Retrieve multiple nodes by IDs."""
        return [
            self._node_to_dict(self._nodes[nid])
            for nid in node_ids if nid in self._nodes
        ]

    async def all_nodes(self) -> list[dict]:
        """Return all nodes."""
        return [self._node_to_dict(n) for n in self._nodes.values()]

    async def node_exists(self, node_id: UUID) -> bool:
        return node_id in self._nodes

    async def count(self, node_type: str | None = None) -> int:
        if node_type is None:
            return len(self._nodes)
        return sum(1 for n in self._nodes.values() if n.node_type == node_type)

    # ── Edge Mutations ─────────────────────────────────────────────

    async def add_edge(
        self,
        source_node_id: UUID,
        target_node_id: UUID,
        relationship_type: str = 'related_to',
        weight: float = 1.0,
        metadata: dict[str, Any] | None = None,
        edge_id: UUID | None = None,
    ) -> dict:
        """Add a new edge between two nodes.

        Args:
            source_node_id: Source node UUID.
            target_node_id: Target node UUID.
            relationship_type: Type of relationship.
            weight: Edge weight for traversal.
            metadata: Optional metadata.
            edge_id: Optional UUID (auto-generated if not provided).

        Returns:
            The created edge as a dict.

        Raises:
            ValueError: If source or target nodes don't exist.
        """
        if source_node_id not in self._nodes:
            raise ValueError(f"Source node {source_node_id} does not exist")
        if target_node_id not in self._nodes:
            raise ValueError(f"Target node {target_node_id} does not exist")
        if source_node_id == target_node_id:
            raise ValueError('Self-loop edges are not allowed')

        eid = edge_id or uuid4()
        record = GraphEdgeRecord(
            edge_id=eid,
            source_node_id=source_node_id,
            target_node_id=target_node_id,
            relationship_type=relationship_type,
            weight=weight,
            metadata=metadata or {},
        )
        self._add_edge_to_registry(record)
        return self._edge_to_dict(record)

    async def remove_edge(self, edge_id: UUID) -> bool:
        """Remove an edge. Returns True if it existed."""
        record = self._edges.pop(edge_id, None)
        if record is None:
            return False

        src_out = self._outgoing.get(record.source_node_id, [])
        if edge_id in src_out:
            src_out.remove(edge_id)

        tgt_in = self._incoming.get(record.target_node_id, [])
        if edge_id in tgt_in:
            tgt_in.remove(edge_id)

        rel_list = self._rel_type_index.get(record.relationship_type, [])
        if edge_id in rel_list:
            rel_list.remove(edge_id)

        return True

    async def update_edge(
        self,
        edge_id: UUID,
        *,
        relationship_type: str | None = None,
        weight: float | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> dict | None:
        """Update an existing edge. Returns updated edge or None."""
        record = self._edges.get(edge_id)
        if record is None:
            return None

        if relationship_type is not None and relationship_type != record.relationship_type:
            old_rel = record.relationship_type
            rel_list = self._rel_type_index.get(old_rel, [])
            if edge_id in rel_list:
                rel_list.remove(edge_id)
            self._rel_type_index[relationship_type].append(edge_id)
            record.relationship_type = relationship_type

        if weight is not None:
            record.weight = weight
        if metadata is not None:
            record.metadata.update(metadata)

        self._bump_version()
        return self._edge_to_dict(record)

    async def get_edge(self, edge_id: UUID) -> dict | None:
        record = self._edges.get(edge_id)
        return self._edge_to_dict(record) if record else None

    async def edge_exists(self, edge_id: UUID) -> bool:
        return edge_id in self._edges

    async def all_edges(self) -> list[dict]:
        return [self._edge_to_dict(e) for e in self._edges.values()]

    # ── Adjacency ──────────────────────────────────────────────────

    async def get_outgoing(self, node_id: UUID) -> list[dict]:
        return [
            self._edge_to_dict(self._edges[eid])
            for eid in self._outgoing.get(node_id, [])
            if eid in self._edges
        ]

    async def get_incoming(self, node_id: UUID) -> list[dict]:
        return [
            self._edge_to_dict(self._edges[eid])
            for eid in self._incoming.get(node_id, [])
            if eid in self._edges
        ]

    async def get_neighbors(self, node_id: UUID) -> dict:
        return {
            'outgoing': await self.get_outgoing(node_id),
            'incoming': await self.get_incoming(node_id),
        }

    async def get_reverse_neighbors(self, node_id: UUID) -> dict:
        """Get neighbors in the opposite direction."""
        return {
            'incoming': await self.get_outgoing(node_id),
            'outgoing': await self.get_incoming(node_id),
        }

    # ── Graph Statistics ───────────────────────────────────────────

    async def graph_statistics(self) -> dict[str, Any]:
        node_count = len(self._nodes)
        edge_count = len(self._edges)

        type_counts: dict[str, int] = {}
        for n in self._nodes.values():
            type_counts[n.node_type] = type_counts.get(n.node_type, 0) + 1

        rel_counts: dict[str, int] = {}
        for e in self._edges.values():
            rel_counts[e.relationship_type] = rel_counts.get(e.relationship_type, 0) + 1

        density = 0.0
        if node_count > 1:
            max_possible = node_count * (node_count - 1)
            density = edge_count / max_possible if max_possible > 0 else 0.0

        # Average degree
        avg_degree = 0.0
        if node_count > 0:
            total_degree = sum(
                len(self._outgoing.get(nid, [])) + len(self._incoming.get(nid, []))
                for nid in self._nodes
            )
            avg_degree = total_degree / node_count

        return {
            'node_count': node_count,
            'edge_count': edge_count,
            'type_counts': type_counts,
            'relationship_counts': rel_counts,
            'density': round(density, 6),
            'avg_degree': round(avg_degree, 4),
            'graph_version': self._graph_version,
            'graph_name': self._graph_name,
            'is_loaded': self._graph_loaded,
        }

    # ── Graph Version & Metadata ───────────────────────────────────

    async def graph_version(self) -> str:
        return self._graph_version

    async def graph_metadata(self) -> dict[str, Any]:
        return {
            'name': self._graph_name,
            'version': self._graph_version,
            'loaded': self._graph_loaded,
            'node_count': len(self._nodes),
            'edge_count': len(self._edges),
            'engine_id': self.engine_id,
        }

    async def set_graph_metadata(self, name: str | None = None, version: str | None = None) -> None:
        if name is not None:
            self._graph_name = name
        if version is not None:
            self._graph_version = version

    # ── Snapshots ──────────────────────────────────────────────────

    async def graph_snapshot(self) -> GraphSnapshot:
        """Take a point-in-time snapshot of the current graph state."""
        snapshot = GraphSnapshot(
            nodes=list(self._nodes.values()),
            edges=list(self._edges.values()),
            version=self._graph_version,
            metadata={
                'node_count': len(self._nodes),
                'edge_count': len(self._edges),
            },
        )
        self._snapshot_history.append(snapshot)
        # Trim history
        if len(self._snapshot_history) > self._max_snapshots:
            self._snapshot_history = self._snapshot_history[-self._max_snapshots:]
        return snapshot

    async def restore_snapshot(self, snapshot: GraphSnapshot) -> int:
        """Restore the graph to a previous snapshot state."""
        await self.load_graph(snapshot.nodes, snapshot.edges, snapshot.version)
        return len(snapshot.nodes) + len(snapshot.edges)

    # ── Index-based Lookups ────────────────────────────────────────

    async def get_nodes_by_type(self, node_type: str) -> list[dict]:
        node_ids = self._type_index.get(node_type, [])
        return await self.get_nodes(node_ids)

    async def get_node_slug(self, slug: str) -> dict | None:
        return await self.get_node_by_slug(slug)

    async def get_edges_by_type(self, relationship_type: str) -> list[dict]:
        edge_ids = self._rel_type_index.get(relationship_type, [])
        return [
            self._edge_to_dict(self._edges[eid])
            for eid in edge_ids if eid in self._edges
        ]

    # ── Integrity Hooks ────────────────────────────────────────────

    async def validate_node(self, node_id: UUID) -> dict:
        """Validate a node's structural integrity."""
        issues: list[str] = []
        record = self._nodes.get(node_id)
        if record is None:
            issues.append(f'Node {node_id} does not exist')
            return {'valid': False, 'issues': issues}
        if not record.slug:
            issues.append('Node has no slug')
        if not record.title:
            issues.append('Node has no title')
        # Check index consistency
        if self._slug_index.get(record.slug) != node_id:
            issues.append('Slug index mismatch')
        return {'valid': len(issues) == 0, 'issues': issues}

    async def validate_edge(self, edge_id: UUID) -> dict:
        """Validate an edge's structural integrity."""
        issues: list[str] = []
        record = self._edges.get(edge_id)
        if record is None:
            issues.append(f'Edge {edge_id} does not exist')
            return {'valid': False, 'issues': issues}
        if record.source_node_id not in self._nodes:
            issues.append(f'Source node {record.source_node_id} does not exist')
        if record.target_node_id not in self._nodes:
            issues.append(f'Target node {record.target_node_id} does not exist')
        if record.source_node_id == record.target_node_id:
            issues.append('Self-loop edge detected')
        return {'valid': len(issues) == 0, 'issues': issues}

    async def integrity_check(self) -> dict[str, Any]:
        """Run a full integrity check across all nodes and edges."""
        issues: list[str] = []
        # Check all nodes have valid slugs
        for nid, record in self._nodes.items():
            if self._slug_index.get(record.slug) != nid:
                issues.append(f'Slug index mismatch for node {nid}')
        # Check all edges have valid endpoints
        for eid, record in self._edges.items():
            if record.source_node_id not in self._nodes:
                issues.append(f'Edge {eid}: source node not found')
            if record.target_node_id not in self._nodes:
                issues.append(f'Edge {eid}: target node not found')
        return {
            'pass': len(issues) == 0,
            'issues': issues,
            'nodes_checked': len(self._nodes),
            'edges_checked': len(self._edges),
        }

    # ── Cache Sync ─────────────────────────────────────────────────

    async def cache_sync(self) -> dict[str, Any]:
        """Sync indexes with the current node/edge state.

        Call this after external modifications to ensure indexes are consistent.
        """
        return await self.graph_rebuild()

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        await super().subscribe_events(event_bus)

    # ── Internal ──────────────────────────────────────────────────

    def _add_node_to_registry(self, record: GraphNodeRecord) -> None:
        self._nodes[record.node_id] = record
        self._index_node(record)

    def _add_edge_to_registry(self, record: GraphEdgeRecord) -> None:
        self._edges[record.edge_id] = record
        self._index_edge(record)

    def _index_node(self, record: GraphNodeRecord) -> None:
        if record.slug:
            self._slug_index[record.slug] = record.node_id
        self._type_index[record.node_type].append(record.node_id)

    def _index_edge(self, record: GraphEdgeRecord) -> None:
        self._outgoing[record.source_node_id].append(record.edge_id)
        self._incoming[record.target_node_id].append(record.edge_id)
        self._rel_type_index[record.relationship_type].append(record.edge_id)

    def _clear_state(self) -> None:
        self._nodes.clear()
        self._edges.clear()
        self._slug_index.clear()
        self._type_index.clear()
        self._rel_type_index.clear()
        self._outgoing.clear()
        self._incoming.clear()
        self._graph_loaded = False

    def _bump_version(self) -> None:
        parts = self._graph_version.split('.')
        if len(parts) == 3:
            parts[2] = str(int(parts[2]) + 1)
            self._graph_version = '.'.join(parts)

    def _node_to_dict(self, record: GraphNodeRecord) -> dict:
        return {
            'id': str(record.node_id),
            'slug': record.slug,
            'title': record.title,
            'node_type': record.node_type,
            'difficulty': record.difficulty,
            'description': record.description,
            'estimated_minutes': record.estimated_minutes,
            'metadata': record.metadata,
            'is_published': record.is_published,
            'created_at': record.created_at,
            'updated_at': record.updated_at,
        }

    def _edge_to_dict(self, record: GraphEdgeRecord) -> dict:
        return {
            'id': str(record.edge_id),
            'source_id': str(record.source_node_id),
            'target_id': str(record.target_node_id),
            'relationship_type': record.relationship_type,
            'weight': record.weight,
            'metadata': record.metadata,
            'created_at': record.created_at,
        }
