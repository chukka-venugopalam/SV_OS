"""Learning resource, path, session, and progress DTOs."""

from app.schemas.learning.resource import (
    LearningResourceSummary,
    LearningResourceDetail,
    LearningResourceCreate,
)
from app.schemas.learning.path import (
    LearningPathSummary,
    LearningPathDetail,
    PathNode,
)
from app.schemas.learning.session import (
    LearningSessionCreate,
    LearningSessionUpdate,
    SessionSummary,
)
from app.schemas.learning.progress import (
    ProgressUpdate,
    ProgressDetail,
    ProgressStatistics,
)

__all__ = [
    'LearningResourceSummary',
    'LearningResourceDetail',
    'LearningResourceCreate',
    'LearningPathSummary',
    'LearningPathDetail',
    'PathNode',
    'LearningSessionCreate',
    'LearningSessionUpdate',
    'SessionSummary',
    'ProgressUpdate',
    'ProgressDetail',
    'ProgressStatistics',
]
