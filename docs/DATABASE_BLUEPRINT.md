# SV-OS Database Blueprint

> **Database**: PostgreSQL 16 | **Driver**: asyncpg | **ORM**: SQLAlchemy 2.0+  
> **Migrations**: Alembic | **Seed Data**: 9 SQL files | **Status**: Finalized ✅

---

## Design Principles

1. **Adjacency list** for graph storage (not a graph database — keeps infrastructure simple)
2. **Soft delete** on all entities via `is_deleted` flag
3. **Optimistic locking** via `version` counter on all entities
4. **UUID primary keys** generated at application level and database level
5. **JSONB** for extensible metadata on entities
6. **CHECK constraints** for enum validation (VARCHAR storage, not native PG enums)
7. **Full-text search** via weighted TSVECTOR with triggers
8. **Views** for common analytical queries

---

## Table Reference

| #   | Table                   | Domain      | Type      | Rows (est.) |
| --- | ----------------------- | ----------- | --------- | ----------- |
| 1   | `users`                 | Auth/User   | Core      | Variable    |
| 2   | `knowledge_nodes`       | Graph       | Core      | 500-5000    |
| 3   | `knowledge_edges`       | Graph       | Core      | 2000-20000  |
| 4   | `careers`               | Career      | Core      | 20-100      |
| 5   | `projects`              | Project     | Core      | 50-500      |
| 6   | `career_requirements`   | Career      | Join      | 100-1000    |
| 7   | `project_requirements`  | Project     | Join      | 100-1000    |
| 8   | `learning_resources`    | Learning    | Detail    | 500-5000    |
| 9   | `user_progress`         | Progress    | User Data | Variable    |
| 10  | `bookmarks`             | Interaction | User Data | Variable    |
| 11  | `favorites`             | Interaction | User Data | Variable    |
| 12  | `search_history`        | Interaction | User Data | Variable    |
| 13  | `activity_logs`         | Audit       | Audit     | Variable    |
| 14  | `password_reset_tokens` | Auth        | Transient | Variable    |

---

## Table Details

### 1. `users` — User Accounts

**Purpose**: Store registered user accounts, authentication data, and profile information.

**Relationships**:

- One-to-many: → `user_progress`, `bookmarks`, `favorites`, `search_history`
- One-to-many: → `activity_logs` (SET NULL on delete)
- One-to-many: → `password_reset_tokens`

**Indexes**:

| Index                | Column(s)  | Purpose                 |
| -------------------- | ---------- | ----------------------- |
| `idx_users_email`    | `email`    | Login lookup (UNIQUE)   |
| `idx_users_username` | `username` | Profile lookup (UNIQUE) |

**Key Columns**:

- `email` (VARCHAR 255, UNIQUE, NOT NULL) — Verified email
- `username` (VARCHAR 100, UNIQUE, NOT NULL) — Public handle
- `password_hash` (VARCHAR 255) — bcrypt hash
- `role` (VARCHAR 50) — `learner` or `admin`
- `preferences` (JSONB) — Extensible user preferences
- `is_active` (BOOLEAN) — Account active flag

**Future Scalability**:

- Add `auth_provider` column for OAuth identities
- Consider partitioning for millions of users
- Add `last_active_at` for engagement tracking

---

### 2. `knowledge_nodes` — Graph Vertices

**Purpose**: The fundamental unit of knowledge — every concept, technology, skill, project, and career is a node.

**Relationships**:

- One-to-many: → `knowledge_edges` (as source and target)
- One-to-many: → `user_progress`, `learning_resources`, `bookmarks`, `favorites`
- One-to-many: → `career_requirements`, `project_requirements`

**Indexes**:

