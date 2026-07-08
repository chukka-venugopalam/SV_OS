"""Graph API endpoints."""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import success_response
from app.services.legacy_graph import GraphService

logger = get_logger(__name__)

router = APIRouter()


@router.get('/explore/{node_id}')
async def explore_node(
    node_id: UUID,
    depth: int = Query(1, ge=1, le=3, description='Exploration depth'),
    relationship_type: str | None = Query(None, description='Filter by edge type'),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Explore the neighborhood around a node."""
    service = GraphService(uow)
    result = await service.get_neighborhood(
        node_id=node_id,
        depth=depth,
        relationship_type=relationship_type,
    )
    if result['node'] is None:
        raise HTTPException(status_code=404, detail='Node not found')

    return success_response(
        data={
            'node': _node_to_dict(result['node']),
            'neighbors': {
                'outgoing': [_node_to_dict(n) for n in result['neighbors'].get('outgoing', [])],
                'incoming': [_node_to_dict(n) for n in result['neighbors'].get('incoming', [])],
            },
            'edge_type_counts': result.get('edge_type_counts', []),
        },
        message='Neighborhood retrieved',
    )


@router.get('/statistics')
async def get_graph_statistics(
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get aggregate graph statistics."""
    service = GraphService(uow)
    stats = await service.get_graph_statistics()
    return success_response(
        data=stats,
        message='Graph statistics retrieved',
    )


@router.get('/prerequisites/{node_id}')
async def get_prerequisite_chain(
    node_id: UUID,
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get the prerequisite chain for a node."""
    service = GraphService(uow)
    chain = await service.get_prerequisite_chain(node_id)
    return success_response(
        data={
            'levels': [
                [_node_to_dict(n) for n in level]
                for level in chain
            ],
            'depth': len(chain),
        },
        message='Prerequisite chain retrieved',
    )


def _node_to_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value if hasattr(node.difficulty, 'value') else node.difficulty,
        'icon': node.icon,
        'color': node.color,
    }
