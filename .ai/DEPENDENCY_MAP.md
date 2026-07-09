# Dependency Map

## Monorepo Structure

... [unchanged] ...

## Turborepo Pipeline

... [unchanged] ...

## Frontend (apps/web) Dependency Tree

... [unchanged] ...

## Backend (apps/api) Model Dependency Tree (Phase 2.4)

```
models/
    ├── base.py                       # AppBaseMixin (no deps beyond SQLAlchemy)
    ├── enums.py                      # 14 enum types (no deps)
    │
    ├── user.py                       # Depends on: Base, AppBaseMixin, UserRole enums
    │   └── back_populates: progress, bookmarks, favorites, search_history,
    │                       learning_sessions, audit_logs, recommendations
    │
    ├── knowledge_node.py             # Depends on: Base, AppBaseMixin, Difficulty, NodeType enums
    │   └── back_populates: outgoing_edges, incoming_edges, resources,
    │                       progress_records, bookmarks, favorites,
    │                       node_tags, career_requirements, project_requirements
    │
    ├── knowledge_edge.py             # Depends on: Base, AppBaseMixin, EdgeDirection, EdgeType
    │   └── FK: knowledge_nodes (source_node_id, target_node_id)
    │
    ├── career.py                     # Depends on: Base, AppBaseMixin, DemandLevel, RequirementType
    │   ├── Career → FK: none (root entity)
    │   └── CareerRequirement → FK: careers, knowledge_nodes
    │
    ├── project.py                    # Depends on: Base, AppBaseMixin, Difficulty, RequirementType
    │   ├── Project → FK: none (root entity)
    │   └── ProjectRequirement → FK: projects, knowledge_nodes
    │
    ├── learning_resource.py          # Depends on: Base, AppBaseMixin, Difficulty, ResourceType
    │   └── FK: knowledge_nodes (node_id)
    │
    ├── learning_path.py              # Depends on: Base, AppBaseMixin, Difficulty, LearningStatus
    │   ├── LearningPath → FK: none (root entity)
    │   └── LearningSession → FK: users, knowledge_nodes
    │
    ├── skill.py                      # Depends on: Base, AppBaseMixin, Difficulty, SkillRelationshipType
    │   ├── Skill → FK: none
    │   └── SkillRelationship → FK: skills (source_skill_id, target_skill_id)
    │
    ├── user_progress.py              # Depends on: Base, AppBaseMixin, ProgressStatus
    │   └── FK: users, knowledge_nodes
    │
    ├── recommendation.py             # Depends on: Base, AppBaseMixin, RecommendationType
    │   └── FK: users, knowledge_nodes
    │
    ├── bookmark.py                   # Depends on: Base, AppBaseMixin
    │   └── FK: users, knowledge_nodes
    │
    ├── favorite.py                   # Depends on: Base, AppBaseMixin
    │   └── FK: users, knowledge_nodes
    │
    ├── tag.py                        # Depends on: Base, AppBaseMixin
    │   ├── Tag → FK: none (root)
    │   └── NodeTag → FK: knowledge_nodes, tags
    │
    ├── search_history.py             # Depends on: Base, AppBaseMixin
    │   └── FK: users
    │
    └── audit_log.py                  # Depends on: Base, AppBaseMixin
        └── FK: users (ondelete SET NULL)
```

### Circular Import Protection

All models use `from __future__ import annotations` and `TYPE_CHECKING` guards for forward references:

- `user.py` references 8 other models under TYPE_CHECKING
- `knowledge_node.py` references 7 other models under TYPE_CHECKING
- No runtime circular imports at model loading time (verified)

## External Library Dependencies

... [unchanged] ...
