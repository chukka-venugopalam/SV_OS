# SV-OS — Database Design

## Philosophy

The knowledge graph is stored in **relational tables** (not Neo4j) using an **adjacency list** pattern. This eliminates the operational complexity of a graph database while providing efficient graph traversal via **recursive CTEs** (Common Table Expressions).

---

## Entity-Relationship Diagram

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│    users    │──────│  user_progress   │──────│knowledge_node│
└─────────────┘     └──────────────────┘     └──────────────┘
       │                                          │
       │                                          │
       ▼                                          ▼
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│  bookmarks  │──────│  favorites       │──────│knowledge_edge│
└─────────────┘     └──────────────────┘     └──────────────┘
       │                                          │
       ▼                                          │
┌─────────────┐     ┌──────────────────┐          │
│search_history│     │  activity_logs   │          │
└─────────────┘     └──────────────────┘          │
                                                  │
     ┌────────────┐     ┌────────────────┐        │
     │  careers   │──────│career_requirements│─────┘
     └────────────┘     └────────────────┘
                                                  │
     ┌────────────┐     ┌──────────────────┐       │
     │  projects  │──────│project_requirements│─────┘
     └────────────┘     └──────────────────┘
                                                  │
     ┌──────────────────┐                         │
     │learning_resources │─────────────────────────┘
     └──────────────────┘

     ┌──────────────────┐     ┌──────────────────┐
     │  learning_paths  │     │learning_sessions  │
     └──────────────────┘     └──────────────────┘
                                                  │
     ┌────────┐     ┌──────────────────┐          │
     │ skills │──────│skill_relationships│          │
     └────────┘     └──────────────────┘
                                                  │
     ┌────────┐     ┌──────────────────┐          │
     │  tags  │──────│   node_tags      │──────────┘
     └────────┘     └──────────────────┘

     ┌──────────────────┐
     │ recommendations  │
     └──────────────────┘
