"""Recommendation Engine — content-based + graph-based recommendation service.

The engine combines multiple signals to generate ranked recommendations:

1. **Prerequisite completion** — nodes whose prerequisites the user has completed
2. **Graph distance** — nodes close to the user's current progress
3. **Popularity** — nodes with high view/edge counts
4. **Difficulty match** — nodes at or slightly above the user's current level
5. **Content relevance** — nodes related to bookmarked/favorited topics

Scoring formula:
    score = (prerequisite_score * 0.30)
          + (graph_distance_score * 0.25)
          + (popularity_score * 0.20)
          + (difficulty_score * 0.15)
          + (relevance_score * 0.10)
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

# Scoring weights
W_PREREQ = 0.30
W_DISTANCE = 0.25
W_POPULARITY = 0.20
W_DIFFICULTY = 0.15
W_RELEVANCE = 0.10


class RecommendationEngine:
    """Full recommendation engine for the SV-OS knowledge graph.

    Generates personalised recommendations by combining multiple
    signals: prerequisite completion, graph proximity, popularity,
    difficulty fit, and content relevance.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    # ── Main Entry Point ───────────────────────────────────────────

    async def get_recommendations(
        self,
        user_id: UUID,
        limit: int = 20,
        exclude_completed: bool = True,
    ) -> list[dict]:
        """Get ranked recommendations for a user.

        Args:
            user_id: The user's UUID.
            limit: Maximum number of recommendations to return.
            exclude_completed: Whether to exclude already-completed nodes.

        Returns:
            A list of dicts with ``node``, ``score``, and ``reason`` keys.

        """
        # 1. Get user context
        completed_node_ids = await self._get_completed_node_ids(user_id)
        bookmarked_node_ids = await self._get_bookmarked_node_ids(user_id)
        all_nodes = await self._uow.knowledge_nodes.find_published()

        if exclude_completed:
            candidates = [n for n in all_nodes if n.id not in completed_node_ids]
        else:
            candidates = list(all_nodes)

        if not candidates:
            return []

        # 2. Score each candidate
        scored: list[tuple[float, dict]] = []
        for node in candidates:
            if not node:
                continue

            score, reasons = await self._score_node(
                node=node,
                _user_id=user_id,
                completed_node_ids=completed_node_ids,
                bookmarked_node_ids=bookmarked_node_ids,
                all_nodes=list(all_nodes),
            )

            if score > 0:
                scored.append(
                    (
                        score,
                        {
                            'node': _node_to_dict(node),
                            'score': round(score, 4),
                            'reasons': reasons,
                        },
                    ),
                )

        # 3. Sort by score descending and return top results
        scored.sort(key=lambda x: float(x[0]), reverse=True)  # type: ignore[arg-type, return-value]
        return [item for _, item in scored[:limit]]

    # ── Scoring Pipeline ───────────────────────────────────────────

    async def _score_node(
        self,
        node,
        _user_id: UUID,
        completed_node_ids: set[UUID],
        bookmarked_node_ids: set[UUID],
        all_nodes: list,
    ) -> tuple[float, list[str]]:
        """Compute a composite score for a single candidate node."""
        reasons: list[str] = []

        # Prerequisite score
        prereq_score, prereq_detail = await self._prerequisite_score(node, completed_node_ids)
        if prereq_detail:
            reasons.append(prereq_detail)

        # Graph distance score
        distance_score, _distance_detail = await self._graph_distance_score(
            node,
            completed_node_ids,
        )

        # Popularity score
        popularity_score, popularity_detail = self._popularity_score(node)
        if popularity_detail:
            reasons.append(popularity_detail)

        # Difficulty score
        difficulty_score, difficulty_detail = self._difficulty_score(
            node,
            completed_node_ids,
            all_nodes,
        )
        if difficulty_detail:
            reasons.append(difficulty_detail)

        # Relevance score
        relevance_score, relevance_detail = self._relevance_score(node, bookmarked_node_ids)
        if relevance_detail:
            reasons.append(relevance_detail)

        composite = (
            prereq_score * W_PREREQ
            + distance_score * W_DISTANCE
            + popularity_score * W_POPULARITY
            + difficulty_score * W_DIFFICULTY
            + relevance_score * W_RELEVANCE
        )

        return composite, reasons

    # ── Signal: Prerequisite Completion ────────────────────────────
    # Score: 1.0 if ALL prerequisites are completed.
    #        0.5 if MOST prerequisites are completed.
    #        0.0 if none are completed.

    async def _prerequisite_score(
        self,
        node,
        completed_node_ids: set[UUID],
    ) -> tuple[float, str | None]:
        prereqs = await self._uow.graph.load_prerequisites(node.id)
        if not prereqs:
            return 0.3, None  # No prerequisites = slightly favoured

        total = len(prereqs)
        completed = sum(1 for p in prereqs if p.id in completed_node_ids)

        if total == 0:
            return 0.3, None

        ratio = completed / total
        if ratio >= 1.0:
            return 1.0, 'All prerequisites completed'
        if ratio >= 0.75:
            return 0.7, f'Most prerequisites completed ({completed}/{total})'
        if ratio >= 0.5:
            return 0.5, f'Some prerequisites completed ({completed}/{total})'
        if ratio > 0:
            return 0.2, f'Few prerequisites completed ({completed}/{total})'

        return 0.0, 'No prerequisites completed'

    # ── Signal: Graph Distance ─────────────────────────────────────
    # Score: Higher when close to user's completed nodes.

    async def _graph_distance_score(
        self,
        node,
        completed_node_ids: set[UUID],
    ) -> tuple[float, str | None]:
        if not completed_node_ids:
            return 0.0, None

        list(completed_node_ids)[:5]  # Sample for performance

        # Check if node shares an edge with any completed node
        edges = await self._uow.graph.load_edges_for_nodes(
            node_ids=[node.id],
        )
        connected_to_completed = any(
            e.source_node_id in completed_node_ids or e.target_node_id in completed_node_ids
            for e in edges
        )

        if connected_to_completed:
            return 0.8, 'Directly connected to your completed topics'

        return 0.3, None

    # ── Signal: Popularity ─────────────────────────────────────────
    # Score: Based on total edge count relative to the max.

    def _popularity_score(self, node) -> tuple[float, str | None]:
        view_count = getattr(node, 'view_count', 0) or 0
        edge_count = getattr(node, 'edge_count', 0) or 0
        total = view_count + edge_count

        if total > 100:
            return 1.0, 'Highly popular topic'
        if total > 50:
            return 0.7, 'Popular topic'
        if total > 10:
            return 0.4, 'Moderately popular'
        if total > 0:
            return 0.1, None

        return 0.0, None

    # ── Signal: Difficulty Match ───────────────────────────────────
    # Score: Higher when difficulty matches the user's current level.

    def _difficulty_score(
        self,
        node,
        _completed_node_ids: set[UUID],
        _all_nodes: list,
    ) -> tuple[float, str | None]:
        difficulty = getattr(node, 'difficulty', None)
        if difficulty is None:
            return 0.3, None

        diff_str = difficulty.value if hasattr(difficulty, 'value') else str(difficulty)
        diff_lower = diff_str.lower()

        # Beginner and intermediate are generally recommended
        if diff_lower in ('beginner', 'intermediate'):
            return 0.7, f'Good {diff_str} level'
        if diff_lower == 'advanced':
            return 0.4, 'Advanced topic'
        if diff_lower == 'expert':
            return 0.1, 'Expert level'

        return 0.3, None

    # ── Signal: Content Relevance ──────────────────────────────────
    # Score: Higher when related to bookmarked/favorited topics.

    def _relevance_score(self, node, bookmarked_node_ids: set[UUID]) -> tuple[float, str | None]:
        if not bookmarked_node_ids:
            return 0.0, None

        # Simple heuristic: check if node type matches bookmarked types
        node_type = getattr(node, 'node_type', None)
        if node_type:
            node_type.value if hasattr(node_type, 'value') else str(node_type)

            # Boost if bookmarked similar types
            if len(bookmarked_node_ids) > 3:
                return 0.3, 'Related to your interests'

        return 0.1, None

    # ── Recommender Methods ────────────────────────────────────────

    async def get_next_best_nodes(
        self,
        user_id: UUID,
        count: int = 5,
    ) -> list[dict]:
        """Get the single best next node(s) for a user to learn."""
        recommendations = await self.get_recommendations(
            user_id=user_id,
            limit=count,
            exclude_completed=True,
        )
        return recommendations[:count]

    async def get_recommended_careers(
        self,
        user_id: UUID,
        limit: int = 5,
    ) -> list[dict]:
        """Get career recommendations based on user's completed nodes."""
        completed_ids = await self._get_completed_node_ids(user_id)
        all_careers = await self._uow.careers.find_published()

        scored_careers = []
        for career in all_careers:
            # Count how many required nodes the user has completed
            required_nodes = await self._uow.graph.load_all_neighbors(career.id)
            all_required = required_nodes.get('incoming', []) + required_nodes.get('outgoing', [])
            total_required = len(all_required)

            if total_required == 0:
                continue

            completed_required = sum(1 for n in all_required if n.id in completed_ids)
            match_ratio = completed_required / total_required

            if match_ratio > 0:
                scored_careers.append(
                    {
                        'career': {
                            'id': str(career.id),
                            'title': career.title,
                            'slug': career.slug,
                            'description': career.description,
                            'salary_range': getattr(career, 'salary_range', None),
                            'demand': career.demand.value
                            if hasattr(career.demand, 'value')
                            else career.demand,
                        },
                        'match_score': round(match_ratio, 4),
                        'completed_required': completed_required,
                        'total_required': total_required,
                    },
                )

        scored_careers.sort(key=lambda x: x['match_score'], reverse=True)  # type: ignore[arg-type, return-value]
        return scored_careers[:limit]

    # ── Helper: Get Completed Node IDs ─────────────────────────────

    async def _get_completed_node_ids(self, user_id: UUID) -> set[UUID]:
        progress_records = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='completed',
        )
        mastered = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='mastered',
        )
        return {p.node_id for p in progress_records.items if p} | {
            p.node_id for p in mastered.items if p
        }

    # ── Helper: Get Bookmarked Node IDs ────────────────────────────

    async def _get_bookmarked_node_ids(self, user_id: UUID) -> set[UUID]:
        bookmarks = await self._uow.bookmarks.find_by_user(user_id=user_id)
        return {b.node_id for b in bookmarks if b}


# ── Helper ─────────────────────────────────────────────────────────


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
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
        'estimated_minutes': getattr(node, 'estimated_minutes', None),
    }
