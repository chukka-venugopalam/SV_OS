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
  description: string;
  content: string;
  node_type: NodeType;
  difficulty: Difficulty;
  icon_name: string;
  color: string;
  metadata: Record<string, unknown>;
  is_published: boolean;
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
