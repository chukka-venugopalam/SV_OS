"""Versioning Platform API — capability-based versioning endpoints."""

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel

router = APIRouter(prefix='/versions', tags=['versioning-platform'])


class CreateSnapshotRequest(BaseModel):
    notes: str = ''
    author: str = 'system'
    tags: list[str] = []
    branch: str = 'main'


class DiffRequest(BaseModel):
    source_version_id: str
    target_version_id: str


class TagRequest(BaseModel):
    version_id: str
    tag: str


class CreateBranchRequest(BaseModel):
    branch_name: str
    from_version_id: str | None = None


def _get_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('versioning')
    return None


def _safe(data: dict, _msg: str = 'Success') -> dict:
    return {'success': True, 'data': data, 'errors': None}


@router.get('')
async def list_versions(
    request: Request,
    branch: Annotated[str | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=200)] = 50,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'items': [], 'count': 0})
    items = await engine.list_snapshots(branch=branch, limit=limit)
    return _safe({'items': items, 'count': len(items)})


@router.get('/{version_id}')
async def get_version(
    version_id: str,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Versioning engine not available'})
    result = await engine.get_snapshot(version_id)
    return _safe(result)


@router.post('/snapshot')
async def create_snapshot(
    request: Request,
    body: CreateSnapshotRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Versioning engine not available'})
    result = await engine.create_snapshot(
        notes=body.notes,
        author=body.author,
        tags=body.tags,
        branch=body.branch,
    )
    return _safe(result)


@router.post('/restore')
async def restore_snapshot(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'version_id' not in body:
        return _safe({'error': 'Engine or version_id missing'})
    result = await engine.restore_snapshot(body['version_id'])
    return _safe(result)


@router.post('/rollback')
async def rollback(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'version_id' not in body:
        return _safe({'error': 'Engine or version_id missing'})
    result = await engine.rollback(body['version_id'])
    return _safe(result)


@router.post('/diff')
async def diff_versions(
    request: Request,
    body: DiffRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Versioning engine not available'})
    result = await engine.diff_versions(body.source_version_id, body.target_version_id)
    return _safe(result)


@router.post('/compare')
async def compare_versions(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'version_id_a' not in body or 'version_id_b' not in body:
        return _safe({'error': 'Missing version IDs'})
    result = await engine.compare_versions(body['version_id_a'], body['version_id_b'])
    return _safe(result)


@router.post('/tag')
async def tag_version(
    request: Request,
    body: TagRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Versioning engine not available'})
    result = await engine.tag_version(body.version_id, body.tag)
    return _safe(result)


@router.post('/branches')
async def create_branch(
    request: Request,
    body: CreateBranchRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Versioning engine not available'})
    result = await engine.create_branch(body.branch_name, body.from_version_id)
    return _safe(result)


@router.get('/branches')
async def list_branches(
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'branches': []})
    result = await engine.list_branches()
    return _safe({'branches': result})


@router.get('/checksum')
async def graph_checksum(
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Versioning engine not available'})
    result = await engine.graph_checksum()
    return _safe(result)
