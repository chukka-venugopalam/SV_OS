"""Application services — business logic layer.

Services compose repository operations through the Unit of Work
pattern and contain all business logic.  They consume SQLAlchemy
models and produce Pydantic DTOs for the API layer.
"""

from app.services.activity_feed import ActivityFeedService

# AI services
from app.services.ai import (
    EmbeddingService,
    HybridSearchService,
    ProviderType,
    RankedResult,
    RankingService,
    RecommendationV2,
    SemanticSearchService,
    SimilarityService,
)
from app.services.auth import AuthenticationError, AuthorizationError, AuthService
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

__all__ = [
    'ActivityFeedService',
    'AuthService',
    'AuthenticationError',
    'AuthorizationError',
    'BookmarkService',
    'CareerService',
    'EmbeddingService',
    'FavoriteService',
    'GraphAnalyticsService',
    'GraphService',
    'GraphTraversalService',
    'HybridSearchService',
    'KnowledgeNodeService',
    'LearningPathGenerator',
    'LearningPathService',
    'ProgressIntelligence',
    'ProgressService',
    'ProjectService',
    'ProviderType',
    'RankedResult',
    'RankingService',
    'RecommendationEngine',
    'RecommendationService',
    'RecommendationV2',
    'SearchService',
    'SemanticSearchService',
    'SimilarityService',
    'SkillService',
    'UserService',
]
