"""Graph API endpoints."""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.schemas.response import success_response
from app.services.legacy_graph import GraphService

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter()


@router.get('/full')
async def get_full_graph(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get all published nodes and edges for full graph visualisation.

    Returns everything in a format compatible with React Flow.
    """
    from sqlalchemy import select

    from app.models.knowledge_edge import KnowledgeEdge
    from app.models.knowledge_node import KnowledgeNode

    # Fetch all published nodes
    nodes_stmt = (
        select(KnowledgeNode)
        .where(
            KnowledgeNode.is_deleted.isnot(True),
            KnowledgeNode.is_published,
        )
        .order_by(KnowledgeNode.title)
    )
    nodes_result = await uow.session.execute(nodes_stmt)
    all_nodes = list(nodes_result.scalars().all())

    # Fetch edges where both source and target are published nodes
    published_ids = [n.id for n in all_nodes]
    if published_ids:
        edges_stmt = (
            select(KnowledgeEdge)
            .where(
                KnowledgeEdge.is_deleted.isnot(True),
                KnowledgeEdge.source_node_id.in_(published_ids),
                KnowledgeEdge.target_node_id.in_(published_ids),
            )
            .order_by(KnowledgeEdge.relationship_type)
        )
        edges_result = await uow.session.execute(edges_stmt)
        all_edges = list(edges_result.scalars().all())
    else:
        all_edges = []

    return success_response(
        data={
            'nodes': [_node_to_dict(n) for n in all_nodes],
            'edges': [_edge_to_dict(e) for e in all_edges],
            'total_nodes': len(all_nodes),
            'total_edges': len(all_edges),
        },
        message='Full graph retrieved',
    )


@router.get('/explore/{node_id}')
async def explore_node(
    node_id: UUID,
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    depth: Annotated[int, Query(ge=1, le=3, description='Exploration depth')] = 1,
    relationship_type: Annotated[str | None, Query(description='Filter by edge type')] = None,
) -> dict:
    """Explore the neighborhood around a node."""
    service = GraphService(uow)
    result = await service.get_neighborhood(
        node_id=node_id,
        _depth=depth,
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
    uow: Annotated[UnitOfWork, Depends(get_uow)],
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
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get the prerequisite chain for a node."""
    service = GraphService(uow)
    chain = await service.get_prerequisite_chain(node_id)
    return success_response(
        data={
            'levels': [[_node_to_dict(n) for n in level] for level in chain],
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
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'estimated_minutes': getattr(node, 'estimated_minutes', None),
        'icon': node.icon,
        'color': node.color,
    }


def _edge_to_dict(edge) -> dict:
    return {
        'id': str(edge.id),
        'source_id': str(edge.source_node_id),
        'target_id': str(edge.target_node_id),
        'relationship_type': edge.relationship_type.value
        if hasattr(edge.relationship_type, 'value')
        else edge.relationship_type,
        'direction': edge.direction.value
        if hasattr(edge.direction, 'value')
        else getattr(edge, 'direction', 'forward'),
    }
