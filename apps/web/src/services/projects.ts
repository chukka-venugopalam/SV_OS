/**
 * Projects API service.
 *
 * Provides functions for interacting with project endpoints.
 */

import type { Project, KnowledgeNode, PaginatedResponse } from '@sv-os/types';

import { apiClient } from '@/lib/api-client';

// ── Service ───────────────────────────────────────────────────────

export const projectService = {
  /** Get a paginated list of projects */
  list(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    difficulty?: string;
  }): Promise<PaginatedResponse<Project>> {
    return apiClient
      .get<PaginatedResponse<Project>>('/projects', {
        params: params as unknown as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },

  /**
   * Get a single project by slug. NOTE: despite the old type name
   * (ProjectWithRequirements), the /projects/{slug} endpoint never actually
   * includes requirements or a roadmap field — verified against the
   * backend's _project_to_dict. Use getRequirements() separately, which is
   * what the detail page already correctly does via useProjectRequirements.
   */
  getBySlug(slug: string): Promise<Project> {
    return apiClient.get<Project>(`/projects/${slug}`).then((res) => res.data!);
  },

  /** Get the knowledge requirements for a project */
  getRequirements(slug: string): Promise<{
    required: KnowledgeNode[];
    recommended: KnowledgeNode[];
    items: (KnowledgeNode & { requirement_type: string })[];
  }> {
    return apiClient
      .get<{
        required: KnowledgeNode[];
        recommended: KnowledgeNode[];
        items: (KnowledgeNode & { requirement_type: string })[];
      }>(`/projects/${slug}/requirements`)
      .then((res) => res.data!);
  },
};
