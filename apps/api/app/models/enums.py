"""
Reusable enumeration types for the SV-OS domain model.

All enums are Python ``StrEnum`` classes so they are natively compatible
with both PostgreSQL and the Pydantic layer.

The custom ``PgEnumType`` (aliased as ``pg_enum``) is a **TypeDecorator**
that wraps a ``String`` column.  This design ensures that
``process_result_value`` is called on **every** read path (SELECT,
refresh, RETURNING after INSERT/UPDATE), unlike the previous design that
relied on an unreliable ``after_load`` event listener.

Architecture
------------
- **Database**: Values are stored as plain strings in a ``VARCHAR`` column
  with a ``CHECK`` constraint ensuring data integrity.
- **Python**: Values are always ``StrEnum`` members (e.g. ``UserRole.LEARNER``)
  when accessed on ORM model instances.
- **Conversion**: ``process_bind_param`` converts enum → string on write;
  ``process_result_value`` converts string → enum on read.

Benefits over the previous ``PgEnum(SAEnum)`` design
------------------------------------------------------
1. ``TypeDecorator.process_result_value`` is called on **all** read paths
   (SELECT, refresh, post-flush RETURNING population), not just initial load.
2. No dependency on asyncpg's native enum type codec (which bypasses
   SQLAlchemy's result processor for native enums).
3. No ORM event listeners needed — eliminates ``after_load`` fragility.
4. Works identically with all PostgreSQL drivers (asyncpg, psycopg3, etc.).
5. The interface ``pg_enum(EnumClass, 'enum_name')`` remains unchanged —
   no model files need modification.
"""

from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import String, TypeDecorator

# ────────────────────────────────────────────────────────────────────
# Custom Enum column type  (TypeDecorator-based)
# ────────────────────────────────────────────────────────────────────


class PgEnumType(TypeDecorator):
    """SQLAlchemy ``TypeDecorator`` that stores ``StrEnum`` values as
    plain strings in the database and reconstitutes them as proper
    Python enum members on read.

    Unlike the previous ``PgEnum(SAEnum)`` design, this implementation
    guarantees that ``process_result_value`` is called on **every** read
    path (SELECT, refresh, post-flush RETURNING), eliminating the need
    for fragile ``after_load`` event listeners.

    Bind path (Python → DB)
        ``StrEnum`` member (e.g. ``UserRole.LEARNER``) → ``'learner'``
        Plain string (e.g. ``'learner'``)              → ``'learner'``

    Result path (DB → Python)
        ``'learner'`` (from DB) → ``UserRole.LEARNER``

    Parameters
    ----------
    enum_cls : type[enum.Enum]
        The Python enum class (e.g. ``UserRole``, ``Difficulty``).
    name : str
        A descriptive name for the column (used for error messages).
    """

    impl = String
    cache_ok = True

    def __init__(
        self,
        enum_cls: type[enum.Enum],
        _name: str,
    ) -> None:
        self._user_enum = enum_cls
        # ``_name`` is accepted for backward compatibility with the
        # ``pg_enum(EnumClass, 'pg_enum_name')`` call signature used
        # across all model files.  It is no longer needed for the
        # ``TypeDecorator`` implementation, but kept for interface
        # compatibility so no model file changes are required.
        super().__init__(length=50)

    def process_bind_param(
        self,
        value: Any,
        _dialect: Any,
    ) -> str | None:
        """Convert a Python value to the database string.

        * ``StrEnum`` member (e.g. ``UserRole.LEARNER``) → ``'learner'``
        * Plain string (e.g. ``'learner'``)              → ``'learner'``
        * ``None``                                       → ``None``
        """
        if value is None:
            return None
        if isinstance(value, enum.Enum):
            return value.value
        if isinstance(value, str):
            return value
        return str(value)

    def process_result_value(
        self,
        value: Any,
        _dialect: Any,
    ) -> enum.Enum | None:
        """Convert a database string back to a Python ``StrEnum`` member.

        This method is called on **every** read from the database,
        including:
        - ``SELECT`` queries (initial load)
        - ``session.refresh()``
        - Post-flush ``RETURNING`` clause population
        - ``session.get()``

        Returns:
            A proper ``StrEnum`` member, or ``None`` if the value is ``None``.
        """
        if value is None:
            return None
        if isinstance(value, self._user_enum):
            return value  # Already a proper enum member — no conversion needed
        if isinstance(value, str):
            try:
                return self._user_enum(value)
            except (ValueError, KeyError):
                # Fallback: return as-is (shouldn't happen with CHECK constraint)
                return value  # type: ignore[return-value]
        # Defensive fallback for unexpected types
        return self._user_enum(str(value))


