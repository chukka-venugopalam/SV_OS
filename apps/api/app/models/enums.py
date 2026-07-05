"""
Reusable enumeration types for the SV-OS domain model.

All enums are Python ``str`` + ``enum.Enum`` classes so they are
natively compatible with SQLAlchemy's ``Enum`` type and PostgreSQL
native enum columns.
"""

from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import Enum


def pg_enum(enum_cls: type[enum.Enum], name: str) -> Any:
    """Build a SQLAlchemy ``Enum`` column type mapped to an existing
    PostgreSQL native enum type.

    Parameters
    ----------
    enum_cls : Python ``enum.Enum`` subclass
        The Python enum class (e.g. ``UserRole``, ``Difficulty``).
    name : str
        The name of the PostgreSQL enum type created by Alembic
        (e.g. ``"user_role_enum"``, ``"difficulty_enum"``).

    Returns
    -------
    ``sqlalchemy.Enum`` instance configured with:

    * ``native_enum=True`` — use the PostgreSQL native enum type.
    * ``create_type=False`` — do **not** auto-create the type (already exists).
    * ``values_callable=lambda e: [i.value for i in e]`` — store
      **enum values** (lowercase strings) instead of Python member names.

    Example
    -------
    .. code-block:: python

        role: Mapped[UserRole] = mapped_column(
            pg_enum(UserRole, "user_role_enum"),
            default=UserRole.LEARNER,
            server_default=text("'learner'"),
            nullable=False,
        )
    """
    return Enum(
        enum_cls,
        name=name,
        native_enum=True,
        create_type=False,
        values_callable=lambda e: [i.value for i in e],
    )


class NodeType(str, enum.Enum):
    """Discriminator for the type of a knowledge node."""

    SUBJECT = 'subject'
    CONCEPT = 'concept'
    TECHNOLOGY = 'technology'
    TOOL = 'tool'
    CAREER = 'career'
    PROJECT = 'project'


class EdgeType(str, enum.Enum):
    """Semantic type of a directed edge in the knowledge graph."""

    PREREQUISITE = 'prerequisite'
    DEPENDS_ON = 'depends_on'
    USES = 'uses'
    ENABLES = 'enables'
    PART_OF = 'part_of'
    RELATED_TO = 'related_to'
    LEADS_TO = 'leads_to'
    REQUIRES = 'requires'


class EdgeDirection(str, enum.Enum):
    """Directionality of a graph edge."""

    FORWARD = 'forward'
    BIDIRECTIONAL = 'bidirectional'
    UNIDIRECTIONAL = 'unidirectional'


class Difficulty(str, enum.Enum):
    """Educational difficulty / complexity level."""

    BEGINNER = 'beginner'
    INTERMEDIATE = 'intermediate'
    ADVANCED = 'advanced'
    EXPERT = 'expert'


class ProgressStatus(str, enum.Enum):
    """Status of a user's progress on a knowledge node."""

    NOT_STARTED = 'not_started'
    LEARNING = 'learning'
    COMPLETED = 'completed'
    MASTERED = 'mastered'


class DemandLevel(str, enum.Enum):
    """Market demand trend for a career."""

    DECLINING = 'declining'
    STABLE = 'stable'
    GROWING = 'growing'
    HIGH_DEMAND = 'high_demand'


class UserRole(str, enum.Enum):
    """Authorization role assigned to a user."""

    LEARNER = 'learner'
    ADMIN = 'admin'


class ResourceType(str, enum.Enum):
    """Category of an external learning resource."""

    VIDEO = 'video'
    ARTICLE = 'article'
    COURSE = 'course'
    BOOK = 'book'
    DOCUMENTATION = 'documentation'
    TOOL = 'tool'
    PODCAST = 'podcast'
    INTERACTIVE = 'interactive'


class Visibility(str, enum.Enum):
    """Visibility scope for user-generated content."""

    PUBLIC = 'public'
    PRIVATE = 'private'
    SHARED = 'shared'


class LearningStatus(str, enum.Enum):
    """Status of a learning session."""

    ACTIVE = 'active'
    PAUSED = 'paused'
    COMPLETED = 'completed'
    ABANDONED = 'abandoned'


class RecommendationType(str, enum.Enum):
    """Category of a recommendation."""

    CAREER_PATH = 'career_path'
    LEARNING_PATH = 'learning_path'
    SKILL_GAP = 'skill_gap'
    RELATED_CONTENT = 'related_content'
    POPULAR = 'popular'
    NEXT_STEP = 'next_step'


class RequirementType(str, enum.Enum):
    """How strongly a node is required for a career or project."""

    REQUIRED = 'required'
    RECOMMENDED = 'recommended'
    BONUS = 'bonus'


class SkillRelationshipType(str, enum.Enum):
    """Semantic relationship between two skills."""

    PREREQUISITE = 'prerequisite'
    BUILD_UPON = 'builds_upon'
    COMPLEMENT = 'complement'
    SPECIALIZATION = 'specialization'
    ALTERNATIVE = 'alternative'
