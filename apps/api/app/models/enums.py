"""
Reusable enumeration types for the SV-OS domain model.

All enums are Python ``str`` + ``enum.Enum`` classes so they are
natively compatible with SQLAlchemy's ``Enum`` type and PostgreSQL
native enum columns.

.. note::

    Standard SQLAlchemy ``Enum`` with ``native_enum=True`` passes
    the Python enum class to the ``asyncpg`` driver, which then
    serialises members via ``.name`` (e.g. ``"LEARNER"``) instead
    of ``.value`` (e.g. ``"learner"``).  Because our PostgreSQL
    native enum labels are lowercase values, this produces
    ``InvalidTextRepresentationError``.

    ``PgEnum`` avoids this by passing only the **lowercase ``.value``
    strings** to the base ``Enum`` — since no Python enum class is
    registered with asyncpg, every value is treated as a plain string
    and sent as-is to PostgreSQL.

    The trade‑off is that ``asyncpg`` returns the raw string on
    read-back.  SQLAlchemy's ``result_processor`` / ``process_result_value``
    are **not called** for native PostgreSQL enums because ``asyncpg``
    handles all result conversion at the driver level via registered
    type codecs.

    To bridge the gap, we register an ORM-level ``after_load`` event
    that converts any string attribute backed by a ``PgEnum`` column
    to the proper Python enum member.  This runs after ``asyncpg``
    and SQLAlchemy's type system have both finished.
"""

from __future__ import annotations

import enum
from typing import Any

from sqlalchemy import Enum as SAEnum, event
from sqlalchemy.orm import ColumnProperty, Mapper
from sqlalchemy.orm.attributes import instance_state

# ────────────────────────────────────────────────────────────────────
# Custom Enum column type
# ────────────────────────────────────────────────────────────────────


class PgEnum(SAEnum):
    """SQLAlchemy ``Enum`` type that serialises Python ``str`` + ``Enum``
    members using their **value** (e.g. ``'learner'``) instead of their
    **name** (e.g. ``'LEARNER'``).

    Bind path (Python → DB)
        Returns ``.value`` as a plain string so asyncpg never receives
        a Python enum member that it would serialise by ``.name``.

    Result path (DB → Python)
        ``asyncpg`` returns the raw string (no Python enum class is
        registered with it).  An ORM ``after_load`` event listener
        (registered at module level) converts the string back to the
        proper Python enum member.

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
        # Pass only the lowercase .value strings — no enum class.
        # This prevents asyncpg from registering a type codec that
        # would serialise members by .name.
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

        # Real enum members have a ``.value`` attribute; plain strings
        # do not — even though ``str`` + ``Enum`` makes ``isinstance``
        # True for both.
        if isinstance(value, self._user_enum) and hasattr(value, 'value'):
            return value.value

        if isinstance(value, str):
            return value

        return str(value)


# Backward-compatible alias — every model imports ``pg_enum``.
pg_enum = PgEnum


# ────────────────────────────────────────────────────────────────────
# ORM-level load listener
#  asyncpg bypasses SQLAlchemy's result_processor for native enums.
#  This listener catches every mapped instance after loading and
#  converts string attributes backed by PgEnum columns.
#
# SQLAlchemy 2.0 removed ``MapperEvents.after_load``.
# ``InstanceEvents.load`` is the correct replacement, and can be
# registered via ``Mapper`` as the target class since ``Mapper``
# dispatches ``InstanceEvents`` for all ORM-mapped classes.
# ────────────────────────────────────────────────────────────────────


def _convert_pgenum_instance(instance: Any) -> None:
    """Convert any string-typed PgEnum attributes on *instance*
    to their proper Python enum members in-place.
    """
    mapper = instance_state(instance).mapper
    for attr in mapper.attrs:
        if not isinstance(attr, ColumnProperty):
            continue

        column = attr.columns[0]
        if not isinstance(column.type, PgEnum):
            continue

        enum_cls = column.type._user_enum
        if enum_cls is None:
            continue

        value = getattr(instance, attr.key, None)
        if isinstance(value, enum_cls):
            continue  # Already a proper enum member
        if not isinstance(value, str):
            continue

        try:
            setattr(instance, attr.key, enum_cls(value))
        except (ValueError, KeyError):
            pass  # Leave the raw string if conversion fails


@event.listens_for(Mapper, 'load')
def _convert_pgenum_on_load(mapper: Mapper, context: Any, target: Any) -> None:
    """``Mapper.load`` (``InstanceEvents.load``) — fires for every
    ORM-mapped instance loaded from the database across all mappers.
    Delegates to ``_convert_pgenum_instance`` which promotes string
    attributes backed by PgEnum columns to proper Python enum members.
    """
    _convert_pgenum_instance(target)


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
