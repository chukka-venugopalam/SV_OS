"""Pydantic schemas for the Stage 5.1 reference dataset import format.

Matches the ``computer_science_map.json`` schema exactly:

- ``ImportMap`` — top-level container (nodes, projects, learning_goals)
- ``ImportNode`` — a single knowledge node in the import payload
- ``ImportProject`` — a single project in the import payload
- ``ImportLearningGoal`` — a career/learning-goal definition
- ``ImportReport`` — structured result of a completed import

Critical design rule
--------------------
``unlocks`` is **never** accepted as input data.  It is always computed
from ``prerequisites`` during the graph-building phase.  If source data
includes ``unlocks``, it is ignored with a warning.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class ImportNode(BaseModel):
    """A single knowledge node in the import payload."""

    id: str = Field(
        description='Unique slug/identifier (e.g. "prog-basics")',
        examples=['prog-basics'],
    )
    title: str = Field(description='Human-readable title')
    summary: str = Field(description='Short description / abstract')
    domain: str = Field(description='Domain or category name (e.g. "Programming Fundamentals")')
    difficulty: int = Field(ge=1, le=5, description='Difficulty level 1-5')
    estimated_time: int | float = Field(gt=0, description='Estimated learning time (hours)')
    prerequisites: list[str] = Field(
        default_factory=list,
        description='IDs of prerequisite nodes',
    )
    skills: list[str] = Field(
        default_factory=list,
        description='Skills taught by this node',
    )
    projects: list[str] = Field(
        default_factory=list,
        description='Project IDs linked to this node',
    )
    careers: list[str] = Field(
        default_factory=list,
        description='Career/learning-goal tags',
    )
    resources: list[str] = Field(
        default_factory=list,
        description='External learning resource descriptions',
    )
    simulators: list[str] = Field(
        default_factory=list,
        description='Simulator/visualizer names',
    )
    learning_outcomes: list[str] = Field(
        default_factory=list,
        description='Measurable learning outcomes',
    )


class ImportProject(BaseModel):
    """A project in the import payload."""

    id: str = Field(description='Unique project identifier (e.g. "p1")')
    title: str = Field(description='Human-readable project title')
    difficulty: int = Field(ge=1, le=5, description='Difficulty level 1-5')
    estimated_time: int | float = Field(gt=0, description='Estimated completion time (hours)')
    linked_nodes: list[str] = Field(
        default_factory=list,
        description='Node IDs that this project reinforces',
    )
    careers: list[str] = Field(
        default_factory=list,
        description='Career tags for relevance',
    )
    portfolio_value: str = Field(
        default='medium',
        description='Portfolio value (low/medium/high)',
    )


class ImportLearningGoal(BaseModel):
    """A career/learning-goal definition with recommended node order."""

    id: str = Field(description='Unique goal identifier (e.g. "AI", "CSE")')
    title: str = Field(description='Human-readable goal title')
    recommended_order: list[str] = Field(
        description='Node IDs in recommended learning sequence',
    )


class ImportMap(BaseModel):
    """Top-level container matching the ``computer_science_map.json`` schema."""

    map_version: str = Field(default='0.1-reference')
    stage: str = Field(default='')
    note: str = Field(default='')
    domains: list[str] = Field(default_factory=list)
    node_count: int = Field(default=0)
    nodes: list[ImportNode] = Field(default_factory=list)
    projects: list[ImportProject] = Field(default_factory=list)
    learning_goals: list[ImportLearningGoal] = Field(default_factory=list)

    @field_validator('node_count')
    @classmethod
    def validate_node_count(cls, v: int, info: Any) -> int:
        """If provided, node_count should match the actual number of nodes."""
        data = info.data
        if 'nodes' in data:
            actual = len(data['nodes'])
            if v != actual and v != 0:
                raise ValueError(
                    f'node_count={v} does not match actual number of nodes ({actual})',
                )
        return v


class ImportNodeResult(BaseModel):
    """Result summary for a single imported node."""

    id: str
    title: str
    domain: str
    difficulty: int
    prerequisites: list[str]
    unlocks: list[str]
    action: str = 'created'  # created | updated | skipped


class ImportReport(BaseModel):
    """Structured result of a completed import operation."""

    success: bool
    total_nodes: int = 0
    total_edges: int = 0
    total_projects: int = 0
    total_goals: int = 0
    total_resources: int = 0
    domains: list[str] = Field(default_factory=list)
    domain_breakdown: dict[str, int] = Field(default_factory=dict)
    errors: list[str] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    topological_order: list[str] = Field(default_factory=list)
    topological_order_length: int = 0
    root_nodes: list[str] = Field(
        default_factory=list,
        description='Nodes with no prerequisites',
    )
    leaf_nodes: list[str] = Field(
        default_factory=list,
        description='Nodes that unlock nothing',
    )
    deepest_node: str | None = Field(
        default=None,
        description='Node with the longest prerequisite chain',
    )
    node_results: list[ImportNodeResult] = Field(default_factory=list)


__all__ = [
    'ImportLearningGoal',
    'ImportMap',
    'ImportNode',
    'ImportNodeResult',
    'ImportProject',
    'ImportReport',
]
