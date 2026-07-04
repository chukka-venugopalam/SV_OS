-- ============================================================================
-- SV-OS — Database Health Check
-- ============================================================================
-- Run: psql -U svos -d svos -f database/scripts/health_check.sql
-- ============================================================================

\echo '═══════════════════════════════════════════════════════════════'
\echo '  SV-OS Database Health Check'
\echo '═══════════════════════════════════════════════════════════════'
\echo ''

-- ── 1. Extension Availability ─────────────────────────────────────
\echo '📦 1. Extensions'
\echo '───────────────────────────────────────────────────────────────'

SELECT name, installed_version, default_version
FROM pg_available_extensions
WHERE name IN ('uuid-ossp', 'pgcrypto', 'pg_trgm', 'unaccent', 'btree_gin', 'btree_gist')
    AND installed_version IS NOT NULL
ORDER BY name;

-- ── 2. Enum Types ────────────────────────────────────────────────
\echo ''
\echo '🔤 2. Enum Types'
\echo '───────────────────────────────────────────────────────────────'

SELECT t.typname AS enum_name, array_agg(e.enumlabel ORDER BY e.enumsortorder) AS values
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname IN (
    'node_type_enum', 'edge_type_enum', 'edge_direction_enum',
    'difficulty_enum', 'progress_enum', 'demand_enum',
    'user_role_enum', 'resource_type_enum', 'learning_status_enum',
    'visibility_enum', 'recommendation_type_enum',
    'requirement_type_enum', 'skill_relationship_type_enum'
)
GROUP BY t.typname
ORDER BY t.typname;

-- ── 3. Table Presence ─────────────────────────────────────────────
\echo ''
\echo '📋 3. Tables'
\echo '───────────────────────────────────────────────────────────────'

SELECT table_name, row_estimate, total_bytes, index_bytes, toast_bytes
FROM (
    SELECT
        relname AS table_name,
        (reltuples::bigint) AS row_estimate,
        pg_total_relation_size(relid) AS total_bytes,
        pg_indexes_size(relid) AS index_bytes,
        pg_total_relation_size(relid) - pg_relation_size(relid) - pg_indexes_size(relid) AS toast_bytes
    FROM pg_class
    WHERE relname IN (
        'users', 'knowledge_nodes', 'knowledge_edges',
        'careers', 'career_requirements',
        'projects', 'project_requirements',
        'learning_resources', 'learning_paths', 'learning_sessions',
        'skills', 'skill_relationships',
        'user_progress', 'bookmarks', 'favorites',
        'search_history', 'activity_logs', 'recommendations',
        'tags', 'node_tags'
    ) AND relkind = 'r'
) AS table_stats
ORDER BY table_name;

-- ── 4. Trigger Presence ───────────────────────────────────────────
\echo ''
\echo '⚡ 4. Triggers'
\echo '───────────────────────────────────────────────────────────────'

SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_%'
ORDER BY trigger_name;

-- ── 5. Index Coverage ─────────────────────────────────────────────
\echo ''
\echo '📑 5. Indexes'
\echo '───────────────────────────────────────────────────────────────'

SELECT
    tablename AS table_name,
    indexname AS index_name,
    indexdef AS index_definition
FROM pg_indexes
WHERE schemaname = 'public'
    AND tablename IN (
        'users', 'knowledge_nodes', 'knowledge_edges',
        'careers', 'career_requirements',
        'projects', 'project_requirements',
        'learning_resources', 'learning_paths', 'learning_sessions',
        'skills', 'skill_relationships',
        'user_progress', 'bookmarks', 'favorites',
        'search_history', 'activity_logs', 'recommendations',
        'tags', 'node_tags'
    )
ORDER BY tablename, indexname;

-- ── 6. GIN/GiST Indexes ──────────────────────────────────────────
\echo ''
\echo '🔍 6. GIN/GiST Indexes'
\echo '───────────────────────────────────────────────────────────────'

SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE indexdef ILIKE '%gin%' OR indexdef ILIKE '%gist%'
ORDER BY tablename;

-- ── 7. Constraint Coverage ────────────────────────────────────────
\echo ''
\echo '🔗 7. Foreign Key Constraints'
\echo '───────────────────────────────────────────────────────────────'

SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'f'
    AND conrelid::regclass::text IN (
        'users', 'knowledge_nodes', 'knowledge_edges',
        'careers', 'career_requirements',
        'projects', 'project_requirements',
        'learning_resources', 'learning_paths', 'learning_sessions',
        'skills', 'skill_relationships',
        'user_progress', 'bookmarks', 'favorites',
        'search_history', 'activity_logs', 'recommendations',
        'tags', 'node_tags'
    )
ORDER BY conname;

-- ── 8. Unique Constraints ─────────────────────────────────────────
\echo ''
\echo '🎯 8. Unique Constraints'
\echo '───────────────────────────────────────────────────────────────'

SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'u'
    AND conrelid::regclass::text IN (
        'users', 'knowledge_nodes', 'knowledge_edges',
        'careers', 'career_requirements',
        'projects', 'project_requirements',
        'learning_resources', 'learning_paths', 'learning_sessions',
        'skills', 'skill_relationships',
        'user_progress', 'bookmarks', 'favorites',
        'search_history', 'activity_logs', 'recommendations',
        'tags', 'node_tags'
    )
ORDER BY conname;

-- ── 9. Views ──────────────────────────────────────────────────────
\echo ''
\echo '👁️  9. Views'
\echo '───────────────────────────────────────────────────────────────'

SELECT table_name, view_definition
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- ── 10. Seed Data Counts ──────────────────────────────────────────
\echo ''
\echo '📊 10. Seed Data Counts'
\echo '───────────────────────────────────────────────────────────────'

SELECT 'knowledge_nodes' AS "Table", count(*) FROM knowledge_nodes
UNION ALL
SELECT 'knowledge_edges', count(*) FROM knowledge_edges
UNION ALL
SELECT 'careers', count(*) FROM careers
UNION ALL
SELECT 'projects', count(*) FROM projects
UNION ALL
SELECT 'learning_resources', count(*) FROM learning_resources
UNION ALL
SELECT 'skills', count(*) FROM skills
UNION ALL
SELECT 'tags', count(*) FROM tags
UNION ALL
SELECT 'learning_paths', count(*) FROM learning_paths
ORDER BY 1;

\echo ''
\echo '═══════════════════════════════════════════════════════════════'
\echo '  ✅ Health check complete!'
\echo '═══════════════════════════════════════════════════════════════'
