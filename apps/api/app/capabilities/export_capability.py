"""Export Capability — export graph data in multiple formats.

Orchestrates: ExportEngine, GraphEngine, TraversalEngine
No business logic — delegates to engines.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID


class ExportCapability:
    """Export Capability — public API for graph export.

    Thin orchestration layer. All business logic lives in engines.
    """

    def __init__(self, export_engine: Any | None = None) -> None:
        self._export = export_engine

    async def export_graph(self, format: str = 'json', compress: bool = False, filter_criteria: dict | None = None) -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_graph(format=format, compress=compress, filter_criteria=filter_criteria)

    async def export_subgraph(self, center_node_id: UUID, depth: int = 2, format: str = 'json') -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_subgraph(center_node_id, depth, format=format)

    async def export_career_graph(self, career_node_id: UUID, format: str = 'json') -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_career_graph(career_node_id, format=format)

    async def export_node(self, node_id: UUID, format: str = 'json') -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_node(node_id, format=format)

    async def export_dependency_chain(self, node_id: UUID, max_depth: int = 5, format: str = 'json') -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_dependency_chain(node_id, max_depth, format=format)

    async def export_learning_path(self, path_data: dict, format: str = 'json') -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_learning_path(path_data, format=format)

    async def export_assessment(self, assessment_data: dict, format: str = 'json') -> dict:
        if self._export is None:
            return {'error': 'Export engine not available'}
        return await self._export.export_assessment(assessment_data, format=format)

    async def list_exports(self, limit: int = 20) -> list[dict]:
        if self._export is None:
            return []
        return await self._export.list_exports(limit=limit)

    async def get_export_status(self, export_id: str) -> dict | None:
        if self._export is None:
            return None
        return await self._export.get_export_status(export_id)
