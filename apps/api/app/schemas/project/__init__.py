"""Project DTOs."""

from app.schemas.project.outcome import (
    LearningOutcome,
    TechStack,
)
from app.schemas.project.project import (
    ProjectCard,
    ProjectCreate,
    ProjectDetail,
    ProjectUpdate,
)
from app.schemas.project.requirement import (
    ProjectRequirement,
    RequiredSkill,
)

__all__ = [
    'LearningOutcome',
    'ProjectCard',
    'ProjectCreate',
    'ProjectDetail',
    'ProjectRequirement',
    'ProjectUpdate',
    'RequiredSkill',
    'TechStack',
]
