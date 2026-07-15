-- ============================================================================
-- SV-OS Database Schema
-- Silicon Valley Learning OS
-- ============================================================================
-- This schema defines the complete PostgreSQL database for the SV-OS platform.
-- It uses an adjacency list pattern to represent the knowledge graph with
-- recursive CTEs for graph traversal.
-- ============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- ENUMERATIONS
-- ============================================================================

CREATE TYPE node_type_enum AS ENUM (
    'subject',
    'concept',
    'technology',
    'tool',
    'career',
    'project'
);

CREATE TYPE edge_type_enum AS ENUM (
    'prerequisite',
    'depends_on',
    'uses',
    'enables',
    'part_of',
    'related_to',
    'leads_to',
    'requires'
);

CREATE TYPE edge_direction_enum AS ENUM (
    'forward',
    'bidirectional',
    'unidirectional'
);

CREATE TYPE difficulty_enum AS ENUM (
    'beginner',
    'intermediate',
    'advanced',
    'expert'
);

CREATE TYPE progress_enum AS ENUM (
    'not_started',
    'learning',
    'completed',
    'mastered'
);

CREATE TYPE demand_enum AS ENUM (
    'declining',
    'stable',
    'growing',
    'high_demand'
);

CREATE TYPE user_role_enum AS ENUM (
    'learner',
    'admin'
);

CREATE TYPE resource_type_enum AS ENUM (
    'video',
    'article',
    'course',
    'book',
    'documentation',
    'tool',
    'podcast',
    'interactive'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- 1. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    avatar_url TEXT,
    bio TEXT,
    password_hash VARCHAR(255),
    role user_role_enum NOT NULL DEFAULT 'learner',
    preferences JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMPTZ,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN users.password_hash IS 'Bcrypt hash of the user password';
COMMENT ON COLUMN users.is_deleted IS 'Soft-delete flag (True = logically deleted)';
COMMENT ON COLUMN users.version IS 'Optimistic-locking version counter';

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- 2. Knowledge Nodes
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    content TEXT,
    node_type node_type_enum NOT NULL,
    difficulty difficulty_enum NOT NULL DEFAULT 'beginner',
    estimated_minutes INTEGER NOT NULL DEFAULT 30,
    icon VARCHAR(50),
    color VARCHAR(7),
    metadata JSONB NOT NULL DEFAULT '{}',
    search_vector TSVECTOR,
    view_count INTEGER NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nodes_slug ON knowledge_nodes(slug);
CREATE INDEX idx_nodes_type ON knowledge_nodes(node_type);
CREATE INDEX idx_nodes_difficulty ON knowledge_nodes(difficulty);
CREATE INDEX idx_nodes_created_at ON knowledge_nodes(created_at DESC);
CREATE INDEX idx_nodes_published ON knowledge_nodes(is_published);
CREATE INDEX idx_nodes_search ON knowledge_nodes USING GIN(search_vector);

-- 3. Knowledge Edges (Adjacency List for Graph)
CREATE TABLE knowledge_edges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    target_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    relationship_type edge_type_enum NOT NULL,
    direction edge_direction_enum NOT NULL DEFAULT 'forward',
    description TEXT NOT NULL DEFAULT '',
    weight FLOAT NOT NULL DEFAULT 1.0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT edge_unique_pair UNIQUE (source_node_id, target_node_id, relationship_type),
    CONSTRAINT edge_no_self_loop CHECK (source_node_id != target_node_id)
);

CREATE INDEX idx_edges_source ON knowledge_edges(source_node_id);
CREATE INDEX idx_edges_target ON knowledge_edges(target_node_id);
CREATE INDEX idx_edges_relationship ON knowledge_edges(relationship_type);
CREATE INDEX idx_edges_direction ON knowledge_edges(direction);
CREATE INDEX idx_edges_source_target ON knowledge_edges(source_node_id, target_node_id);

-- 4. Careers
CREATE TABLE careers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    average_salary VARCHAR(100),
    demand_level demand_enum NOT NULL DEFAULT 'growing',
    required_experience VARCHAR(50),
    icon VARCHAR(50),
    color VARCHAR(7),
    metadata JSONB NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_careers_slug ON careers(slug);
CREATE INDEX idx_careers_demand ON careers(demand_level);

-- 5. Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(200) UNIQUE NOT NULL,
    title VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    difficulty difficulty_enum NOT NULL DEFAULT 'intermediate',
    estimated_hours INTEGER NOT NULL DEFAULT 10,
    tech_stack TEXT[] NOT NULL DEFAULT '{}',
    icon VARCHAR(50),
    color VARCHAR(7),
    metadata JSONB NOT NULL DEFAULT '{}',
    is_published BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_difficulty ON projects(difficulty);

