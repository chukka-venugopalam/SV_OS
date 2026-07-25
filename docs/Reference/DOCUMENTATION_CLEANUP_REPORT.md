# SV-OS Documentation Cleanup Report

> **Date**: July 25, 2026 | **Status**: Awaiting Approval
> **Total docs scanned**: 85 markdown files (66 in `docs/`, 19 in root)

---

## Classification Results

### KEEP — Core documentation (32 files)

These are actively referenced, contain current information, and should remain in the primary documentation structure.

#### Architecture & Design

| File                            | Size | Reason                                  |
| ------------------------------- | ---- | --------------------------------------- |
| `docs/ARCHITECTURE.md`          | ✓    | Current system architecture (v0.3.0)    |
| `docs/BACKEND_BLUEPRINT.md`     | ✓    | Backend stack & design decisions        |
| `docs/FRONTEND_BLUEPRINT.md`    | ✓    | Frontend stack & component design       |
| `docs/DATABASE_BLUEPRINT.md`    | ✓    | Database schema & graph storage details |
| `docs/API_BLUEPRINT.md`         | ✓    | API endpoint documentation              |
| `docs/ENGINEERING_BLUEPRINT.md` | ✓    | Engineering standards & implementation  |

#### Knowledge System

| File                                  | Size | Reason                                   |
| ------------------------------------- | ---- | ---------------------------------------- |
| `docs/KNOWLEDGE_GRAPH_DESIGN.md`      | ✓    | Core knowledge graph philosophy & design |
| `docs/KNOWLEDGE_SCHEMA.md`            | ✓    | Knowledge node/edge schema details       |
| `docs/KNOWLEDGE_VALIDATION.md`        | ✓    | Validation rules for knowledge data      |
| `docs/KNOWLEDGE_NAVIGATION_SYSTEM.md` | ✓    | Graph navigation & traversal design      |
| `docs/SEARCH_ARCHITECTURE.md`         | ✓    | Search system design                     |
| `docs/RECOMMENDATION_ENGINE.md`       | ✓    | Recommendation engine design             |
| `docs/GRAPH_RELATIONSHIPS.md`         | ✓    | Edge type definitions & semantics        |

#### Learning System

| File                             | Size | Reason                                 |
| -------------------------------- | ---- | -------------------------------------- |
| `docs/LEARNING_ENGINE.md`        | ✓    | Learning engine full specification     |
| `docs/LEARNING_PATH_ENGINE.md`   | ✓    | Learning path generation               |
| `docs/LEARNING_PHILOSOPHY.md`    | ✓    | Learning design philosophy             |
| `docs/COGNITIVE_MODEL.md`        | ✓    | Cognitive science principles           |
| `docs/MASTERY_MODEL.md`          | ✓    | Mastery scoring & progression          |
| `docs/JOURNEY_DESIGN.md`         | ✓    | Learner journey design                 |
| `docs/VISUAL_LEARNING_SYSTEM.md` | ✓    | Visual/interactive learning principles |
| `docs/SIMULATION_FRAMEWORK.md`   | ✓    | Simulation system design               |
| `docs/PROJECT_ENGINE.md`         | ✓    | Project engine design                  |

#### Infrastructure & Operations

| File                            | Size | Reason                              |
| ------------------------------- | ---- | ----------------------------------- |
| `docs/DEPLOYMENT.md`            | ✓    | Production deployment guide         |
| `docs/DEPLOYMENT_GUIDE.md`      | ✓    | Detailed deployment instructions    |
| `docs/SECURITY_GUIDE.md`        | ✓    | Security policies & auth design     |
| `docs/TESTING_STRATEGY.md`      | ✓    | Testing approach & coverage targets |
| `docs/PERFORMANCE_GUIDE.md`     | ✓    | Performance optimization guidance   |
| `docs/DATABASE.md`              | ✓    | Database schema reference           |
| `docs/PRODUCT_EVOLUTION.md`     | ✓    | Product roadmap & evolution         |
| `docs/ENGINEERING_STANDARDS.md` | ✓    | Coding standards & conventions      |

#### Reference

