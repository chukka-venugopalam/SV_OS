import type { KnowledgeNode } from './graph';

export type CareerDemand = 'declining' | 'stable' | 'growing' | 'high_demand';

export type RequirementType = 'required' | 'recommended' | 'bonus';

export interface CareerCertification {
  name: string;
  url?: string;
  note?: string;
  status?: string;
}

export interface Career {
  id: string;
  slug: string;
  title: string;
  description: string;
  average_salary?: number | string | null;
  salary_range?: string;
  demand_level: string;
  demand?: CareerDemand;
  required_experience?: string | null;
  icon: string | null;
  icon_name?: string;
  color: string | null;
  is_published: boolean;
  linked_projects: string[];
  companies_hiring: string[];
  certifications: Array<CareerCertification | string>;
  extra_metadata: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
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
