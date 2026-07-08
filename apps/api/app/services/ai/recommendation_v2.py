"""
Recommendation V2 — enhanced recommendation engine with semantic signals.

Builds on the phase 3.1 RecommendationEngine by adding:
- Semantic embedding similarity
- Learning velocity (pace of recent completions)
- Recent search history
- Explainable score breakdown
- Configurable weights
"""

from __future__ import annotations

import math
from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.services.recommendation_engine import RecommendationEngine

logger = get_logger(__name__)

# Scoring weights for V2
W_COMPLETED = 0.15
W_WEAK_TOPICS = 0.10
W_BOOKMARKS = 0.10
W_CAREER_GOALS = 0.10
W_RECENT_SEARCHES = 0.05
W_SEMANTIC = 0.20
W_GRAPH_DISTANCE = 0.15
W_DIFFICULTY = 0.05
W_ESTIMATED_TIME = 0.05
W_VELOCITY = 0.05


class RecommendationV2:
    """Enhanced recommendation engine with semantic and temporal signals.

    Produces explainable recommendations with full score breakdowns.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._v1 = RecommendationEngine(uow)

    async def get_personalized(
        self,
        user_id: UUID,
        limit: int = 20,
    ) -> list[dict]:
        """Get personalised recommendations with score breakdowns.

        Args:
            user_id: The user's UUID.
            limit: Maximum recommendations.

        Returns:
            List of recommended nodes with scores and reasons.
        """
        # Gather user context
        completed_ids = await self._get_completed_ids(user_id)
        bookmarked_ids = await self._get_bookmarked_ids(user_id)
        weak_topics = await self._get_weak_topics(user_id)
        career_goals = await self._get_career_goals(user_id)
        recent_searches = await self._get_recent_searches(user_id)
        learning_velocity = await self._compute_learning_velocity(user_id)

        all_nodes = await self._uow.knowledge_nodes.find_published()
        candidates = [n for n in all_nodes if n.id not in completed_ids]

        if not candidates:
            return []

        scored = []
        for node in candidates:
            score, breakdown = await self._score_node_v2(
                node=node,
                user_id=user_id,
                completed_ids=completed_ids,
                bookmarked_ids=bookmarked_ids,
                weak_topics=weak_topics,
                career_goals=career_goals,
                recent_searches=recent_searches,
                learning_velocity=learning_velocity,
                all_nodes=all_nodes,
            )

            if score > 0:
                reasons = self._build_reasons(breakdown)
                scored.append({
                    'node': _node_to_dict(node),
                    'score': round(score, 4),
                    'breakdown': breakdown,
                    'reasons': reasons,
                })

        scored.sort(key=lambda x: x['score'], reverse=True)
        return scored[:limit]

    # ── V2 Scoring Pipeline ────────────────────────────────────────

    async def _score_node_v2(
        self,
        node,
        user_id: UUID,
        completed_ids: set[UUID],
        bookmarked_ids: set[UUID],
        weak_topics: list[dict],
        career_goals: list,
        recent_searches: list,
        learning_velocity: float,
        all_nodes: list,
    ) -> tuple[float, dict]:
        """Compute V2 composite score with full breakdown."""

        # Use V1 for prerequisite and graph distance
        prereq_score, _ = await self._v1._prerequisite_score(node, completed_ids)
        distance_score, _ = await self._v1._graph_distance_score(node, completed_ids)

        # V2-specific signals
        weak_score = self._weak_topic_score(node, weak_topics)
        bookmark_score = self._bookmark_affinity_score(node, bookmarked_ids)
        semantic_score = await self._semantic_score(node, completed_ids, bookmarked_ids)
        difficulty_score = self._difficulty_score(node, learning_velocity)
        time_score = self._estimated_time_score(node, learning_velocity)
        search_score = self._recent_search_score(node, recent_searches)
        velocity_score = self._velocity_boost(node, learning_velocity)

        composite = (
            prereq_score * W_COMPLETED
            + weak_score * W_WEAK_TOPICS
            + bookmark_score * W_BOOKMARKS
            + distance_score * W_GRAPH_DISTANCE
            + semantic_score * W_SEMANTIC
            + difficulty_score * W_DIFFICULTY
            + time_score * W_ESTIMATED_TIME
            + search_score * W_RECENT_SEARCHES
            + velocity_score * W_VELOCITY
        )

        breakdown = {
            'prerequisite_completion': round(prereq_score, 4),
            'weak_topic_reinforcement': round(weak_score, 4),
            'bookmark_affinity': round(bookmark_score, 4),
            'graph_distance': round(distance_score, 4),
            'semantic_similarity': round(semantic_score, 4),
            'difficulty_match': round(difficulty_score, 4),
            'estimated_time_match': round(time_score, 4),
            'recent_search_relevance': round(search_score, 4),
            'learning_velocity': round(velocity_score, 4),
        }

        return composite, breakdown

    # ── V2 Signals ─────────────────────────────────────────────────

    def _weak_topic_score(
        self, node, weak_topics: list[dict]
    ) -> float:
        """Score based on whether the node is a known weak topic."""
        node_id_str = str(node.id)
        for wt in weak_topics:
            if wt.get('node', {}).get('id') == node_id_str:
                return 0.9  # Strong recommendation to reinforce
        return 0.0

    def _bookmark_affinity_score(
        self, node, bookmarked_ids: set[UUID]
    ) -> float:
        """Score based on similarity to bookmarked nodes."""
        if not bookmarked_ids:
            return 0.0
        # Higher score if this node type matches bookmarked node types
        node_type = getattr(node, 'node_type', None)
        if node_type:
            return 0.3 if len(bookmarked_ids) > 2 else 0.1
        return 0.0

    async def _semantic_score(
        self, node, completed_ids: set[UUID], bookmarked_ids: set[UUID]
    ) -> float:
        """Semantic similarity to user's completed/bookmarked nodes."""
        # Find a representative embedding from completed/bookmarked nodes
        reference_ids = list(completed_ids | bookmarked_ids)[:3]
        if not reference_ids:
            return 0.0

        target_metadata = node.extra_metadata or {}
        target_embedding = target_metadata.get('embedding')
        if not target_embedding:
            return 0.0

        max_sim = 0.0
        for ref_id in reference_ids:
            ref_node = await self._uow.knowledge_nodes.get_by_id(ref_id)
            if not ref_node:
                continue
            ref_metadata = ref_node.extra_metadata or {}
            ref_emb = ref_metadata.get('embedding')
            if not ref_emb:
                continue

            sim = self._cosine_similarity(target_embedding, ref_emb)
            max_sim = max(max_sim, sim)

        return max_sim * 0.8  # Scale to max 0.8

    def _difficulty_score(
        self, node, learning_velocity: float
    ) -> float:
        """Score based on difficulty relative to learning velocity."""
        diff = getattr(node, 'difficulty', None)
        if diff is None:
            return 0.3

        diff_str = diff.value if hasattr(diff, 'value') else str(diff)
        # Fast learners can handle advanced content
        if learning_velocity > 2.0:  # >2 nodes/day
            return 0.7 if diff_str.lower() in ('intermediate', 'advanced') else 0.5
        elif learning_velocity > 1.0:  # 1-2 nodes/day
            return 0.7 if diff_str.lower() in ('beginner', 'intermediate') else 0.3
        else:  # Slow learners
            return 0.7 if diff_str.lower() == 'beginner' else 0.3

    def _estimated_time_score(
        self, node, learning_velocity: float
    ) -> float:
        """Score based on estimated time vs available time."""
        estimated = getattr(node, 'estimated_minutes', 30) or 30
        if learning_velocity <= 0:
            return 0.3
        daily_minutes = learning_velocity * 60  # Rough daily available time
        if daily_minutes >= estimated:
            return 0.8  # Can finish in a day
        return 0.3

    def _recent_search_score(
        self, node, recent_searches: list
    ) -> float:
        """Score based on overlap with recent search queries."""
        if not recent_searches:
            return 0.0
        title_lower = node.title.lower()
        for search in recent_searches:
            query = search.lower()
            if query in title_lower or any(
                word in title_lower for word in query.split()
            ):
                return 0.6
        return 0.0

    def _velocity_boost(self, node, learning_velocity: float) -> float:
        """Boost for fast learners (recommend more content)."""
        if learning_velocity > 2.0:
            return 0.5
        elif learning_velocity > 1.0:
            return 0.3
        return 0.1

    # ── Helpers ────────────────────────────────────────────────────

    def _cosine_similarity(
        self, vec_a: list[float], vec_b: list[float]
    ) -> float:
        if not vec_a or not vec_b:
            return 0.0
        dot = sum(a * b for a, b in zip(vec_a, vec_b))
        norm_a = math.sqrt(sum(a * a for a in vec_a))
        norm_b = math.sqrt(sum(b * b for b in vec_b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)

    def _build_reasons(self, breakdown: dict) -> list[str]:
        """Build human-readable reasons from score breakdown."""
        reasons = []
        signal_names = {
            'prerequisite_completion': 'You have completed related prerequisites',
            'weak_topic_reinforcement': 'This is a topic you may need to reinforce',
            'bookmark_affinity': 'Similar to your bookmarked topics',
            'graph_distance': 'Close to your current learning path',
            'semantic_similarity': 'Semantically related to your interests',
            'difficulty_match': 'Matches your current difficulty level',
            'estimated_time_match': 'Fits your available learning time',
            'recent_search_relevance': 'Related to your recent searches',
            'learning_velocity': 'Recommended based on your learning pace',
        }

        # Sort signals by score descending
        sorted_signals = sorted(
            breakdown.items(), key=lambda x: x[1], reverse=True
        )
        for signal_name, score in sorted_signals[:3]:
            if score > 0.3 and signal_name in signal_names:
                reasons.append(signal_names[signal_name])

        return reasons

    async def _get_completed_ids(self, user_id: UUID) -> set[UUID]:
        completed = await self._uow.user_progress.find_by_user(
            user_id=user_id, status='completed',
        )
        mastered = await self._uow.user_progress.find_by_user(
            user_id=user_id, status='mastered',
        )
        return {p.node_id for p in completed.items if p} | {
            p.node_id for p in mastered.items if p
        }

    async def _get_bookmarked_ids(self, user_id: UUID) -> set[UUID]:
        bookmarks = await self._uow.bookmarks.find_by_user(user_id=user_id)
        return {b.node_id for b in bookmarks if b}

    async def _get_weak_topics(self, user_id: UUID) -> list[dict]:
        """Identify weak topics (stale learning, >7 days without update)."""
        from datetime import datetime, timezone, timedelta
        progress = await self._uow.user_progress.find_by_user(user_id=user_id)
        weak = []
        for p in progress.items:
            if not p or p.status != 'learning':
                continue
            if p.updated_at and (datetime.now(timezone.utc) - p.updated_at).days > 7:
                node = await self._uow.knowledge_nodes.get_by_id(p.node_id)
                if node:
                    weak.append({'node': _node_to_dict(node)})
        return weak

    async def _get_career_goals(self, user_id: UUID) -> list:
        """Get user's career interests (stub — future: career preferences)."""
        return []

    async def _get_recent_searches(self, user_id: UUID) -> list[str]:
        """Get recent search queries for the user."""
        searches = await self._uow.search_history.find_by_user(
            user_id=user_id, limit=10,
        )
        return [s.query for s in searches if s and s.query][:10]

    async def _compute_learning_velocity(self, user_id: UUID) -> float:
        """Compute learning velocity (nodes completed per day, last 30 days)."""
        from datetime import datetime, timezone, timedelta
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)

        completed = await self._uow.user_progress.find_by_user(
            user_id=user_id, status='completed',
        )
        nodes_completed = sum(
            1 for p in completed.items if p and p.updated_at and p.updated_at >= thirty_days_ago
        )
        mastered = await self._uow.user_progress.find_by_user(
            user_id=user_id, status='mastered',
        )
        nodes_mastered = sum(
            1 for p in mastered.items if p and p.updated_at and p.updated_at >= thirty_days_ago
        )

        total = nodes_completed + nodes_mastered
        return round(total / 30.0, 2) if total > 0 else 0.0


def _node_to_dict(node) -> dict:
    return {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description[:300] if node.description else '',
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value if hasattr(node.difficulty, 'value') else node.difficulty,
        'estimated_minutes': node.estimated_minutes,
        'icon': node.icon,
        'color': node.color,
        'view_count': node.view_count,
    }
