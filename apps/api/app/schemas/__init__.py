"""Pydantic DTO layer — complete API contract definitions.

This module exports all public DTOs organized by feature domain.
Every schema in this layer is independent of the SQLAlchemy ORM models.
"""

# Common / Shared
from app.schemas.common.pagination import (
    CursorParams,
    CursorResponse,
    FilterParams,
    PageParams,
    PageResponse,
    SortDirection,
    SortParams,
    PaginatedData,
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
from app.schemas.common.errors import (
    ErrorDetail,
    ValidationErrorItem,
    ErrorResponse,
    ValidationErrorResponse,
)

# Response envelope (existing)
from app.schemas.response import (
    APIResponse,
    success_response,
    error_response,
)

# Knowledge
from app.schemas.knowledge.node import (
    KnowledgeNodeCard,
    KnowledgeNodeSummary,
    KnowledgeNodeDetail,
    KnowledgeNodeCreate,
    KnowledgeNodeUpdate,
    KnowledgeNodeList,
    KnowledgeNodeLink,
)
from app.schemas.knowledge.search import (
    KnowledgeSearchResult,
    GroupedSearchResult,
    SearchHighlight,
)
from app.schemas.knowledge.dependency import (
    KnowledgeDependency,
    DependencyNode,
    DependencyTree,
)
from app.schemas.knowledge.recommendation import (
    KnowledgeRecommendation,
)

# Graph
from app.schemas.graph.node import GraphNode
from app.schemas.graph.edge import GraphEdge
from app.schemas.graph.subgraph import Subgraph, Neighborhood, TraversalResult
from app.schemas.graph.path import ShortestPath, PathStep
from app.schemas.graph.statistics import (
    GraphStatistics,
    NodeTypeCount,
    EdgeTypeCount,
)

# Career
from app.schemas.career.career import (
    CareerCard,
    CareerOverview,
    CareerDetail,
    CareerCreate,
    CareerUpdate,
)
from app.schemas.career.roadmap import (
    CareerRoadmap,
    RoadmapStep,
    CareerProgress,
)
from app.schemas.career.requirement import (
    CareerRequirement,
    RequirementDetail,
)
from app.schemas.career.recommendation import (
    CareerRecommendation,
    RelatedCareer,
)

# Project
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

# Learning
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

# User
from app.schemas.user.profile import (
    UserProfile,
    UserSettings,
    ProfileUpdate,
    UserSummary,
)
from app.schemas.user.bookmark import (
    BookmarkCreate,
    BookmarkDetail,
    BookmarkList,
)
from app.schemas.user.favorite import (
    FavoriteCreate,
    FavoriteDetail,
    FavoriteList,
)
from app.schemas.user.history import (
    LearningHistoryItem,
    SearchHistoryItem,
    SearchHistoryCreate as UserSearchHistoryCreate,
)
from app.schemas.user.dashboard import (
    DashboardSummary,
    UserStatistics,
    RecentActivity,
)

# Skill
from app.schemas.skill.skill import (
    SkillSummary,
    SkillDetail,
    SkillLink,
    SkillCreate,
    SkillUpdate,
    SkillRelationshipSchema,
    SkillRelationshipCreate,
    SkillGraph,
    SkillCategoryCount,
)

# Tag
from app.schemas.tag.tag import (
    TagSummary,
    TagDetail,
    TagCreate,
    TagUpdate,
    NodeTagInfo,
    NodeTagCreate,
    TagList,
)

# Recommendation
from app.schemas.recommendation.recommendation import (
    RecommendationSummary,
    RecommendationDetail,
    RecommendationDismiss,
    RecommendationList,
    RecommendationTypeCount,
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

# Audit
from app.schemas.audit.audit import (
    AuditLogEntry,
    AuditLogDetail,
    AuditLogList,
    AuditLogFilter,
)

# Search
from app.schemas.search.request import (
    SearchRequest,
    AutocompleteRequest,
    FilterRequest,
)
from app.schemas.search.result import (
    SearchResult,
    GroupedResult,
    HighlightFragment,
    SearchSuggestion,
)
from app.schemas.search.history import (
    SearchHistoryCreate,
    SearchHistoryResponse,
)

__all__ = [
    # Response Envelope
    'APIResponse',
    'success_response',
    'error_response',
    # Common — Pagination
    'PageParams',
    'PageResponse',
    'CursorParams',
    'CursorResponse',
    'SortParams',
    'SortDirection',
    'FilterParams',
    'PaginatedData',
    # Common — Health
    'HealthCheckDetail',
    'HealthResponse',
    # Common — Metadata
    'APIVersion',
    'Links',
    'Metadata',
    'ResponseMetadata',
    # Auth
    'LoginRequest',
    'SignupRequest',
    'RefreshRequest',
    'TokenResponse',
    'LoginResponse',
    'ChangePasswordRequest',
    'ForgotPasswordRequest',
    'ResetPasswordRequest',
    # Common — Errors
    'ErrorDetail',
    'ValidationErrorItem',
    'ErrorResponse',
    'ValidationErrorResponse',
    # Knowledge — Node
    'KnowledgeNodeCard',
    'KnowledgeNodeSummary',
    'KnowledgeNodeDetail',
    'KnowledgeNodeCreate',
    'KnowledgeNodeUpdate',
    'KnowledgeNodeList',
    'KnowledgeNodeLink',
    # Knowledge — Search
    'KnowledgeSearchResult',
    'GroupedSearchResult',
    'SearchHighlight',
    # Knowledge — Dependency
    'KnowledgeDependency',
    'DependencyNode',
    'DependencyTree',
    # Knowledge — Recommendation
    'KnowledgeRecommendation',
    # Graph
    'GraphNode',
    'GraphEdge',
    'Subgraph',
    'Neighborhood',
    'TraversalResult',
    'ShortestPath',
    'PathStep',
    'GraphStatistics',
    'NodeTypeCount',
    'EdgeTypeCount',
    # Career
    'CareerCard',
    'CareerOverview',
    'CareerDetail',
    'CareerCreate',
    'CareerUpdate',
    'CareerRoadmap',
    'RoadmapStep',
    'CareerProgress',
    'CareerRequirement',
    'RequirementDetail',
    'CareerRecommendation',
    'RelatedCareer',
    # Project
    'ProjectCard',
    'ProjectDetail',
    'ProjectCreate',
    'ProjectUpdate',
    'ProjectRequirement',
    'RequiredSkill',
    'LearningOutcome',
    'TechStack',
    # Learning
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
    # User
    'UserProfile',
    'UserSettings',
    'ProfileUpdate',
    'UserSummary',
    'BookmarkCreate',
    'BookmarkDetail',
    'BookmarkList',
    'FavoriteCreate',
    'FavoriteDetail',
    'FavoriteList',
    'LearningHistoryItem',
    'SearchHistoryItem',
    'UserSearchHistoryCreate',
    'DashboardSummary',
    'UserStatistics',
    'RecentActivity',
    # Skill
    'SkillSummary',
    'SkillDetail',
    'SkillLink',
    'SkillCreate',
    'SkillUpdate',
    'SkillRelationshipSchema',
    'SkillRelationshipCreate',
    'SkillGraph',
    'SkillCategoryCount',
    # Tag
    'TagSummary',
    'TagDetail',
    'TagCreate',
    'TagUpdate',
    'NodeTagInfo',
    'NodeTagCreate',
    'TagList',
    # Recommendation
    'RecommendationSummary',
    'RecommendationDetail',
    'RecommendationDismiss',
    'RecommendationList',
    'RecommendationTypeCount',
    # Audit
    'AuditLogEntry',
    'AuditLogDetail',
    'AuditLogList',
    'AuditLogFilter',
    # Search
    'SearchRequest',
    'AutocompleteRequest',
    'FilterRequest',
    'SearchResult',
    'GroupedResult',
    'HighlightFragment',
    'SearchSuggestion',
    'SearchHistoryCreate',
    'SearchHistoryResponse',
]
