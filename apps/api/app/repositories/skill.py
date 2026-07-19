"""Skill repository — persistence operations for ``Skill`` and ``SkillRelationship`` models."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from sqlalchemy import func, select

from app.models.skill import Skill, SkillRelationship
from app.repositories.base import BaseRepository
from app.repositories.errors import EntityNotFoundError

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories.query_helpers import PageResult


class SkillRepository(BaseRepository[Skill]):
    """Repository for ``Skill`` persistence operations."""

    model = Skill

    # ── Lookup Methods ─────────────────────────────────────────────

    async def find_by_name(self, name: str) -> Skill | None:
        """Find a skill by name."""
        return await self.get_by_field('name', name)

    async def get_by_name(self, name: str) -> Skill:
        """Find by name or raise ``EntityNotFoundError``."""
        skill = await self.find_by_name(name)
        if not skill:
            msg = 'Skill'
            raise EntityNotFoundError(msg, name)
        return skill

    async def find_by_category(
        self,
        category: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Skill]:
        """Find skills by category with pagination."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'category': category},
            sort_field='name',
        )

    async def find_by_difficulty(
        self,
        difficulty: str,
        page: int = 1,
        per_page: int = 20,
    ) -> PageResult[Skill]:
        """Find skills by difficulty level."""
        return await self.paginate(
            page=page,
            per_page=per_page,
            filters={'difficulty': difficulty},
            sort_field='name',
        )

    # ── Category Operations ────────────────────────────────────────

    async def list_categories(self) -> list[str]:
        """Get the distinct list of skill categories."""
        stmt = (
            select(Skill.category)
            .where(
                Skill.category.isnot(None),
                not Skill.is_deleted,
            )
            .distinct()
            .order_by(Skill.category)
        )
        result = await self.session.execute(stmt)
        return [row[0] for row in result.all() if row[0]]

    async def count_by_category(self) -> list[dict[str, Any]]:
        """Count skills grouped by category."""
        stmt = (
            select(
                Skill.category,
                func.count().label('count'),
            )
            .where(not Skill.is_deleted)
            .group_by(Skill.category)
            .order_by(Skill.category)
        )
        result = await self.session.execute(stmt)
        return [{'category': row[0], 'count': row[1]} for row in result.all()]

    # ── Skill Relationships ────────────────────────────────────────

    async def get_relationships(
        self,
        skill_id: UUID,
        direction: str = 'outgoing',
    ) -> list[SkillRelationship]:
        """Get all relationships for a skill in the specified direction."""
        if direction == 'incoming':
            stmt = select(SkillRelationship).where(
                SkillRelationship.target_skill_id == skill_id,
                not SkillRelationship.is_deleted,
            )
        else:
            stmt = select(SkillRelationship).where(
                SkillRelationship.source_skill_id == skill_id,
                not SkillRelationship.is_deleted,
            )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())

    async def add_relationship(
        self,
        source_skill_id: UUID,
        target_skill_id: UUID,
        relationship_type: str,
        weight: float | None = None,
    ) -> SkillRelationship:
        """Create a relationship between two skills."""
        rel = SkillRelationship(
            source_skill_id=source_skill_id,
            target_skill_id=target_skill_id,
            relationship_type=relationship_type,
            weight=weight,
        )
        self.session.add(rel)
        await self.session.flush()
        await self.session.refresh(rel)
        return rel

    async def remove_relationship(
        self,
        source_skill_id: UUID,
        target_skill_id: UUID,
        relationship_type: str | None = None,
    ) -> bool:
        """Remove (soft-delete) a skill relationship."""
        stmt = select(SkillRelationship).where(
            SkillRelationship.source_skill_id == source_skill_id,
            SkillRelationship.target_skill_id == target_skill_id,
        )
        if relationship_type:
            stmt = stmt.where(SkillRelationship.relationship_type == relationship_type)
        result = await self.session.execute(stmt)
        rel = result.scalar_one_or_none()
        if not rel:
            return False
        rel.is_deleted = True
        await self.session.flush()
        return True

    # ── Skill Graph ────────────────────────────────────────────────

    async def get_graph_for_skills(
        self,
        skill_ids: list[UUID],
    ) -> list[SkillRelationship]:
        """Get all relationships among a given set of skills."""
        if not skill_ids:
            return []
        stmt = select(SkillRelationship).where(
            SkillRelationship.source_skill_id.in_(skill_ids),
            SkillRelationship.target_skill_id.in_(skill_ids),
            not SkillRelationship.is_deleted,
        )
        result = await self.session.execute(stmt)
        return list(result.scalars().all())
