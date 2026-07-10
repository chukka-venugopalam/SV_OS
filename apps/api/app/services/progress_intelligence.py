"""
Progress Intelligence — analytics and predictions for user learning progress.

Provides:
- ``next_best_node()`` — the optimal next concept to learn
- ``missing_prerequisites()`` — prerequisites the user hasn't completed
- ``weak_topics()`` — topics where the user needs reinforcement
- ``estimated_completion()`` — time to complete a given goal
- ``completion_forecast()`` — projected completion dates
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from structlog.stdlib import get_logger

from app.repositories import UnitOfWork
from app.services.recommendation_engine import RecommendationEngine

logger = get_logger(__name__)


class ProgressIntelligence:
    """Advanced progress analytics and predictions.

    Uses the recommendation engine for next-best-node suggestions
    and adds analytics on top of user progress data.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._recommender = RecommendationEngine(uow)

    # ── Next Best Node ─────────────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def next_best_node(self, user_id: UUID) -> dict | None:
        """Determine the single best next node for a user to learn.

        Uses the recommendation engine and returns the highest-scored
        node that the user hasn't started or completed.

        Returns:
            A dict with ``node`` and explanation, or ``None`` if no
            suitable node is found.
        """
        recommendations = await self._recommender.get_recommendations(
            user_id=user_id,
            limit=1,
            exclude_completed=True,
        )
        if recommendations:
            return recommendations[0]
        return None

    # ── Missing Prerequisites ─────────────────────────────────────
    # Time: O(V * D) worst case  |  Space: O(V)

    async def missing_prerequisites(
        self,
        user_id: UUID,
        goal_node_id: UUID | None = None,
    ) -> list[dict]:
        """Find prerequisites that the user hasn't completed.

        If a ``goal_node_id`` is provided, only checks prerequisites
        of that goal.  Otherwise, checks all published nodes.

        Returns:
            A list of prerequisite node dicts that haven't been completed.
        """
        completed_ids = await self._get_completed_ids(user_id)
        missing: list[dict] = []

        if goal_node_id:
            # Check prerequisites of the specific goal
            prereqs = await self._uow.graph.load_prerequisites(goal_node_id)
            for prereq in prereqs:
                if prereq.id not in completed_ids:
                    missing.append(_node_to_dict(prereq, missing=True))
        else:
            # Check all published nodes

            all_nodes = await self._uow.knowledge_nodes.find_published()
            for node in all_nodes:
                prereqs = await self._uow.graph.load_prerequisites(node.id)
                for prereq in prereqs:
                    if prereq.id not in completed_ids and not any(
                        m['id'] == str(prereq.id) for m in missing
                    ):
                        missing.append(_node_to_dict(prereq, missing=True))

        return missing

    # ── Weak Topics ────────────────────────────────────────────────
    # Time: O(V)  |  Space: O(V)

    async def weak_topics(
        self,
        user_id: UUID,
        limit: int = 10,
    ) -> list[dict]:
        """Identify topics where the user needs reinforcement.

        Weak topics are:
        - Nodes that the user has started but not completed (stale)
        - Nodes with many dependents that the user hasn't learned
        - Advanced topics that depend on beginner topics the user has learned

        Returns:
            A list of weak topic node dicts with a ``weakness_score``.
        """
        all_progress = await self._uow.user_progress.find_by_user(
            user_id=user_id,
        )

        stale_nodes: list[dict] = []

        for progress in all_progress.items:
            if not progress:
                continue
            # Nodes in 'learning' status for more than 7 days are stale
            if progress.status == 'learning':
                updated_at = progress.updated_at
                if not updated_at:
                    continue
                if isinstance(updated_at, datetime):
                    if updated_at.tzinfo is None:
                        updated_at = updated_at.replace(tzinfo=UTC)
                else:
                    updated_at = datetime.fromisoformat(str(updated_at).replace('Z', '+00:00'))

                days_since_update = (datetime.now(UTC) - updated_at).days
                if days_since_update > 7:
                    node = await self._uow.knowledge_nodes.get_by_id(progress.node_id)
                    if node:
                        stale_nodes.append(
                            {
                                'node': _node_to_dict(node),
                                'weakness_score': round(min(days_since_update / 30, 1.0), 3),
                                'reason': f'Started but not updated in {days_since_update} days',
                            }
                        )

        # Sort by weakness score descending
        stale_nodes.sort(key=lambda x: x['weakness_score'], reverse=True)

        return stale_nodes[:limit]

    # ── Estimated Completion ──────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def estimated_completion(
        self,
        user_id: UUID,
        goal_node_id: UUID,
    ) -> dict:
        """Estimate the time to complete a specific goal.

        Considers:
        - Number of missing prerequisites
        - Difficulty of remaining nodes
        - User's historical learning pace

        Returns:
            A dict with estimated minutes, hours, days, and pace info.
        """
        # Get missing prerequisites for the goal
        missing = await self.missing_prerequisites(
            user_id=user_id,
            goal_node_id=goal_node_id,
        )

        # Get user's learning pace (completed nodes / time)
        user_pace = await self._get_user_pace(user_id)

        # Estimate total minutes
        total_minutes = 0
        for node_data in missing:
            difficulty = node_data.get('difficulty', 'intermediate')
            estimated = {'beginner': 30, 'intermediate': 60, 'advanced': 120, 'expert': 180}
            total_minutes += estimated.get(difficulty.lower(), 60)

        # Apply user pace multiplier
        if user_pace > 0:
            pace_multiplier = 60.0 / user_pace  # Normalize to our estimates
            adjusted_minutes = total_minutes * pace_multiplier
        else:
            adjusted_minutes = total_minutes

        return {
            'goal_node_id': str(goal_node_id),
            'missing_prerequisites': len(missing),
            'estimated_minutes': round(adjusted_minutes),
            'estimated_hours': round(adjusted_minutes / 60, 1),
            'estimated_days': round(adjusted_minutes / 60 / 2, 1),  # Assuming 2hr/day
            'user_historical_pace_minutes_per_node': round(user_pace, 1),
        }

    # ── Completion Forecast ───────────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def completion_forecast(self, user_id: UUID) -> dict:
        """Generate a completion forecast for the user.

        Projects completion dates based on current pace and remaining
        nodes across all goals.

        Returns:
            A dict with overall stats and projected completion.
        """
        # Get top recommendations as proxy for active goals
        recommendations = await self._recommender.get_recommendations(
            user_id=user_id,
            limit=5,
            exclude_completed=True,
        )

        completed_ids = await self._get_completed_ids(user_id)
        all_nodes = await self._uow.knowledge_nodes.find_published()

        total_remaining = len(all_nodes) - len(completed_ids)
        user_pace = await self._get_user_pace(user_id)

        # Project completion
        if user_pace > 0 and total_remaining > 0:
            estimated_days = (total_remaining * user_pace) / 60 / 2  # 2hr/day
        else:
            estimated_days = 0

        now = datetime.now(UTC)
        projected_date = now + timedelta(days=estimated_days) if estimated_days > 0 else None

        return {
            'total_nodes': len(all_nodes),
            'completed_nodes': len(completed_ids),
            'remaining_nodes': total_remaining,
            'completion_percentage': round(len(completed_ids) / len(all_nodes) * 100, 1)
            if all_nodes
            else 0,
            'user_pace_minutes_per_node': round(user_pace, 1),
            'estimated_days_to_completion': round(estimated_days, 1),
            'projected_completion_date': projected_date.isoformat() if projected_date else None,
            'next_recommendations': [
                {'node': r['node'], 'score': r['score']} for r in recommendations
            ],
        }

    # ── User Pace Calculation ─────────────────────────────────────

    async def _get_user_pace(self, user_id: UUID) -> float:
        """Calculate the user's average learning pace (minutes per node)."""
        completed = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='completed',
        )
        mastered = await self._uow.user_progress.find_by_user(
            user_id=user_id,
            status='mastered',
        )

        all_done = list(completed.items) + list(mastered.items)

        if len(all_done) < 2:
            return 60.0  # Default: 60 minutes per node

        # Calculate time span between first and last completion
        times = [
            p.updated_at
            if isinstance(p.updated_at, datetime)
            else datetime.fromisoformat(str(p.updated_at).replace('Z', '+00:00'))
            for p in all_done
            if p and p.updated_at
        ]

        if len(times) < 2:
            return 60.0

        times.sort()
        span_hours = (times[-1] - times[0]).total_seconds() / 3600

        if span_hours < 1:
            return 60.0

        minutes_per_node = (span_hours * 60) / len(all_done)
        return max(5.0, minutes_per_node)  # Minimum 5 minutes per node

    # ── Helper ────────────────────────────────────────────────────

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


# ── Helper ─────────────────────────────────────────────────────────


def _node_to_dict(node, missing: bool = False) -> dict:
    result = {
        'id': str(node.id),
        'slug': node.slug,
        'title': node.title,
        'description': node.description,
        'node_type': node.node_type.value if hasattr(node.node_type, 'value') else node.node_type,
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else node.difficulty,
    }
    if missing:
        result['is_missing_prerequisite'] = True
    return result