| File                                       | Size | Reason                            |
| ------------------------------------------ | ---- | --------------------------------- |
| `docs/IMPLEMENTATION_GUIDE.md`             | ✓    | Implementation guidelines         |
| `docs/TECH_DECISIONS.md`                   | ✓    | Technology decisions & rationale  |
| `docs/PHASE5_MASTER_CONTEXT.md`            | ✓    | Phase 5 single-source-of-truth    |
| `docs/STAGE_5_2_KNOWLEDGE_QUERY_ENGINE.md` | ✓    | Stage 5.2 API documentation       |
| `docs/STAGE_5_3_BLUEPRINT.md`              | ✓    | Stage 5.3 content layer blueprint |

---

### ARCHIVE — Historical documents (26 files)

These are valuable historical records but not needed for daily development. Move to `docs/archive/`.

| File                                       | Reason                                                        |
| ------------------------------------------ | ------------------------------------------------------------- |
| `docs/FOLDER_STRUCTURE.md`                 | Superseded by ARCHITECTURE.md folder tree                     |
| `docs/FILE_STRUCTURE_REFERENCE.md`         | Superseded by ARCHITECTURE.md                                 |
| `docs/ARCHITECTURE_V2.md`                  | Historical v2 architecture (pre-v0.3.0)                       |
| `docs/SV-OS_ARCHITECTURE_SPECIFICATION.md` | Draft specification, superseded by ARCHITECTURE.md            |
| `docs/SV_OS_MASTER_SPEC.md`                | Early master spec, superseded by PHASE5_MASTER_CONTEXT.md     |
| `docs/ENGINEERING_BLUEPRINT.md`            | Contains same info as ENGINEERING_STANDARDS.md                |
| `docs/BACKEND_ARCHITECTURE.md`             | Content folded into ARCHITECTURE.md                           |
| `docs/FRONTEND_ARCHITECTURE.md`            | Content folded into ARCHITECTURE.md                           |
| `docs/CURRENT_PROGRESS.md`                 | Outdated progress status                                      |
| `docs/MASTER_ENGINEERING_CHECKLIST.md`     | Historical checklist                                          |
| `docs/MASTER_TODO.md`                      | Historical TODO list                                          |
| `docs/IMPLEMENTATION_ROADMAP.md`           | Older roadmap, superseded by DEVELOPMENT_ROADMAP.md           |
| `docs/KNOWLEDGE_IMPORT_PLAN.md`            | Early import plan, superseded by import code                  |
| `docs/KNOWLEDGE_IMPORT_SPEC.md`            | Early import spec, superseded by import code                  |
| `docs/CONTENT_AUTHORING_GUIDE.md`          | Draft, pure markdown stub content                             |
| `docs/SETUP.md`                            | Superseded by README.md quick start                           |
| `docs/DEVELOPMENT.md`                      | Superseded by README.md and CONTRIBUTING.md                   |
| `docs/EnvironmentVariables.md`             | Superseded by README.md                                       |
| `docs/MonorepoGuide.md`                    | Superseded by README.md                                       |
| `docs/Runbook.md`                          | Operational runbook (may need updating to be useful)          |
| `docs/Troubleshooting.md`                  | Minimal content, assess if worth keeping active               |
| `docs/BackupRestore.md`                    | Operational procedure                                         |
| `docs/ProductionChecklist.md`              | Historical checklist                                          |
| `docs/Contributing.md`                     | Keep in root, already there — this should stay                |
| `docs/CONTRIBUTING_AI.md`                  | AI-specific contributing guide — archive if not actively used |
| `docs/CONTRIBUTING_GUIDE_ADVANCED.md`      | Advanced contributing — archive if not actively used          |

### REMOVE — No value files (7 files)

These provide no ongoing value and are safe to delete.

| File                          | Reason                                                         |
| ----------------------------- | -------------------------------------------------------------- |
| `docs/AI_CONTEXT.md`          | Stub/duplicate content, superseded by PHASE5_MASTER_CONTEXT.md |
| `docs/AI_CONTEXT.zip`         | Binary archive of unknown origin — verify before deleting      |
| `docs/API.md`                 | Stub file, superseded by API_BLUEPRINT.md                      |
| `docs/PROJECT_OVERVIEW.md`    | Stub file, superseded by README.md                             |
| `docs/DEVELOPMENT_ROADMAP.md` | Stub file, superseded by PRODUCT_EVOLUTION.md                  |
| `docs/CodingStandards.md`     | Stub file, superseded by ENGINEERING_STANDARDS.md              |
| `docs/FUTURE_OF_LEARNING.md`  | Conceptual/aspirational, no actionable content                 |