```

---

## Migrations

SV-OS uses **Alembic** for schema management. All changes go through version-controlled migration files.

| Revision | Description |
|----------|-------------|
| `0001` | Enable PostgreSQL extensions (uuid-ossp, pgcrypto, pg_trgm, unaccent, btree_gin, btree_gist) |
| `0002` | Initial schema: 20 tables, 13 enums, indexes, constraints, triggers, views |

See `database/migrations/README.md` for complete migration documentation.

## Extensions

| Extension | Purpose |
|-----------|---------|
| `uuid-ossp` | UUID generation for primary keys |
| `pgcrypto` | Cryptographic functions for future encryption needs |
| `pg_trgm` | Trigram text similarity for fuzzy search |
| `unaccent` | Accent removal for full-text search normalization |
| `btree_gin` | GIN indexes on scalar columns for composite indexes |
| `btree_gist` | GiST indexes on scalar columns for future exclusion constraints |

## Tables

### 1. `users` (16 columns)
Registered platform users (learner/admin).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | UUID | PK, DEFAULT gen_random_uuid() | Unique identifier |
| email | VARCHAR(255) | UNIQUE, NOT NULL | User email |
| username | VARCHAR(100) | UNIQUE, NOT NULL | Display name |
| display_name | VARCHAR(200) | nullable | Display name shown in UI |
| avatar_url | TEXT | nullable | Profile picture URL |
| bio | TEXT | nullable | Short biography |
| role | user_role_enum | DEFAULT 'learner' | 'learner', 'admin' |
| preferences | JSONB | DEFAULT '{}' | User preferences |
| is_active | BOOLEAN | DEFAULT true | Account status |
| last_login_at | TIMESTAMPTZ | nullable | Last login timestamp |
| created_at | TIMESTAMPTZ | DEFAULT NOW() | Creation timestamp |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |
| is_deleted | BOOLEAN | DEFAULT false | Soft-delete flag |
| version | INTEGER | DEFAULT 1 | Optimistic-locking counter |

### 2. `knowledge_nodes` (18 columns)
Central knowledge graph entity. All node types (subjects, concepts, technologies, tools) are stored in this single table and discriminated by `node_type`.

Key columns: `slug` (UNIQUE), `title`, `description`, `content`, `node_type`, `difficulty`, `search_vector` (TSVECTOR with GIN index), `is_published`.

### 3. `knowledge_edges` (12 columns)
Directed, typed relationships between knowledge nodes. Supports graph traversal via recursive CTEs.

Unique constraint: `(source_node_id, target_node_id, relationship_type)`. Check constraint: `source_node_id != target_node_id`.

### 4. `careers` (15 columns)
Professional career paths with market demand tracking.

### 5. `career_requirements` (9 columns)
Many-to-many join: Career → KnowledgeNode with requirement type (required/recommended/bonus).

### 6. `projects` (15 columns)
Hands-on build exercises with tech_stack array.

### 7. `project_requirements` (9 columns)
Many-to-many join: Project → KnowledgeNode with requirement type.

### 8. `learning_resources` (14 columns)
External learning materials (videos, articles, courses, books) linked to knowledge nodes.

### 9. `learning_paths` (14 columns)
Curated, ordered sequences of knowledge nodes. Node membership stored as JSONB `node_order` array.

### 10. `learning_sessions` (12 columns)
Single study session tracking for a user on a knowledge node.

### 11. `skills` (10 columns)
Discrete measurable abilities across categories (Programming Language, Web, DevOps, Database, Cloud, AI/ML, Security, Soft Skill).

### 12. `skill_relationships` (9 columns)
Directed relationships between skills (prerequisite, builds_upon, complement, specialization, alternative).

### 13. `user_progress` (13 columns)
User learning status lifecycle on a knowledge node (not_started → learning → completed → mastered).

### 14. `bookmarks` (8 columns)
User-saved knowledge nodes for quick access. Each (user, node) pair is unique.

### 15. `favorites` (7 columns)
User-liked knowledge nodes used as recommendation signals.

### 16. `search_history` (9 columns)
User search query records for analytics and personalisation.

### 17. `activity_logs` (11 columns)
Immutable audit trail for system events. User ID uses ON DELETE SET NULL to preserve logs.

### 18. `recommendations` (12 columns)
Personalised content suggestions generated by the recommendation engine (future phase).

### 19. `tags` (7 columns)
Free-form categorisation labels. Name is unique.

### 20. `node_tags` (7 columns)
Many-to-many join: Tag → KnowledgeNode with unique constraint on (node_id, tag_id).

---

## Enumerations (13)

### node_type_enum
```sql
CREATE TYPE node_type_enum AS ENUM (
    'subject', 'concept', 'technology', 'tool', 'career', 'project'
);
```

### edge_type_enum
```sql
CREATE TYPE edge_type_enum AS ENUM (
    'prerequisite', 'depends_on', 'uses', 'enables', 'part_of',
    'related_to', 'leads_to', 'requires'
);
```

### edge_direction_enum
```sql
CREATE TYPE edge_direction_enum AS ENUM (
    'forward', 'bidirectional', 'unidirectional'
);
```

### difficulty_enum
```sql
CREATE TYPE difficulty_enum AS ENUM (
    'beginner', 'intermediate', 'advanced', 'expert'
);
```

### Other enums
- `progress_enum`: not_started, learning, completed, mastered
- `demand_enum`: declining, stable, growing, high_demand
- `user_role_enum`: learner, admin
- `resource_type_enum`: video, article, course, book, documentation, tool, podcast, interactive
- `learning_status_enum`: active, paused, completed, abandoned
- `visibility_enum`: public, private, shared
- `recommendation_type_enum`: career_path, learning_path, skill_gap, related_content, popular, next_step
- `requirement_type_enum`: required, recommended, bonus
- `skill_relationship_type_enum`: prerequisite, builds_upon, complement, specialization, alternative

---

## Index Strategy

Total indexes: 30 across all 20 tables. Every index is justified for specific query patterns.

### Key Index Groups

**Graph Traversal**
- `knowledge_edges(source_node_id)` — outgoing edges
- `knowledge_edges(target_node_id)` — incoming edges  
- `knowledge_edges(source_node_id, target_node_id)` — composite graph traversal
- `knowledge_edges(relationship_type)` — filter by edge type
- `skill_relationships(source_skill_id)` — outgoing skill relationships
- `skill_relationships(target_skill_id)` — incoming skill relationships

**Full-Text Search**
- `knowledge_nodes.search_vector` (GIN) — full-text search

**Filtered Queries**
- `knowledge_nodes(is_published)` — published nodes only
- `knowledge_nodes(node_type)` — filter by type
- `knowledge_nodes(difficulty)` — filter by difficulty
- `learning_paths(is_published)` — published paths only
- `projects(difficulty)` — filter by difficulty
- `careers(demand_level)` — filter by demand

**User Data Lookup**
- `user_progress(user_id)` — user dashboard
- `user_progress(status)` — filter by progress status
- `bookmarks(user_id)` — user bookmarks
- `favorites(user_id)` — user favorites
- `search_history(user_id)` — search history per user
- `recommendations(user_id)` — recommendations per user
- `learning_sessions(user_id)` — sessions per user

**Audit Trail**
- `activity_logs(user_id)` — actions by user
- `activity_logs(action)` — filter by action type
- `activity_logs(entity_type, entity_id)` — entity lookup
- `activity_logs(created_at DESC)` — time-ordered queries

### Indexes Avoided
- JSONB GIN indexes on metadata columns — premature without query profiling
- Composite (node_type, is_published) — bitmap scan combining single-column indexes is sufficient
- Unique constraint columns (email, username, slug) — PostgreSQL auto-creates index from unique constraint

---

## Full-Text Search

A trigger-updated `tsvector` column enables efficient full-text search:

```sql
-- Trigger function
CREATE FUNCTION update_search_vector() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE OF title, description, content
    ON knowledge_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- GIN index
