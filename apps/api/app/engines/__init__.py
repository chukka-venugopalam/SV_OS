"""Engines — domain business logic for SV-OS.

Each engine owns a specific domain boundary and implements pure business logic.
Engines depend on other engines via constructor injection, never via direct imports.
Engines never access persistence directly — they use repository interfaces.

Canonical engines:
- GraphEngine — structural graph state and traversal
- KnowledgeEngine — node content, resources, tags, skills
- TraversalEngine — graph traversal algorithms
- EventEngine — domain event backbone
- StateEngine — learner state and progression
- DependencyEngine — prerequisites, blockers, readiness
- ValidationEngine — mutation and import validation
- SearchEngine — search over graph and content
- RecommendationEngine — next-step recommendations
- LearningPathEngine — learning path / roadmap generation
- CareerEngine — career matching and skill-gap analysis
- AssessmentEngine — assessment definition, submission, grading
- ImportEngine — content ingestion and import workflows
- SimulatorEngine — simulation scenarios
"""