### ROOT DOCUMENTS — Keep/Archive

| Root File                                 | Classification | Reason                                               |
| ----------------------------------------- | -------------- | ---------------------------------------------------- |
| `README.md`                               | ✅ **KEEP**    | Primary project entry point                          |
| `CHANGELOG.md`                            | ✅ **KEEP**    | Release history                                      |
| `SV_OS_ARCHITECTURE_V1_FINAL.md`          | 📦 **ARCHIVE** | Superseded by docs/ARCHITECTURE.md                   |
| `SV_OS_RELEASE_PLAN.md`                   | 📦 **ARCHIVE** | Historical release plan                              |
| `SV_OS_SPRINT_PLAN.md`                    | 📦 **ARCHIVE** | Historical sprint plan                               |
| `SV_OS_TASK_BREAKDOWN.md`                 | 📦 **ARCHIVE** | Historical task list                                 |
| `SV_OS_EPIC_BREAKDOWN.md`                 | 📦 **ARCHIVE** | Historical epic breakdown                            |
| `SV_OS_BUILD_ORDER.md`                    | 📦 **ARCHIVE** | Historical build order                               |
| `SV_OS_FILE_IMPLEMENTATION_SEQUENCE.md`   | 📦 **ARCHIVE** | Historical file sequence                             |
| `SV_OS_IMPLEMENTATION_ROADMAP.md`         | 📦 **ARCHIVE** | Superseded by docs/DEVELOPMENT_ROADMAP.md            |
| `SV_OS_IMPLEMENTATION_SPECIFICATION.md`   | 📦 **ARCHIVE** | Historical spec, superseded by Phase docs            |
| `SV_OS_TECHNICAL_DESIGN_SPECIFICATION.md` | 📦 **ARCHIVE** | Historical TDS                                       |
| `SV_OS_INTERFACE_CONTRACTS.md`            | 📦 **ARCHIVE** | Historical interface contracts                       |
| `SV_OS_ENGINE_COMMUNICATION_MATRIX.md`    | 📦 **ARCHIVE** | Historical matrix                                    |
| `SV_OS_ENGINE_DEPENDENCY_GRAPH.md`        | 📦 **ARCHIVE** | Historical dependency graph                          |
| `SV_OS_ARCHITECTURE_AUDIT.md`             | 📦 **ARCHIVE** | Historical audit report                              |
| `SV_OS_DEVELOPER_CHECKLIST.md`            | 📦 **ARCHIVE** | Historical checklist (note: not on master checklist) |
| `SV-OS_v1.0_Release_Report.md`            | 📦 **ARCHIVE** | Historical release report                            |
| `SV_OS_REPOSITORY_BOOTSTRAP.md`           | 📦 **ARCHIVE** | Historical bootstrap instructions                    |

---

## Proposed Restructured Directory

