"""
Reusable enumeration types for the SV-OS domain model.

All enums are Python ``str`` + ``enum.Enum`` classes so they are
natively compatible with SQLAlchemy's ``Enum`` type and PostgreSQL
native enum columns.

.. note::

    Standard SQLAlchemy ``Enum`` with ``native_enum=True`` passes
    the Python enum class directly to the ``asyncpg`` driver, which
    then serialises members via ``.name`` (e.g. ``"LEARNER"``)
    instead of ``.value`` (e.g. ``"learner"``).  Because our PostgreSQL
    native enum labels are lowercase values, this produces
    ``InvalidTextRepresentationError``.

    ``PgEnum`` works around this by:

    #. Passing only the **lowercase ``.value`` strings** to the base
       ``Enum`` — no Python enum class is registered with asyncpg at
       all, so asyncpg treats everything as plain strings for encoding.
    #. Overriding ``result_processor`` to install a custom decode step
       that converts the raw PostgreSQL string back into the proper
       Python enum member.  This is necessary because ``asyncpg``
       returns raw strings when no Python enum codec is registered,
       and SQLAlchemy's native-enum ``result_processor`` returns
       ``None`` by default.
"""

from __future__ import annotations

import enum
from typing import Any, Callable

from sqlalchemy import Enum as SAEnum


class PgEnum(SAEnum):
    """SQLAlchemy ``Enum`` type that serialises Python ``str`` + ``Enum``
    members using their **value** (e.g. ``'learner'``) instead of their
    **name** (e.g. ``'LEARNER'``).

    Bind (Python → DB) passes the raw ``.value`` string so that
    ``asyncpg`` never receives a Python enum member it would serialise
    by ``.name``.

    Result (DB → Python) installs a custom ``result_processor`` that
    converts the PostgreSQL returned string back to the proper Python
    enum member via ``enum_cls(string)``.

    Parameters
    ----------
    enum_cls : Python ``enum.Enum`` subclass
        The Python enum class (e.g. ``UserRole``, ``Difficulty``).
    name : str
        The name of the PostgreSQL enum type (e.g. ``"user_role_enum"``).
    """

    _user_enum: type[enum.Enum]

    def __init__(
        self,
        enum_cls: type[enum.Enum],
        name: str,
    ) -> None:
        self._user_enum = enum_cls
        # ── Pass only the lowercase .value strings to the base type ──
        # The base Enum.__init__ normally receives a Python enum class
        # as the first argument and registers it with asyncpg.  By
        # supplying *v.value strings instead, there is **no Python enum
        # class** for asyncpg to serialise via .name.  asyncpg treats
        # every value as a plain string, which matches the PostgreSQL
        # native enum labels exactly.
        super().__init__(
            *(v.value for v in enum_cls),
            name=name,
            native_enum=True,
            create_type=False,
        )

    # ── Bind (Python value → database parameter) ───────────────────

    def process_bind_param(
        self,
        value: Any,
        dialect: Any,
    ) -> str | None:
        """Convert a Python value to the database string.

        * ``Enum`` member (e.g. ``UserRole.LEARNER``) → ``'learner'``
        * Plain string (e.g. ``'learner'``)           → ``'learner'``
        """
        if value is None:
            return None

        # ``str`` + ``Enum`` classes make ``isinstance(x, TheEnum)``
        # return True for both real enum members AND plain strings
        # (because the enum inherits from ``str``).  We distinguish
        # real members by checking ``hasattr(value, 'value')``, which
        # only enum instances have.
        if isinstance(value, self._user_enum) and hasattr(value, 'value'):
            return value.value

        if isinstance(value, str):
            return value

        return str(value)

    # ── Result (database value → Python value) ─────────────────────

    def result_processor(
        self,
        dialect: Any,
        coltype: Any,
    ) -> Callable[[Any], Any] | None:
        """Return a callable that converts the database string back
        to the proper Python enum member.

        The base ``Enum.result_processor`` returns ``None`` for native
        PostgreSQL enums because it expects ``asyncpg`` to handle the
        conversion.  Since our ``__init__`` does **not** register a
        Python enum class with asyncpg, it returns the raw string.

        Our override always installs a processor so that the returned
        ORM attribute is a *bona fide* Python enum member.
        """
        # ── Collect enum lookup helper ──────────────────────────────
        user_enum = self._user_enum

        # Ensure we still get the base processor if one exists
        # (rare for native enums, but harmless to chain)
        base_processor = super().result_processor(dialect, coltype)

        if user_enum is None:
            return base_processor

        def _process(value: Any) -> Any:
            if value is None:
                return None

            # Let the base processor run first if it exists
            if base_processor is not None:
                value = base_processor(value)

            # Convert the final string value to an enum member
            if isinstance(value, str):
                try:
                    return user_enum(value)
                except (ValueError, KeyError):
                    pass

            return value

        return _process


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
