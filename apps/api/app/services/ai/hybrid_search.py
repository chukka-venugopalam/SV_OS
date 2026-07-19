"""Hybrid Search Service — multi-signal search combining keyword, semantic,
graph proximity, popularity, and difficulty signals into a single ranking.

Scoring formula:
    score = (keyword_score * W_KEYWORD)
          + (semantic_score * W_SEMANTIC)
          + (graph_proximity * W_GRAPH)
          + (popularity_score * W_POPULARITY)
          + (difficulty_score * W_DIFFICULTY)

All weights are configurable via constructor.
"""

from __future__ import annotations

import math
from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

# Default weights
W_KEYWORD = 0.25
W_SEMANTIC = 0.25
W_GRAPH = 0.20
W_POPULARITY = 0.15
W_DIFFICULTY = 0.15


class HybridSearchService:
    """Multi-signal hybrid search combining multiple ranking signals.

    Combines traditional keyword search with semantic similarity,
    graph proximity, popularity, and difficulty scoring for
    comprehensive, relevant results.
    """

    def __init__(
        self,
        uow: UnitOfWork,
        w_keyword: float = W_KEYWORD,
        w_semantic: float = W_SEMANTIC,
        w_graph: float = W_GRAPH,
        w_popularity: float = W_POPULARITY,
        w_difficulty: float = W_DIFFICULTY,
    ) -> None:
        self._uow = uow
        self._w_keyword = w_keyword
        self._w_semantic = w_semantic
        self._w_graph = w_graph
        self._w_popularity = w_popularity
        self._w_difficulty = w_difficulty

    async def search(
        self,
        query: str,
        query_embedding: list[float] | None = None,
        user_id: UUID | None = None,
        filters: dict | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Execute a hybrid search with multi-signal ranking.

        Args:
            query: The search query string.
            query_embedding: Optional pre-computed query embedding.
            user_id: Optional user ID for personalisation.
            filters: Optional filters (node_type, difficulty, tags).
            page: Page number.
            per_page: Items per page.

        Returns:
            Paginated results with scores and signal breakdown.

        """
        nodes = await self._uow.knowledge_nodes.find_published()
        user_progress_ids: set[UUID] = set()
        user_bookmark_ids: set[UUID] = set()
        completed_ids: set[UUID] = set()

        if user_id:
            user_progress_ids = await self._get_user_progress_ids(user_id)
            user_bookmark_ids = await self._get_user_bookmark_ids(user_id)
            completed_ids = await self._get_completed_ids(user_id)

        scored: list[tuple[float, dict]] = []
        for node in nodes:
            # Apply filters
            if filters:
                if filters.get('node_type') and (node.node_type.value != filters['node_type']):
                    continue
                if filters.get('difficulty') and (node.difficulty.value != filters['difficulty']):
                    continue

            keyword_score = self._keyword_score(query, node)
            semantic_score = self._semantic_score(query_embedding, node)
            graph_score = await self._graph_score(node, completed_ids)
            popularity_score = self._popularity_score(node)
            difficulty_score = self._difficulty_score(node)

            composite = (
                keyword_score * self._w_keyword
                + semantic_score * self._w_semantic
                + graph_score * self._w_graph
                + popularity_score * self._w_popularity
                + difficulty_score * self._w_difficulty
            )

            if composite > 0:
                scored.append(
                    (
                        composite,
                        {
                            'node': _node_to_dict(node),
                            'score': round(composite, 4),
                            'signals': {
                                'keyword': round(keyword_score, 4),
                                'semantic': round(semantic_score, 4),
                                'graph': round(graph_score, 4),
                                'popularity': round(popularity_score, 4),
                                'difficulty': round(difficulty_score, 4),
                            },
                            'is_in_progress': node.id in user_progress_ids,
                            'is_bookmarked': node.id in user_bookmark_ids,
                        },
                    ),
                )

        scored.sort(key=lambda x: x[0], reverse=True)

        # Paginate
        total = len(scored)
        offset = (page - 1) * per_page
        items = [item for _, item in scored[offset : offset + per_page]]
        total_pages = max(1, (total + per_page - 1) // per_page) if total else 1

        return {
            'items': items,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
        }

    # ── Scoring Signals ────────────────────────────────────────────

    def _keyword_score(self, query: str, node) -> float:
        """TF-IDF-like keyword score. 0.0 to 1.0."""
        if not query:
            return 0.0

        query_lower = query.lower()
        text = f'{node.title} {node.description}'.lower()
        score = 0.0

        # Exact title match
        if query_lower == node.title.lower():
            score = 1.0
        # Title contains query
        elif query_lower in node.title.lower():
            score = 0.8
        # Description contains query
        elif query_lower in node.description.lower():
            score = 0.5

        # Bonus for word overlap
        query_words = set(query_lower.split())
        text_words = set(text.split())
        if query_words and text_words:
            overlap = len(query_words & text_words) / len(query_words)
            score = max(score, overlap * 0.6)

        return min(score, 1.0)

    def _semantic_score(self, query_embedding: list[float] | None, node) -> float:
        """Semantic similarity score based on embeddings."""
        if not query_embedding:
            return 0.0

        metadata = node.extra_metadata or {}
        node_embedding = metadata.get('embedding')
        if not node_embedding:
            return 0.0

        return self._cosine_similarity(query_embedding, node_embedding)

    async def _graph_score(self, node, completed_ids: set[UUID]) -> float:
        """Graph proximity score. Higher when close to completed nodes."""
        if not completed_ids:
            return 0.0

        edges = await self._uow.graph.load_edges_for_nodes(
            node_ids=[node.id],
        )
        connected_to_completed = any(
            e.source_node_id in completed_ids or e.target_node_id in completed_ids for e in edges
        )

        return 0.8 if connected_to_completed else 0.2

    def _popularity_score(self, node) -> float:
        """Popularity score based on view count. 0.0 to 1.0."""
        view_count = getattr(node, 'view_count', 0) or 0
        if view_count > 500:
            return 1.0
        if view_count > 100:
            return 0.8
        if view_count > 50:
            return 0.5
        if view_count > 10:
            return 0.3
        if view_count > 0:
            return 0.1
        return 0.0

    def _difficulty_score(self, node) -> float:
        """Difficulty score. Prefers beginner/intermediate. 0.0 to 1.0."""
        diff = getattr(node, 'difficulty', None)
        if diff is None:
            return 0.3

        diff_str = diff.value if hasattr(diff, 'value') else str(diff)
        if diff_str.lower() in ('beginner', 'intermediate'):
            return 0.7
        if diff_str.lower() == 'advanced':
            return 0.4
        if diff_str.lower() == 'expert':
            return 0.1
        return 0.3

    def _cosine_similarity(self, vec_a: list[float], vec_b: list[float]) -> float:
        """Compute cosine similarity between two vectors."""
        if not vec_a or not vec_b:
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b, strict=False))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    async def _get_user_progress_ids(self, user_id: UUID) -> set[UUID]:
        progress = await self._uow.user_progress.find_by_user(user_id=user_id)
        return {p.node_id for p in progress.items if p}

    async def _get_user_bookmark_ids(self, user_id: UUID) -> set[UUID]:
        bookmarks = await self._uow.bookmarks.find_by_user(user_id=user_id)
        return {b.node_id for b in bookmarks if b}

    async def _get_completed_ids(self, user_id: UUID) -> set[UUID]:
        completed = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='completed',
        )
        mastered = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='mastered',
        )
        return {p.node_id for p in completed.items if p} | {p.node_id for p in mastered.items if p}


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
        'estimated_minutes': node.estimated_minutes,
        'icon': node.icon,
        'color': node.color,
        'view_count': node.view_count,
    }