```
docs/
├── README.md (index linking to key docs — NEW)
│
├── Architecture/
│   ├── ARCHITECTURE.md
│   ├── BACKEND_BLUEPRINT.md
│   ├── FRONTEND_BLUEPRINT.md
│   ├── DATABASE_BLUEPRINT.md
│   └── API_BLUEPRINT.md
│
├── Knowledge/
│   ├── KNOWLEDGE_GRAPH_DESIGN.md
│   ├── KNOWLEDGE_SCHEMA.md
│   ├── KNOWLEDGE_VALIDATION.md
│   ├── KNOWLEDGE_NAVIGATION_SYSTEM.md
│   ├── GRAPH_RELATIONSHIPS.md
│   ├── SEARCH_ARCHITECTURE.md
│   ├── RECOMMENDATION_ENGINE.md
│   ├── PHASE5_MASTER_CONTEXT.md
│   ├── STAGE_5_2_KNOWLEDGE_QUERY_ENGINE.md
│   └── STAGE_5_3_BLUEPRINT.md
│
├── Learning/
│   ├── LEARNING_ENGINE.md
│   ├── LEARNING_PATH_ENGINE.md
│   ├── LEARNING_PHILOSOPHY.md
│   ├── COGNITIVE_MODEL.md
│   ├── MASTERY_MODEL.md
│   ├── JOURNEY_DESIGN.md
│   ├── VISUAL_LEARNING_SYSTEM.md
│   ├── SIMULATION_FRAMEWORK.md
│   └── PROJECT_ENGINE.md
│
├── Deployment/
│   ├── DEPLOYMENT.md
│   └── DEPLOYMENT_GUIDE.md
│
├── Security/
│   └── SECURITY_GUIDE.md
│
├── Testing/
│   └── TESTING_STRATEGY.md
│
├── Reference/
│   ├── DATABASE.md
│   ├── PRODUCT_EVOLUTION.md
│   ├── ENGINEERING_STANDARDS.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── TECH_DECISIONS.md
│   ├── PERFORMANCE_GUIDE.md
│   ├── PROJECT_MEMORY.md          (NEW)
│   ├── PROJECT_HANDOFF.md         (NEW)
│   └── DATABASE_MIGRATION_PLAN.md (NEW)
│
└── archive/
    ├── ARCHITECTURE_V2.md
    ├── SV-OS_ARCHITECTURE_SPECIFICATION.md
    ├── SV_OS_MASTER_SPEC.md
    ├── BACKEND_ARCHITECTURE.md
    ├── FRONTEND_ARCHITECTURE.md
    ├── FOLDER_STRUCTURE.md
    ├── FILE_STRUCTURE_REFERENCE.md
    ├── CURRENT_PROGRESS.md
    ├── MASTER_ENGINEERING_CHECKLIST.md
    ├── MASTER_TODO.md
    ├── IMPLEMENTATION_ROADMAP.md
    ├── KNOWLEDGE_IMPORT_PLAN.md
    ├── KNOWLEDGE_IMPORT_SPEC.md
    ├── CONTENT_AUTHORING_GUIDE.md
    ├── CONTRIBUTING_AI.md
    ├── CONTRIBUTING_GUIDE_ADVANCED.md
    ├── SETUP.md
    ├── DEVELOPMENT.md
    ├── EnvironmentVariables.md
    ├── MonorepoGuide.md
    ├── Runbook.md
    ├── Troubleshooting.md
    ├── BackupRestore.md
    ├── ProductionChecklist.md
    └── (root historical files go here too)
        ├── SV_OS_ARCHITECTURE_V1_FINAL.md
        ├── SV_OS_RELEASE_PLAN.md
        ├── SV_OS_SPRINT_PLAN.md
        ├── SV_OS_TASK_BREAKDOWN.md
        ├── SV_OS_EPIC_BREAKDOWN.md
        ├── SV_OS_BUILD_ORDER.md
        ├── SV_OS_FILE_IMPLEMENTATION_SEQUENCE.md
        ├── SV_OS_IMPLEMENTATION_ROADMAP.md
        ├── SV_OS_IMPLEMENTATION_SPECIFICATION.md
        ├── SV_OS_TECHNICAL_DESIGN_SPECIFICATION.md
        ├── SV_OS_INTERFACE_CONTRACTS.md
        ├── SV_OS_ENGINE_COMMUNICATION_MATRIX.md
        ├── SV_OS_ENGINE_DEPENDENCY_GRAPH.md
        ├── SV_OS_ARCHITECTURE_AUDIT.md
        ├── SV_OS_DEVELOPER_CHECKLIST.md
        ├── SV-OS_v1.0_Release_Report.md
        └── SV_OS_REPOSITORY_BOOTSTRAP.md
```

---

## Approval Needed

Before executing the moves and deletions:

1. **Do you approve moving 26 docs files + 19 root files to `docs/archive/`?**
2. **Do you approve deleting the 7 REMOVE files?**
3. **Do you approve the proposed folder structure?**
4. **Do you approve moving root historical files to `docs/archive/`?**

Any of these can be adjusted. Reply with approval or modifications.
