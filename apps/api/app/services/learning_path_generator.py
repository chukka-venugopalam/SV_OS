"""Learning Path Generator — dynamic learning path creation from user goals.

Given a goal (target node/career), current knowledge level, and constraints,
generates an ordered learning roadmap with milestones, estimated duration,
and prerequisite coverage.

Algorithm:
1. Compute the prerequisite chain from goal back to root nodes
2. Filter out already-completed nodes
3. Topologically sort the remaining nodes
4. Group into milestone levels based on depth
5. Estimate duration per milestone
"""

from __future__ import annotations

from typing import TYPE_CHECKING

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

# Average learning time per node by difficulty (minutes)
ESTIMATED_MINUTES: dict[str, int] = {
    'beginner': 30,
    'intermediate': 60,
    'advanced': 120,
    'expert': 180,
}

# Default difficulty progression
DIFFICULTY_ORDER = {'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 3}

# Milestone sizes (number of nodes per milestone)
MILESTONE_SIZE = 5


class LearningPathGenerator:
    """Generates dynamic, personalised learning paths.

    Given a goal (career, project, or knowledge node) and the user's
    current knowledge state, generates an ordered roadmap with
    milestones, estimated duration, and progress tracking.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    # ── Main Entry Point ───────────────────────────────────────────

    async def generate_path(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        difficulty: str | None = None,
        estimated_hours: int | None = None,  # noqa: ARG002
    ) -> dict:
        """Generate a dynamic learning path toward a goal.

        Args:
            goal_node_id: The target knowledge node UUID.
            user_id: Optional user ID to exclude completed nodes.
            difficulty: Target difficulty level preference.
            estimated_hours: Optional time constraint for the path.

        Returns:
            A dict with ``goal``, ``milestones``, ``stats``, and
            ``prerequisites``.

        """
        goal_node = await self._uow.knowledge_nodes.get_by_id(goal_node_id)
        if not goal_node:
            return {'error': 'Goal node not found'}

        # 1. Compute the full prerequisite chain
        prereq_ids = await self._build_prerequisite_set(goal_node_id)
        prereq_nodes = []
        for pid in prereq_ids:
            node = await self._uow.knowledge_nodes.get_by_id(pid)
            if node:
                prereq_nodes.append(node)

        # 2. Filter completed nodes
        completed_ids: set[UUID] = set()
        if user_id:
            completed_ids = await self._get_completed_ids(user_id)

        remaining = [n for n in prereq_nodes if n.id not in completed_ids]

        # 3. Topological sort by depth
        ordered = await self._topological_sort(remaining, goal_node_id)

        # 4. Apply difficulty filter
        if difficulty:
            diff_idx = DIFFICULTY_ORDER.get(difficulty, 1)
            ordered = [
                n
                for n in ordered
                if DIFFICULTY_ORDER.get(
                    n.difficulty.value
                    if hasattr(n.difficulty, 'value')
                    else str(n.difficulty).lower(),
                    0,
                )
                <= diff_idx
            ]

        # 5. Group into milestones
        milestones = self._build_milestones(ordered)

        # 6. Calculate stats
        total_estimated_minutes = sum(
            ESTIMATED_MINUTES.get(
                n.difficulty.value if hasattr(n.difficulty, 'value') else str(n.difficulty).lower(),
                45,
            )
            for n in ordered
        )

        completion_pct = 0.0
        if prereq_nodes:
            completion_pct = len(completed_ids) / len(prereq_nodes) * 100

        return {
            'goal': {
                'id': str(goal_node.id),
                'title': goal_node.title,
                'slug': goal_node.slug,
                'node_type': goal_node.node_type.value
                if hasattr(goal_node.node_type, 'value')
                else goal_node.node_type,
            },
            'milestones': milestones,
            'stats': {
                'total_nodes': len(prereq_nodes),
                'remaining_nodes': len(ordered),
                'completed_nodes': len(completed_ids),
                'completion_percentage': round(completion_pct, 1),
                'estimated_minutes': total_estimated_minutes,
                'estimated_hours': round(total_estimated_minutes / 60, 1),
            },
            'prerequisites': {
                'required': [_node_to_dict(n) for n in ordered],
                'completed': len(completed_ids),
                'missing': len(ordered),
            },
        }

    # ── Prerequisite Set Building ─────────────────────────────────
    # Time: O(V + E)  |  Space: O(V)

    async def _build_prerequisite_set(self, node_id: UUID, max_depth: int = 10) -> list[UUID]:
        """Build an ordered set of all prerequisite node IDs."""
        from collections import deque

        visited: set[UUID] = set()
        ordered: list[UUID] = []
        queue: deque[tuple[UUID, int]] = deque()
        queue.append((node_id, 0))

        while queue:
            current_id, depth = queue.popleft()

            if current_id in visited:
                continue
            visited.add(current_id)

            if current_id != node_id:
                ordered.append(current_id)

            if depth >= max_depth:
                continue

            prereqs = await self._uow.graph.load_prerequisites(current_id)
            for prereq in prereqs:
                if prereq.id not in visited:
                    queue.append((prereq.id, depth + 1))

        # Reverse: root prerequisites first
        ordered.reverse()
        return ordered

    # ── Topological Sort by Depth ─────────────────────────────────
    # Time: O(V log V)  |  Space: O(V)

    async def _topological_sort(self, nodes: list, _goal_node_id: UUID) -> list:
        """Topologically sort nodes by prerequisite depth."""
        depth_map: dict[UUID, int] = {}

        for node in nodes:
            depth_map[node.id] = await self._compute_node_depth(node.id)

        # Sort by: depth (ascending), then difficulty (ascending)
        def sort_key(n):
            depth = depth_map.get(n.id, 0)
            diff = n.difficulty.value if hasattr(n.difficulty, 'value') else str(n.difficulty)
            diff_idx = DIFFICULTY_ORDER.get(diff.lower(), 0)
            return (depth, diff_idx)

        return sorted(nodes, key=sort_key)

    # ── Node Depth Computation ────────────────────────────────────
    # Time: O(D) where D is prereq chain depth  |  Space: O(1)

    async def _compute_node_depth(self, node_id: UUID) -> int:
        depth = 0
        current_id = node_id
        visited: set[UUID] = set()

        while depth < 20:
            prereqs = await self._uow.graph.load_prerequisites(current_id)
            if not prereqs:
                break
            # Move to the first prerequisite (assumes tree-like structure)
            next_node = prereqs[0]
            if next_node.id in visited:
                break
            visited.add(next_node.id)
            current_id = next_node.id
            depth += 1

        return depth

    # ── Milestone Building ─────────────────────────────────────────

    def _build_milestones(self, ordered_nodes: list) -> list[dict]:
        """Group nodes into learnable milestones."""
        milestones: list[dict] = []
        for i in range(0, len(ordered_nodes), MILESTONE_SIZE):
            chunk = ordered_nodes[i : i + MILESTONE_SIZE]
            estimated_minutes = sum(
                ESTIMATED_MINUTES.get(
                    n.difficulty.value
                    if hasattr(n.difficulty, 'value')
                    else str(n.difficulty).lower(),
                    45,
                )
                for n in chunk
            )

            milestones.append(
                {
                    'level': len(milestones) + 1,
                    'title': f'Milestone {len(milestones) + 1}',
                    'node_count': len(chunk),
                    'estimated_minutes': estimated_minutes,
                    'estimated_hours': round(estimated_minutes / 60, 1),
                    'nodes': [_node_to_dict(n) for n in chunk],
                },
            )

        return milestones

    # ── Helper: Get Completed IDs ─────────────────────────────────

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
        'estimated_minutes': ESTIMATED_MINUTES.get(
            node.difficulty.value
            if hasattr(node.difficulty, 'value')
            else str(node.difficulty).lower(),
            45,
        ),
    }
