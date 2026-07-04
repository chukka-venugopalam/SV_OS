import type { KnowledgeNode } from './graph';

export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  tech_stack: string[];
  estimated_time: string;
  github_url: string | null;
  demo_url: string | null;
  image_url: string | null;
  icon_name: string;
  color: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProjectRequirement {
  id: string;
  project_id: string;
  node_id: string;
  requirement_type: 'required' | 'recommended';
  notes: string | null;
}

export interface ProjectWithRequirements extends Project {
  requirements: ProjectRequirement[];
  roadmap: {
    required: KnowledgeNode[];
    recommended: KnowledgeNode[];
  };
}
