import type { KnowledgeNode } from './graph';

export type CareerDemand = 'declining' | 'stable' | 'growing' | 'high_demand';

export type RequirementType = 'required' | 'recommended' | 'bonus';

export interface Career {
  id: string;
  slug: string;
  title: string;
  description: string;
  salary_range: string;
  demand: CareerDemand;
  icon_name: string;
  color: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CareerRequirement {
  id: string;
  career_id: string;
  node_id: string;
  requirement_type: RequirementType;
  notes: string | null;
}

export interface CareerWithRequirements extends Career {
  requirements: CareerRequirement[];
  roadmap: {
    required: KnowledgeNode[];
    recommended: KnowledgeNode[];
    bonus: KnowledgeNode[];
  };
}