-- 6. Career Requirements (Many-to-Many: Career → Knowledge Nodes)
CREATE TABLE career_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    career_id UUID NOT NULL REFERENCES careers(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('required', 'recommended', 'bonus')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT career_req_unique UNIQUE (career_id, node_id, requirement_type)
);

CREATE INDEX idx_career_req_career ON career_requirements(career_id);
CREATE INDEX idx_career_req_node ON career_requirements(node_id);

-- 7. Project Requirements (Many-to-Many: Project → Knowledge Nodes)
CREATE TABLE project_requirements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('required', 'recommended')),
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT project_req_unique UNIQUE (project_id, node_id, requirement_type)
);

CREATE INDEX idx_project_req_project ON project_requirements(project_id);
CREATE INDEX idx_project_req_node ON project_requirements(node_id);

-- 8. Learning Resources
CREATE TABLE learning_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    title VARCHAR(300) NOT NULL,
    url TEXT NOT NULL,
    resource_type resource_type_enum NOT NULL,
    platform VARCHAR(100),
    is_free BOOLEAN NOT NULL DEFAULT true,
    duration_minutes INTEGER,
    difficulty difficulty_enum NOT NULL DEFAULT 'beginner',
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_resources_node ON learning_resources(node_id);
CREATE INDEX idx_resources_type ON learning_resources(resource_type);

-- 9. User Progress
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    status progress_enum NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    time_spent_minutes INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT progress_unique UNIQUE (user_id, node_id)
);

CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_progress_node ON user_progress(node_id);
CREATE INDEX idx_progress_status ON user_progress(status);

-- 10. Bookmarks
CREATE TABLE bookmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bookmark_unique UNIQUE (user_id, node_id)
);

CREATE INDEX idx_bookmarks_user ON bookmarks(user_id);

-- 11. Favorites
CREATE TABLE favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT favorite_unique UNIQUE (user_id, node_id)
);

CREATE INDEX idx_favorites_user ON favorites(user_id);

-- 12. Search History
CREATE TABLE search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query TEXT NOT NULL,
    filters JSONB NOT NULL DEFAULT '{}',
    results_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_search_user ON search_history(user_id);
CREATE INDEX idx_search_created ON search_history(created_at DESC);

-- 13. Activity Logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    metadata JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_user ON activity_logs(user_id);
CREATE INDEX idx_activity_action ON activity_logs(action);
CREATE INDEX idx_activity_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_entity ON activity_logs(entity_type, entity_id);

-- 14. Password Reset Tokens
CREATE TABLE password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT false,
    is_deleted BOOLEAN NOT NULL DEFAULT false,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_password_reset_user ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_token_hash ON password_reset_tokens(token_hash);

-- ============================================================================
-- FULL-TEXT SEARCH TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'C');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_search_vector
    BEFORE INSERT OR UPDATE OF title, description, content
    ON knowledge_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_search_vector();

-- ============================================================================
-- UPDATED_AT TRIGGER
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_nodes_updated_at
    BEFORE UPDATE ON knowledge_nodes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_careers_updated_at
    BEFORE UPDATE ON careers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_projects_updated_at
    BEFORE UPDATE ON projects
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Node with prerequisite count
CREATE VIEW v_node_statistics AS
SELECT
    n.id,
    n.slug,
    n.title,
    n.node_type,
    n.difficulty,
    n.estimated_minutes,
    n.view_count,
    COUNT(DISTINCT e_in.target_node_id) AS prerequisite_count,
    COUNT(DISTINCT e_out.source_node_id) AS unlock_count,
    COUNT(DISTINCT lr.id) AS resource_count
FROM knowledge_nodes n
LEFT JOIN knowledge_edges e_in ON e_in.source_node_id = n.id AND e_in.relationship_type = 'prerequisite'
LEFT JOIN knowledge_edges e_out ON e_out.target_node_id = n.id AND e_out.relationship_type = 'prerequisite'
LEFT JOIN learning_resources lr ON lr.node_id = n.id
WHERE n.is_published = true
GROUP BY n.id, n.slug, n.title, n.node_type, n.difficulty, n.estimated_minutes, n.view_count;

-- User progress summary
CREATE VIEW v_user_progress_summary AS
SELECT
    up.user_id,
    COUNT(*) AS total_nodes,
    COUNT(*) FILTER (WHERE up.status = 'not_started') AS not_started_count,
    COUNT(*) FILTER (WHERE up.status = 'learning') AS learning_count,
    COUNT(*) FILTER (WHERE up.status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE up.status = 'mastered') AS mastered_count,
    SUM(up.time_spent_minutes) AS total_time_minutes
FROM user_progress up
GROUP BY up.user_id;