| Index                  | Column(s)         | Purpose                |
| ---------------------- | ----------------- | ---------------------- |
| `idx_nodes_slug`       | `slug`            | URL lookup (UNIQUE)    |
| `idx_nodes_type`       | `node_type`       | Filter by type         |
| `idx_nodes_difficulty` | `difficulty`      | Filter by level        |
| `idx_nodes_published`  | `is_published`    | Published-only queries |
| `idx_nodes_search`     | `search_vector`   | GIN index for FTS      |
| `idx_nodes_created_at` | `created_at DESC` | Recent nodes           |

**Key Columns**:

- `slug` (VARCHAR 200, UNIQUE) — URL-safe identifier
- `title` (VARCHAR 300) — Display title
- `description` (TEXT) — Short summary
- `content` (TEXT) — Full learning material
- `node_type` (VARCHAR 50) — Subject, concept, technology, tool, career, project
- `difficulty` (VARCHAR 50) — Beginner, intermediate, advanced, expert
- `estimated_minutes` (INTEGER) — Time to complete
- `metadata` (JSONB) — Extensible: keywords, external links, version info
- `search_vector` (TSVECTOR) — Auto-updated FTS index
- `view_count` (INTEGER) — Popularity metric

**Future Scalability**:

- Add `locale` column for multilingual support
- Consider table partitioning by `node_type` for large graphs
- Add GIN index on `metadata` if query patterns emerge

---

### 3. `knowledge_edges` — Graph Edges

**Purpose**: Directed relationships between knowledge nodes, forming the graph structure.

**Relationships**:

- Many-to-one: → `knowledge_nodes` (source, ON DELETE CASCADE)
- Many-to-one: → `knowledge_nodes` (target, ON DELETE CASCADE)

**Indexes**:

| Index                     | Column(s)                        | Purpose            |
| ------------------------- | -------------------------------- | ------------------ |
| `idx_edges_source`        | `source_node_id`                 | Outgoing traversal |
| `idx_edges_target`        | `target_node_id`                 | Incoming traversal |
| `idx_edges_relationship`  | `relationship_type`              | Filter by type     |
| `idx_edges_source_target` | `source_node_id, target_node_id` | Pair lookup        |

**Constraints**:

- `edge_unique_pair`: UNIQUE (source_node_id, target_node_id, relationship_type)
- `edge_no_self_loop`: CHECK (source_node_id != target_node_id)

**Key Columns**:

- `relationship_type` (VARCHAR 50) — prerequisite, depends_on, uses, enables, part_of, related_to, leads_to, requires
- `direction` (VARCHAR 50) — forward, bidirectional, unidirectional
- `weight` (FLOAT) — Traversal weight (default: 1.0)
- `description` (TEXT) — Edge rationale
- `metadata` (JSONB) — Extensible edge metadata

**Future Scalability**:

- Add `valid_from`/`valid_to` for temporal edges
- Consider `edge_type` hierarchy for more granular filtering

---

### 4. `careers` — Career Paths

**Purpose**: Define career paths with demand levels and salary information.

**Relationships**:

- One-to-many: → `career_requirements`

**Indexes**:

| Index                | Column(s)      | Purpose             |
| -------------------- | -------------- | ------------------- |
| `idx_careers_slug`   | `slug`         | URL lookup (UNIQUE) |
| `idx_careers_demand` | `demand_level` | Filter by demand    |

**Key Columns**:

- `slug` (VARCHAR 200, UNIQUE)
- `demand_level` (VARCHAR 50) — declining, stable, growing, high_demand
- `average_salary` (VARCHAR 100)
- `required_experience` (VARCHAR 50)
- `metadata` (JSONB) — Extensible career data

---

### 5. `projects` — Learning Projects

**Purpose**: Hands-on projects that apply knowledge from multiple nodes.

**Relationships**:

- One-to-many: → `project_requirements`

**Indexes**:

| Index                     | Column(s)    | Purpose             |
| ------------------------- | ------------ | ------------------- |
| `idx_projects_slug`       | `slug`       | URL lookup (UNIQUE) |
| `idx_projects_difficulty` | `difficulty` | Filter by level     |

**Key Columns**:

