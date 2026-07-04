"""Application services — business logic layer.

Services compose repository operations through the Unit of Work
pattern and contain all business logic.  They consume SQLAlchemy
models and produce Pydantic DTOs for the API layer.
"""

from app.services.auth import AuthService, AuthenticationError, AuthorizationError
from app.services.bookmark import BookmarkService
from app.services.career import CareerService
from app.services.favorite import FavoriteService
from app.services.graph import GraphService
from app.services.knowledge_node import KnowledgeNodeService
from app.services.learning_path import LearningPathService
from app.services.progress import ProgressService
from app.services.project import ProjectService
from app.services.recommendation import RecommendationService
from app.services.search import SearchService
from app.services.skill import SkillService
from app.services.user import UserService

__all__ = [
    'AuthService',
    'AuthenticationError',
    'AuthorizationError',
    'UserService',
    'KnowledgeNodeService',
    'GraphService',
    'CareerService',
    'ProjectService',
    'SkillService',
    'LearningPathService',
    'ProgressService',
    'BookmarkService',
    'FavoriteService',
    'RecommendationService',
    'SearchService',
]
