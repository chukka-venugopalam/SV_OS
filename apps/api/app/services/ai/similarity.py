"""
Similarity Service — concept similarity and relationship discovery.

Provides:
- Similar concepts to a given node (semantic + graph + popularity)
- Concept clustering suggestions
- "People also learned" style recommendations
"""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.services.ai.semantic_search import SemanticSearchService

logger = get_logger(__name__)


class SimilarityService:
    """Computes similarity between concepts using multiple signals.

    Combines:
    - Semantic embedding similarity
    - Graph proximity (shared edges)
    - Same-type bonus (concepts similar to other concepts)
    - Co-prerequisite similarity (nodes that share prerequisites)
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._semantic_search = SemanticSearchService(uow)

    async def find_similar(
        self,
        node_id: UUID,
        limit: int = 10,
        include_semantic: bool = True,
        include_graph: bool = True,
    ) -> list[dict]:
        """Find similar concepts to a given node using multiple signals.

        Args:
            node_id: The source node.
            limit: Maximum results.
            include_semantic: Include semantic embedding similarity.
            include_graph: Include graph-based similarity.

        Returns:
            List of similar nodes with scores and reasons.
        """
        node = await self._uow.knowledge_nodes.get_by_id(node_id)
        if not node:
            return []

        node_type = node.node_type.value if hasattr(node.node_type, 'value') else node.node_type
        metadata = node.extra_metadata or {}
        embedding = metadata.get('embedding')

        candidates: dict[UUID, dict] = {}

        # 1. Semantic similarity
        if include_semantic and embedding:
            semantic_results = await self._semantic_search.search(
                query_embedding=embedding,
                limit=limit * 3,
                threshold=0.2,
                exclude_node_ids=[node_id],
            )
            for r in semantic_results:
                nid = UUID(r['node']['id'])
                if nid not in candidates:
                    candidates[nid] = {
                        'node': r['node'],
                        'semantic_score': r['similarity'],
                        'graph_score': 0.0,
                        'type_score': 0.0,
                    }
                else:
                    candidates[nid]['semantic_score'] = r['similarity']

        # 2. Graph proximity (shared edges / same neighborhood)
        if include_graph:
            neighbors = await self._uow.graph.load_all_neighbors(node_id)
            all_neighbor_ids = set()

            for n in neighbors.get('outgoing', []):
                all_neighbor_ids.add(n.id)
            for n in neighbors.get('incoming', []):
                all_neighbor_ids.add(n.id)

            for nid in all_neighbor_ids:
                if nid == node_id:
                    continue
                neighbor_node = await self._uow.knowledge_nodes.get_by_id(nid)
                if neighbor_node:
                    ntype = (
                        neighbor_node.node_type.value
                        if hasattr(neighbor_node.node_type, 'value')
                        else neighbor_node.node_type
                    )

                    if nid not in candidates:
                        candidates[nid] = {
                            'node': _node_to_dict(neighbor_node),
                            'semantic_score': 0.0,
                            'graph_score': 0.8,
                            'type_score': 1.0 if ntype == node_type else 0.5,
                        }
                    else:
                        candidates[nid]['graph_score'] = 0.8
                        candidates[nid]['type_score'] = 1.0 if ntype == node_type else 0.5

        # 3. Compute composite scores
        scored = []
        for _nid, data in candidates.items():
            composite = (
                data.get('semantic_score', 0.0) * 0.40
                + data['graph_score'] * 0.35
                + data['type_score'] * 0.25
            )

            reasons = []
            if data.get('semantic_score', 0.0) > 0.5:
                reasons.append('Semantically related content')
            if data['graph_score'] > 0:
                reasons.append('Connected in knowledge graph')
            if data['type_score'] > 0.7:
                reasons.append('Same type category')

            scored.append(
                {
                    'node': data['node'],
                    'score': round(composite, 4),
                    'signals': {
                        'semantic': round(data.get('semantic_score', 0.0), 4),
                        'graph': round(data['graph_score'], 4),
                        'type': round(data['type_score'], 4),
                    },
                    'reasons': reasons[:2],  # Top 2 reasons
                }
            )

        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:limit]


def _node_to_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description[:200] if node.description else '',
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
        'estimated_minutes': node.estimated_minutes,
        'icon': node.icon,
        'color': node.color,
    }