- `tech_stack` (TEXT[]) — Array of technology names
- `estimated_hours` (INTEGER)
- `metadata` (JSONB)

---

### 6. `career_requirements` — Career Knowledge Mapping

**Purpose**: Many-to-many join between careers and required knowledge nodes.

**Relationships**:

- Many-to-one: → `careers`
- Many-to-one: → `knowledge_nodes`

**Indexes**:

| Index                   | Column(s)   | Purpose                       |
| ----------------------- | ----------- | ----------------------------- |
| `idx_career_req_career` | `career_id` | All requirements for a career |
| `idx_career_req_node`   | `node_id`   | All careers requiring a node  |

**Key Columns**:

- `requirement_type` (VARCHAR 50) — required, recommended, bonus
- `order_index` (INTEGER) — Display ordering

---

### 7. `project_requirements` — Project Knowledge Mapping

**Purpose**: Many-to-many join between projects and required knowledge.

Same structure as `career_requirements` but for projects.

---

### 8. `learning_resources` — External Learning Materials

**Purpose**: Curated external resources mapped to knowledge nodes.

**Relationships**:

- Many-to-one: → `knowledge_nodes`

**Indexes**:

| Index                | Column(s)       | Purpose                  |
| -------------------- | --------------- | ------------------------ |
| `idx_resources_node` | `node_id`       | All resources for a node |
| `idx_resources_type` | `resource_type` | Filter by type           |

**Key Columns**:

- `url` (TEXT) — External URL
- `resource_type` (VARCHAR 50) — video, article, course, book, documentation, tool, podcast, interactive
- `platform` (VARCHAR 100) — YouTube, Coursera, Udemy, etc.
- `is_free` (BOOLEAN)
- `duration_minutes` (INTEGER)
- `language` (VARCHAR 10) — ISO language code

---

### 9. `user_progress` — Learning Progress

**Purpose**: Track per-user, per-node learning progress.

**Relationships**:

- Many-to-one: → `users`
- Many-to-one: → `knowledge_nodes`

**Indexes**:

| Index                 | Column(s) | Purpose                       |
| --------------------- | --------- | ----------------------------- |
| `idx_progress_user`   | `user_id` | All progress for a user       |
| `idx_progress_node`   | `node_id` | All users' progress on a node |
| `idx_progress_status` | `status`  | Filter by status              |

**Constraints**:

- `progress_unique`: UNIQUE (user_id, node_id)

**Key Columns**:

- `status` (VARCHAR 50) — not_started, learning, completed, mastered
- `started_at` (TIMESTAMPTZ)
- `completed_at` (TIMESTAMPTZ)
- `mastered_at` (TIMESTAMPTZ)
- `time_spent_minutes` (INTEGER)
- `notes` (TEXT)

---

### 10. `bookmarks` — User Bookmarks

**Purpose**: Save nodes for later reference with optional notes.

**Relationships**:

- Many-to-one: → `users`
- Many-to-one: → `knowledge_nodes`

**Key Columns**:

- `notes` (TEXT) — Personal notes

---

### 11. `favorites` — User Favorites

**Purpose**: One-click like/save for quick access.

Same structure as bookmarks but without notes — simpler interaction.

---

### 12. `search_history` — User Search History

**Purpose**: Record user searches for analytics and personalization.

**Relationships**:

- Many-to-one: → `users`

**Indexes**:

| Index                | Column(s)         | Purpose               |
| -------------------- | ----------------- | --------------------- |
| `idx_search_user`    | `user_id`         | User's search history |
| `idx_search_created` | `created_at DESC` | Recent searches       |

**Key Columns**:

- `query` (TEXT) — Search text
- `filters` (JSONB) — Applied filters
- `results_count` (INTEGER)

---

### 13. `activity_logs` — Audit Trail

**Purpose**: Immutable audit log for all user actions.

**Relationships**:

- Many-to-one: → `users` (SET NULL on delete — preserve audit trail)

**Indexes**:

