-- ============================================================================
-- Migration 006: Add Act/District/Chapter Structure & Tier to Knowledge Nodes
-- ============================================================================

-- 1. Add new structural columns (all NULLABLE, additive only)
ALTER TABLE knowledge_nodes
  ADD COLUMN IF NOT EXISTS act SMALLINT CHECK (act BETWEEN 1 AND 8),
  ADD COLUMN IF NOT EXISTS district VARCHAR(100),
  ADD COLUMN IF NOT EXISTS chapter_number SMALLINT,
  ADD COLUMN IF NOT EXISTS tier VARCHAR(20) CHECK (tier IN ('gate_core', 'career_track'));

-- 2. Create indexes for Act/District/Chapter querying and Tier filtering
CREATE INDEX IF NOT EXISTS idx_nodes_act_district ON knowledge_nodes(act, district, chapter_number);
CREATE INDEX IF NOT EXISTS idx_nodes_tier ON knowledge_nodes(tier);

-- Comments
COMMENT ON COLUMN knowledge_nodes.act IS 'Act identifier (1 through 8) in the SV-OS curriculum framework';
COMMENT ON COLUMN knowledge_nodes.district IS 'District name / category within the Act';
COMMENT ON COLUMN knowledge_nodes.chapter_number IS 'Chapter sequence number within the District';
COMMENT ON COLUMN knowledge_nodes.tier IS 'Curriculum tier: gate_core or career_track';
