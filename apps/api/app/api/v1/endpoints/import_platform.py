"""Import Platform API — capability-based import endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Query, Request
from pydantic import BaseModel

if TYPE_CHECKING:
    from uuid import UUID

router = APIRouter(prefix='/import', tags=['import-platform'])


class StartImportRequest(BaseModel):
    payload: dict | None = None
    raw_content: str = ''
    source_format: str = 'json'
    dry_run: bool = False
    source: str = 'api'


def _get_engine(request: Request):
    container = getattr(request.app.state, 'platform_container', None)
    if container and container.engine_registry:
        return container.engine_registry.try_get('import')
    return None


def _safe(data: dict, _msg: str = 'Success') -> dict:
    return {'success': True, 'data': data, 'errors': None}


@router.post('')
async def start_import(
    request: Request,
    body: StartImportRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Import engine not available'})
    result = await engine.start_import(
        payload=body.payload,
        raw_content=body.raw_content,
        source_format=body.source_format,
        dry_run=body.dry_run,
        source=body.source,
    )
    return _safe(result)


@router.post('/dry-run')
async def dry_run_import(
    request: Request,
    body: StartImportRequest,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Import engine not available'})
    body.dry_run = True
    result = await engine.start_import(
        payload=body.payload,
        raw_content=body.raw_content,
        source_format=body.source_format,
        dry_run=True,
        source=body.source,
    )
    return _safe(result)


@router.post('/validate')
async def validate_import(
    request: Request,
    body: dict,
) -> dict:
    engine = _get_engine(request)
    if engine is None or 'content' not in body:
        return _safe({'error': 'Engine or content missing'})
    fmt = body.get('format', 'json')
    result = await engine.validate_raw_content(body['content'], format=fmt)
    return _safe(result)


@router.post('/cancel/{import_id}')
async def cancel_import(
    import_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Import engine not available'})
    result = await engine.cancel_import(import_id)
    return _safe(result)


@router.get('/jobs')
async def list_import_jobs(
    request: Request,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'items': [], 'count': 0})
    items = await engine.get_import_history(limit=limit)
    return _safe({'items': items, 'count': len(items)})


@router.get('/jobs/{import_id}')
async def get_import_job(
    import_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Import engine not available'})
    result = await engine.get_import_status(import_id)
    return _safe(result)


@router.post('/resume/{import_id}')
async def resume_import(
    import_id: UUID,
    request: Request,
) -> dict:
    engine = _get_engine(request)
    if engine is None:
        return _safe({'error': 'Import engine not available'})
    result = await engine.resume_import(import_id)
    return _safe(result)
