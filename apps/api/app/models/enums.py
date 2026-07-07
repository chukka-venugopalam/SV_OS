"""
Reusable enumeration types for the SV-OS domain model.

All enums are Python ``str`` + ``enum.Enum`` classes so they are
natively compatible with SQLAlchemy's ``Enum`` type and PostgreSQL
native enum columns.

.. warning::

    SQLAlchemy's built-in ``Enum`` type uses **member names** (``.name``)
    by default when registering Python enums with the asyncpg driver.
    For ``str`` + ``Enum`` classes such as ``UserRole(LEARNER='learner')``,
    asyncpg serialises the Python member name ``'LEARNER'`` instead of
    the value ``'learner'``, causing
    ``InvalidTextRepresentationError`` at the database level.

    ``PgEnum`` works around this by:

    #. Passing explicit ``.value`` strings to the parent ``Enum`` type
       so no Python enum class is registered with asyncpg at all.
    #. Overriding ``process_bind_param`` to always return the string
       ``.value`` for enum members.
    #. Overriding ``process_result_value`` to convert result strings
       back to the proper Python enum member.
"""

from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import Enum as SAEnum


class PgEnum(SAEnum):
    """SQLAlchemy ``Enum`` type that serialises Python ``str`` + ``Enum``
    members using their **value** (e.g. ``'learner'``) instead of their
    **name** (e.g. ``'LEARNER'``).

    This prevents ``asyncpg`` from sending the uppercase member name
    to PostgreSQL native enum columns, which would cause
    ``InvalidTextRepresentationError``.

    Parameters
    ----------
    enum_cls : Python ``enum.Enum`` subclass
        The Python enum class (e.g. ``UserRole``, ``Difficulty``).
    name : str
        The name of the PostgreSQL enum type (e.g. ``"user_role_enum"``).
    """

    def __init__(
        self,
        enum_cls: type[enum.Enum],
        name: str,
    ) -> None:
        self._user_enum: type[enum.Enum] = enum_cls
        # Pass the STRING VALUES (not the enum class) to the parent so
        # that asyncpg never sees a Python enum member it would convert
        # via .name.  The parent treats everything as plain strings.
        super().__init__(
            *(v.value for v in enum_cls),
            name=name,
            native_enum=True,
            create_type=False,
        )

    def process_bind_param(
        self,
        value: Any,
        dialect: Any,
    ) -> str | None:
        """Convert a Python value to the database string.

        * ``Enum`` member (e.g. ``UserRole.LEARNER``) → ``'learner'``
        * Plain string (e.g. ``'learner'``)               → ``'learner'``
        """
        if value is None:
            return None

        # Distinguish a real enum member from a plain string.
        # We cannot rely on isinstance(value, self._user_enum) alone
        # because ``str`` + ``Enum`` classes make ``isinstance('learner', UserRole)``
        # return True (``UserRole`` inherits from ``str``).
        if isinstance(value, self._user_enum) and hasattr(value, 'value'):
            return value.value

        if isinstance(value, str):
            return value

        return str(value)

    def process_result_value(
        self,
        value: Any,
        dialect: Any,
    ) -> enum.Enum | None:
        """Convert a database result string back to a Python ``Enum`` member."""
        if value is None:
            return None

        if isinstance(value, str) and self._user_enum is not None:
            try:
                return self._user_enum(value)
            except (ValueError, KeyError):
                pass

        return value


# Backward-compatible alias — every model imports ``pg_enum``.
pg_enum = PgEnum


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
