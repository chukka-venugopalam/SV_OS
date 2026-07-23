"""Learning Path Engine — generate coherent learning paths to target outcomes.

Supports multiple strategies:
- career_roadmap — path toward a career goal
- skill_roadmap — path to acquire specific skills
- custom_roadmap — user-defined path
- dependency_roadmap — pure prerequisite-based ordering
- shortest_roadmap — shortest time to goal
- semester_roadmap — structured by time blocks
- daily_roadmap — day-by-day plan
- weekly_roadmap — week-by-week plan

Features:
- Milestones with unlocked_by chains
- Progress tracking and completion %
- Resume/pause/rebuild paths
- Estimated duration
- Path validation
- Path export objects
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth


@dataclass
class PathNode:
    """A single node within a learning path."""

    node_id: str
    title: str
    slug: str
    node_type: str
    difficulty: str
    estimated_minutes: int = 30
    completed: bool = False
    milestone: int = 0


@dataclass
class Milestone:
    """A milestone within a learning path."""

    level: int
    title: str
    description: str = ''
    node_count: int = 0
    estimated_minutes: int = 0
    completed: bool = False
    nodes: list[PathNode] = field(default_factory=list)


@dataclass
class LearningPath:
    """A complete learning path."""

    path_id: str = field(default_factory=lambda: str(uuid4()))
    goal_node_id: str = ''
    goal_title: str = ''
    strategy: str = 'dependency_roadmap'
    milestones: list[Milestone] = field(default_factory=list)
    status: str = 'active'  # active, paused, completed
    completion_percentage: float = 0.0
    total_estimated_minutes: int = 0
    completed_minutes: int = 0
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    resumed_count: int = 0
    user_id: str = ''


ESTIMATED_MINUTES_BY_DIFFICULTY = {
    'beginner': 30,
    'intermediate': 60,
    'advanced': 120,
    'expert': 180,
}

DIFFICULTY_ORDER = {'beginner': 0, 'intermediate': 1, 'advanced': 2, 'expert': 3}
DEFAULT_MILESTONE_SIZE = 5


class LearningPathEngine(EngineBase):
    """Learning Path Engine — roadmap generation and management.

    Public Interface:
        generate_path, resume_path, pause_path, rebuild_path,
        validate_path, export_path,
        generate_career_roadmap, generate_skill_roadmap,
        generate_custom_roadmap, generate_dependency_roadmap,
        generate_shortest_roadmap, generate_semester_roadmap,
        generate_daily_roadmap, generate_weekly_roadmap
    """

    def __init__(
        self,
        graph_engine: Any | None = None,
        traversal_engine: Any | None = None,
        state_engine: Any | None = None,
        dependency_engine: Any | None = None,
    ) -> None:
        super().__init__()
        self._graph = graph_engine
        self._traversal = traversal_engine
        self._state = state_engine
        self._dependency = dependency_engine

        # In-memory path storage
        self._paths: dict[str, LearningPath] = {}  # path_id -> path
        self._user_paths: dict[str, list[str]] = {}  # user_id -> path_ids

    def _default_name(self) -> str:
        return 'learning_path'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='graph',
                required=True,
                description='Graph engine for node data',
            ),
            EngineDependency(
                engine_name='traversal',
                required=True,
                description='Traversal engine for dependency chains',
            ),
            EngineDependency(
                engine_name='state',
                required=False,
                description='State engine for learner progress',
            ),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._paths.clear()
        self._user_paths.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Learning path engine is operational',
            details={
                'total_paths': len(self._paths),
                'active_paths': sum(1 for p in self._paths.values() if p.status == 'active'),
            },
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        if self._traversal is None:
            issues.append('No TraversalEngine reference set')
        return issues

    # ═══════════════════════════════════════════════════════════════
    # Path Generation (Multiple Strategies)
    # ═══════════════════════════════════════════════════════════════

    async def generate_path(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        strategy: str = 'dependency_roadmap',
        **kwargs: Any,
    ) -> dict:
        """Generate a learning path toward a goal using the specified strategy.

        Args:
            goal_node_id: Target node UUID.
            user_id: Optional user ID for progress filtering.
            strategy: Strategy name (dependency_roadmap, shortest_roadmap, etc.)

        Returns:
            Path dict with milestones, stats, and progress.

        """
        strategy_map = {
            'dependency_roadmap': self.generate_dependency_roadmap,
            'shortest_roadmap': self.generate_shortest_roadmap,
            'career_roadmap': self.generate_career_roadmap,
            'skill_roadmap': self.generate_skill_roadmap,
            'custom_roadmap': self.generate_custom_roadmap,
            'semester_roadmap': self.generate_semester_roadmap,
            'daily_roadmap': self.generate_daily_roadmap,
            'weekly_roadmap': self.generate_weekly_roadmap,
        }

        generator = strategy_map.get(strategy, self.generate_dependency_roadmap)
        return await generator(goal_node_id, user_id, **kwargs)  # type: ignore[operator]

    async def generate_dependency_roadmap(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate a roadmap by ordering nodes by prerequisite depth.

        Pure topological sort — foundational nodes first, goal last.
        """
        return await self._build_path(
            goal_node_id,
            user_id,
            strategy='dependency_roadmap',
            milestone_size=kwargs.get('milestone_size', DEFAULT_MILESTONE_SIZE),
        )

    async def generate_shortest_roadmap(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate the shortest-time roadmap.

        Orders nodes by estimated time, shortest first.
        """
        return await self._build_path(
            goal_node_id,
            user_id,
            strategy='shortest_roadmap',
            sort_by='estimated_minutes',
            milestone_size=kwargs.get('milestone_size', DEFAULT_MILESTONE_SIZE),
        )

    async def generate_career_roadmap(
        self,
        career_node_id: UUID,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate a career roadmap — all prerequisites for a career.

        Includes all nodes required to prepare for a career path.
        """
        return await self._build_path(
            career_node_id,
            user_id,
            strategy='career_roadmap',
            milestone_size=kwargs.get('milestone_size', DEFAULT_MILESTONE_SIZE),
        )

    async def generate_skill_roadmap(
        self,
        skill_name: str,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate a skill roadmap — nodes that teach a specific skill."""
        # Find nodes related to the skill
        if self._graph is None:
            return {'error': 'Graph engine not available', 'path': None}

        all_nodes = await self._graph.all_nodes()  # type: ignore[operator]  # type: ignore[operator]  # type: ignore[misc]
        skill_nodes = [
            n
            for n in all_nodes
            if skill_name.lower() in n.get('title', '').lower()
            or skill_name.lower() in n.get('description', '').lower()
        ]

        if not skill_nodes:
            return {'error': f'No nodes found for skill: {skill_name}', 'path': None}

        # Use the most relevant node as the goal
        goal_node_id = UUID(skill_nodes[0]['id'])
        return await self._build_path(
            goal_node_id,
            user_id,
            strategy='skill_roadmap',
            milestone_size=kwargs.get('milestone_size', DEFAULT_MILESTONE_SIZE),
        )

    async def generate_custom_roadmap(
        self,
        node_ids: list[UUID],
        user_id: UUID | None = None,
        **kwargs: Any,  # noqa: ARG002
    ) -> dict:
        """Generate a custom roadmap from a user-provided list of nodes."""
        if self._graph is None:
            return {'error': 'Graph engine not available', 'path': None}

        nodes: list[dict] = []
        for nid in node_ids:
            node = await self._graph.get_node(nid)
            if node:
                nodes.append(node)

        if not nodes:
            return {'error': 'No valid nodes provided', 'path': None}

        path_nodes = [
            PathNode(
                node_id=n['id'],
                title=n.get('title', ''),
                slug=n.get('slug', ''),
                node_type=n.get('node_type', ''),
                difficulty=n.get('difficulty', 'beginner'),
                estimated_minutes=n.get('estimated_minutes', 30),
            )
            for n in nodes
        ]

        return await self._save_path(
            path_nodes,
            user_id,
            strategy='custom_roadmap',
            goal_title='Custom Roadmap',
        )

    async def generate_semester_roadmap(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate a roadmap structured by semester (12-week blocks)."""
        return await self._build_path(
            goal_node_id,
            user_id,
            strategy='semester_roadmap',
            milestone_size=kwargs.get('milestone_size', 24),
        )

    async def generate_daily_roadmap(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate a day-by-day roadmap.

        Each day contains at most `daily_max_minutes` of content.
        """
        daily_max = kwargs.get('daily_max_minutes', 60)
        result = await self._build_path(
            goal_node_id,
            user_id,
            strategy='daily_roadmap',
            milestone_size=DEFAULT_MILESTONE_SIZE,
        )

        if result.get('milestones'):
            # Rebuild milestones as daily blocks
            flat_nodes = []
            for ms in result['milestones']:
                for node_data in ms.get('nodes', []):
                    flat_nodes.append(node_data)

            daily_milestones: list[Milestone] = []
            current_day_nodes: list[dict] = []
            current_day_minutes = 0
            day = 1

            for node in flat_nodes:
                mins = node.get('estimated_minutes', 30)
                if current_day_minutes + mins > daily_max and current_day_nodes:
                    daily_milestones.append(
                        Milestone(
                            level=day,
                            title=f'Day {day}',
                            node_count=len(current_day_nodes),
                            estimated_minutes=current_day_minutes,
                            nodes=[
                                PathNode(**n) if isinstance(n, dict) else n
                                for n in current_day_nodes
                            ],
                        ),
                    )
                    day += 1
                    current_day_nodes = []  # type: ignore[no-redef]
                    current_day_minutes = 0
                current_day_nodes.append(node)
                current_day_minutes += mins

            if current_day_nodes:
                daily_milestones.append(
                    Milestone(
                        level=day,
                        title=f'Day {day}',
                        node_count=len(current_day_nodes),
                        estimated_minutes=current_day_minutes,
                        nodes=[
                            PathNode(**n) if isinstance(n, dict) else n for n in current_day_nodes
                        ],
                    ),
                )

            result['milestones'] = [self._milestone_to_dict(m) for m in daily_milestones]

        return result

    async def generate_weekly_roadmap(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        **kwargs: Any,
    ) -> dict:
        """Generate a week-by-week roadmap."""
        weekly_max = kwargs.get('weekly_max_minutes', 300)
        result = await self._build_path(
            goal_node_id,
            user_id,
            strategy='weekly_roadmap',
            milestone_size=DEFAULT_MILESTONE_SIZE,
        )

        if result.get('milestones'):
            flat_nodes = []
            for ms in result['milestones']:
                for node_data in ms.get('nodes', []):
                    flat_nodes.append(node_data)

            weekly_milestones: list[Milestone] = []
            current_week_nodes = []  # type: ignore[var-annotated]
            current_week_minutes = 0
            week = 1

            for node in flat_nodes:
                mins = node.get('estimated_minutes', 30)
                if current_week_minutes + mins > weekly_max and current_week_nodes:
                    weekly_milestones.append(
                        Milestone(
                            level=week,
                            title=f'Week {week}',
                            node_count=len(current_week_nodes),
                            estimated_minutes=current_week_minutes,
                            nodes=[
                                PathNode(**n) if isinstance(n, dict) else n
                                for n in current_week_nodes
                            ],
                        ),
                    )
                    week += 1
                    current_week_nodes = []  # type: ignore[no-redef]
                    current_week_minutes = 0
                current_week_nodes.append(node)
                current_week_minutes += mins

            if current_week_nodes:
                weekly_milestones.append(
                    Milestone(
                        level=week,
                        title=f'Week {week}',
                        node_count=len(current_week_nodes),
                        estimated_minutes=current_week_minutes,
                        nodes=[
                            PathNode(**n) if isinstance(n, dict) else n for n in current_week_nodes
                        ],
                    ),
                )

            result['milestones'] = [self._milestone_to_dict(m) for m in weekly_milestones]

        return result

    # ═══════════════════════════════════════════════════════════════
    # Path Lifecycle
    # ═══════════════════════════════════════════════════════════════

    async def resume_path(self, path_id: UUID) -> dict:
        """Resume a paused learning path."""
        path = self._paths.get(str(path_id))
        if path is None:
            return {'error': 'Path not found'}

        path.status = 'active'
        path.resumed_count += 1
        path.updated_at = datetime.now(UTC).isoformat()
        return self._path_to_dict(path)

    async def pause_path(self, path_id: UUID) -> dict:
        """Pause an active learning path."""
        path = self._paths.get(str(path_id))
        if path is None:
            return {'error': 'Path not found'}

        path.status = 'paused'
        path.updated_at = datetime.now(UTC).isoformat()
        return self._path_to_dict(path)

    async def rebuild_path(self, path_id: UUID, user_id: UUID | None = None) -> dict:
        """Rebuild a learning path, recalculating progress."""
        path = self._paths.get(str(path_id))
        if path is None:
            return {'error': 'Path not found'}

        goal_id = UUID(path.goal_node_id) if path.goal_node_id else None
        if goal_id:
            return await self._build_path(
                goal_id,
                user_id or UUID(path.user_id) if path.user_id else None,
                strategy=path.strategy,
            )

        return self._path_to_dict(path)

    async def validate_path(self, path_id: UUID) -> dict:
        """Validate a learning path for consistency."""
        path = self._paths.get(str(path_id))
        if path is None:
            return {'valid': False, 'errors': ['Path not found']}

        errors: list[str] = []
        all_ids = set()
        for ms in path.milestones:
            for node in ms.nodes:
                if node.node_id in all_ids:
                    errors.append(f'Duplicate node: {node.title} ({node.node_id})')
                all_ids.add(node.node_id)

        return {
            'valid': len(errors) == 0,
            'errors': errors,
            'milestone_count': len(path.milestones),
            'total_nodes': len(all_ids),
        }

    async def export_path(self, path_id: UUID, format: str = 'json') -> dict:
        """Export a learning path as a portable object."""
        path = self._paths.get(str(path_id))
        if path is None:
            return {'error': 'Path not found'}

        base = self._path_to_dict(path)
        base['export_format'] = format
        base['exported_at'] = datetime.now(UTC).isoformat()

        if format == 'minimal':
            # Only include node IDs and order
            base['milestones'] = [
                {
                    'level': ms.level,
                    'node_ids': [n.node_id for n in ms.nodes],
                }
                for ms in path.milestones
            ]

        return base

    # ═══════════════════════════════════════════════════════════════
    # Internal: Path Building
    # ═══════════════════════════════════════════════════════════════

    async def _build_path(
        self,
        goal_node_id: UUID,
        user_id: UUID | None = None,
        strategy: str = 'dependency_roadmap',
        sort_by: str = 'depth',
        milestone_size: int = DEFAULT_MILESTONE_SIZE,
    ) -> dict:
        """Shared path building logic."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Graph/Traversal engine not available', 'path': None}

        goal_node = await self._graph.get_node(goal_node_id)
        if goal_node is None:
            return {'error': 'Goal node not found', 'path': None}

        # 1. Get the dependency chain
        chain = await self._traversal.dependency_chain(goal_node_id, max_depth=10)

        # 2. Flatten chain into ordered node list
        node_ids_in_order: list[str] = []
        for level in chain:
            for item in level:
                nid = item.get('node_id', '')
                if nid and nid not in node_ids_in_order:
                    node_ids_in_order.append(nid)

        # Add the goal node at the end
        if goal_node['id'] not in node_ids_in_order:
            node_ids_in_order.append(goal_node['id'])

        # 3. Build path nodes
        path_nodes: list[PathNode] = []
        for nid in node_ids_in_order:
            node = await self._graph.get_node(UUID(nid))
            if node:
                path_nodes.append(
                    PathNode(
                        node_id=node['id'],
                        title=node.get('title', ''),
                        slug=node.get('slug', ''),
                        node_type=node.get('node_type', ''),
                        difficulty=node.get('difficulty', 'beginner'),
                        estimated_minutes=node.get('estimated_minutes', 30),
                    ),
                )

        # 4. Sort if needed
        if sort_by == 'estimated_minutes':
            path_nodes.sort(key=lambda n: n.estimated_minutes)

        # 5. Group into milestones
        milestones: list[Milestone] = []
        for i in range(0, len(path_nodes), milestone_size):
            chunk = path_nodes[i : i + milestone_size]
            chunk_minutes = sum(n.estimated_minutes for n in chunk)
            milestones.append(
                Milestone(
                    level=len(milestones) + 1,
                    title=f'Milestone {len(milestones) + 1}',
                    node_count=len(chunk),
                    estimated_minutes=chunk_minutes,
                    nodes=chunk,
                ),
            )

        # 6. Calculate completion
        completed_nodes = 0
        if self._state and user_id:
            try:
                learner_state = await self._state.get_learner_state(user_id)
                active_nodes = getattr(learner_state, 'active_nodes', {})
                for n in path_nodes:
                    if n.node_id in active_nodes:
                        state_info = active_nodes[n.node_id]
                        if isinstance(state_info, dict) and state_info.get('status') in (
                            'completed',
                            'mastered',
                        ):
                            n.completed = True
                            completed_nodes += 1
                for ms in milestones:
                    ms.completed = all(n.completed for n in ms.nodes)
            except Exception:
                pass

        completion_pct = round(completed_nodes / len(path_nodes) * 100, 1) if path_nodes else 0.0
        total_minutes = sum(n.estimated_minutes for n in path_nodes)

        # 7. Save the path
        path = LearningPath(
            goal_node_id=goal_node['id'],
            goal_title=goal_node.get('title', ''),
            strategy=strategy,
            milestones=milestones,
            completion_percentage=completion_pct,
            total_estimated_minutes=total_minutes,
            user_id=str(user_id) if user_id else '',
        )
        self._paths[path.path_id] = path
        if user_id:
            self._user_paths.setdefault(str(user_id), []).append(path.path_id)

        # Publish event
        await self.publish_event(
            'roadmap.generated.v1',
            {
                'path_id': path.path_id,
                'goal_node_id': goal_node['id'],
                'goal_title': goal_node.get('title', ''),
                'strategy': strategy,
                'milestone_count': len(milestones),
                'total_nodes': len(path_nodes),
            },
            correlation_id=str(user_id) if user_id else path.path_id,
        )

        return self._path_to_dict(path)

    async def _save_path(
        self,
        path_nodes: list[PathNode],
        user_id: UUID | None = None,
        strategy: str = 'custom_roadmap',
        goal_title: str = 'Custom Roadmap',
    ) -> dict:
        """Save a path from pre-built nodes."""
        milestones: list[Milestone] = []
        for i in range(0, len(path_nodes), DEFAULT_MILESTONE_SIZE):
            chunk = path_nodes[i : i + DEFAULT_MILESTONE_SIZE]
            chunk_minutes = sum(n.estimated_minutes for n in chunk)
            milestones.append(
                Milestone(
                    level=len(milestones) + 1,
                    title=f'Step {len(milestones) + 1}',
                    node_count=len(chunk),
                    estimated_minutes=chunk_minutes,
                    nodes=chunk,
                ),
            )

        total_minutes = sum(n.estimated_minutes for n in path_nodes)

        path = LearningPath(
            goal_title=goal_title,
            strategy=strategy,
            milestones=milestones,
            total_estimated_minutes=total_minutes,
            user_id=str(user_id) if user_id else '',
        )
        self._paths[path.path_id] = path
        if user_id:
            self._user_paths.setdefault(str(user_id), []).append(path.path_id)

        return self._path_to_dict(path)

    # ═══════════════════════════════════════════════════════════════
    # Progress Tracking
    # ═══════════════════════════════════════════════════════════════

    async def get_progress(self, path_id: UUID, user_id: UUID | None = None) -> dict:
        """Get progress for a learning path."""
        path = self._paths.get(str(path_id))
        if path is None:
            return {'error': 'Path not found'}

        completed_nodes = 0
        total_nodes = sum(ms.node_count for ms in path.milestones)

        if self._state and user_id:
            try:
                learner_state = await self._state.get_learner_state(user_id)
                active_nodes = getattr(learner_state, 'active_nodes', {})
                for ms in path.milestones:
                    for node in ms.nodes:
                        if node.node_id in active_nodes:
                            info = active_nodes[node.node_id]
                            if isinstance(info, dict) and info.get('status') in (
                                'completed',
                                'mastered',
                            ):
                                node.completed = True
                                completed_nodes += 1
                    ms.completed = all(n.completed for n in ms.nodes if ms.nodes)
            except Exception:
                pass

        completion_pct = round(completed_nodes / total_nodes * 100, 1) if total_nodes else 0.0
        path.completion_percentage = completion_pct

        return {
            'path_id': path.path_id,
            'status': path.status,
            'completed_nodes': completed_nodes,
            'total_nodes': total_nodes,
            'completion_percentage': completion_pct,
            'milestones': [self._milestone_to_dict(m) for m in path.milestones],
        }

    # ═══════════════════════════════════════════════════════════════
    # Utility
    # ═══════════════════════════════════════════════════════════════

    def _path_to_dict(self, path: LearningPath) -> dict:
        return {
            'path_id': path.path_id,
            'goal_node_id': path.goal_node_id,
            'goal_title': path.goal_title,
            'strategy': path.strategy,
            'status': path.status,
            'completion_percentage': path.completion_percentage,
            'total_estimated_minutes': path.total_estimated_minutes,
            'milestone_count': len(path.milestones),
            'milestones': [self._milestone_to_dict(m) for m in path.milestones],
            'created_at': path.created_at,
            'updated_at': path.updated_at,
            'resumed_count': path.resumed_count,
        }

    def _milestone_to_dict(self, ms: Milestone) -> dict:
        return {
            'level': ms.level,
            'title': ms.title,
            'description': ms.description,
            'node_count': ms.node_count,
            'estimated_minutes': ms.estimated_minutes,
            'completed': ms.completed,
            'nodes': [self._path_node_to_dict(n) for n in ms.nodes],
        }

    def _path_node_to_dict(self, node: PathNode) -> dict:
        return {
            'node_id': node.node_id,
            'title': node.title,
            'slug': node.slug,
            'node_type': node.node_type,
            'difficulty': node.difficulty,
            'estimated_minutes': node.estimated_minutes,
            'completed': node.completed,
            'milestone': node.milestone,
        }
