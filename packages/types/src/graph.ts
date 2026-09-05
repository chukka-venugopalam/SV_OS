export type NodeType = 'subject' | 'concept' | 'technology' | 'tool' | 'career' | 'project';

export type EdgeType =
  | 'prerequisite'
  | 'depends_on'
  | 'uses'
  | 'enables'
  | 'part_of'
  | 'related_to'
  | 'leads_to'
  | 'requires';

export type EdgeDirection = 'forward' | 'bidirectional' | 'unidirectional';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export interface KnowledgeNode {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  domain: string;
  /** Content QUALITY flag — distinct from is_published (visibility). */
  content_status: 'stub' | 'draft' | 'in_review' | 'verified' | 'published' | 'archived' | null;
  node_type: NodeType;
  difficulty: Difficulty;
  estimated_minutes: number;
  icon: string | null;
  color: string | null;
  view_count: number;
  is_published: boolean;
  /** Curriculum placement — act 1-7 = GATE-core, act 8 = career-track, null = unassigned. */
  act: number | null;
  district: string | null;
  chapter_number: number | null;
  tier: 'gate_core' | 'career_track' | null;
  worked_example: Record<string, unknown> | null;
  sources: unknown[];
  simulators: unknown[];
  common_mistakes: unknown;
  exam_traps: unknown;
  quick_techniques: unknown;
  previous_year_questions: unknown;
  cross_domain_connections: unknown[];
  learning_outcomes: unknown[];
  extra_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeEdge {
  id: string;
  source_id: string;
  target_id: string;
  relationship_type: EdgeType;
  direction: EdgeDirection;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GraphNode extends KnowledgeNode {
  prerequisites: KnowledgeNode[];
  unlocks: KnowledgeNode[];
  related: KnowledgeNode[];
  resources: LearningResource[];
}

export interface GraphSubgraph {
  nodes: KnowledgeNode[];
  edges: KnowledgeEdge[];
  center_node_id: string;
  depth: number;
}

export interface LearningResource {
  id: string;
  node_id: string;
  title: string;
  url: string;
  resource_type: string;
  description: string;
  is_free: boolean;
  duration_minutes: number | null;
  created_at: string;
}
