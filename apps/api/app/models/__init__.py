"""
SV-OS Domain Models — complete SQLAlchemy ORM layer.

All models inherit from ``AppBaseMixin`` (UUID PK, timestamps,
soft-delete, version) and ``Base`` (declarative base from
``app.core.database``).

Usage:
    from app.models import User, KnowledgeNode, KnowledgeEdge, ...
"""

from app.models.ai_history import PlannerHistory, QuizHistory
from app.models.ai_memory import AIMemory, AIPreference
from app.models.audit_log import AuditLog
from app.models.base import AppBaseMixin
from app.models.bookmark import Bookmark
from app.models.career import Career, CareerRequirement
from app.models.chat_session import ChatMessage, ChatSession
from app.models.enums import (
    DemandLevel,
    Difficulty,
    EdgeDirection,
    EdgeType,
    LearningStatus,
    NodeType,
    ProgressStatus,
    RecommendationType,
    RequirementType,
    ResourceType,
    SkillRelationshipType,
    UserRole,
    Visibility,
)
from app.models.favorite import Favorite
from app.models.knowledge_edge import KnowledgeEdge
from app.models.knowledge_node import KnowledgeNode
from app.models.learning_path import LearningPath, LearningSession
from app.models.learning_resource import LearningResource
from app.models.project import Project, ProjectRequirement
from app.models.recommendation import Recommendation
from app.models.search_history import SearchHistory
from app.models.skill import Skill, SkillRelationship
from app.models.tag import NodeTag, Tag
from app.models.user import User
from app.models.user_progress import UserProgress

__all__ = [
    # Enums
    'NodeType',
    'EdgeType',
    'EdgeDirection',
    'Difficulty',
    'ProgressStatus',
    'DemandLevel',
    'UserRole',
    'ResourceType',
    'Visibility',
    'LearningStatus',
    'RecommendationType',
    'RequirementType',
    'SkillRelationshipType',
    # Base
    'AppBaseMixin',
    # Core entities
    'User',
    'KnowledgeNode',
    'KnowledgeEdge',
    'Career',
    'CareerRequirement',
    'Project',
    'ProjectRequirement',
    'LearningResource',
    'LearningPath',
    'LearningSession',
    'Skill',
    'SkillRelationship',
    'UserProgress',
    'Recommendation',
    'Bookmark',
    'Favorite',
    'Tag',
    'NodeTag',
    'SearchHistory',
    'AuditLog',
    # Phase 4 AI models
    'ChatSession',
    'ChatMessage',
    'AIMemory',
    'AIPreference',
    'QuizHistory',
    'PlannerHistory',
]
