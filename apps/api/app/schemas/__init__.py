"""Pydantic DTO layer — complete API contract definitions.

This module exports all public DTOs organized by feature domain.
Every schema in this layer is independent of the SQLAlchemy ORM models.
"""

# Common / Shared
# Audit
from app.schemas.audit.audit import (
    AuditLogDetail,
    AuditLogEntry,
    AuditLogFilter,
    AuditLogList,
)

# Auth
from app.schemas.auth.auth import (
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    ResetPasswordRequest,
    SignupRequest,
    TokenResponse,
)

# Career
from app.schemas.career.career import (
    CareerCard,
    CareerCreate,
    CareerDetail,
    CareerOverview,
    CareerUpdate,
)
from app.schemas.career.recommendation import (
    CareerRecommendation,
    RelatedCareer,
)
from app.schemas.career.requirement import (
    CareerRequirement,
    RequirementDetail,
)
from app.schemas.career.roadmap import (
    CareerProgress,
    CareerRoadmap,
    RoadmapStep,
)
from app.schemas.common.errors import (
    ErrorDetail,
    ErrorResponse,
    ValidationErrorItem,
    ValidationErrorResponse,
)
from app.schemas.common.health import (
    HealthCheckDetail,
    HealthResponse,
)
from app.schemas.common.metadata import (
    APIVersion,
    Links,
    Metadata,
    ResponseMetadata,
)
from app.schemas.common.pagination import (
    CursorParams,
    CursorResponse,
    FilterParams,
    PageParams,
    PageResponse,
    PaginatedData,
    SortDirection,
    SortParams,
)
from app.schemas.graph.edge import GraphEdge

# Graph
from app.schemas.graph.node import GraphNode
from app.schemas.graph.path import PathStep, ShortestPath
from app.schemas.graph.statistics import (
    EdgeTypeCount,
    GraphStatistics,
    NodeTypeCount,
)
from app.schemas.graph.subgraph import Neighborhood, Subgraph, TraversalResult
from app.schemas.knowledge.dependency import (
    DependencyNode,
    DependencyTree,
    KnowledgeDependency,
)

# Knowledge
from app.schemas.knowledge.import_map import (
    ImportLearningGoal,
    ImportMap,
    ImportNode,
    ImportNodeResult,
    ImportProject,
    ImportReport,
)
from app.schemas.knowledge.node import (
    KnowledgeNodeCard,
    KnowledgeNodeCreate,
    KnowledgeNodeDetail,
    KnowledgeNodeLink,
    KnowledgeNodeList,
    KnowledgeNodeSummary,
    KnowledgeNodeUpdate,
)
from app.schemas.knowledge.recommendation import (
    KnowledgeRecommendation,
)
from app.schemas.knowledge.search import (
    GroupedSearchResult,
    KnowledgeSearchResult,
    SearchHighlight,
)
from app.schemas.learning.path import (
    LearningPathDetail,
    LearningPathSummary,
    PathNode,
)
from app.schemas.learning.progress import (
    ProgressDetail,
    ProgressStatistics,
    ProgressUpdate,
)

# Learning
from app.schemas.learning.resource import (
    LearningResourceCreate,
    LearningResourceDetail,
    LearningResourceSummary,
)
from app.schemas.learning.session import (
    LearningSessionCreate,
    LearningSessionUpdate,
    SessionSummary,
)
from app.schemas.project.outcome import (
    LearningOutcome,
    TechStack,
)

# Project
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

# Recommendation
from app.schemas.recommendation.recommendation import (
    RecommendationDetail,
    RecommendationDismiss,
    RecommendationList,
    RecommendationSummary,
    RecommendationTypeCount,
)

# Response envelope (existing)
from app.schemas.response import (
    APIResponse,
    error_response,
    success_response,
)
from app.schemas.search.history import (
    SearchHistoryCreate,
    SearchHistoryResponse,
)

# Search
from app.schemas.search.request import (
    AutocompleteRequest,
    FilterRequest,
    SearchRequest,
)
from app.schemas.search.result import (
    GroupedResult,
    HighlightFragment,
    SearchResult,
    SearchSuggestion,
)

# Skill
from app.schemas.skill.skill import (
    SkillCategoryCount,
    SkillCreate,
    SkillDetail,
    SkillGraph,
    SkillLink,
    SkillRelationshipCreate,
    SkillRelationshipSchema,
    SkillSummary,
    SkillUpdate,
)

# Tag
from app.schemas.tag.tag import (
    NodeTagCreate,
    NodeTagInfo,
    TagCreate,
    TagDetail,
    TagList,
    TagSummary,
    TagUpdate,
)
from app.schemas.user.bookmark import (
    BookmarkCreate,
    BookmarkDetail,
    BookmarkList,
)
from app.schemas.user.dashboard import (
    DashboardSummary,
    RecentActivity,
    UserStatistics,
)
from app.schemas.user.favorite import (
    FavoriteCreate,
    FavoriteDetail,
    FavoriteList,
)
from app.schemas.user.history import (
    LearningHistoryItem,
    SearchHistoryItem,
)
from app.schemas.user.history import (
    SearchHistoryCreate as UserSearchHistoryCreate,
)

