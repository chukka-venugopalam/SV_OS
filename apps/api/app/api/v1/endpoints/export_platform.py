"""Export Platform API — capability-based export endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel

router = APIRouter(prefix='/export', tags=['export-platform'])


class ExportGraphRequest(BaseModel):
    format: str = 'json'
    compress: bool = False
    filter_criteria: dict | None = None


class ExportSubgraphRequest(BaseModel):
    center_node_id: UUID
    depth: int = 2
    format: str = 'json'


class ExportNodeRequest(BaseModel):
    node_id: UUID
    format: str = 'json'


def _get_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('export')
    return None


def _safe(data: dict, msg: str = 'Success') -> dict:
    return {'success': True, 'data': data, 'errors': None}


@router.post('')
async def export_graph(
    request: Request,
    body: ExportGraphRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Export engine not available'})
    result = await engine.export_graph(
        format=body.format,
        compress=body.compress,
        filter_criteria=body.filter_criteria,
    )
    return _safe(result)


@router.post('/subgraph')
async def export_subgraph(
    request: Request,
    body: ExportSubgraphRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Export engine not available'})
    result = await engine.export_subgraph(body.center_node_id, body.depth, format=body.format)
    return _safe(result)


@router.post('/node')
async def export_node(
    request: Request,
    body: ExportNodeRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Export engine not available'})
    result = await engine.export_node(body.node_id, format=body.format)
    return _safe(result)


@router.post('/dependency-chain')
async def export_dependency_chain(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'node_id' not in body:
        return _safe({'error': 'Engine or node_id missing'})
    nid = UUID(body['node_id'])
    max_depth = body.get('max_depth', 5)
    fmt = body.get('format', 'json')
    result = await engine.export_dependency_chain(nid, max_depth, format=fmt)
    return _safe(result)


@router.post('/career-graph')
async def export_career_graph(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'career_node_id' not in body:
        return _safe({'error': 'Engine or career_node_id missing'})
    nid = UUID(body['career_node_id'])
    fmt = body.get('format', 'json')
    result = await engine.export_career_graph(nid, format=fmt)
    return _safe(result)


@router.get('/jobs')
async def list_exports(
    request: Request,
    limit: int = Query(20, ge=1, le=100),
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'items': [], 'count': 0})
    items = await engine.list_exports(limit=limit)
    return _safe({'items': items, 'count': len(items)})


@router.get('/jobs/{export_id}')
async def get_export_status(
    export_id: str,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Export engine not available'})
    result = await engine.get_export_status(export_id)
    return _safe(result)


@router.get('/download/{export_id}')
async def download_export(
    export_id: str,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Export engine not available'})
    result = await engine.download_export(export_id)
    return _safe({'data': result})
