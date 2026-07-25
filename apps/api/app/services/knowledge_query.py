"""Knowledge Query Service — rich queries for the knowledge graph.

Provides domain-specific queries that go beyond basic CRUD:
- Node retrieval by slug / id / title / domain / difficulty / type
- Recently unlocked topics (derived from prerequisite edges)
- Recommended next topics based on prerequisite completion
- Statistics per domain / difficulty
- Related projects, careers, and resources
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from structlog.stdlib import get_logger

if TYPE_CHECKING:
    from uuid import UUID

    from app.models.knowledge_node import KnowledgeNode
    from app.repositories import UnitOfWork

logger = get_logger(__name__)


class KnowledgeQueryService:
    """Rich query service for the knowledge graph.

    Provides domain-level queries, unlock computation (derived from
    prerequisites), next-topic recommendations, and cross-entity
    lookups (projects, careers, resources for a node).
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow

    # ── Node Retrieval ─────────────────────────────────────────────

    async def get_by_slug(self, slug: str) -> KnowledgeNode:
        """Get a published node by slug.

        Raises ``EntityNotFoundError`` if not found.
        """
        return await self._uow.knowledge_nodes.get_by_slug(slug)

    async def get_by_id(self, node_id: UUID) -> KnowledgeNode | None:
        """Get a published node by ID."""
        return await self._uow.knowledge_nodes.get_by_id(node_id)

    async def find_by_title(self, title: str, exact: bool = True) -> list[KnowledgeNode]:
        """Find nodes by title (exact or partial match)."""
        if exact:
            from sqlalchemy import func, select

            stmt = (
                select(KnowledgeNode)
                .where(
                    func.lower(KnowledgeNode.title) == title.lower(),
                    KnowledgeNode.is_deleted.isnot(True),
                    KnowledgeNode.is_published,
                )
                .order_by(KnowledgeNode.title)
            )
            result = await self._uow.session.execute(stmt)
            return list(result.scalars().all())
        result = await self._uow.knowledge_nodes.search(  # type: ignore[assignment]
            query=title,
            fields=['title'],
            page=1,
            per_page=20,
        )
        return list(result.items)  # type: ignore[attr-defined]

    # ── Domain / Type / Difficulty Queries ─────────────────────────

    async def get_nodes_by_domain(
        self,
        domain: str,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Get published nodes filtered by domain (via metadata)."""
        from sqlalchemy import func, select

        stmt = (
            select(KnowledgeNode)
            .where(
                KnowledgeNode.extra_metadata['domain'].astext == domain,
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .order_by(KnowledgeNode.title)
            .offset((page - 1) * per_page)
            .limit(per_page)
        )
        count_stmt = (
            select(func.count())
            .select_from(KnowledgeNode)
            .where(
                KnowledgeNode.extra_metadata['domain'].astext == domain,
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
        )
        total_result = await self._uow.session.execute(count_stmt)
        total = total_result.scalar() or 0

        result = await self._uow.session.execute(stmt)
        items = list(result.scalars().all())

        return {
            'items': [_node_card_dict(n) for n in items],
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': max(1, (total + per_page - 1) // per_page) if total else 1,
        }

    async def get_nodes_by_type(
        self,
        node_type: str,
        page: int = 1,
        per_page: int = 20,
    ) -> Any:
        """Get published nodes filtered by node_type."""
        return await self._uow.knowledge_nodes.find_by_type(  # type: ignore[assignment]
            node_type=node_type,
            page=page,
            per_page=per_page,
        )

    async def get_nodes_by_difficulty(
        self,
        difficulty: str,
        page: int = 1,
        per_page: int = 20,
    ) -> Any:
        """Get published nodes filtered by difficulty level."""
        return await self._uow.knowledge_nodes.find_by_difficulty(
            difficulty=difficulty,
            page=page,
            per_page=per_page,
        )

    async def get_all_domains(self) -> list[dict[str, Any]]:
        """Get distinct domains with node counts, ordered by count desc.

        Domains are stored in ``metadata['domain']`` on each node.
        """
        from sqlalchemy import func, select

        stmt = (
            select(
                KnowledgeNode.extra_metadata['domain'].astext.label('domain'),
                func.count().label('count'),
            )
            .where(
                KnowledgeNode.is_deleted.isnot(True),
                KnowledgeNode.is_published,
            )
            .group_by(KnowledgeNode.extra_metadata['domain'].astext)
            .order_by(func.count().desc())
        )
        result = await self._uow.session.execute(stmt)
        rows = result.all()
        return [
            {
                'domain': row[0] if row[0] else 'uncategorized',
                'count': row[1],
            }
            for row in rows
        ]

    # ── Unlocks (Derived — Never Stored) ───────────────────────────

    async def get_unlocks(
        self,
        slug: str,
    ) -> list[KnowledgeNode]:
        """Get nodes that this node unlocks (reverse of prerequisites).

        **Critical**: Unlocks are computed by reversing KnowledgeEdge
        prerequisite relationships. This is never stored as a separate
        column or table — it is always derived at query time to prevent
        graph drift when edges are edited.
        """
        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        # Dependents = nodes that have this node as a prerequisite
        return await self._uow.graph.load_dependents(node.id)

    async def get_prerequisites(
        self,
        slug: str,
    ) -> list[KnowledgeNode]:
        """Get prerequisite nodes that must be learned before this node."""
        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        return await self._uow.graph.load_prerequisites(node.id)

    async def get_recently_unlocked(
        self,
        completed_node_ids: list[UUID],
        limit: int = 10,
    ) -> list[KnowledgeNode]:
        """Given a list of completed node IDs, find which new nodes are
        now fully unlocked (all prerequisites satisfied).

        This powers the "What can I learn next?" recommendation.
        """
        if not completed_node_ids:
            return []

        visited = set(completed_node_ids)
        candidate_ids: set[UUID] = set()
        for nid in completed_node_ids:
            dependents = await self._uow.graph.load_dependents(nid)
            for dep in dependents:
                if dep.id not in visited:
                    candidate_ids.add(dep.id)

        unlocked: list[KnowledgeNode] = []
        for cid in list(candidate_ids)[: limit * 3]:
            prereqs = await self._uow.graph.load_prerequisites(cid)
            prereq_ids = {p.id for p in prereqs}
            if prereq_ids and prereq_ids.issubset(visited):
                node = await self._uow.knowledge_nodes.get_by_id(cid)
                if node and node.is_published:
                    unlocked.append(node)
                    if len(unlocked) >= limit:
                        break

        return unlocked[:limit]

    # ── Next-Topic Recommendations ─────────────────────────────────

    async def get_recommended_next(
        self,
        completed_node_ids: list[UUID],
        limit: int = 5,
    ) -> list[KnowledgeNode]:
        """Recommend the next best topics based on unlocked nodes.

        Ranks unlocked nodes by: (1) fewest remaining prerequisites,
        (2) lowest difficulty, (3) highest view_count (popularity).
        """
        unlocked = await self.get_recently_unlocked(
            completed_node_ids=completed_node_ids,
            limit=limit * 3,
        )

        def sort_key(n: KnowledgeNode) -> tuple:
            diff_order = {
                'beginner': 0,
                'intermediate': 1,
                'advanced': 2,
                'expert': 3,
            }
            diff_str = n.difficulty.value if hasattr(n.difficulty, 'value') else str(n.difficulty)
            return (diff_order.get(diff_str.lower(), 1), -getattr(n, 'view_count', 0))

        unlocked.sort(key=sort_key)
        return unlocked[:limit]

    # ── Cross-Entity Lookups ───────────────────────────────────────

    async def get_related_projects(
        self,
        slug: str,
        page: int = 1,  # noqa: ARG002
        per_page: int = 20,  # noqa: ARG002
    ) -> list[dict[str, Any]]:
        """Get projects related to a knowledge node."""
        from sqlalchemy import select

        from app.models.project import Project, ProjectRequirement

        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        stmt = (
            select(Project)
            .join(ProjectRequirement, ProjectRequirement.project_id == Project.id)
            .where(
                ProjectRequirement.node_id == node.id,
                Project.is_deleted.isnot(True),
            )
            .order_by(Project.title)
        )
        proj_result = await self._uow.session.execute(stmt)
        projects = list(proj_result.scalars().all())
        return [_project_to_dict(p) for p in projects]

    async def get_related_careers(
        self,
        slug: str,
    ) -> list[dict[str, Any]]:
        """Get careers that require a knowledge node."""
        from sqlalchemy import select

        from app.models.career import Career, CareerRequirement

        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        stmt = (
            select(Career)
            .join(CareerRequirement, CareerRequirement.career_id == Career.id)
            .where(
                CareerRequirement.node_id == node.id,
                Career.is_deleted.isnot(True),
            )
            .order_by(Career.title)
        )
        career_result = await self._uow.session.execute(stmt)
        careers = list(career_result.scalars().all())
        return [_career_to_dict(c) for c in careers]

    async def get_related_resources(
        self,
        slug: str,
        page: int = 1,
        per_page: int = 20,
    ) -> Any:
        """Get learning resources for a knowledge node."""
        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        return await self._uow.learning_resources.find_by_node(
            node_id=node.id,
            page=page,
            per_page=per_page,
        )

    async def get_related_nodes(
        self,
        slug: str,
        relationship_type: str | None = None,
    ) -> dict[str, list[dict[str, Any]]]:
        """Get all related nodes (neighbors) for a slug."""
        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        all_neighbors = await self._uow.graph.load_all_neighbors(
            node_id=node.id,
            relationship_type=relationship_type,
        )
        return {
            'outgoing': [_node_card_dict(n) for n in all_neighbors.get('outgoing', [])],
            'incoming': [_node_card_dict(n) for n in all_neighbors.get('incoming', [])],
        }

    # ── Dependency Tree ────────────────────────────────────────────

    async def get_dependency_tree(
        self,
        slug: str,
        max_depth: int = 5,
    ) -> dict[str, Any]:
        """Build a nested dependency tree rooted at the given node.

        Returns a recursive structure:
        ``{node, depth, prerequisites: [{node, depth, prerequisites: [...]}]}``
        """
        from app.services.graph.traversal import GraphTraversalService

        node = await self._uow.knowledge_nodes.get_by_slug(slug)
        traversal = GraphTraversalService(self._uow)
        chain = await traversal.prerequisite_chain(node.id, max_depth=max_depth)

        return {
            'node': _node_card_dict(node),
            'slug': slug,
            'title': node.title,
            'depth': 0,
            'levels': [{'level': i + 1, 'nodes': level} for i, level in enumerate(chain)],
            'total_depth': len(chain),
        }


# ── Helper Conversion Functions ────────────────────────────────────


def _node_card_dict(node) -> dict[str, Any]:
    """Convert a KnowledgeNode to a compact card dict."""
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
        'icon': getattr(node, 'icon', None),
        'color': getattr(node, 'color', None),
    }


def _project_to_dict(project) -> dict[str, Any]:
    return {
        'id': str(project.id),
        'slug': project.slug,
        'title': project.title,
        'description': project.description,
        'difficulty': project.difficulty.value
        if hasattr(project.difficulty, 'value')
        else project.difficulty,
        'estimated_hours': project.estimated_hours,
    }


def _career_to_dict(career) -> dict[str, Any]:
    return {
        'id': str(career.id),
        'slug': career.slug,
        'title': career.title,
        'description': career.description,
        'demand_level': career.demand_level.value
        if hasattr(career.demand_level, 'value')
        else career.demand_level,
    }