# User
from app.schemas.user.profile import (
    ProfileUpdate,
    UserProfile,
    UserSettings,
    UserSummary,
)

__all__ = [
    # Response Envelope
    'APIResponse',
    # Common — Metadata
    'APIVersion',
    'AuditLogDetail',
    # Audit
    'AuditLogEntry',
    'AuditLogFilter',
    'AuditLogList',
    'AutocompleteRequest',
    'BookmarkCreate',
    'BookmarkDetail',
    'BookmarkList',
    # Career
    'CareerCard',
    'CareerCreate',
    'CareerDetail',
    'CareerOverview',
    'CareerProgress',
    'CareerRecommendation',
    'CareerRequirement',
    'CareerRoadmap',
    'CareerUpdate',
    'ChangePasswordRequest',
    'CursorParams',
    'CursorResponse',
    'DashboardSummary',
    'DependencyNode',
    'DependencyTree',
    'EdgeTypeCount',
    # Common — Errors
    'ErrorDetail',
    'ErrorResponse',
    'FavoriteCreate',
    'FavoriteDetail',
    'FavoriteList',
    'FilterParams',
    'FilterRequest',
    'ForgotPasswordRequest',
    'GraphEdge',
    # Graph
    'GraphNode',
    'GraphStatistics',
    'GroupedResult',
    'GroupedSearchResult',
    # Common — Health
    'HealthCheckDetail',
    # Import
    'HealthResponse',
    'HighlightFragment',
    # Import
    'ImportLearningGoal',
    'ImportMap',
    'ImportNode',
    'ImportNodeResult',
    'ImportProject',
    'ImportReport',
    # Knowledge — Dependency
    'KnowledgeDependency',
    # Knowledge — Node
    'KnowledgeNodeCard',
    'KnowledgeNodeCreate',
    'KnowledgeNodeDetail',
    'KnowledgeNodeLink',
    'KnowledgeNodeList',
    'KnowledgeNodeSummary',
    'KnowledgeNodeUpdate',
    # Knowledge — Recommendation
    'KnowledgeRecommendation',
    # Knowledge — Search
    'KnowledgeSearchResult',
    'LearningHistoryItem',
    'LearningOutcome',
    'LearningPathDetail',
    'LearningPathSummary',
    'LearningResourceCreate',
    'LearningResourceDetail',
    # Learning
    'LearningResourceSummary',
    'LearningSessionCreate',
    'LearningSessionUpdate',
    'Links',
    # Auth
    'LoginRequest',
    'LoginResponse',
    'Metadata',
    'Neighborhood',
    'NodeTagCreate',
    'NodeTagInfo',
    'NodeTypeCount',
    # Common — Pagination
    'PageParams',
    'PageResponse',
    'PaginatedData',
    'PathNode',
    'PathStep',
    'ProfileUpdate',
    'ProgressDetail',
    'ProgressStatistics',
    'ProgressUpdate',
    # Project
    'ProjectCard',
    'ProjectCreate',
    'ProjectDetail',
    'ProjectRequirement',
    'ProjectUpdate',
    'RecentActivity',
    'RecommendationDetail',
    'RecommendationDismiss',
    'RecommendationList',
    # Recommendation
    'RecommendationSummary',
    'RecommendationTypeCount',
    'RefreshRequest',
    'RelatedCareer',
    'RequiredSkill',
    'RequirementDetail',
    'ResetPasswordRequest',
    'ResponseMetadata',
    'RoadmapStep',
    'SearchHighlight',
    'SearchHistoryCreate',
    'SearchHistoryItem',
    'SearchHistoryResponse',
    # Search
    'SearchRequest',
    'SearchResult',
    'SearchSuggestion',
    'SessionSummary',
    'ShortestPath',
    'SignupRequest',
    'SkillCategoryCount',
    'SkillCreate',
    'SkillDetail',
    'SkillGraph',
    'SkillLink',
    'SkillRelationshipCreate',
    'SkillRelationshipSchema',
    # Skill
    'SkillSummary',
    'SkillUpdate',
    'SortDirection',
    'SortParams',
    'Subgraph',
    'TagCreate',
    'TagDetail',
    'TagList',
    # Tag
    'TagSummary',
    'TagUpdate',
    'TechStack',
    'TokenResponse',
    'TraversalResult',
    # User
    'UserProfile',
    'UserSearchHistoryCreate',
    'UserSettings',
    'UserStatistics',
    'UserSummary',
    'ValidationErrorItem',
    'ValidationErrorResponse',
    'error_response',
    'success_response',
]
