"""Application services — business logic layer.

Services compose repository operations through the Unit of Work
pattern and contain all business logic.  They consume SQLAlchemy
models and produce Pydantic DTOs for the API layer.
"""

from app.services.activity_feed import ActivityFeedService
from app.services.auth import AuthService, AuthenticationError, AuthorizationError
from app.services.bookmark import BookmarkService
from app.services.career import CareerService
from app.services.favorite import FavoriteService
from app.services.graph import GraphService
from app.services.graph.analytics import GraphAnalyticsService
from app.services.graph.traversal import GraphTraversalService
from app.services.knowledge_node import KnowledgeNodeService
from app.services.learning_path import LearningPathService
from app.services.learning_path_generator import LearningPathGenerator
from app.services.progress import ProgressService
from app.services.progress_intelligence import ProgressIntelligence
from app.services.project import ProjectService
from app.services.recommendation import RecommendationService
from app.services.recommendation_engine import RecommendationEngine
from app.services.search import SearchService
from app.services.skill import SkillService
from app.services.user import UserService

# AI services
from app.services.ai import (
    EmbeddingService,
    ProviderType,
    SemanticSearchService,
    HybridSearchService,
    RankingService,
    RankedResult,
    RecommendationV2,
    SimilarityService,
)

__all__ = [
    'AuthService',
    'AuthenticationError',
    'AuthorizationError',
    'UserService',
    'KnowledgeNodeService',
    'GraphService',
    'GraphTraversalService',
    'GraphAnalyticsService',
    'CareerService',
    'ProjectService',
    'SkillService',
    'LearningPathService',
    'LearningPathGenerator',
    'ProgressService',
    'ProgressIntelligence',
    'BookmarkService',
    'FavoriteService',
    'RecommendationService',
    'RecommendationEngine',
    'SearchService',
    'ActivityFeedService',
    'EmbeddingService',
    'ProviderType',
    'SemanticSearchService',
    'HybridSearchService',
    'RankingService',
    'RankedResult',
    'RecommendationV2',
    'SimilarityService',
]
