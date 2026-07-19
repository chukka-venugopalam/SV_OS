"""Export Engine — export graph data in multiple formats.

Supported formats:
- JSON (default, pretty-printed)
- YAML (structured)
- CSV (flat, one file per entity type)
- Markdown (readable documentation)
- ZIP (compressed archive of multiple formats)

Export targets:
- Entire graph
- Subgraph (around a center node)
- Career graph (careers + their prerequisites)
- Learning path
- Assessment
- Single node
- Dependency chain

Supports streaming export, metadata, version metadata, filtering, compression.
"""

from __future__ import annotations

import csv
import io
import json
import zipfile
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import TYPE_CHECKING, Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth

if TYPE_CHECKING:
    from app.engines.graph_engine import GraphEngine
    from app.engines.traversal_engine import TraversalEngine


@dataclass
class ExportJob:
    """Tracks the progress of an export operation."""

    export_id: str = field(default_factory=lambda: str(uuid4()))
    format: str = 'json'
    target: str = 'graph'
    status: str = 'pending'  # pending, running, completed, failed
    progress: float = 0.0
    total_items: int = 0
    exported_items: int = 0
    result_size_bytes: int = 0
    error_message: str | None = None
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    completed_at: str | None = None
    filter_criteria: dict[str, Any] = field(default_factory=dict)


