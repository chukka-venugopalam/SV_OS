"""Recommendation Engine — deterministic next-step recommendations.

Priority rules (highest to lowest):
1. Urgent Review — items due for spaced repetition review
2. Reinforce Weak Knowledge — items with lowest confidence
3. Continue Learning Streak — items connected to current learning session
4. Career Requirement — items required for target career
5. Unlock Maximum Nodes — items that unlock the most downstream content
6. Highest Dependency Value — items with the most dependents
7. Shortest Estimated Time — quickest to complete
8. Easiest First — lowest difficulty first

NO scores. NO weights. NO ML. NO AI.
Each recommendation includes an explanation of WHY it exists.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from app.engines.base import EngineBase, EngineDependency, EngineHealth


@dataclass
class Recommendation:
    """A single deterministic recommendation with explanation."""
    node_id: str
    title: str
    slug: str
    node_type: str
    difficulty: str
    priority: int           # 1 (highest) to 8 (lowest)
    priority_label: str     # Human-readable priority name
    reason: str             # WHY this item is recommended
    estimated_minutes: int = 30
    icon: str | None = None
    color: str | None = None


# ── Priority Order (1 = highest) ──────────────────────────────────

PRIORITY_URGENT_REVIEW = 1
PRIORITY_REINFORCE_WEAK = 2
PRIORITY_CONTINUE_STREAK = 3
PRIORITY_CAREER_REQUIREMENT = 4
PRIORITY_UNLOCK_MAX_NODES = 5
PRIORITY_HIGHEST_DEPENDENCY = 6
PRIORITY_SHORTEST_TIME = 7
PRIORITY_EASIEST_FIRST = 8

PRIORITY_LABELS = {
    1: 'Urgent Review',
    2: 'Reinforce Weak Knowledge',
    3: 'Continue Learning Streak',
    4: 'Career Requirement',
    5: 'Unlock Maximum Nodes',
    6: 'Highest Dependency Value',
    7: 'Shortest Estimated Time',
    8: 'Easiest First',
}


class RecommendationEngine(EngineBase):
    """Recommendation Engine — deterministic next-step recommendations.

    Uses ONLY priority-based deterministic rules. No scores, weights, ML, or AI.

    Public Interface:
        recommend_next, recommend_batch, recommend_daily, recommend_weekly,
        recommend_by_goal, recommend_by_skill, recommend_by_career,
        recommend_after_assessment, recommend_after_import, recommend_after_revision
    """

    def __init__(
        self,
        graph_engine: Any | None = None,
        state_engine: Any | None = None,
        dependency_engine: Any | None = None,
        knowledge_engine: Any | None = None,
        traversal_engine: Any | None = None,
    ) -> None:
        super().__init__()
        self._graph = graph_engine
        self._state = state_engine
        self._dependency = dependency_engine
        self._knowledge = knowledge_engine
        self._traversal = traversal_engine

        # In-memory store for recommendations (no persistence)
        self._recommendation_history: dict[str, list[dict]] = {}  # user_id -> recommendations

    def _default_name(self) -> str:
        return 'recommendation'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='graph', required=True, description='Graph engine for node data'),
            EngineDependency(engine_name='state', required=False, description='State engine for learner state'),
            EngineDependency(engine_name='dependency', required=False, description='Dependency engine for prerequisites'),
            EngineDependency(engine_name='traversal', required=False, description='Traversal engine for graph algorithms'),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._recommendation_history.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Recommendation engine is operational',
            details={'total_recommendations': sum(len(v) for v in self._recommendation_history.values())},
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        if self._state is None:
            issues.append('No StateEngine reference set — career recommendations unavailable')
        if self._dependency is None:
            issues.append('No DependencyEngine reference set — dependency value unavailable')
        return issues

    # ═══════════════════════════════════════════════════════════════
    # Public API
    # ═══════════════════════════════════════════════════════════════

    async def recommend_next(self, user_id: UUID, limit: int = 5) -> list[dict]:
        """Get the single best next recommendation for a user.

        Returns the highest-priority available recommendation.
        """
        batch = await self.recommend_batch(user_id, limit=limit)
        return batch[:limit]

    async def recommend_batch(self, user_id: UUID, limit: int = 20) -> list[dict]:
        """Get a batch of recommendations sorted by priority.

        Runs all 8 priority rules and merges results in priority order.
        """
        recommendations: list[Recommendation] = []

        # Gather candidates from all priority rules
        candidates = await self._gather_all_candidates(user_id)

        # Sort by priority (ascending — 1 is highest)
        candidates.sort(key=lambda r: (r.priority, r.estimated_minutes))

        # Deduplicate by node_id
        seen: set[str] = set()
        unique: list[Recommendation] = []
        for rec in candidates:
            if rec.node_id not in seen:
                seen.add(rec.node_id)
                unique.append(rec)

        # Convert to dicts
        result = [self._rec_to_dict(r) for r in unique[:limit]]

        # Store in history
        self._recommendation_history.setdefault(str(user_id), []).extend(result)

        # Publish event
        await self.publish_event(
            'recommendation.generated.v1',
            {'user_id': str(user_id), 'count': len(result), 'recommendations': [r['node_id'] for r in result]},
            correlation_id=str(user_id),
        )

        return result

    async def recommend_daily(self, user_id: UUID, limit: int = 10) -> list[dict]:
        """Get daily recommendations — focuses on review and weak knowledge.

        Uses priorities 1 (Urgent Review) and 2 (Reinforce Weak Knowledge).
        """
        recommendations: list[Recommendation] = []
        candidates = await self._gather_all_candidates(user_id)

        # Only priorities 1 and 2 for daily digest
        daily = [r for r in candidates if r.priority <= 2]
        daily.sort(key=lambda r: (r.priority, r.estimated_minutes))

        seen: set[str] = set()
        for rec in daily:
            if rec.node_id not in seen:
                seen.add(rec.node_id)
                recommendations.append(rec)

        return [self._rec_to_dict(r) for r in recommendations[:limit]]

    async def recommend_weekly(self, user_id: UUID, limit: int = 20) -> list[dict]:
        """Get weekly recommendations — broader scope including career and unlock goals.

        Uses priorities 1-5 (adds career and unlock considerations).
        """
        recommendations: list[Recommendation] = []
        candidates = await self._gather_all_candidates(user_id)

        weekly = [r for r in candidates if r.priority <= 5]
        weekly.sort(key=lambda r: (r.priority, r.estimated_minutes))

        seen: set[str] = set()
        for rec in weekly:
            if rec.node_id not in seen:
                seen.add(rec.node_id)
                recommendations.append(rec)

        return [self._rec_to_dict(r) for r in recommendations[:limit]]

    async def recommend_by_goal(self, user_id: UUID, goal_node_id: UUID, limit: int = 10) -> list[dict]:
        """Get recommendations toward a specific goal node.

        Finds the dependency chain toward the goal and recommends the next
        uncompleted prerequisite.
        """
        recommendations: list[Recommendation] = []

        if self._traversal is None:
            return []

        chain = await self._traversal.dependency_chain(goal_node_id, max_depth=5)
        if not chain:
            return []

        # Flatten chain (level 0 = direct prerequisites)
        prereq_ids: list[str] = []
        for level in chain:
            for item in level:
                nid = item.get('node_id', '')
                if nid and nid not in prereq_ids:
                    prereq_ids.append(nid)

        for nid in prereq_ids[:limit]:
            if self._graph:
                node = await self._graph.get_node(UUID(nid))
                if node:
                    recommendations.append(Recommendation(
                        node_id=str(nid),
                        title=node.get('title', ''),
                        slug=node.get('slug', ''),
                        node_type=node.get('node_type', ''),
                        difficulty=node.get('difficulty', 'beginner'),
                        priority=PRIORITY_CAREER_REQUIREMENT,
                        priority_label='Goal Prerequisite',
                        reason=f'Prerequisite for your goal: {node.get("title", "")}',
                        estimated_minutes=30,
                    ))

        return [self._rec_to_dict(r) for r in recommendations[:limit]]

    async def recommend_by_skill(self, skill_name: str, limit: int = 10) -> list[dict]:
        """Get recommendations for nodes that teach a specific skill."""
        if self._knowledge is None:
            return []

        # Search content index for the skill
        if hasattr(self._knowledge, 'search_content'):
            results = await self._knowledge.search_content(skill_name, limit=limit)
            return results
        return []

    async def recommend_by_career(self, career_node_id: UUID, limit: int = 10) -> list[dict]:
        """Get recommendations for nodes required by a career."""
        recommendations: list[Recommendation] = []

        if self._traversal is None:
            return []

        chain = await self._traversal.dependency_chain(career_node_id, max_depth=5)

        for level in chain:
            for item in level:
                nid = item.get('node_id', '')
                if self._graph:
                    node = await self._graph.get_node(UUID(nid))
                    if node:
                        recommendations.append(Recommendation(
                            node_id=str(nid),
                            title=node.get('title', ''),
                            slug=node.get('slug', ''),
                            node_type=node.get('node_type', ''),
                            difficulty=node.get('difficulty', 'beginner'),
                            priority=PRIORITY_CAREER_REQUIREMENT,
                            priority_label='Career Requirement',
                            reason=f'Required for career: {node.get("title", "")}',
                            estimated_minutes=30,
                        ))

        return [self._rec_to_dict(r) for r in recommendations[:limit]]

    async def recommend_after_assessment(self, user_id: UUID, assessment_results: dict) -> list[dict]:
        """Get recommendations based on assessment performance.

        Recommends nodes where the learner scored poorly for reinforcement.
        """
        recommendations: list[Recommendation] = []
        failed_nodes = assessment_results.get('failed_node_ids', [])

        for nid_str in failed_nodes:
            if self._graph:
                node = await self._graph.get_node(UUID(nid_str))
                if node:
                    recommendations.append(Recommendation(
                        node_id=str(nid_str),
                        title=node.get('title', ''),
                        slug=node.get('slug', ''),
                        node_type=node.get('node_type', ''),
                        difficulty=node.get('difficulty', 'beginner'),
                        priority=PRIORITY_REINFORCE_WEAK,
                        priority_label='Reinforce Weak Knowledge',
                        reason=f'Assessment shows weakness in "{node.get("title", "")}"',
                        estimated_minutes=30,
                    ))

        return [self._rec_to_dict(r) for r in recommendations]

    async def recommend_after_import(self, new_node_ids: list[str], limit: int = 10) -> list[dict]:
        """Get recommendations for newly imported content.

        Recommends imported nodes that are introductory or foundational.
        """
        recommendations: list[Recommendation] = []

        for nid_str in new_node_ids[:limit]:
            if self._graph:
                node = await self._graph.get_node(UUID(nid_str))
                if node and node.get('difficulty') in ('beginner', 'intermediate'):
                    recommendations.append(Recommendation(
                        node_id=str(nid_str),
                        title=node.get('title', ''),
                        slug=node.get('slug', ''),
                        node_type=node.get('node_type', ''),
                        difficulty=node.get('difficulty', 'beginner'),
                        priority=PRIORITY_EASIEST_FIRST,
                        priority_label='New Content Available',
                        reason=f'Newly imported: "{node.get("title", "")}"',
                        estimated_minutes=node.get('estimated_minutes', 30),
                    ))

        return [self._rec_to_dict(r) for r in recommendations]

    async def recommend_after_revision(self, user_id: UUID, revised_node_ids: list[str], limit: int = 10) -> list[dict]:
        """Get recommendations for what to study after completing a revision.

        Recommends nodes connected to the revised nodes for continued learning.
        """
        recommendations: list[Recommendation] = []

        if self._traversal is None:
            return []

        for nid_str in revised_node_ids[:5]:
            try:
                nid = UUID(nid_str)
                # Find nodes at depth 1 (directly connected)
                sub = await self._traversal.subgraph(nid, depth=1)
                for node in sub.get('nodes', []):
                    if node.get('id') != nid_str:
                        recommendations.append(Recommendation(
                            node_id=node['id'],
                            title=node.get('title', ''),
                            slug=node.get('slug', ''),
                            node_type=node.get('node_type', ''),
                            difficulty=node.get('difficulty', 'beginner'),
                            priority=PRIORITY_CONTINUE_STREAK,
                            priority_label='Continue Learning Streak',
                            reason=f'Connected to what you just revised',
                            estimated_minutes=node.get('estimated_minutes', 30),
                        ))
            except (ValueError, AttributeError):
                pass

        # Deduplicate
        seen: set[str] = set()
        unique: list[Recommendation] = []
        for rec in recommendations:
            if rec.node_id not in seen:
                seen.add(rec.node_id)
                unique.append(rec)

        return [self._rec_to_dict(r) for r in unique[:limit]]

    async def get_history(self, user_id: UUID, limit: int = 50) -> list[dict]:
        """Get recommendation history for a user."""
        history = self._recommendation_history.get(str(user_id), [])
        return history[-limit:]

    # ═══════════════════════════════════════════════════════════════
    # Internal: Candidate Gathering
    # ═══════════════════════════════════════════════════════════════

    async def _gather_all_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Gather candidates from all available priority rules."""
        candidates: list[Recommendation] = []
        added_ids: set[str] = set()

        # Priority 1: Urgent Review
        urgent = await self._get_urgent_review_candidates(user_id)
        for rec in urgent:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 2: Reinforce Weak Knowledge
        weak = await self._get_weak_knowledge_candidates(user_id)
        for rec in weak:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 3: Continue Learning Streak
        streak = await self._get_streak_candidates(user_id)
        for rec in streak:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 4: Career Requirement
        career = await self._get_career_candidates(user_id)
        for rec in career:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 5: Unlock Maximum Nodes
        unlock = await self._get_unlock_candidates(user_id)
        for rec in unlock:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 6: Highest Dependency Value
        dep = await self._get_dependency_value_candidates(user_id)
        for rec in dep:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 7: Shortest Estimated Time
        short = await self._get_shortest_time_candidates(user_id)
        for rec in short:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        # Priority 8: Easiest First
        easy = await self._get_easiest_candidates(user_id)
        for rec in easy:
            if rec.node_id not in added_ids:
                added_ids.add(rec.node_id)
                candidates.append(rec)

        return candidates

    async def _get_urgent_review_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 1: Items due for spaced repetition review."""
        if self._state is None:
            return []

        results: list[Recommendation] = []
        try:
            # Get learner's active nodes with low confidence
            learner_state = await self._state.get_learner_state(user_id)
            active_nodes = getattr(learner_state, 'active_nodes', {})

            for nid_str, state_info in active_nodes.items():
                if isinstance(state_info, dict):
                    confidence = state_info.get('confidence', 1.0)
                    if confidence < 0.5:  # Needs review
                        node = await self._graph.get_node(UUID(nid_str)) if self._graph else None
                        if node:
                            results.append(Recommendation(
                                node_id=str(nid_str),
                                title=node.get('title', ''),
                                slug=node.get('slug', ''),
                                node_type=node.get('node_type', ''),
                                difficulty=node.get('difficulty', 'beginner'),
                                priority=PRIORITY_URGENT_REVIEW,
                                priority_label='Urgent Review',
                                reason=f'Confidence is low ({round(confidence, 2)}) — needs review',
                                estimated_minutes=node.get('estimated_minutes', 15),
                            ))
        except Exception:
            pass
        return results

    async def _get_weak_knowledge_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 2: Items with lowest confidence scores."""
        if self._state is None:
            return []

        results: list[Recommendation] = []
        try:
            learner_state = await self._state.get_learner_state(user_id)
            active_nodes = getattr(learner_state, 'active_nodes', {})

            # Sort by confidence ascending
            sorted_nodes = sorted(
                active_nodes.items(),
                key=lambda x: x[1].get('confidence', 1.0) if isinstance(x[1], dict) else 1.0,
            )

            for nid_str, state_info in sorted_nodes[:10]:
                confidence = state_info.get('confidence', 1.0) if isinstance(state_info, dict) else 1.0
                if 0.3 <= confidence < 0.7:  # Moderate weakness
                    node = await self._graph.get_node(UUID(nid_str)) if self._graph else None
                    if node:
                        results.append(Recommendation(
                            node_id=str(nid_str),
                            title=node.get('title', ''),
                            slug=node.get('slug', ''),
                            node_type=node.get('node_type', ''),
                            difficulty=node.get('difficulty', 'beginner'),
                            priority=PRIORITY_REINFORCE_WEAK,
                            priority_label='Reinforce Weak Knowledge',
                            reason=f'Confidence is moderate ({round(confidence, 2)}) — reinforce understanding',
                            estimated_minutes=node.get('estimated_minutes', 20),
                        ))
        except Exception:
            pass
        return results

    async def _get_streak_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 3: Items connected to current learning session."""
        if self._traversal is None or self._graph is None:
            return []

        results: list[Recommendation] = []
        try:
            # Get current active nodes from state
            if self._state:
                learner_state = await self._state.get_learner_state(user_id)
                active_nodes = getattr(learner_state, 'active_nodes', {})
                for nid_str in list(active_nodes.keys())[:3]:
                    try:
                        sub = await self._traversal.subgraph(UUID(nid_str), depth=1)
                        for node in sub.get('nodes', []):
                            if node.get('id') != nid_str:
                                results.append(Recommendation(
                                    node_id=node['id'],
                                    title=node.get('title', ''),
                                    slug=node.get('slug', ''),
                                    node_type=node.get('node_type', ''),
                                    difficulty=node.get('difficulty', 'beginner'),
                                    priority=PRIORITY_CONTINUE_STREAK,
                                    priority_label='Continue Learning Streak',
                                    reason=f'Continue your streak — next step from current topic',
                                    estimated_minutes=node.get('estimated_minutes', 30),
                                ))
                    except Exception:
                        pass
        except Exception:
            pass
        return results

    async def _get_career_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 4: Items required for target career."""
        if self._traversal is None or self._graph is None:
            return []

        results: list[Recommendation] = []

        # Get all career nodes from graph
        try:
            all_nodes = await self._graph.all_nodes()
            career_nodes = [n for n in all_nodes if n.get('node_type') == 'career']

            for career in career_nodes[:3]:
                try:
                    chain = await self._traversal.dependency_chain(UUID(career['id']), max_depth=3)
                    for level in chain:
                        for item in level:
                            nid = item.get('node_id', '')
                            node = await self._graph.get_node(UUID(nid))
                            if node:
                                results.append(Recommendation(
                                    node_id=str(nid),
                                    title=node.get('title', ''),
                                    slug=node.get('slug', ''),
                                    node_type=node.get('node_type', ''),
                                    difficulty=node.get('difficulty', 'beginner'),
                                    priority=PRIORITY_CAREER_REQUIREMENT,
                                    priority_label='Career Requirement',
                                    reason=f'Required for career: {career.get("title", "")}',
                                    estimated_minutes=node.get('estimated_minutes', 30),
                                ))
                except Exception:
                    pass
        except Exception:
            pass
        return results

    async def _get_unlock_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 5: Items that unlock the most downstream content."""
        if self._traversal is None or self._graph is None:
            return []

        results: list[Recommendation] = []

        try:
            # For each available concept, count how many downstream nodes depend on it
            all_nodes = await self._graph.all_nodes()
            for node in all_nodes[:50]:
                try:
                    chain = await self._traversal.reverse_dependency_chain(UUID(node['id']), max_depth=2)
                    dependent_count = sum(len(level) for level in chain)

                    if dependent_count > 2:  # Unlocks at least 3 nodes
                        results.append(Recommendation(
                            node_id=node['id'],
                            title=node.get('title', ''),
                            slug=node.get('slug', ''),
                            node_type=node.get('node_type', ''),
                            difficulty=node.get('difficulty', 'beginner'),
                            priority=PRIORITY_UNLOCK_MAX_NODES,
                            priority_label='Unlock Maximum Nodes',
                            reason=f'Unlocks {dependent_count} downstream nodes',
                            estimated_minutes=node.get('estimated_minutes', 30),
                        ))
                except Exception:
                    pass
        except Exception:
            pass
        return results

    async def _get_dependency_value_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 6: Items with the most dependents (high value)."""
        if self._traversal is None or self._graph is None:
            return []

        results: list[Recommendation] = []

        try:
            all_nodes = await self._graph.all_nodes()
            dependency_counts: list[tuple[str, int, dict]] = []

            for node in all_nodes[:50]:
                try:
                    chain = await self._traversal.reverse_dependency_chain(UUID(node['id']), max_depth=2)
                    count = sum(len(level) for level in chain)
                    dependency_counts.append((node['id'], count, node))
                except Exception:
                    pass

            # Sort by dependency count descending
            dependency_counts.sort(key=lambda x: x[1], reverse=True)

            for nid_str, count, node in dependency_counts[:10]:
                if count >= 2:
                    results.append(Recommendation(
                        node_id=str(nid_str),
                        title=node.get('title', ''),
                        slug=node.get('slug', ''),
                        node_type=node.get('node_type', ''),
                        difficulty=node.get('difficulty', 'beginner'),
                        priority=PRIORITY_HIGHEST_DEPENDENCY,
                        priority_label='Highest Dependency Value',
                        reason=f'High value — {count} nodes depend on this',
                        estimated_minutes=node.get('estimated_minutes', 30),
                    ))
        except Exception:
            pass
        return results

    async def _get_shortest_time_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 7: Items with the shortest estimated time."""
        if self._graph is None:
            return []

        results: list[Recommendation] = []

        try:
            all_nodes = await self._graph.all_nodes()
            # Filter to available (published, not too difficult)
            available = [
                n for n in all_nodes
                if n.get('estimated_minutes', 120) is not None
            ]
            available.sort(key=lambda n: n.get('estimated_minutes', 120))

            for node in available[:10]:
                mins = node.get('estimated_minutes', 30)
                if mins <= 30:  # Quick wins
                    results.append(Recommendation(
                        node_id=node['id'],
                        title=node.get('title', ''),
                        slug=node.get('slug', ''),
                        node_type=node.get('node_type', ''),
                        difficulty=node.get('difficulty', 'beginner'),
                        priority=PRIORITY_SHORTEST_TIME,
                        priority_label='Shortest Estimated Time',
                        reason=f'Quick win — only {mins} minutes',
                        estimated_minutes=mins,
                    ))
        except Exception:
            pass
        return results

    async def _get_easiest_candidates(self, user_id: UUID) -> list[Recommendation]:
        """Priority 8: Items with the lowest difficulty."""
        if self._graph is None:
            return []

        results: list[Recommendation] = []

        try:
            all_nodes = await self._graph.all_nodes()
            beginner = [n for n in all_nodes if n.get('difficulty') == 'beginner']

            for node in beginner[:10]:
                results.append(Recommendation(
                    node_id=node['id'],
                    title=node.get('title', ''),
                    slug=node.get('slug', ''),
                    node_type=node.get('node_type', ''),
                    difficulty='beginner',
                    priority=PRIORITY_EASIEST_FIRST,
                    priority_label='Easiest First',
                    reason='Beginner level — easiest to start with',
                    estimated_minutes=node.get('estimated_minutes', 30),
                ))
        except Exception:
            pass
        return results

    # ═══════════════════════════════════════════════════════════════
    # Helpers
    # ═══════════════════════════════════════════════════════════════

    def _rec_to_dict(self, rec: Recommendation) -> dict:
        return {
            'node_id': rec.node_id,
            'title': rec.title,
            'slug': rec.slug,
            'node_type': rec.node_type,
            'difficulty': rec.difficulty,
            'priority': rec.priority,
            'priority_label': rec.priority_label,
            'reason': rec.reason,
            'estimated_minutes': rec.estimated_minutes,
            'icon': rec.icon,
            'color': rec.color,
        }