# Backward-compatible alias — every model imports ``pg_enum``.
pg_enum = PgEnumType


# ────────────────────────────────────────────────────────────────────
# Enum Definitions
# ────────────────────────────────────────────────────────────────────


class NodeType(enum.StrEnum):
    """Discriminator for the type of a knowledge node."""

    SUBJECT = 'subject'
    CONCEPT = 'concept'
    TECHNOLOGY = 'technology'
    TOOL = 'tool'
    CAREER = 'career'
    PROJECT = 'project'


class EdgeType(enum.StrEnum):
    """Semantic type of a directed edge in the knowledge graph."""

    PREREQUISITE = 'prerequisite'
    DEPENDS_ON = 'depends_on'
    USES = 'uses'
    ENABLES = 'enables'
    PART_OF = 'part_of'
    RELATED_TO = 'related_to'
    LEADS_TO = 'leads_to'
    REQUIRES = 'requires'


class EdgeDirection(enum.StrEnum):
    """Directionality of a graph edge."""

    FORWARD = 'forward'
    BIDIRECTIONAL = 'bidirectional'
    UNIDIRECTIONAL = 'unidirectional'


class Difficulty(enum.StrEnum):
    """Educational difficulty / complexity level."""

    BEGINNER = 'beginner'
    INTERMEDIATE = 'intermediate'
    ADVANCED = 'advanced'
    EXPERT = 'expert'


class ProgressStatus(enum.StrEnum):
    """Status of a user's progress on a knowledge node."""

    NOT_STARTED = 'not_started'
    LEARNING = 'learning'
    COMPLETED = 'completed'
    MASTERED = 'mastered'


class DemandLevel(enum.StrEnum):
    """Market demand trend for a career."""

    DECLINING = 'declining'
    STABLE = 'stable'
    GROWING = 'growing'
    HIGH_DEMAND = 'high_demand'


class UserRole(enum.StrEnum):
    """Authorization role assigned to a user."""

    LEARNER = 'learner'
    ADMIN = 'admin'


class ResourceType(enum.StrEnum):
    """Category of an external learning resource."""

    VIDEO = 'video'
    ARTICLE = 'article'
    COURSE = 'course'
    BOOK = 'book'
    DOCUMENTATION = 'documentation'
    TOOL = 'tool'
    PODCAST = 'podcast'
    INTERACTIVE = 'interactive'


class Visibility(enum.StrEnum):
    """Visibility scope for user-generated content."""

    PUBLIC = 'public'
    PRIVATE = 'private'
    SHARED = 'shared'


class LearningStatus(enum.StrEnum):
    """Status of a learning session."""

    ACTIVE = 'active'
    PAUSED = 'paused'
    COMPLETED = 'completed'
    ABANDONED = 'abandoned'


class RecommendationType(enum.StrEnum):
    """Category of a recommendation."""

    CAREER_PATH = 'career_path'
    LEARNING_PATH = 'learning_path'
    SKILL_GAP = 'skill_gap'
    RELATED_CONTENT = 'related_content'
    POPULAR = 'popular'
    NEXT_STEP = 'next_step'


class RequirementType(enum.StrEnum):
    """How strongly a node is required for a career or project."""

    REQUIRED = 'required'
    RECOMMENDED = 'recommended'
    BONUS = 'bonus'


class SkillRelationshipType(enum.StrEnum):
    """Semantic relationship between two skills."""

    PREREQUISITE = 'prerequisite'
    BUILD_UPON = 'builds_upon'
    COMPLEMENT = 'complement'
    SPECIALIZATION = 'specialization'
    ALTERNATIVE = 'alternative'
