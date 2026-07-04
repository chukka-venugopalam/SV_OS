"""Project DTOs."""

from app.schemas.project.project import (
    ProjectCard,
    ProjectDetail,
    ProjectCreate,
    ProjectUpdate,
)
from app.schemas.project.requirement import (
    ProjectRequirement,
    RequiredSkill,
)
from app.schemas.project.outcome import (
    LearningOutcome,
    TechStack,
)

__all__ = [
    'ProjectCard',
    'ProjectDetail',
    'ProjectCreate',
    'ProjectUpdate',
    'ProjectRequirement',
    'RequiredSkill',
    'LearningOutcome',
    'TechStack',
]
