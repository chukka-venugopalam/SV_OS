"""Graph API endpoints."""

from collections import defaultdict, deque
from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.models.knowledge_edge import KnowledgeEdge
from app.models.knowledge_node import KnowledgeNode
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

    Returns everything in a format compatible with React Flow, with nodes
    positioned by topological depth computed strictly from prerequisite edges.
    """
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
    published_ids = {n.id for n in all_nodes}

    all_edges_dict = []
    prereq_adj = defaultdict(list)
    in_degree = defaultdict(int)

    for n in all_nodes:
        in_degree[n.id] = 0

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
        db_edges = list(edges_result.scalars().all())

        for e in db_edges:
            rel_type = (
                e.relationship_type.value
                if hasattr(e.relationship_type, 'value')
                else e.relationship_type
            )
            all_edges_dict.append(_edge_to_dict(e))

            # Strictly compute depth using prerequisite edges ONLY
            if rel_type == 'prerequisite':
                prereq_adj[e.source_node_id].append(e.target_node_id)
                in_degree[e.target_node_id] += 1

    # Topological depth calculation (longest path from roots in DAG)
    depth_map = {n.id: 0 for n in all_nodes}
    queue = deque([n.id for n in all_nodes if in_degree[n.id] == 0])

    while queue:
        curr = queue.popleft()
        curr_depth = depth_map[curr]
        for neighbor in prereq_adj[curr]:
            depth_map[neighbor] = max(depth_map[neighbor], curr_depth + 1)
            in_degree[neighbor] -= 1
            if in_degree[neighbor] == 0:
                queue.append(neighbor)

    # Append cross-domain connections from node metadata as cross_domain edges
    virtual_edge_id = 1
    for n in all_nodes:
        meta = n.extra_metadata or {}
        cd_list = meta.get('cross_domain_connections', [])
        for cd in cd_list:
            tgt_id_str = cd.get('target_id')
            # Look up target by slug or ID
            tgt_node = next(
                (
                    node
                    for node in all_nodes
                    if node.slug == tgt_id_str or str(node.id) == tgt_id_str
                ),
                None,
            )
            if tgt_node:
                all_edges_dict.append(
                    {
                        'id': f'cd-edge-{virtual_edge_id}',
                        'source_id': str(n.id),
                        'target_id': str(tgt_node.id),
                        'relationship_type': 'cross_domain',
                        'edge_type': 'cross_domain',
                        'direction': 'forward',
                        'reason': cd.get('reason', ''),
                    }
                )
                virtual_edge_id += 1

    return success_response(
        data={
            'nodes': [_node_to_dict(n, depth_map.get(n.id, 0)) for n in all_nodes],
            'edges': all_edges_dict,
            'total_nodes': len(all_nodes),
            'total_edges': len(all_edges_dict),
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


def _node_to_dict(node, depth: int = 0) -> dict:
    meta = node.extra_metadata or {}
    node_type = (
        node.node_type.value
        if hasattr(node.node_type, 'value')
        else (str(node.node_type) if node.node_type is not None else 'concept')
    )
    difficulty = (
        node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else (str(node.difficulty) if node.difficulty is not None else 'intermediate')
    )
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node_type,
        'difficulty': difficulty,
        'estimated_minutes': getattr(node, 'estimated_minutes', None),
        'icon': node.icon or 'book',
        'color': node.color or '#3B82F6',
        'depth': depth,
        'domain': meta.get('domain', getattr(node, 'domain_raw', 'General CS')),
        'cross_domain_connections': meta.get('cross_domain_connections', []),
    }


def _edge_to_dict(edge) -> dict:
    rel_type = (
        edge.relationship_type.value
        if hasattr(edge.relationship_type, 'value')
        else (str(edge.relationship_type) if edge.relationship_type is not None else 'related')
    )
    direction_val = (
        edge.direction.value
        if hasattr(getattr(edge, 'direction', None), 'value')
        else (
            str(getattr(edge, 'direction', 'forward'))
            if getattr(edge, 'direction', None) is not None
            else 'forward'
        )
    )
    return {
        'id': str(edge.id),
        'source_id': str(edge.source_node_id),
        'target_id': str(edge.target_node_id),
        'relationship_type': rel_type,
        'edge_type': rel_type,
        'direction': direction_val,
    }