CREATE INDEX ix_knowledge_nodes_search_vector
    ON knowledge_nodes USING GIN(search_vector);
```

Weighting: Title (A) > Description (B) > Content (C). Language: English.

Query pattern:
```sql
SELECT title, slug, node_type,
    ts_rank(search_vector, query) AS rank
FROM knowledge_nodes, plainto_tsquery('english', :search_query) AS query
WHERE search_vector @@ query
    AND is_published = true
ORDER BY rank DESC
LIMIT 20;
```

---

## Views

### v_node_statistics
Node with prerequisite count, unlock count, and resource count.

### v_user_progress_summary
User progress aggregated counts (total, not_started, learning, completed, mastered) and total time spent.

---

## Graph Traversal Examples

### Find all prerequisites (recursive CTE)

```sql
WITH RECURSIVE prereqs AS (
    SELECT e.source_node_id, 1 AS depth, ARRAY[e.source_node_id] AS path
    FROM knowledge_edges e
    WHERE e.target_node_id = :node_id
        AND e.relationship_type = 'prerequisite'
        AND e.direction = 'forward'
    UNION ALL
    SELECT e.source_node_id, p.depth + 1, p.path || e.source_node_id
    FROM knowledge_edges e
    JOIN prereqs p ON e.target_node_id = p.source_node_id
    WHERE e.relationship_type = 'prerequisite'
        AND e.direction = 'forward'
        AND NOT e.source_node_id = ANY(p.path)
        AND p.depth < 10
)
SELECT DISTINCT n.*, p.depth, e.description
FROM prereqs p
JOIN knowledge_nodes n ON n.id = p.source_node_id
JOIN knowledge_edges e ON e.target_node_id = n.id
ORDER BY p.depth DESC;
```

### Find complete learning path for a career

```sql
WITH career_nodes AS (
    SELECT cr.node_id, cr.order_index, cr.requirement_type
    FROM career_requirements cr
    WHERE cr.career_id = :career_id
),
node_prereqs AS (
    SELECT DISTINCT e.source_node_id
    FROM knowledge_edges e
    WHERE e.target_node_id IN (SELECT node_id FROM career_nodes)
        AND e.relationship_type = 'prerequisite'
        AND e.direction = 'forward'
    UNION
    SELECT DISTINCT e2.source_node_id
    FROM knowledge_edges e2
    WHERE e2.target_node_id IN (
        SELECT source_node_id FROM knowledge_edges
        WHERE target_node_id IN (SELECT node_id FROM career_nodes)
            AND relationship_type = 'prerequisite'
            AND direction = 'forward'
    )
)
SELECT n.*, 'prerequisite' AS requirement_type, 0 AS order_index
FROM knowledge_nodes n
WHERE n.id IN (SELECT source_node_id FROM node_prereqs)
UNION ALL
SELECT n.*, cn.requirement_type, cn.order_index
FROM knowledge_nodes n
JOIN career_nodes cn ON n.id = cn.node_id
ORDER BY order_index, title;
```

---

## Seed Data

See `database/seeds/` for 9 seed files covering foundational reference data:

| File | Records | Description |
|------|---------|-------------|
| `01_subjects.sql` | 12 | Top-level academic subjects |
| `02_concepts.sql` | 30 | Core CS concepts |
| `03_technologies.sql` | 17 | Technologies and frameworks |
| `04_careers.sql` | 9 | Professional career paths |
| `05_projects.sql` | 10 | Hands-on build exercises |
| `06_edges.sql` | ~70 | Knowledge graph relationships |
| `07_learning_resources.sql` | 28 | External learning materials |
| `08_skills.sql` | 44 | Skills across 7 categories |
| `09_tags.sql` | 30 | Free-form categorisation labels |

Load via: `./database/scripts/seed.sh`
