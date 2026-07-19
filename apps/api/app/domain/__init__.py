"""Domain — pure domain objects, policies, and invariants.

Domain objects are framework-agnostic business concepts. They do not depend on
SQLAlchemy, FastAPI, or any infrastructure. ORM models in app.models implement
persistence mappings for these domain concepts.

Canonical domain entities:
- KnowledgeNode — a node in the knowledge graph
- KnowledgeEdge — a relationship between nodes
- LearnerState — learner progress on a node
- ValidationReport — result of validation
- AssessmentSubmission — learner assessment submission
- ImportJob — import workflow state
- DomainEvent — state change event

See app.models for the ORM implementations of these domain concepts.
"""

from app.domain.knowledge_node import KnowledgeNode as DomainKnowledgeNode
from app.domain.knowledge_edge import KnowledgeEdge as DomainKnowledgeEdge
from app.domain.learner_state import LearnerState as DomainLearnerState
from app.domain.validation_report import ValidationReport
from app.domain.assessment_submission import AssessmentSubmission
from app.domain.import_job import ImportJob
from app.domain.domain_event import DomainEvent

__all__ = [
    'AssessmentSubmission',
    'DomainEvent',
    'DomainKnowledgeEdge',
    'DomainKnowledgeNode',
    'DomainLearnerState',
    'ImportJob',
    'ValidationReport',
]
