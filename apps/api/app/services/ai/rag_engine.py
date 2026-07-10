"""
RAG Engine — Retrieval-Augmented Generation pipeline for grounded answers.

Pipeline:
1. Question → embedding → Semantic Search (top K results)
2. Hybrid Search (keyword + semantic + graph proximity)
3. Graph Expansion (prerequisites, dependents of top results)
4. Context Builder (format for LLM injection)
5. Grounded Answer with citations
"""

from __future__ import annotations

from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.services.ai.embedding_service import EmbeddingService
from app.services.ai.hybrid_search import HybridSearchService
from app.services.ai.semantic_search import SemanticSearchService

logger = get_logger(__name__)


class RAGEngine:
    """Retrieval-Augmented Generation engine for the SV-OS knowledge graph.

    Every RAG result includes:
    - Relevant knowledge nodes with similarity scores
    - Prerequisite and dependent chains for context
    - Citations formatted for injection into LLM prompts
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._embedding = EmbeddingService(uow=uow)
        self._semantic = SemanticSearchService(uow)
        self._hybrid = HybridSearchService(uow)

    async def search(
        self,
        query: str,
        top_k: int = 5,
        expand_graph: bool = True,
        user_id: UUID | None = None,
    ) -> list[dict]:
        """Execute the full RAG pipeline.

        Args:
            query: The search query.
            top_k: Number of top results to return.
            expand_graph: Whether to include prerequisite/dependent context.
            user_id: Optional user ID for personalisation.

        Returns:
            List of enriched knowledge node results with citations.
        """
        # 1. Generate query embedding
        try:
            query_embedding = await self._embedding.embed(query)
        except Exception:
            query_embedding = None

        # 2. Semantic search
        semantic_results: list[dict] = []
        if query_embedding:
            semantic_results = await self._semantic.search(
                query_embedding=query_embedding,
                limit=top_k * 2,
                threshold=0.2,
            )

        # 3. Hybrid search
        hybrid_results = await self._hybrid.search(
            query=query,
            query_embedding=query_embedding,
            user_id=user_id,
            page=1,
            per_page=top_k * 2,
        )

        # 4. Merge and deduplicate results
        seen_ids: set[str] = set()
        merged: list[dict] = []

        for r in semantic_results:
            nid = r.get('node', {}).get('id', '')
            if nid and nid not in seen_ids:
                seen_ids.add(nid)
                merged.append(
                    {
                        'node': r['node'],
                        'similarity': r.get('similarity', 0),
                        'source': 'semantic',
                    }
                )

        for r in hybrid_results.get('items', []):
            nid = r.get('node', {}).get('id', '')
            if nid and nid not in seen_ids:
                seen_ids.add(nid)
                merged.append(
                    {
                        'node': r['node'],
                        'similarity': r.get('score', 0),
                        'source': 'hybrid',
                    }
                )

        # Sort by similarity descending
        merged.sort(key=lambda x: x['similarity'], reverse=True)
        merged = merged[:top_k]

        # 5. Graph expansion
        if expand_graph and merged:
            expanded = await self._expand_with_graph(merged)
            merged = expanded

        # 6. Enrich with citations
        results = []
        for item in merged:
            node = item.get('node', {})
            results.append(
                {
                    **item,
                    'citation': {
                        'title': node.get('title', ''),
                        'slug': node.get('slug', ''),
                        'node_type': node.get('node_type', ''),
                        'difficulty': node.get('difficulty', ''),
                    },
                }
            )

        return results

    async def _expand_with_graph(
        self,
        results: list[dict],
    ) -> list[dict]:
        """Expand results with prerequisite and dependent context."""
        expanded = []
        for item in results:
            node_id_str = item.get('node', {}).get('id', '')
            if not node_id_str:
                expanded.append(item)
                continue

            try:
                node_id = UUID(node_id_str)
            except (ValueError, AttributeError):
                expanded.append(item)
                continue

            prereqs = await self._uow.graph.load_prerequisites(node_id)
            dependents = await self._uow.graph.load_dependents(node_id)

            item['prerequisites'] = [{'title': n.title, 'slug': n.slug} for n in prereqs[:3]]
            item['dependents'] = [{'title': n.title, 'slug': n.slug} for n in dependents[:3]]
            expanded.append(item)

        return expanded