class ExportEngine(EngineBase):
    """Export Engine — export graph data in multiple formats.

    Public Interface:
        export_graph, export_subgraph, export_career_graph,
        export_learning_path, export_assessment, export_node,
        export_dependency_chain, list_exports, get_export_status,
        download_export
    """

    def __init__(
        self,
        graph_engine: GraphEngine | None = None,
        traversal_engine: TraversalEngine | None = None,
    ) -> None:
        super().__init__()
        self._graph = graph_engine
        self._traversal = traversal_engine

        # In-memory export storage
        self._exports: dict[str, ExportJob] = {}
        self._export_results: dict[str, dict | str] = {}  # export_id -> result data

    def _default_name(self) -> str:
        return 'export'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='graph',
                required=True,
                description='Graph engine for data',
            ),
            EngineDependency(
                engine_name='traversal',
                required=False,
                description='Traversal engine for subgraphs',
            ),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._exports.clear()
        self._export_results.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Export engine is operational',
            details={
                'total_exports': len(self._exports),
                'completed_exports': sum(
                    1 for j in self._exports.values() if j.status == 'completed'
                ),
            },
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ═══════════════════════════════════════════════════════════════════
    # Public Export Methods
    # ═══════════════════════════════════════════════════════════════════

    async def export_graph(
        self,
        format: str = 'json',
        compress: bool = False,
        filter_criteria: dict[str, Any] | None = None,
    ) -> dict:
        """Export the entire graph.

        Args:
            format: Export format (json, yaml, csv, md, zip).
            compress: Whether to compress the result (ZIP).
            filter_criteria: Optional {node_type, difficulty, tags} filters.

        Returns:
            Export job result with download info.

        """
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        job = ExportJob(format=format, target='graph', filter_criteria=filter_criteria or {})
        self._exports[job.export_id] = job
        job.status = 'running'

        await self.publish_event(
            'graph.export.started.v1',
            {
                'export_id': job.export_id,
                'format': format,
                'target': 'graph',
            },
            correlation_id=job.export_id,
        )

        try:
            nodes = await self._graph.all_nodes()
            edges = await self._graph.all_edges()
            stats = await self._graph.graph_statistics()

            # Apply filters
            fc = filter_criteria or {}
            if fc.get('node_type'):
                nodes = [n for n in nodes if n.get('node_type') == fc['node_type']]
            if fc.get('difficulty'):
                nodes = [n for n in nodes if n.get('difficulty') == fc['difficulty']]

            data = {
                'export_type': 'full_graph',
                'schema_version': '1.0',
                'exported_at': datetime.now(UTC).isoformat(),
                'statistics': stats,
                'nodes': nodes,
                'edges': edges,
            }

            job.total_items = len(nodes) + len(edges)
            job.exported_items = job.total_items
            result = await self._serialize(job.export_id, data, format, compress)
            job.status = 'completed'

            await self.publish_event(
                'graph.export.completed.v1',
                {
                    'export_id': job.export_id,
                    'format': format,
                    'items': job.total_items,
                    'size_bytes': job.result_size_bytes,
                },
                correlation_id=job.export_id,
            )

            return result

        except Exception as exc:
            job.status = 'failed'
            job.error_message = str(exc)
            await self.publish_event(
                'graph.export.failed.v1',
                {
                    'export_id': job.export_id,
                    'error': str(exc),
                },
                correlation_id=job.export_id,
            )
            return {'error': str(exc), 'export_id': job.export_id}

    async def export_subgraph(
        self,
        center_node_id: UUID,
        depth: int = 2,
        format: str = 'json',
    ) -> dict:
        """Export a subgraph around a center node."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Required engines not available'}

        job = ExportJob(format=format, target='subgraph')
        self._exports[job.export_id] = job
        job.status = 'running'

        sub = await self._traversal.subgraph(center_node_id, depth)
        data = {
            'export_type': 'subgraph',
            'schema_version': '1.0',
            'exported_at': datetime.now(UTC).isoformat(),
            'center_node_id': str(center_node_id),
            'depth': depth,
            'nodes': sub.get('nodes', []),
            'edges': sub.get('edges', []),
        }

        job.total_items = len(data['nodes']) + len(data['edges'])
        job.exported_items = job.total_items
        result = await self._serialize(job.export_id, data, format)
        job.status = 'completed'
        return result

    async def export_career_graph(self, career_node_id: UUID, format: str = 'json') -> dict:
        """Export a career graph — career + all prerequisite nodes."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Required engines not available'}

        job = ExportJob(format=format, target='career_graph')
        self._exports[job.export_id] = job
        job.status = 'running'

        career = await self._graph.get_node(career_node_id)
        chain = await self._traversal.dependency_chain(career_node_id, max_depth=10)

        # Collect all prerequisite node IDs
        prereq_ids = set()
        for level in chain:
            for item in level:
                nid = item.get('node_id', '')
                if nid:
                    prereq_ids.add(nid)

        all_node_ids = [career_node_id] + [UUID(pid) for pid in prereq_ids if pid]

        # Get node details
        nodes = []
        if self._graph:
            for nid in all_node_ids:
                node = await self._graph.get_node(nid)
                if node:
                    nodes.append(node)

        data = {
            'export_type': 'career_graph',
            'schema_version': '1.0',
            'career': career,
            'required_node_count': len(nodes),
            'dependency_levels': len(chain),
            'nodes': nodes,
        }

        job.total_items = len(nodes)
        job.exported_items = job.total_items
        result = await self._serialize(job.export_id, data, format)
        job.status = 'completed'
        return result

    async def export_learning_path(self, path_data: dict, format: str = 'json') -> dict:
        """Export a learning path."""
        job = ExportJob(format=format, target='learning_path')
        self._exports[job.export_id] = job
        job.status = 'running'

        data = {
            'export_type': 'learning_path',
            'schema_version': '1.0',
            'exported_at': datetime.now(UTC).isoformat(),
            'path': path_data,
        }

        job.total_items = len(path_data.get('milestones', []))
        job.exported_items = job.total_items
        result = await self._serialize(job.export_id, data, format)
        job.status = 'completed'
        return result

    async def export_assessment(self, assessment_data: dict, format: str = 'json') -> dict:
        """Export an assessment."""
        job = ExportJob(format=format, target='assessment')
        self._exports[job.export_id] = job
        job.status = 'running'

        data = {
            'export_type': 'assessment',
            'schema_version': '1.0',
            'exported_at': datetime.now(UTC).isoformat(),
            'assessment': assessment_data,
        }

        job.total_items = len(assessment_data.get('questions', []))
        job.exported_items = job.total_items
        result = await self._serialize(job.export_id, data, format)
        job.status = 'completed'
        return result

    async def export_node(self, node_id: UUID, format: str = 'json') -> dict:
        """Export a single node with full details."""
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        job = ExportJob(format=format, target='node')
        self._exports[job.export_id] = job
        job.status = 'running'

        node = await self._graph.get_node(node_id)
        neighbors = await self._graph.get_neighbors(node_id)

        data = {
            'export_type': 'node',
            'schema_version': '1.0',
            'node': node,
            'neighbors': neighbors,
        }

        job.total_items = 1
        job.exported_items = 1
        result = await self._serialize(job.export_id, data, format)
        job.status = 'completed'
        return result

    async def export_dependency_chain(
        self,
        node_id: UUID,
        max_depth: int = 5,
        format: str = 'json',
    ) -> dict:
        """Export the dependency chain of a node."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Required engines not available'}

        job = ExportJob(format=format, target='dependency_chain')
        self._exports[job.export_id] = job
        job.status = 'running'

        chain = await self._traversal.dependency_chain(node_id, max_depth)

        data = {
            'export_type': 'dependency_chain',
            'schema_version': '1.0',
            'node_id': str(node_id),
            'max_depth': max_depth,
            'levels': chain,
        }

        job.total_items = sum(len(level) for level in chain)
        job.exported_items = job.total_items
        result = await self._serialize(job.export_id, data, format)
        job.status = 'completed'
        return result

    # ═══════════════════════════════════════════════════════════════════
    # Export Job Management
    # ═══════════════════════════════════════════════════════════════════

    async def list_exports(self, limit: int = 20) -> list[dict]:
        """List recent export jobs."""
        sorted_jobs = sorted(
            self._exports.values(),
            key=lambda j: j.created_at,
            reverse=True,
        )
        return [self._job_to_dict(j) for j in sorted_jobs[:limit]]

    async def get_export_status(self, export_id: str) -> dict | None:
        """Get the status of an export job."""
        job = self._exports.get(export_id)
        if job is None:
            return None
        return self._job_to_dict(job)

    async def download_export(self, export_id: str) -> dict | str | None:
        """Get the exported data for downloading."""
        return self._export_results.get(export_id)

    # ═══════════════════════════════════════════════════════════════════
    # Serialization
    # ═══════════════════════════════════════════════════════════════════

    async def _serialize(
        self,
        export_id: str,
        data: dict,
        format: str = 'json',
        compress: bool = False,
    ) -> dict:
        """Serialize data into the requested format and store it."""
        format = format.lower()

        if format == 'json':
            result = json.dumps(data, indent=2, default=str, ensure_ascii=False)
        elif format == 'csv':
            result = self._to_csv(data)
        elif format == 'md':
            result = self._to_markdown(data)
        elif format == 'yaml':
            # Simple YAML-like format (indented key-value)
            result = self._to_yaml_like(data)
        elif format == 'zip':
            result = self._to_zip(data)
        else:
            result = json.dumps(data, indent=2, default=str)

        if compress:
            import gzip

            result_bytes = result.encode('utf-8') if isinstance(result, str) else result
            result = gzip.compress(result_bytes)

        self._export_results[export_id] = result
        job = self._exports.get(export_id)
        if job:
            job.result_size_bytes = len(result) if isinstance(result, str) else len(result)  # noqa: RUF034

        return {
            'export_id': export_id,
            'format': format,
            'size_bytes': job.result_size_bytes if job else len(result),
            'status': 'completed',
            'mime_type': self._mime_type(format),
        }

    def _to_csv(self, data: dict) -> str:
        """Convert export data to CSV format."""
        output = io.StringIO()
        writer = csv.writer(output)

        # Write nodes
        nodes = data.get('nodes', [])
        if nodes:
            writer.writerow(['--- NODES ---'])
            writer.writerow(['id', 'slug', 'title', 'node_type', 'difficulty', 'description'])
            for n in nodes:
                writer.writerow(
                    [
                        n.get('id', ''),
                        n.get('slug', ''),
                        n.get('title', ''),
                        n.get('node_type', ''),
                        n.get('difficulty', ''),
                        n.get('description', ''),
                    ],
                )

        # Write edges
        edges = data.get('edges', [])
        if edges:
            writer.writerow(['--- EDGES ---'])
            writer.writerow(['id', 'source_id', 'target_id', 'relationship_type', 'weight'])
            for e in edges:
                writer.writerow(
                    [
                        e.get('id', ''),
                        e.get('source_id', ''),
                        e.get('target_id', ''),
                        e.get('relationship_type', ''),
                        e.get('weight', ''),
                    ],
                )

        return output.getvalue()

    def _to_markdown(self, data: dict) -> str:
        """Convert export data to Markdown documentation."""
        lines = []
        export_type = data.get('export_type', 'export')
        lines.append(f'# {export_type.replace("_", " ").title()}')
        lines.append(f'*Exported at: {data.get("exported_at", "N/A")}*')
        lines.append('')

        if data.get('statistics'):
            stats = data['statistics']
            lines.append('## Statistics')
            lines.append(f'- Nodes: {stats.get("node_count", 0)}')
            lines.append(f'- Edges: {stats.get("edge_count", 0)}')
            lines.append(f'- Density: {stats.get("density", 0)}')
            lines.append('')

        nodes = data.get('nodes', [])
        if nodes:
            lines.append(f'## Nodes ({len(nodes)})')
            lines.append('| ID | Title | Type | Difficulty |')
            lines.append('|----|-------|------|------------|')
            for n in nodes:
                lines.append(
                    f'| {n.get("id", "")[:8]}... | {n.get("title", "")} | '
                    f'{n.get("node_type", "")} | {n.get("difficulty", "")} |',
                )
            lines.append('')

        edges = data.get('edges', [])
        if edges:
            lines.append(f'## Edges ({len(edges)})')
            lines.append('| ID | Source | Target | Type |')
            lines.append('|-----|--------|--------|------|')
            for e in edges:
                lines.append(
                    f'| {e.get("id", "")[:8]}... | {str(e.get("source_id", ""))[:8]}... | '
                    f'{str(e.get("target_id", ""))[:8]}... | {e.get("relationship_type", "")} |',
                )
            lines.append('')

        return '\n'.join(lines)

    def _to_yaml_like(self, data: dict, indent: int = 0) -> str:
        """Simple structured format similar to YAML."""
        lines = []
        prefix = '  ' * indent
        for key, value in data.items():
            if isinstance(value, dict):
                lines.append(f'{prefix}{key}:')
                lines.append(self._to_yaml_like(value, indent + 1))
            elif isinstance(value, list):
                lines.append(f'{prefix}{key}:')
                for item in value[:10]:  # Limit for readability
                    if isinstance(item, dict):
                        lines.append(f'{prefix}  -')
                        lines.append(self._to_yaml_like(item, indent + 2))
                    else:
                        lines.append(f'{prefix}  - {item}')
                if len(value) > 10:
                    lines.append(f'{prefix}  ... ({len(value)} total)')
            else:
                lines.append(f'{prefix}{key}: {value}')
        return '\n'.join(lines)

    def _to_zip(self, data: dict) -> bytes:
        """Create a ZIP archive containing multiple format representations."""
        buffer = io.BytesIO()
        with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.writestr('export.json', json.dumps(data, indent=2, default=str))
            zf.writestr('export.csv', self._to_csv(data))
            zf.writestr('export.md', self._to_markdown(data))
            nodes = data.get('nodes', [])
            edges = data.get('edges', [])
            zf.writestr(
                'metadata.json',
                json.dumps(
                    {
                        'export_type': data.get('export_type', ''),
                        'exported_at': data.get('exported_at', ''),
                        'node_count': len(nodes),
                        'edge_count': len(edges),
                    },
                    indent=2,
                ),
            )
        return buffer.getvalue()

    def _mime_type(self, format: str) -> str:
        mime_map = {
            'json': 'application/json',
            'yaml': 'text/yaml',
            'csv': 'text/csv',
            'md': 'text/markdown',
            'zip': 'application/zip',
        }
        return mime_map.get(format, 'application/octet-stream')

    def _job_to_dict(self, job: ExportJob) -> dict:
        return {
            'export_id': job.export_id,
            'format': job.format,
            'target': job.target,
            'status': job.status,
            'progress': job.progress,
            'total_items': job.total_items,
            'exported_items': job.exported_items,
            'result_size_bytes': job.result_size_bytes,
            'error_message': job.error_message,
            'created_at': job.created_at,
            'completed_at': job.completed_at,
        }
