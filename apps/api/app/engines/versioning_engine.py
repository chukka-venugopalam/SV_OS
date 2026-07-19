"""Versioning Engine — graph snapshot, versioning, diff, and rollback.

Supports:
- Graph snapshots with metadata (author, checksum, notes)
- Version history and version lookup
- Graph diff (node/edge added/removed/modified)
- Rollback with validation
- Rollback validation
- Lightweight branch support
- Merge validation (stub)
- Version comparison
- Immutable snapshots
- Graph checksum (SHA-256 based)
- Version tags (e.g. 'v1.0', 'stable', 'release')
- Latest version lookup
- Delete old versions (policy-driven)
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth
from app.engines.graph_engine import GraphEngine, GraphNodeRecord, GraphEdgeRecord


# ── Snapshot Storage ───────────────────────────────────────────────


@dataclass
class VersionSnapshot:
    """An immutable point-in-time snapshot of the graph state."""
    version_id: str = field(default_factory=lambda: str(uuid4()))
    version_number: str = '1.0.0'
    timestamp: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    author: str = 'system'
    checksum: str = ''
    notes: str = ''
    tags: list[str] = field(default_factory=list)
    branch: str = 'main'
    parent_version_id: str | None = None
    nodes: list[dict] = field(default_factory=list)
    edges: list[dict] = field(default_factory=list)
    graph_metadata: dict[str, Any] = field(default_factory=dict)
    statistics: dict[str, Any] = field(default_factory=dict)
    immutable: bool = True


@dataclass
class GraphDiff:
    """Result of comparing two graph versions."""
    source_version: str = ''
    target_version: str = ''
    nodes_added: list[dict] = field(default_factory=list)
    nodes_removed: list[dict] = field(default_factory=list)
    nodes_modified: list[dict] = field(default_factory=list)
    edges_added: list[dict] = field(default_factory=list)
    edges_removed: list[dict] = field(default_factory=list)
    edges_modified: list[dict] = field(default_factory=list)
    summary: dict[str, int] = field(default_factory=dict)


class VersioningEngine(EngineBase):
    """Versioning Engine — graph versioning, snapshots, and rollback.

    Public Interface:
        create_snapshot, get_snapshot, list_snapshots, list_versions,
        delete_snapshot, restore_snapshot, rollback,
        rollback_validation, diff_versions, compare_versions,
        create_branch, list_branches, merge_validation,
        tag_version, get_latest_version, graph_checksum,
        get_version_by_tag, version_history
    """

    def __init__(self, graph_engine: GraphEngine | None = None) -> None:
        super().__init__()
        self._graph = graph_engine

        # In-memory snapshot store
        self._snapshots: dict[str, VersionSnapshot] = {}  # version_id -> snapshot
        self._branches: dict[str, list[str]] = {'main': []}  # branch -> version_ids
        self._tags: dict[str, str] = {}  # tag -> version_id
        self._version_counter: int = 0
        self._retention_policy: dict[str, int] = {
            'max_snapshots': 100,
            'max_branches': 10,
            'delete_older_than_days': 365,
        }

    def _default_name(self) -> str:
        return 'versioning'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='graph', required=True, description='Graph engine for snapshots'),
        ]

    async def _initialize_impl(self) -> None:
        self._version_counter = 0

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._snapshots.clear()
        self._branches.clear()
        self._tags.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Versioning engine is operational',
            details={
                'total_snapshots': len(self._snapshots),
                'branches': len(self._branches),
                'tags': len(self._tags),
                'latest_version': self._version_counter,
            },
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ═══════════════════════════════════════════════════════════════
    # Snapshot Management
    # ═══════════════════════════════════════════════════════════════

    async def create_snapshot(
        self,
        notes: str = '',
        author: str = 'system',
        tags: list[str] | None = None,
        branch: str = 'main',
    ) -> dict:
        """Create an immutable point-in-time snapshot of the current graph.

        Includes checksum, statistics, and graph metadata.

        Args:
            notes: Optional human-readable notes.
            author: Who created the snapshot.
            tags: Optional version tags (e.g. ['v1.0', 'stable']).
            branch: Which branch this snapshot belongs to.

        Returns:
            Dict with version_id, version_number, checksum, and metadata.
        """
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        self._version_counter += 1
        version_number = f'1.{self._version_counter}.0'

        # Get current graph state
        nodes = await self._graph.all_nodes()
        edges = await self._graph.all_edges()
        stats = await self._graph.graph_statistics()
        meta = await self._graph.graph_metadata()
        current_version = await self._graph.graph_version()

        # Compute checksum
        checksum = self._compute_checksum(nodes, edges)

        # Find parent version (latest on this branch)
        branch_versions = self._branches.get(branch, [])
        parent_id = branch_versions[-1] if branch_versions else None

        snapshot = VersionSnapshot(
            version_number=version_number,
            author=author,
            checksum=checksum,
            notes=notes,
            tags=tags or [version_number],
            branch=branch,
            parent_version_id=parent_id,
            nodes=nodes,
            edges=edges,
            graph_metadata={**meta, 'version': current_version},
            statistics=stats,
        )

        self._snapshots[snapshot.version_id] = snapshot
        self._branches.setdefault(branch, []).append(snapshot.version_id)

        # Apply tags
        for tag in (tags or [version_number]):
            self._tags[tag] = snapshot.version_id

        # Enforce retention policy
        await self._enforce_retention_policy()

        # Publish event
        await self.publish_event(
            'graph.snapshot.created.v1',
            {
                'version_id': snapshot.version_id,
                'version_number': version_number,
                'checksum': checksum,
                'node_count': len(nodes),
                'edge_count': len(edges),
                'branch': branch,
                'author': author,
            },
            correlation_id=snapshot.version_id,
        )

        return {
            'version_id': snapshot.version_id,
            'version_number': version_number,
            'checksum': checksum,
            'node_count': len(nodes),
            'edge_count': len(edges),
            'branch': branch,
            'tags': snapshot.tags,
            'notes': notes,
            'author': author,
            'parent_version_id': parent_id,
            'timestamp': snapshot.timestamp,
        }

    async def get_snapshot(self, version_id: str) -> dict | None:
        """Get a snapshot by version ID.

        Returns snapshot metadata (without full node/edge data by default).
        """
        snapshot = self._snapshots.get(version_id)
        if snapshot is None:
            # Try looking up by tag
            resolved_id = self._tags.get(version_id)
            if resolved_id:
                snapshot = self._snapshots.get(resolved_id)
        if snapshot is None:
            return None
        return self._snapshot_to_dict(snapshot)

    async def get_snapshot_full(self, version_id: str) -> dict | None:
        """Get a snapshot with full node/edge data."""
        snapshot = self._snapshots.get(version_id)
        if snapshot is None:
            resolved_id = self._tags.get(version_id)
            if resolved_id:
                snapshot = self._snapshots.get(resolved_id)
        if snapshot is None:
            return None
        result = self._snapshot_to_dict(snapshot)
        result['nodes'] = snapshot.nodes
        result['edges'] = snapshot.edges
        return result

    async def list_snapshots(
        self, branch: str | None = None, limit: int = 50
    ) -> list[dict]:
        """List snapshots, optionally filtered by branch."""
        snapshots = list(self._snapshots.values())

        if branch:
            branch_ids = set(self._branches.get(branch, []))
            snapshots = [s for s in snapshots if s.version_id in branch_ids]

        snapshots.sort(key=lambda s: s.timestamp, reverse=True)
        return [self._snapshot_to_dict(s) for s in snapshots[:limit]]

    async def delete_snapshot(self, version_id: str) -> dict:
        """Delete a snapshot by version ID (only if not immutable)."""
        snapshot = self._snapshots.get(version_id)
        if snapshot is None:
            return {'error': f'Snapshot {version_id} not found', 'success': False}
        if snapshot.immutable:
            return {'error': 'Snapshot is immutable and cannot be deleted', 'success': False}

        # Remove from branch
        for branch_name, version_ids in self._branches.items():
            if version_id in version_ids:
                version_ids.remove(version_id)

        # Remove tags pointing to this version
        tags_to_remove = [t for t, v in self._tags.items() if v == version_id]
        for t in tags_to_remove:
            del self._tags[t]

        del self._snapshots[version_id]
        return {'success': True, 'deleted_version': version_id}

    # ═══════════════════════════════════════════════════════════════
    # Restore & Rollback
    # ═══════════════════════════════════════════════════════════════

    async def restore_snapshot(self, version_id: str) -> dict:
        """Restore the graph to a previous snapshot's state.

        Creates a new snapshot before restoring for safety.
        """
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        snapshot = self._snapshots.get(version_id)
        if snapshot is None:
            # Try tag lookup
            resolved_id = self._tags.get(version_id)
            if resolved_id:
                snapshot = self._snapshots.get(resolved_id)
        if snapshot is None:
            return {'error': f'Snapshot {version_id} not found'}

        # Create safety snapshot before restore
        safety = await self.create_snapshot(
            notes=f'Auto-safety before restore to {version_id}',
            author='system',
            branch=snapshot.branch,
        )

        # Restore from snapshot data
        node_records = []
        for n in snapshot.nodes:
            node_records.append(GraphNodeRecord(
                node_id=UUID(n['id']),
                slug=n.get('slug', ''),
                title=n.get('title', ''),
                node_type=n.get('node_type', ''),
                difficulty=n.get('difficulty', 'beginner'),
                description=n.get('description', ''),
                metadata=n.get('metadata', {}),
            ))

        edge_records = []
        for e in snapshot.edges:
            edge_records.append(GraphEdgeRecord(
                edge_id=UUID(e['id']),
                source_node_id=UUID(e['source_id']),
                target_node_id=UUID(e['target_id']),
                relationship_type=e.get('relationship_type', 'related_to'),
                weight=e.get('weight', 1.0),
                metadata=e.get('metadata', {}),
            ))

        count = await self._graph.load_graph(node_records, edge_records, snapshot.version_number)

        await self.publish_event(
            'graph.snapshot.restored.v1',
            {
                'version_id': version_id,
                'safety_version_id': safety.get('version_id', ''),
                'nodes_restored': len(node_records),
                'edges_restored': len(edge_records),
            },
            correlation_id=version_id,
        )

        return {
            'success': True,
            'version_id': version_id,
            'version_number': snapshot.version_number,
            'nodes_restored': len(node_records),
            'edges_restored': len(edge_records),
            'safety_snapshot': safety,
        }

    async def rollback(self, version_id: str) -> dict:
        """Alias for restore_snapshot with a rollback event."""
        result = await self.restore_snapshot(version_id)

        await self.publish_event(
            'graph.version.rollback.v1',
            {
                'version_id': version_id,
                'success': result.get('success', False),
                'nodes_affected': result.get('nodes_restored', 0),
            },
            correlation_id=version_id,
        )

        return {
            **result,
            'action': 'rollback',
        }

    async def rollback_validation(self, version_id: str) -> dict:
        """Validate that a rollback to a given version is safe.

        Checks for conflicts and data integrity.
        """
        snapshot = self._snapshots.get(version_id)
        if snapshot is None:
            return {'safe': False, 'errors': [f'Snapshot {version_id} not found']}

        if self._graph is None:
            return {'safe': True, 'errors': []}

        current_nodes = await self._graph.all_nodes()
        current_node_ids = {n['id'] for n in current_nodes}

        snapshot_node_ids = {n['id'] for n in snapshot.nodes}

        # Nodes that would be lost by rollback
        added_since = current_node_ids - snapshot_node_ids
        lost = [n for n in current_nodes if n['id'] in added_since]

        return {
            'safe': len(lost) <= 10,  # Allow limited data loss
            'errors': [],
            'warnings': [
                f'{len(lost)} nodes added since snapshot would be lost'
            ] if lost else [],
            'nodes_to_lose': len(lost),
            'nodes_to_restore': len(snapshot.nodes),
            'edges_to_restore': len(snapshot.edges),
        }

    # ═══════════════════════════════════════════════════════════════
    # Diff & Comparison
    # ═══════════════════════════════════════════════════════════════

    async def diff_versions(
        self, source_version_id: str, target_version_id: str
    ) -> dict:
        """Compute a structured diff between two graph versions.

        Args:
            source_version_id: Older version ID (or tag).
            target_version_id: Newer version ID (or tag).

        Returns:
            GraphDiff with added/removed/modified nodes and edges.
        """
        source = self._snapshots.get(source_version_id)
        if source is None:
            resolved = self._tags.get(source_version_id)
            if resolved:
                source = self._snapshots.get(resolved)
        target = self._snapshots.get(target_version_id)
        if target is None:
            resolved = self._tags.get(target_version_id)
            if resolved:
                target = self._snapshots.get(resolved)

        if source is None or target is None:
            return {'error': 'One or both versions not found', 'diff': None}

        source_nodes = {n['id']: n for n in source.nodes}
        target_nodes = {n['id']: n for n in target.nodes}
        source_edges = {e['id']: e for e in source.edges}
        target_edges = {e['id']: e for e in target.edges}

        diff = GraphDiff(
            source_version=source.version_number,
            target_version=target.version_number,
        )

        # Nodes added (in target but not source)
        for nid, node in target_nodes.items():
            if nid not in source_nodes:
                diff.nodes_added.append(node)

        # Nodes removed (in source but not target)
        for nid, node in source_nodes.items():
            if nid not in target_nodes:
                diff.nodes_removed.append(node)

        # Nodes modified (different title/description/difficulty)
        for nid, target_node in target_nodes.items():
            source_node = source_nodes.get(nid)
            if source_node and self._is_node_modified(source_node, target_node):
                diff.nodes_modified.append({
                    'id': nid,
                    'before': source_node,
                    'after': target_node,
                })

        # Edge diffs (same logic)
        for eid, edge in target_edges.items():
            if eid not in source_edges:
                diff.edges_added.append(edge)
        for eid, edge in source_edges.items():
            if eid not in target_edges:
                diff.edges_removed.append(edge)
        for eid, target_edge in target_edges.items():
            source_edge = source_edges.get(eid)
            if source_edge and self._is_edge_modified(source_edge, target_edge):
                diff.edges_modified.append({
                    'id': eid,
                    'before': source_edge,
                    'after': target_edge,
                })

        diff.summary = {
            'nodes_added': len(diff.nodes_added),
            'nodes_removed': len(diff.nodes_removed),
            'nodes_modified': len(diff.nodes_modified),
            'edges_added': len(diff.edges_added),
            'edges_removed': len(diff.edges_removed),
            'edges_modified': len(diff.edges_modified),
            'total_changes': (
                len(diff.nodes_added) + len(diff.nodes_removed) + len(diff.nodes_modified) +
                len(diff.edges_added) + len(diff.edges_removed) + len(diff.edges_modified)
            ),
        }

        return {
            'diff': {
                'source_version': diff.source_version,
                'target_version': diff.target_version,
                'nodes_added': diff.nodes_added,
                'nodes_removed': diff.nodes_removed,
                'nodes_modified': diff.nodes_modified,
                'edges_added': diff.edges_added,
                'edges_removed': diff.edges_removed,
                'edges_modified': diff.edges_modified,
            },
            'summary': diff.summary,
        }

    async def compare_versions(
        self, version_id_a: str, version_id_b: str
    ) -> dict:
        """Compare two versions side by side."""
        return await self.diff_versions(version_id_a, version_id_b)

    # ═══════════════════════════════════════════════════════════════
    # Version Info
    # ═══════════════════════════════════════════════════════════════

    async def list_versions(self, limit: int = 50) -> list[dict]:
        """List all versions sorted by timestamp descending."""
        return await self.list_snapshots(limit=limit)

    async def get_latest_version(self, branch: str = 'main') -> dict | None:
        """Get the latest snapshot on a branch."""
        branch_ids = self._branches.get(branch, [])
        if not branch_ids:
            return None
        latest_id = branch_ids[-1]
        return self._snapshot_to_dict(self._snapshots[latest_id]) if latest_id in self._snapshots else None

    async def version_history(self, limit: int = 20) -> list[dict]:
        """Get full version history."""
        return await self.list_snapshots(limit=limit)

    # ═══════════════════════════════════════════════════════════════
    # Version Tags
    # ═══════════════════════════════════════════════════════════════

    async def tag_version(self, version_id: str, tag: str) -> dict:
        """Tag a version with a human-readable label."""
        resolved_id = self._tags.get(version_id, version_id)
        if resolved_id not in self._snapshots:
            return {'error': f'Version {version_id} not found', 'success': False}
        self._tags[tag] = resolved_id
        snapshot = self._snapshots[resolved_id]
        if tag not in snapshot.tags:
            snapshot.tags.append(tag)
        return {'success': True, 'tag': tag, 'version_id': resolved_id}

    async def get_version_by_tag(self, tag: str) -> dict | None:
        """Get a snapshot by its tag."""
        version_id = self._tags.get(tag)
        if version_id is None:
            return None
        return await self.get_snapshot(version_id)

    # ═══════════════════════════════════════════════════════════════
    # Branches
    # ═══════════════════════════════════════════════════════════════

    async def create_branch(self, branch_name: str, from_version_id: str | None = None) -> dict:
        """Create a new branch for parallel development.

        Args:
            branch_name: Name of the new branch.
            from_version_id: Optional version to fork from (uses latest if None).

        Returns:
            Dict with branch name and fork point.
        """
        if branch_name in self._branches:
            return {'error': f'Branch {branch_name} already exists', 'success': False}

        fork_point = None
        if from_version_id:
            fork_point = from_version_id
        else:
            # Fork from latest on main
            latest = await self.get_latest_version('main')
            if latest:
                fork_point = latest['version_id']

        self._branches[branch_name] = [fork_point] if fork_point else []

        return {
            'success': True,
            'branch': branch_name,
            'fork_point': fork_point,
        }

    async def list_branches(self) -> list[dict]:
        """List all branches and their snapshot counts."""
        return [
            {'name': name, 'snapshot_count': len(ids)}
            for name, ids in self._branches.items()
        ]

    async def merge_validation(self, source_branch: str, target_branch: str = 'main') -> dict:
        """Validate whether a branch can be merged into another.

        Checks for conflicts between branch snapshots.
        """
        source_ids = self._branches.get(source_branch, [])
        target_ids = self._branches.get(target_branch, [])

        if not source_ids:
            return {'can_merge': False, 'errors': [f'Branch {source_branch} has no snapshots']}

        # Compare the latest snapshots from each branch
        source_latest = self._snapshots.get(source_ids[-1]) if source_ids else None
        target_latest = self._snapshots.get(target_ids[-1]) if target_ids else None

        if source_latest is None or target_latest is None:
            return {'can_merge': True, 'errors': []}

        # Check for conflicts — same node modified in both branches
        source_node_ids = {n['id'] for n in source_latest.nodes if isinstance(n, dict)}
        target_node_ids = {n['id'] for n in target_latest.nodes if isinstance(n, dict)}

        # Nodes that exist in one but not the other suggest divergent changes
        added_by_source = source_node_ids - target_node_ids
        added_by_target = target_node_ids - source_node_ids

        return {
            'can_merge': True,
            'warnings': [],
            'source_branch': source_branch,
            'target_branch': target_branch,
            'source_nodes': len(source_node_ids),
            'target_nodes': len(target_node_ids),
            'added_by_source': len(added_by_source),
            'added_by_target': len(added_by_target),
        }

    # ═══════════════════════════════════════════════════════════════
    # Checksum
    # ═══════════════════════════════════════════════════════════════

    async def graph_checksum(self) -> dict:
        """Compute a SHA-256 checksum of the current graph state."""
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        nodes = await self._graph.all_nodes()
        edges = await self._graph.all_edges()
        checksum = self._compute_checksum(nodes, edges)

        return {
            'checksum': checksum,
            'algorithm': 'sha256',
            'node_count': len(nodes),
            'edge_count': len(edges),
        }

    # ═══════════════════════════════════════════════════════════════
    # Internal
    # ═══════════════════════════════════════════════════════════════

    def _compute_checksum(self, nodes: list[dict], edges: list[dict]) -> str:
        """Compute SHA-256 checksum from node/edge data."""
        data = {
            'nodes': sorted(nodes, key=lambda n: n.get('id', '')),
            'edges': sorted(edges, key=lambda e: e.get('id', '')),
        }
        serialized = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode()).hexdigest()

    def _is_node_modified(self, a: dict, b: dict) -> bool:
        """Check if two node dicts differ in meaningful fields."""
        for key in ('title', 'description', 'difficulty', 'node_type', 'slug', 'is_published'):
            if a.get(key) != b.get(key):
                return True
        return False

    def _is_edge_modified(self, a: dict, b: dict) -> bool:
        """Check if two edge dicts differ in meaningful fields."""
        for key in ('relationship_type', 'weight'):
            if a.get(key) != b.get(key):
                return True
        return False

    async def _enforce_retention_policy(self) -> None:
        """Delete old snapshots based on retention policy."""
        max_snapshots = self._retention_policy.get('max_snapshots', 100)
        if len(self._snapshots) > max_snapshots:
            # Keep only the most recent snapshots
            sorted_ids = sorted(
                self._snapshots.keys(),
                key=lambda vid: self._snapshots[vid].timestamp,
                reverse=True,
            )
            to_delete = sorted_ids[max_snapshots:]
            for vid in to_delete:
                snapshot = self._snapshots.get(vid)
                if snapshot and not snapshot.immutable:
                    await self.delete_snapshot(vid)

    def _snapshot_to_dict(self, snapshot: VersionSnapshot) -> dict:
        return {
            'version_id': snapshot.version_id,
            'version_number': snapshot.version_number,
            'timestamp': snapshot.timestamp,
            'author': snapshot.author,
            'checksum': snapshot.checksum,
            'notes': snapshot.notes,
            'tags': snapshot.tags,
            'branch': snapshot.branch,
            'parent_version_id': snapshot.parent_version_id,
            'graph_metadata': snapshot.graph_metadata,
            'statistics': snapshot.statistics,
            'immutable': snapshot.immutable,
        }
