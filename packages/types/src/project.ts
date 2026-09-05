export interface Project {
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  tech_stack: string[];
  estimated_hours: number | null;
  github_url: string | null;
  demo_url: string | null;
  reference_repos: Array<{ title?: string; url?: string; note?: string }>;
  milestones: Array<{ step: number; title: string; description: string; deliverables: string[] }>;
  architecture_overview: string | null;
  linked_node_explanations: Record<string, string>;
  domains_crossed: string[];
  icon: string | null;
  color: string | null;
  is_published: boolean;
  extra_metadata: Record<string, unknown>;
  created_at: string;
}
