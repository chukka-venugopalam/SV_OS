"""Capabilities — orchestrate engines to produce capability outcomes.

Capabilities are the public API boundary. They orchestrate engine calls and
return results to the API layer. Capabilities never contain business logic.
Business logic belongs in the engines.

Canonical capabilities:
- RecommendationCapability — retrieve next-step recommendations
- LearningPathCapability — generate learning roadmaps
- CareerCapability — compare careers and analyze skill gaps
- GraphCapability — explore graph structure and retrieve subgraphs
- AssessmentCapability — submit and evaluate assessments
- SearchCapability — search graph and content
- ImportCapability — start, monitor, and rollback imports
- SimulatorCapability — run simulation scenarios
- KnowledgeCapability — retrieve content and metadata for nodes
"""
