"""Context Engine — gathers comprehensive context before every AI call.

Collects from:
- Knowledge graph (current node, prerequisites, dependents)
- Semantic search (related concepts)
- Graph traversal (neighbors)
- User progress (completed, in-progress, weak topics)
- Bookmarks and favorites
- Activity feed (recent activity)
- Recommendations (personalised)
- Career goals and learning path
- AI memory (persistent user context)

All context is formatted for injection into LLM prompts.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

from app.services.activity_feed import ActivityFeedService
from app.services.ai.semantic_search import SemanticSearchService
from app.services.progress_intelligence import ProgressIntelligence
from app.services.recommendation_engine import RecommendationEngine

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

MAX_CONTEXT_NODES = 10


class ContextEngine:
    """Gathers all relevant context for AI prompt injection.

    The ``build_context()`` method returns a structured dict that can
    be serialised into prompt system messages.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._progress = ProgressIntelligence(uow)
        self._semantic = SemanticSearchService(uow)
        self._recommender = RecommendationEngine(uow)
        self._activity = ActivityFeedService(uow)

    async def build_context(
        self,
        user_id: UUID | None = None,
        node_slug: str | None = None,
        include_progress: bool = True,
        include_recommendations: bool = True,
        _include_graph: bool = True,
        max_nodes: int = MAX_CONTEXT_NODES,
    ) -> dict:
        """Build comprehensive context for AI prompt injection.

        Args:
            user_id: Optional user ID for personalisation.
            node_slug: Optional specific node to focus on.
            include_progress: Include user progress data.
            include_recommendations: Include recommendations.
            include_graph: Include graph neighborhood data.
            max_nodes: Max nodes per section.

        Returns:
            Dict with sections: user, graph, progress, activity,
            recommendations, memory, career, projects.

        """
        context: dict = {
            'knowledge_graph': {},
            'user_progress': {},
            'activity': [],
            'recommendations': [],
            'career': [],
            'projects': [],
            'ai_memory': [],
        }

        # 1. Knowledge graph context
        if node_slug:
            node = await self._uow.knowledge_nodes.find_by_slug(node_slug)
            if node:
                prereqs = await self._uow.graph.load_prerequisites(node.id)
                dependents = await self._uow.graph.load_dependents(node.id)
                neighbors = await self._uow.graph.load_all_neighbors(node.id)

                context['knowledge_graph'] = {
                    'current_node': _node_summary(node),
                    'prerequisites': [_node_summary(n) for n in prereqs[:max_nodes]],
                    'dependents': [_node_summary(n) for n in dependents[:max_nodes]],
                    'related_nodes': [
                        _node_summary(n) for n in neighbors.get('outgoing', [])[:max_nodes]
                    ],
                }

        # 2. User progress
        if user_id and include_progress:
            try:
                forecast = await self._progress.completion_forecast(user_id)
                weak = await self._progress.weak_topics(user_id)
                next_node = await self._progress.next_best_node(user_id)
                context['user_progress'] = {
                    'completion_percentage': forecast.get('completion_percentage', 0),
                    'completed_nodes': forecast.get('completed_nodes', 0),
                    'remaining_nodes': forecast.get('remaining_nodes', 0),
                    'weak_topics': [w.get('node', {}).get('title', '') for w in weak[:3]],
                    'next_recommended_node': next_node.get('node', {}).get('title')
                    if next_node
                    else None,
                }
            except Exception as exc:
                logger.warning('context_progress_error', error=str(exc))

        # 3. Activity
        if user_id:
            try:
                feed = await self._activity.get_feed(user_id, page=1, per_page=5)
                context['activity'] = [
                    {
                        'type': a['activity_type'],
                        'title': a['title'],
                        'description': a['description'],
                    }
                    for a in feed.get('items', [])[:5]
                ]
            except Exception as exc:
                logger.warning('context_activity_error', error=str(exc))

        # 4. Recommendations
        if user_id and include_recommendations:
            try:
                recs = await self._recommender.get_recommendations(
                    user_id=user_id,
                    limit=5,
                    exclude_completed=True,
                )
                context['recommendations'] = [
                    {
                        'title': r.get('node', {}).get('title', ''),
                        'score': r.get('score', 0),
                        'reasons': r.get('reasons', []),
                    }
                    for r in recs[:5]
                ]
            except Exception as exc:
                logger.warning('context_recs_error', error=str(exc))

        # 5. AI Memory
        if user_id:
            try:
                from sqlalchemy import select

                from app.models.ai_memory import AIMemory

                stmt = (
                    select(AIMemory.memory_type, AIMemory.key, AIMemory.value)  # type: ignore[assignment]
                    .where(AIMemory.user_id == user_id, AIMemory.is_deleted.isnot(True))
                    .order_by(AIMemory.confidence.desc())
                    .limit(10)
                )
                rows = (await self._uow.session.execute(stmt)).all()
                context['ai_memory'] = [
                    {'type': r.memory_type, 'key': r.key, 'value': r.value} for r in rows
                ]
            except Exception:
                pass

        # 6. Career goals
        if user_id:
            try:
                from sqlalchemy import select

                from app.models.ai_memory import AIMemory

                stmt = select(AIMemory.value).where(  # type: ignore[assignment]
                    AIMemory.user_id == user_id,
                    AIMemory.memory_type == 'career_goal',
                    AIMemory.is_deleted.isnot(True),
                )
                rows = (await self._uow.session.execute(stmt)).all()
                context['career'] = [r.value for r in rows] if rows else []
            except Exception:
                pass

        return context

    async def build_node_context(
        self,
        node_slug: str,
        _max_depth: int = 2,
    ) -> dict:
        """Build focused context around a specific knowledge node."""
        return await self.build_context(
            user_id=None,
            node_slug=node_slug,
            include_progress=False,
            include_recommendations=False,
            _include_graph=True,
        )


def _node_summary(node) -> dict:
    return {
        'slug': node.slug,
        'title': node.title,
        'node_type': node.node_type.value
        if hasattr(node.node_type, 'value')
        else str(node.node_type),
        'difficulty': node.difficulty.value
        if hasattr(node.difficulty, 'value')
        else str(node.difficulty),
    }
