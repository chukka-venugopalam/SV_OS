# SV-OS Stage 5.3 — Knowledge Content Layer (Blueprint)

> **Status**: Engineering Blueprint | **Version**: 1.0 | **Author**: Lead Architect
> **Preconditions**: Stage 5.1 (40-node import) ✅ live | Stage 5.2 engines (22 registered) ✅ live
> **Stage naming**: This stage is `stage-5.3-content-layer`. See naming note below.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Project State (Verified)](#2-current-project-state)
3. [Knowledge Assets — Dataset Blueprints](#3-knowledge-assets)
4. [Database Schema Extensions](#4-database-schema-extensions)
5. [New Services](#5-new-services)
6. [API Endpoints](#6-api-endpoints)
7. [Import Pipeline Extensions](#7-import-pipeline-extensions)
8. [Frontend Requirements](#8-frontend-requirements)
9. [AI Integration (Already Built)](#9-ai-integration)
10. [Implementation Roadmap & Dependencies](#10-implementation-roadmap)
11. [Engineering Rules](#11-engineering-rules)
    A. [Master Checklist](#appendix-a-master-checklist)

---

## 1. Executive Summary

### Naming Note (direct correction to project documentation)

Going forward, stages must use descriptive names (`stage-5.2-full-graph-import`, `stage-5.3-content-layer`, etc.) rather than bare stage numbers. This is the third time in this project's history that different work items have shared the same stage number, causing confusion across handovers. This document uses the name `stage-5.3-content-layer` throughout.

### Vision

Turn SV-OS from a graph of node titles and summaries into a rich, multi-format content platform where every node has real learning materials — flashcards, glossaries, simulators, practice questions, and more — that the existing AI infrastructure can embed, the existing recommendation engine can rank, and learners can actually study from.

### Mission

Produce and import 10+ content datasets (flashcards, glossary terms, simulators, practice questions, common mistakes, FAQ entries, etc.) with associated services and APIs, gated by a `content_status` lifecycle so content quality is visible at every level.

### Grounding statement

This blueprint is written against real, verified numbers from the live codebase — not estimates from planning documents. Every "designed" number below has been checked against the actual import file, database schema, engine registry, and route table. Every "estimated" number is explicitly labeled.

---

## 2. Current Project State (Verified)

All claims below have been verified against the live codebase at commit `234d65b`.

### 2.1 Completed Infrastructure

| Component                | Status                                             | Evidence                                                                                                                                                                                                          |
| ------------------------ | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stage 5.1 40-node import | ✅ Live in DB                                      | `computer_science_map.json` → `KnowledgeImportService` → `knowledge_nodes` table                                                                                                                                  |
| Stage 5.2 engines        | ✅ 22 registered                                   | `apps/api/app/engines/` — 22 `.py` files, all registered in `PlatformContainer`                                                                                                                                   |
| Engine registry          | ✅ Registered                                      | Event, Graph, Knowledge, Dependency, Traversal, Query, State, Recommendation, LearningPath, Assessment, Career, Versioning, Export, Scheduler, Revision, Analytics, Plugin, Validation, Import, Simulator, Search |
| Database schema          | ✅ 22 tables                                       | `knowledge_nodes`, `knowledge_edges`, `learning_goals`, `learning_goal_nodes`, `careers`, `project`, resources, users, progress, bookmarks, favorites, skills, tags, audit, etc.                                  |
| API endpoints            | ✅ 26 endpoint groups                              | Health, Auth, Graph, Nodes, Search, Recommendations, LearningPaths, Career, Project, Progress, Import, Bookmarks, Favorites, Skills, AI Chat, Activity, Platform, etc.                                            |
| Frontend routes          | ✅ 26 routes (5 unauthenticated, 21 authenticated) | Root layout wraps AuthProvider, ThemeProvider, CommandProvider, ModalProvider, ToastProvider, GraphProvider, ReactQueryProvider                                                                                   |
| AI infrastructure        | ✅ Built (Phase 2.4)                               | Embedding providers, RAG engine, context engine — idle, waiting for content                                                                                                                                       |
| CI pipeline              | ✅ Green                                           | Ruff 0 errors, Format 323/323, MyPy 0 errors, TypeScript 0 errors, Sync tests 24/24                                                                                                                               |

### 2.2 Content Assets — Real Inventory

| Dataset                     | Real Status   | Nodes/Items                            | Source                      |
| --------------------------- | ------------- | -------------------------------------- | --------------------------- |
| `computer_science_map.json` | ✅ Live in DB | 40 nodes, 9 projects, 4 learning goals | `computer_science_map.json` |

**`learning_goals` table migration status**: The model (`apps/api/app/models/learning_goal.py`) and repository (`apps/api/app/repositories/learning_goal.py`) exist in the codebase. The `LearningGoal` and `LearningGoalNode` tables are referenced by the import pipeline. **Migration status: needs verification** — confirm the `learning_goals` table exists in the live database via `alembic history` or by checking the migrations directory. If not applied, create a migration for the existing model before any content-layer work begins.
| `stage5_2_import_refactored.json` | ⚠️ Designed, validated, NOT imported | 181 nodes, 12 careers, 40 domains, 288 prereq edges | `stage5_2_import_refactored.json` (130KB) |
| Career data | ⚠️ Partial | 9 seeded + 12 validated (not imported) = 21 total designed | DB seed + validated JSON |
| Learning goals | ✅ Live, needs separate table migration | 4 (AI Engineer, CSE, GATE, Interview) | `computer_science_map.json` |
| Projects | ✅ 9 real, inline in 40-node dataset | 9 (p1-p9) | `computer_science_map.json` |
| Simulators | ⚠️ 20 designed, 0 implemented | 20 (designs exist in roadmap) | Roadmap docs only |
| Learning resources | ⚠️ Sparse | Real resources for ~6 of 221 designed nodes | Inline in both datasets |
| Concept decomposition (atomic units) | ⚠️ 10 from 1 worked example (Virtual Memory) | 10 AKUs | One-off prototype |
| All other content (flashcards, glossary, FAQ, etc.) | ❌ None exist | 0 | True gaps |

### 2.3 Critical Dependency Note for This Blueprint

Every item below is annotated with one of:

- **❶ 40-node safe**: Works correctly against today's 40-node live database. No dependency on the 181-node import.
- **❷ 181-node ready**: Requires the full 181-node graph to be meaningful. Implement against 40 nodes if possible; document where behavior changes at scale.
- **❸ 181-node required**: Cannot be implemented until `stage5_2_full_graph_import` is complete. Blocked.

---

## 3. Knowledge Assets — Dataset Blueprints

### 3.1 Flashcards Dataset `flashcards.json`

**Purpose**: Per-node flashcard sets for spaced-repetition review. Each card is a question-answer pair at the Atomic Knowledge Unit (AKU) granularity established by the Virtual Memory prototype (which produced 10 AKUs from 1 node).

**Schema**:

```json
{
  "card_id": "uuid-or-slug",
  "knowledge_node_id": "node-slug",
  "question": "string (max 1000 chars)",
  "answer": "string (max 3000 chars)",
  "hint": "string (optional, max 500 chars)",
  "domain_id": "uuid-or-slug (canonical categories FK)",
  "difficulty": 1-5,
  "tags": ["tag1", "tag2"],
  "content_status": "draft|review|verified"
}
```

**Expected size**: ~10 AKUs × 221 nodes = **2,210 cards** (estimated). **Methodology**: Estimate based on 1 node's prototype scaled linearly. Real count depends on content authoring, not formula.

**Relationships**: `knowledge_node_id → knowledge_nodes.slug` (FK). Tags reference the canonical `tags` table. Domain uses `categories.id` canonical FK.

**Dependency**: ❷ 181-node ready — Flashcards are meaningful per-node regardless of graph size. The 40-node set gets about 400 cards.

**Import order**: After `stage-5.2-full-graph-import` (cards reference nodes).

**Validation rules**:

- `question` and `answer` required, non-empty
- `knowledge_node_id` must resolve to existing node slug
- Re-import by `card_id` is an upsert

### 3.2 Glossary Dataset `glossary.json`

**Purpose**: Key term definitions across all 12+ domains. Every node gets at least 3-5 glossary terms.

**Schema**:

```json
{
  "term_id": "uuid-or-slug",
  "term": "string",
  "definition": "string",
  "abbreviation": "string (optional)",
  "also_known_as": ["string"] (optional),
  "knowledge_node_id": "node-slug (FK)",
  "domain_id": "uuid-or-slug (canonical FK)",
  "content_status": "draft|review|verified"
}
```

**Expected size**: ~5 terms × 221 nodes = **1,105 terms** (estimated). Grounded in "5 terms per node = reasonable minimum" heuristic.

**Dependency**: ❷ 181-node ready

### 3.3 Practice Questions Dataset `practice_questions.json`

**Purpose**: Quick-check questions (multiple-choice or short-answer) per node for self-assessment.

**Schema**:

```json
{
  "question_id": "uuid-or-slug",
  "knowledge_node_id": "node-slug (FK)",
  "question": "string",
  "question_type": "multiple_choice|short_answer|true_false|code_output",
  "options": ["string"] (MC only),
  "correct_answer": "string",
  "explanation": "string",
  "difficulty": 1-5,
  "domain_id": "uuid-or-slug (canonical FK)",
  "content_status": "draft|review|verified"
}
```

**Expected size**: ~3 questions × 221 nodes = **663 questions** (estimated).

**Dependency**: ❷ 181-node ready

### 3.4 Common Mistakes Dataset `common_mistakes.json`

**Purpose**: Anti-patterns and frequent errors per concept — especially valuable for self-directed learners who don't have a teacher.

**Schema**:

```json
{
  "mistake_id": "uuid-or-slug",
  "knowledge_node_id": "node-slug (FK)",
  "mistake": "string",
  "why_it_happens": "string",
  "how_to_avoid": "string",
  "example": "string (optional)",
  "content_status": "draft|review|verified"
}
```

**Expected size**: ~2 mistakes × 100 high-value nodes = **200 entries** (estimated).

**Dependency**: ❷ 181-node ready

### 3.5 FAQ Dataset `faq.json`

**Purpose**: Frequently asked questions per domain or per node — reduces learner support burden.

**Schema**:

```json
{
  "faq_id": "uuid-or-slug",
  "knowledge_node_id": "node-slug (optional FK)",
  "domain_id": "uuid-or-slug (canonical FK, optional)",
  "question": "string",
  "answer": "string",
  "related_terms": ["string"],
  "content_status": "draft|review|verified"
}
```

**Expected size**: ~1 FAQ × 221 nodes = **221 entries** (estimated).

**Dependency**: ❷ 181-node ready

### 3.6 Simulators Dataset `simulators.json`

**Purpose**: Launchable interactive simulators tied to nodes. 20 already designed at the roadmap level with: purpose, complexity (Low/Medium/High), technologies, implementation_effort, and educational_value. **This is the first dataset that includes implementation work, not just data authoring.**

**Schema**:

```json
{
  "simulator_id": "uuid-or-slug",
  "name": "string",
  "purpose": "string",
  "complexity": "Low|Medium|High",
  "technologies": ["string"],
  "implementation_effort": "string (hours estimate)",
  "educational_value": "string",
  "knowledge_node_id": "node-slug (FK)",
  "launch_url": "string (optional, URL to running instance)",
  "content_status": "designed|prototype|implemented|published"
}
```

**Expected size**: **20 simulators** — all designed, 0 implemented. This is the number from the roadmap; it can be verified against any simulator tracking document.

**Relationships**: Many-to-many with nodes via `node_simulators` join table (schema already exists in `database/schema.sql`).

**Dependency**: ❷ 181-node ready (simulators reference existing nodes). Physical implementation is a separate effort.

### 3.7 Concept Decomposition (AKU) Dataset `concept_decomposition.json`

**Purpose**: Break each node into its atomic knowledge units for fine-grained progress tracking and flashcard generation.

**Schema** (matches existing `concept_decomposition` table per `database/schema.sql`):

```json
{
  "unit_id": "string (e.g. 'OS-005.M3.T1.C2.MC1.AKU1')",
  "node_id": "node-slug (FK)",
  "parent_id": "parent-unit-id (optional, FK to self)",
  "level": "module|topic|concept|micro_concept|atomic_unit",
  "name": "string"
}
```

**Expected size**: ~10 AKUs × 221 nodes = **2,210 units** (estimated). Methodology: Virtual Memory prototype produced 10 AKUs from 1 intermediate-complexity node. Expect variance by node complexity.

**Dependency**: ❷ 181-node ready (can start with 40 nodes = ~400 units)

### 3.8 Learning Resources Expansion `learning_resources.json`

**Purpose**: Fill the resource gap — currently only 6 of 221 nodes have real resources.

**Schema** (extends existing `learning_resources` table):

```json
{
  "resource_id": "uuid-or-slug",
  "node_id": "node-slug (FK)",
  "title": "string",
  "url": "string",
  "resource_type": "video|article|course|book|documentation|tool|podcast|interactive",
  "is_free": true/false,
  "language": "string (default: 'en')",
  "duration_minutes": "int (optional)",
  "content_status": "draft|review|verified"
}
```

**Expected size**: ~3 resources × 221 nodes = **663 resources** (estimated).

**Dependency**: ❷ 181-node ready

### 3.9 Research & Industry Tools Datasets (Estimated)

These are truly undesigned — no prototype, no existing content. The numbers below are **estimated sizing methodologies**, not predictions.

| Dataset                | Methodology                        | Estimated Size | Dependency       |
| ---------------------- | ---------------------------------- | -------------- | ---------------- |
| `research_papers.json` | ~2 papers per advanced/expert node | ~150 papers    | ❸ 181-node req.  |
| `industry_tools.json`  | ~1 tool per technology node        | ~60 tools      | ❷ 181-node ready |
| `software_stacks.json` | Major stacks as composite entities | ~10 stacks     | ❸ 181-node req.  |

### 3.10 Datasets Explicitly Out of Scope for Stage 5.3

The following were requested in the original prompt but are **deferred** to later stages by this blueprint:

| Dataset                                                                                 | Reason for Deferral                                                                |
| --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `companies.json`                                                                        | Requires industry research beyond content authoring                                |
| `roles.json`                                                                            | Career-specific; better built from the career graph                                |
| `interview_topics.json`                                                                 | Better derived from existing learning_goals (which already include interview prep) |
| `gate_topics.json`                                                                      | Already covered by the GATE learning goal — a filter on existing nodes             |
| `difficulty_rules.json`                                                                 | Already encoded in the `difficulty` column on `knowledge_nodes`                    |
| `mastery_rules.json`                                                                    | Engine-level concern, not dataset — belongs in the Assessment/State engines        |
| `prerequisite_overrides.json`                                                           | Would introduce graph inconsistency — explicitly prohibited by design              |
| `metadata.json`, `tag_dictionary.json`, `topic_clusters.json`, `learning_patterns.json` | Better derived programmatically from the graph than maintained as static datasets  |

---

## 4. Database Schema Extensions

### 4.1 `content_status` Column on `knowledge_nodes`

Add after `is_published`:

```sql
ALTER TABLE knowledge_nodes
ADD COLUMN content_status VARCHAR(20) NOT NULL DEFAULT 'stub'
CHECK (content_status IN ('stub', 'draft', 'in_review', 'verified', 'published', 'archived'));
```

**Status lifecycle**: `stub → draft → in_review → verified → published` with `archived` as a terminal state from any non-stub status.

**Gating rule**: Content from Stage 5.3 datasets (flashcards, glossary, etc.) is only servable from nodes where `content_status >= 'verified'` (i.e., `verified` or `published`). This prevents half-baked content from appearing in search results or recommendations.

**Dependency**: ❶ 40-node safe — this is a single-column migration on the existing table. No data dependency on the 181-node import.

### 4.2 New Content Tables

All new tables follow the `node_details` sidecar pattern: a `knowledge_node_id UUID REFERENCES knowledge_nodes(id)` foreign key, plus `is_deleted` for soft-delete, plus `created_at`/`updated_at` timestamps.

#### Table: `knowledge_node_content_flashcards`

```sql
CREATE TABLE knowledge_node_content_flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    hint TEXT,
    domain_id UUID REFERENCES categories(id),
    difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
    tags JSONB DEFAULT '[]',
    content_status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (content_status IN ('draft', 'in_review', 'verified', 'published', 'archived')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_flashcards_node ON knowledge_node_content_flashcards(knowledge_node_id);
CREATE INDEX idx_flashcards_status ON knowledge_node_content_flashcards(content_status);
```

#### Table: `knowledge_node_content_glossary`

```sql
CREATE TABLE knowledge_node_content_glossary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    term VARCHAR(300) NOT NULL,
    definition TEXT NOT NULL,
    abbreviation VARCHAR(50),
    also_known_as JSONB DEFAULT '[]',
    domain_id UUID REFERENCES categories(id),
    content_status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (content_status IN ('draft', 'in_review', 'verified', 'published', 'archived')),
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table: `knowledge_node_content_practice_questions`

```sql
CREATE TABLE knowledge_node_content_practice_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    question_type VARCHAR(20) NOT NULL DEFAULT 'multiple_choice'
        CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false', 'code_output')),
    options JSONB,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty SMALLINT CHECK (difficulty BETWEEN 1 AND 5),
    domain_id UUID REFERENCES categories(id),
    content_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table: `knowledge_node_content_common_mistakes`

```sql
CREATE TABLE knowledge_node_content_common_mistakes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    mistake TEXT NOT NULL,
    why_it_happens TEXT,
    how_to_avoid TEXT,
    example TEXT,
    content_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table: `knowledge_node_content_faq`

```sql
CREATE TABLE knowledge_node_content_faq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    knowledge_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    domain_id UUID REFERENCES categories(id),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    related_terms JSONB DEFAULT '[]',
    content_status VARCHAR(20) NOT NULL DEFAULT 'draft',
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Table: `simulators` (confirmed existing in `database/schema.sql`)

Verified: `database/schema.sql` already defines `simulators` and `node_simulators` tables. **No new table needed.** The existing schema has:

- `simulators`: id, name, purpose, complexity, technologies JSONB, implementation_effort, educational_value
- `node_simulators`: node_id + simulator_id (many-to-many join)

**Action needed**: Create the actual migration for these if not already applied. Update `simulators.content_status` to include the Stage 5.3 lifecycle.

#### Table: `concept_decomposition` (confirmed existing in `database/schema.sql`)

Verified: Already defined. **No new table needed.**

### 4.3 `categories` Table for Canonical Domains

**Does not exist in the current ORM models.** The `stage5_2_import_refactored.json` uses `domain_id` referencing canonical taxonomy, but no `categories` table or model exists in the codebase.

**Required migration**:

```sql
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    name VARCHAR(300) NOT NULL,
    parent_id UUID REFERENCES categories(id),
    aliases JSONB DEFAULT '[]',
    description TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_categories_parent ON categories(parent_id);
```

**Seed data**: The 40 canonical domains from the Stage 5.2 taxonomy (verified in `stage5_2_import_refactored.json` metadata).

**Dependency**: ❷ 181-node ready — needed by the full-graph import which uses `domain_id`. For the 40-node live set, domains are stored as free-text in `knowledge_nodes.extra_metadata`. The categories table is an enabler for the full import, not a dependency for 40-node operations.

### 4.4 Vector Search Columns

AI infrastructure already exists (Phase 2.4). Stage 5.3's job is to give it content to embed.

Each new content table gets a nullable embedding column for vector search integration:

```sql
ALTER TABLE knowledge_node_content_flashcards ADD COLUMN embedding vector(1536);
ALTER TABLE knowledge_node_content_glossary ADD COLUMN embedding vector(1536);
-- etc. for each new content table
```

**Dependency**: ❶ 40-node safe — can add columns now; they stay null until the AI pipeline runs embeddings. No data dependency.

---

## 5. New Services

### 5.1 Content Import Service `content_import.py`

**Purpose**: Import each Stage 5.3 dataset through the same validation pipeline used by Stage 5.1's `KnowledgeImportService`. Extends the existing import pipeline rather than replacing it.

**Location**: `apps/api/app/services/content_import.py`

**Methods**:

- `import_flashcards(data)` — validate + upsert flashcards
- `import_glossary(data)` — validate + upsert glossary terms
- `import_practice_questions(data)` — validate + upsert questions
- `import_common_mistakes(data)` — validate + upsert mistakes
- `import_faq(data)` — validate + upsert FAQ entries
- `validate_content_referential_integrity(data)` — all `knowledge_node_id` references resolve
- `generate_import_report()` — same format as `KnowledgeImportService.print_report()`

**Reuses from Stage 5.1**:

- `ImportReport` schema (extend with content-type counters)
- Validation pattern: two-pass (schema → referential integrity) before any writes
- Upsert-by-ID pattern
- Combined-graph integrity check (mandated by Stage 5.2 Task 9 — check against whole DB)

**Dependency**: ❷ 181-node ready (content references nodes; with 40 nodes you can import flashcard data for those 40 nodes only)

### 5.2 Content Query Service `content_query.py`

**Purpose**: Retrieve content by node, by domain, by content_status, by difficulty. Powers the `/explore/[slug]` page's content sections.

**Location**: `apps/api/app/services/content_query.py`

**Methods**:

- `get_flashcards(node_id, status_filter)` — flashcards for a node
- `get_glossary(node_id|domain_id)` — glossary terms, optionally filtered
- `get_practice_questions(node_id, difficulty)` — practice questions
- `get_common_mistakes(node_id)` — mistakes for a node
- `get_faq(node_id|domain_id)` — FAQ entries
- `get_content_summary(node_id)` — counts of each content type per node
- `get_simulators(node_id)` — simulators tied to a node (uses existing `node_simulators` join)

**Cache strategy**: Results are cacheable with short TTL (5 minutes) since content changes infrequently. Use the existing `CacheBackend` infrastructure.

**Dependency**: ❶ 40-node safe — queries work on any subset of nodes. Returns empty results for nodes with no Stage 5.3 content, which is correct behavior.

### 5.3 Similarity Service `similarity_service.py`

**Purpose**: Find similar content items (flashcards, glossary terms, etc.) within and across nodes. This is distinct from the existing `RecommendationEngine` (which recommends _nodes_ to _learners_) — this service recommends _content items_ to _learners_.

**Location**: `apps/api/app/services/similarity_service.py`

**Methods**:

- `find_similar_flashcards(card_id, limit)` — similarity by tags + domain + embedding
- `find_similar_glossary_terms(term_id, limit)` — similarity by domain + aliases
- `cross_node_similar_content(node_id, content_type, limit)` — finds content items across nodes

**Integration with existing engines**:

- Uses `SearchEngine` for tag-based matching
- Uses existing embedding providers (Phase 2.4) for vector similarity when embeddings exist
- Falls back to tag/domain overlap when embeddings are unavailable

**Dependency**: ❷ 181-node ready — similarity is meaningful only when multiple nodes have content. With 40 nodes, the result set is small but functional.

### 5.4 Tag Engine (NOT needed — verified)

**Verification result**: The existing `apps/api/app/models/tag.py` implements `NodeTag` as a many-to-many join between `knowledge_nodes` and `tags`. This is node-level tagging, not content-level. However, creating a separate tag engine for each content type (flashcards, glossary, etc.) is premature until content volume justifies it.

**Decision**: Stage 5.3 does not build a separate Tag Engine. Instead:

- Each new content table gets a `tags JSONB DEFAULT '[]'` column for inline string tags
- Cross-content search ("find all content tagged with 'memory'") is handled by the SearchEngine's existing JSONB querying
- If content volume exceeds 10,000 items, revisit with a `content_tags` polymorphic table

**Dependency**: ❶ 40-node safe — JSONB tags require no new infrastructure.

### 5.5 Content Versioning (NOT a new service)

**Decision**: The existing `VersioningEngine` handles graph-structure versioning (nodes, edges). Content-level versioning (flashcard edits, glossary updates) is **not** needed in Stage 5.3 content because:

- Content datasets are imported as units, not edited individually
- Changes to individual items are tracked via `updated_at` and `content_status`
- Full audit trail exists in `audit_log` table

If per-item versioning is needed later, extend `VersioningEngine` with a content-type discriminator. Do not build a separate service now.

### 5.6 Search Index Service (Extension, NOT new)

**Decision**: The existing `SearchEngine` and PostgreSQL FTS infrastructure already handle keyword search over `knowledge_nodes`. Stage 5.3 content is searchable by:

1. Adding a GIN-indexed `tsvector` column to each new content table (or a shared search index table)
2. Extending the existing search endpoint to accept a `content_type` filter

Build a lightweight `ContentSearchIndex` helper within the existing `search_service.py` rather than a new top-level service.

**Dependency**: ❶ 40-node safe

---

## 6. API Endpoints

### 6.1 Collision Check

No collision with existing 26 endpoint groups. The new endpoints nest under existing groups (primarily `Nodes`) rather than creating new top-level groups.

### 6.2 New Endpoints

All new endpoints are sub-resources of the existing `GET /knowledge/node/{slug}` group, or under a new `/content` prefix.

| Method | Path                                        | Purpose                   | Dependency |
| ------ | ------------------------------------------- | ------------------------- | ---------- |
| `GET`  | `/knowledge/node/{slug}/flashcards`         | Flashcards for a node     | ❶          |
| `GET`  | `/knowledge/node/{slug}/glossary`           | Glossary terms for a node | ❶          |
| `GET`  | `/knowledge/node/{slug}/practice-questions` | Practice questions        | ❶          |
| `GET`  | `/knowledge/node/{slug}/common-mistakes`    | Common mistakes           | ❶          |
| `GET`  | `/knowledge/node/{slug}/faq`                | FAQ entries               | ❶          |
| `GET`  | `/knowledge/node/{slug}/simulators`         | Simulators tied to node   | ❶          |
| `GET`  | `/knowledge/node/{slug}/content-summary`    | Counts per content type   | ❶          |
| `GET`  | `/content/flashcards/{card_id}`             | Single flashcard detail   | ❶          |
| `GET`  | `/content/glossary/{term_id}`               | Single glossary term      | ❶          |
| `GET`  | `/content/search?q=&content_type=`          | Search across content     | ❶          |
| `POST` | `/import/content/flashcards`                | Import flashcard dataset  | ❷          |
| `POST` | `/import/content/glossary`                  | Import glossary dataset   | ❷          |
| `POST` | `/import/content/practice-questions`        | Import questions          | ❷          |
| `POST` | `/import/content/common-mistakes`           | Import mistakes           | ❷          |
| `POST` | `/import/content/faq`                       | Import FAQ                | ❷          |
| `POST` | `/import/content/simulators`                | Import simulators         | ❷          |

### 6.3 Endpoint Implementation Notes

- All read endpoints filter by `content_status >= 'verified'` by default. Add `?status=` query param for admin override.
- All read endpoints support pagination via `?page=&per_page=` (default per_page=20).
- All import endpoints require admin authentication (reuse existing `AuthMiddleware`).
- No new top-level router group — endpoints hang off existing `knowledge.py` or create a single `content.py` endpoint file.

---

## 7. Import Pipeline Extensions

### 7.1 Architecture

```
JSON Dataset File → ContentImportService.validate_schema()
                  → ContentImportService.validate_referential_integrity()
                  → CombinedGraphIntegrityCheck()  [Task 9 methodology]
                  → ContentImportService.persist_*()
                  → ImportReport
```

### 7.2 Combined Graph Integrity Check

**Mandated by Stage 5.2 Task 9**: Every new dataset's import must pass an integrity check against the _whole_ database, not just the new batch in isolation.

**Implementation**:

```python
async def combined_graph_integrity_check(
    uow: UnitOfWork,
    new_node_ids: set[str],
    current_db_ids: set[str],
) -> list[str]:
    """Check that all node references in the new dataset resolve
    against the union of new + existing database nodes.

    Returns list of error messages. Empty list = pass.
    """
```

This check runs after schema validation but before persistence, preventing partial imports.

### 7.3 Content Status Gating During Import

The import pipeline must check the source node's `content_status` before importing content:

```python
# In validation step:
for item in flashcards:
    node = await resolve_node(item.knowledge_node_id)
    if node and node.content_status in ('stub', 'archived'):
        warnings.append(
            f"Skipping flashcard '{item.card_id}' — "
            f"node '{item.knowledge_node_id}' is in status '{node.content_status}'"
        )
        continue  # Skip this item, don't fail the whole import
```

Rule: Content can only be imported for nodes with `content_status >= 'draft'`.

### 7.4 Import Order

```
1. categories.json              (if not seeded yet)
2. stage-5.2-full-graph-import  (181 nodes + edges)
3. stage-5.3-content:
   a. simulators.json
   b. concept_decomposition.json
   c. learning_resources.json
   d. glossary.json
   e. flashcards.json
   f. practice_questions.json
   g. common_mistakes.json
   h. faq.json
```

Each step validates against the cumulative state of all previous steps.

---

## 8. Frontend Requirements

### 8.1 Assumption Check

Most Stage 5.3 content extends existing pages rather than requiring new top-level routes. Verified against the 26 existing routes:

| Dataset            | Extends                                           | New Route Needed?                  |
| ------------------ | ------------------------------------------------- | ---------------------------------- |
| Flashcards         | `/explore/[slug]` + `/learning` session page      | ❌ Extends existing                |
| Glossary           | `/explore/[slug]`                                 | ❌ Extends existing                |
| Practice Questions | `/learning` session page + `/explore/[slug]`      | ❌ Extends existing                |
| Common Mistakes    | `/explore/[slug]`                                 | ❌ Extends existing                |
| FAQ                | `/explore/[slug]`                                 | ❌ Extends existing                |
| Simulators         | `/explore/[slug]` + new `/simulators` launch page | ⚠️ Possibly new `/simulators/[id]` |

### 8.2 `/explore/[slug]` Content Sections

When viewing a knowledge node, the page gains tabbed or accordion sections:

```
┌─ Knowledge Node ──────────────────────────┐
│ [Title] [Difficulty] [Estimated Time]      │
│                                            │
│ [Description / Summary]                    │
│                                            │
│ ┌─ Content Tabs ────────────────────────┐  │
│ │ [Flashcards] [Glossary] [Practice]    │  │
│ │ [Mistakes] [FAQ] [Simulators]         │  │
│ └───────────────────────────────────────┘  │
│                                            │
│ [Prerequisites] [Unlocks] [Projects]       │
│ [Resources] [Careers]                      │
└────────────────────────────────────────────┘
```

Each tab queries the corresponding API endpoint and only appears if content exists for that node. This is consistent with the existing pattern where missing data simply doesn't render.

### 8.3 Content Status Badge

Each content section shows a subtle status badge if the content is not yet `published` (visible to admins/contributors only):

```
[Flashcards] ─── 12 cards ⬤ verified
```

### 8.4 Flashcard Session UI

A new `/learn/session/{node_slug}` route for flashcards and practice questions in a study-session format. This is the one genuinely new frontend route needed.

**Wireframe**:

```
┌─ Study Session ───────────────────────────┐
│ [Node Title]                    [Progress] │
│                                    3/12   │
│ ┌─ Card ───────────────────────────────┐  │
│ │                                       │  │
│ │   Question: What is a page fault?     │  │
│ │                                       │  │
│ │        [Show Answer]                  │  │
│ │                                       │  │
│ │   Answer: An interrupt that occurs    │  │
│ │   when a program accesses a memory    │  │
│ │   page not in physical memory.        │  │
│ │                                       │  │
│ │   [Easy] [Medium] [Hard] [Again]      │  │
│ └───────────────────────────────────────┘  │
│                                            │
└────────────────────────────────────────────┘
```

**Dependency**: ❶ 40-node safe — works with any content regardless of graph size.

---

## 9. AI Integration

### 9.1 Correction to Original Prompt

The original prompt frames AI integration as "future work to design for." **This is incorrect.** The AI infrastructure (embedding providers, RAG engine, semantic search, context engine) is **already built and complete** (Phase 2.4). The actual situation is:

> **AI integration is currently idle, waiting on content — not waiting on infrastructure.**

Stage 5.3's job is to produce content the existing AI plumbing can operate on.

### 9.2 What Stage 5.3 Gives the AI Layer

| AI Capability                            | Currently Idle Because            | Stage 5.3 Enables                                                   |
| ---------------------------------------- | --------------------------------- | ------------------------------------------------------------------- |
| Semantic search over flashcards          | No flashcards exist               | Flashcard embeddings → "find me flashcards about memory management" |
| RAG over glossary terms                  | No glossary exists                | "Define virtual memory" answered from glossary                      |
| AI-generated practice questions          | No question template exists       | Questions from the dataset seed the generator                       |
| Similarity-based content recommendations | Similarity has nothing to compare | Tags + embeddings on real content unlock this                       |

### 9.3 No New AI Infrastructure Required

Stage 5.3 explicitly does **not** build:

- New embedding providers (reuse Phase 2.4)
- New RAG pipeline (reuse existing)
- New AI chat service (reuse existing `ai_chat.py` endpoint)
- New context engine (reuse existing)

The only integration work is:

1. Run the existing embedding pipeline over new content tables
2. Add `content_type` filter to existing search
3. Wire similarity queries through existing engines

---

## 10. Implementation Roadmap

### ⚠️ Prerequisite: Stage 5.2 Full Graph Import

Before any Phase 5.3B–D work begins, the `stage-5.2-full-graph-import` must have landed. The 181-node dataset at `stage5_2_import_refactored.json` is designed, validated, referentially checked, and ready — but **not yet in the live database**.

This is the single most important ordering constraint across all of Phase 5.3:

| Dataset                     | Depends on 181-node import?          |
| --------------------------- | ------------------------------------ |
| Flashcards (3.1)            | ❷ — each card references a node      |
| Glossary (3.2)              | ❷ — each term references a node      |
| Practice questions (3.3)    | ❷ — each question references a node  |
| Common mistakes (3.4)       | ❷ — each mistake references a node   |
| FAQ (3.5)                   | ❷ — each FAQ references a node       |
| Simulators (3.6)            | ❷ — each simulator references a node |
| Concept decomposition (3.7) | ❷ — each AKU references a node       |
| Learning resources (3.8)    | ❷ — each resource references a node  |

**Phase 5.3A is the only phase that can proceed before the 181-node import**, because it builds infrastructure (tables, services, APIs, frontend) that works correctly with content for any subset of nodes — including today's 40-node live set.

**Recommended ordering**:

1. Complete Phase 5.3A (foundation — takes ~41 hours, 40-node safe)
2. Complete `stage-5.2-full-graph-import` (import the 181 nodes)
3. Complete Phase 5.3B (data authoring — 181-node ready)
4. Complete Phase 5.3C (import & integrate — 181-node ready)
5. Complete Phase 5.3D (intelligent services — 181-node required)

### Phase 5.3A — Foundation (❶ 40-node safe)

| #   | Task                                                                                      | Est. Complexity | Depends On | Acceptance                              |
| --- | ----------------------------------------------------------------------------------------- | --------------- | ---------- | --------------------------------------- |
| 1   | Create `categories` table + migration                                                     | Small           | None       | `alembic upgrade head` works            |
| 2   | Add `content_status` column to `knowledge_nodes`                                          | Small           | None       | Column exists with default `'stub'`     |
| 3   | Add embedding columns to content tables                                                   | Small           | None       | Columns exist, nullable                 |
| 4   | Create all 5 new content tables (flashcards, glossary, practice_questions, mistakes, faq) | Medium          | Tasks 1-2  | All tables exist in schema              |
| 5   | Build `ContentQueryService` — read-only queries                                           | Medium          | Tasks 4    | Queries return correct data             |
| 6   | Build 7 read-only API endpoints (GET /knowledge/node/{slug}/_, GET /content/_)            | Medium          | Task 5     | Endpoints return data, pagination works |
| 7   | Add content sections to `/explore/[slug]` frontend                                        | Medium          | Task 6     | Tabs render when content exists         |
| 8   | Build flashcard study session UI `/learn/session/{slug}`                                  | Medium          | Task 6     | Spaced-repetition UX works              |
| 9   | Run quality gates and tests                                                               | Small           | Tasks 1-8  | All CI green                            |

### Phase 5.3B — Content Datasets (❷ 181-node ready, can start at 40)

| #   | Task                                                        | Est. Complexity | Depends On | Acceptance                      |
| --- | ----------------------------------------------------------- | --------------- | ---------- | ------------------------------- |
| 10  | Author `glossary.json` (~1,105 terms)                       | Large           | Task 4     | All 221 nodes have ≥3 terms     |
| 11  | Author `flashcards.json` (~2,210 cards)                     | Large           | Task 4     | All nodes have ≥10 cards        |
| 12  | Author `practice_questions.json` (~663 questions)           | Large           | Task 4     | All nodes have ≥3 questions     |
| 13  | Author `common_mistakes.json` (~200 entries)                | Medium          | Task 4     | Top 100 nodes covered           |
| 14  | Author `faq.json` (~221 entries)                            | Medium          | Task 4     | FAQ per node                    |
| 15  | Author `learning_resources_expansion.json` (~663 resources) | Medium          | Task 4     | Fill resource gap for 221 nodes |

### Phase 5.3C — Import & Integrate (❷ 181-node ready)

| #   | Task                                                           | Est. Complexity | Depends On     | Acceptance                           |
| --- | -------------------------------------------------------------- | --------------- | -------------- | ------------------------------------ |
| 16  | Build `ContentImportService` (validate + persist)              | Medium          | Tasks 4, 10-15 | All datasets import with 0 errors    |
| 17  | Build combined-graph integrity check                           | Medium          | Task 16        | References resolve across datasets   |
| 18  | Import glossary, flashcards, practice_questions, mistakes, FAQ | Medium          | Tasks 10-16    | All datasets live in DB              |
| 19  | Import simulators + learning resources                         | Medium          | Tasks 16       | Simulators appear on node pages      |
| 20  | Wire embedding pipeline for new content                        | Medium          | Tasks 2-3, 18  | Embeddings generated for all content |
| 21  | Content search integration                                     | Medium          | Tasks 6, 20    | Search returns content results       |

### Phase 5.3D — Intelligent Services (❸ 181-node required)

| #   | Task                                                              | Est. Complexity | Depends On   | Acceptance                              |
| --- | ----------------------------------------------------------------- | --------------- | ------------ | --------------------------------------- |
| 22  | Build `SimilarityService`                                         | Medium          | Tasks 18, 20 | Similar results are relevant            |
| 23  | Wire existing `RecommendationEngine` to content signals           | Medium          | Tasks 18, 22 | Recommendations include content reasons |
| 24  | Extend `SearchEngine` with content-type filter and hybrid ranking | Medium          | Tasks 18, 20 | Hybrid search (FTS + vector) works      |
| 25  | Run full integration tests against all content types              | Medium          | Tasks 18-24  | All tests pass                          |
| 26  | Final quality gates                                               | Small           | Tasks 22-25  | CI green, Docker green                  |

---

## 11. Engineering Rules

### 11.1 Schema Rules (carried over from refactor)

1. **`unlocks` is always derived, never stored.** No table gets an `unlocks` column. Any query asking for what a node unlocks must reverse-traverse `knowledge_edges` filtered by `relationship_type='prerequisite'`.
2. **`estimated_time` prohibited.** Only `estimated_hours` or `estimated_minutes` — explicit units.
3. **Domain references use canonical `categories.id` FK.** No new free-text domain columns.
4. **Pydantic catches type errors at construction.** Tests must use `pytest.raises(ValidationError)` — do not test `validate_schema` with invalid typed objects.

### 11.2 Content Status Rules

1. Content is only servable from nodes with `content_status >= 'verified'`.
2. Content import skips items for nodes in `stub` or `archived` status.
3. Content status transitions: `stub → draft → in_review → verified → published`. `archived` is terminal from any state.
4. Bulk status changes require the import pipeline, not ad-hoc queries.

### 11.3 Import Rules

1. No partial imports. If validation fails, nothing is written.
2. Upsert by ID — re-running the same import is a safe no-op.
3. Every import validates against the _whole_ database (combined-graph check).
4. Cycle detection (Kahn's algorithm) runs before any write.
5. Imports are authenticated (admin role required).

### 11.4 API Rules

1. New content endpoints hang off existing route groups — no new top-level groups without architectural review.
2. Default `content_status` filter: `verified` or higher.
3. Pagination on all list endpoints.
4. Cache headers on all read endpoints (content changes infrequently).

### 11.5 Frontend Rules

1. Content sections on `/explore/[slug]` only render if content exists — empty state is "no content yet."
2. No new top-level routes without explicit approval. Exception: `/learn/session/{slug}` (one new route).
3. Content status badges are admin-visible only.
4. Study session UI uses existing TooltipProvider and ToastProvider for interactions.

### 11.6 AI Rules

1. No new AI infrastructure. Stage 5.3 feeds the existing pipeline.
2. Content embedding runs as a batch process, not per-request.
3. The `SimilarityService` falls back to tag/domain overlap when embeddings are unavailable — never blocks on missing embeddings.

### 11.7 Clean Architecture Rules

1. Services import repositories, never ORM models.
2. Engines never access persistence directly — use repository interfaces.
3. API endpoints never call repositories directly — go through services.
4. All queries through the existing `UnitOfWork` pattern.
5. No circular imports between services, repositories, or engines.

---

## Appendix A: Master Checklist

### Phase 5.3A — Foundation (❶ 40-node safe)

| #   | Task                                    | Status     | Complexity | Depends On | Est. Hours |
| --- | --------------------------------------- | ---------- | ---------- | ---------- | ---------- |
| 1   | Create `categories` table + migration   | 🔲 Pending | Small      | None       | 2          |
| 2   | Add `content_status` column             | 🔲 Pending | Small      | None       | 1          |
| 3   | Add embedding columns to content tables | 🔲 Pending | Small      | None       | 1          |
| 4   | Create 5 new content tables + migration | 🔲 Pending | Medium     | 1-2        | 4          |
| 5   | Build `ContentQueryService`             | 🔲 Pending | Medium     | 4          | 6          |
| 6   | Build 7 read-only API endpoints         | 🔲 Pending | Medium     | 5          | 6          |
| 7   | Content sections on `/explore/[slug]`   | 🔲 Pending | Medium     | 6          | 8          |
| 8   | Flashcard study session UI              | 🔲 Pending | Medium     | 6          | 10         |
| 9   | Quality gates + tests                   | 🔲 Pending | Small      | 1-8        | 3          |

### Phase 5.3B — Content Datasets (❷ 181-node ready)

| #   | Task                                    | Status     | Complexity         | Est. Hours |
| --- | --------------------------------------- | ---------- | ------------------ | ---------- |
| 10  | Author `glossary.json` (~1,105 terms)   | 🔲 Pending | Large (data entry) | 20         |
| 11  | Author `flashcards.json` (~2,210 cards) | 🔲 Pending | Large (data entry) | 40         |
| 12  | Author `practice_questions.json` (~663) | 🔲 Pending | Large (data entry) | 30         |
| 13  | Author `common_mistakes.json` (~200)    | 🔲 Pending | Medium             | 8          |
| 14  | Author `faq.json` (~221 entries)        | 🔲 Pending | Medium             | 8          |
| 15  | Author `learning_resources.json` (~663) | 🔲 Pending | Medium             | 15         |

### Phase 5.3C — Import & Integrate (❷ 181-node ready)

| #   | Task                           | Status     | Complexity | Depends On | Est. Hours |
| --- | ------------------------------ | ---------- | ---------- | ---------- | ---------- |
| 16  | Build `ContentImportService`   | 🔲 Pending | Medium     | 4, 10-15   | 8          |
| 17  | Combined-graph integrity check | 🔲 Pending | Medium     | 16         | 4          |
| 18  | Import all Stage 5.3 datasets  | 🔲 Pending | Medium     | 10-16      | 4          |
| 19  | Import simulators + resources  | 🔲 Pending | Small      | 16         | 2          |
| 20  | Wire embedding pipeline        | 🔲 Pending | Medium     | 2-3, 18    | 6          |
| 21  | Content search integration     | 🔲 Pending | Medium     | 6, 20      | 4          |

### Phase 5.3D — Intelligent Services (❸ 181-node required)

| #   | Task                                 | Status     | Complexity | Depends On | Est. Hours |
| --- | ------------------------------------ | ---------- | ---------- | ---------- | ---------- |
| 22  | Build `SimilarityService`            | 🔲 Pending | Medium     | 18, 20     | 8          |
| 23  | Wire RecommendationEngine to content | 🔲 Pending | Medium     | 18, 22     | 6          |
| 24  | Extend SearchEngine                  | 🔲 Pending | Medium     | 18, 20     | 6          |
| 25  | Integration tests                    | 🔲 Pending | Medium     | 18-24      | 6          |
| 26  | Final quality gates                  | 🔲 Pending | Small      | 22-25      | 2          |

**Total estimated engineering hours**: ~213 hours (Phase 5.3A=41, 5.3B=121, 5.3C=28, 5.3D=22)

**Total estimated data authoring hours**: ~121 hours (Phase 5.3B — glossaries, flashcards, questions, etc.)

---

_End of Stage 5.3 Blueprint. All numbers grounded in verified project state at commit `234d65b`._