| Index                  | Column(s)                | Purpose               |
| ---------------------- | ------------------------ | --------------------- |
| `idx_activity_user`    | `user_id`                | User's activity       |
| `idx_activity_action`  | `action`                 | Filter by action type |
| `idx_activity_created` | `created_at DESC`        | Recent activity       |
| `idx_activity_entity`  | `entity_type, entity_id` | Entity history        |

**Key Columns**:

- `action` (VARCHAR 100) — e.g., "node.viewed", "node.completed"
- `entity_type` (VARCHAR 50)
- `entity_id` (UUID)
- `metadata` (JSONB) — Action-specific data
- `ip_address` (INET) — Request origin

**Future Scalability**:

- Partition by month for large tables
- Consider TimescaleDB for time-series optimization

---

### 14. `password_reset_tokens` — Password Reset

**Purpose**: Secure password reset tokens with expiry.

**Relationships**:

- Many-to-one: → `users`

**Indexes**:

| Index                           | Column(s)    | Purpose               |
| ------------------------------- | ------------ | --------------------- |
| `idx_password_reset_user`       | `user_id`    | Find tokens for user  |
| `idx_password_reset_token_hash` | `token_hash` | Token lookup (UNIQUE) |

**Key Columns**:

- `token_hash` (VARCHAR 255, UNIQUE) — SHA-256 hash of token
- `expires_at` (TIMESTAMPTZ) — 1-hour from creation
- `is_used` (BOOLEAN) — Prevent reuse

---

## Database Views

### `v_node_statistics`

Purpose: Pre-computed node metrics for dashboard and analytics.

Columns: `id`, `slug`, `title`, `node_type`, `difficulty`, `estimated_minutes`, `view_count`, `prerequisite_count`, `unlock_count`, `resource_count`

### `v_user_progress_summary`

Purpose: Aggregated progress per user for dashboard.

Columns: `user_id`, `total_nodes`, `not_started_count`, `learning_count`, `completed_count`, `mastered_count`, `total_time_minutes`

---

## Extension Justification

| Extension    | Purpose            | Why Needed                                       |
| ------------ | ------------------ | ------------------------------------------------ |
| `uuid-ossp`  | UUID generation    | Primary keys, `gen_random_uuid()`                |
| `pg_trgm`    | Trigram similarity | Fuzzy search on titles/descriptions              |
| `unaccent`   | Accent removal     | Normalize FTS for accented characters            |
| `btree_gin`  | GIN on scalars     | Composite indexes for (search_vector, node_type) |
| `btree_gist` | GiST on scalars    | Future exclusion constraints for scheduling      |

---

## Full-Text Search Design

### Weighting Strategy

| Field         | Weight          | Purpose                         |
| ------------- | --------------- | ------------------------------- |
| `title`       | **A** (highest) | Title matches are most relevant |
| `description` | **B**           | Description is secondary        |
| `content`     | **C**           | Full content is tertiary        |

### Trigger

```sql
NEW.search_vector :=
  setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
  setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
  setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
```

Triggered on INSERT or UPDATE of `title`, `description`, or `content`.

---

## Migration History

| #   | Revision | Change                                                 | Dependencies |
| --- | -------- | ------------------------------------------------------ | ------------ |
| 1   | `0001`   | Create PostgreSQL extensions                           | None         |
| 2   | `0002`   | Initial schema (all tables, enums, indexes, triggers)  | 0001         |
| 3   | `0003`   | Add `password_hash` column to users                    | 0002         |
| 4   | `0004`   | Create AI chat tables                                  | 0002         |
| 5   | `0005`   | Add password reset tokens                              | 0002         |
| 6   | `0006`   | Convert native enums to VARCHAR with CHECK constraints | 0002         |

---

_Cross-reference: [KNOWLEDGE_GRAPH_DESIGN.md](./KNOWLEDGE_GRAPH_DESIGN.md), [API_BLUEPRINT.md](./API_BLUEPRINT.md)_
