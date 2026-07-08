/**
 * Projects API service.
 *
 * Provides functions for interacting with project endpoints.
 */

import { apiClient } from '@/lib/api-client';
import type { Project, ProjectWithRequirements, KnowledgeNode } from '@sv-os/types';
import type { PaginatedResponse } from '@sv-os/types';

// ── Service ───────────────────────────────────────────────────────

export const projectService = {
  /** Get a paginated list of projects */
  list(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    difficulty?: string;
  }): Promise<PaginatedResponse<Project>> {
    return apiClient
      .get<PaginatedResponse<Project>>('/projects', { params: params as Record<string, string | number | boolean | undefined> })
      .then((res) => res.data!);
  },

  /** Get a single project by slug */
  getBySlug(slug: string): Promise<ProjectWithRequirements> {
    return apiClient.get<ProjectWithRequirements>(`/projects/${slug}`).then((res) => res.data!);
  },

  /** Get the knowledge requirements for a project */
  getRequirements(slug: string): Promise<{
    required: KnowledgeNode[];
    recommended: KnowledgeNode[];
  }> {
    return apiClient
      .get<{ required: KnowledgeNode[]; recommended: KnowledgeNode[] }>(`/projects/${slug}/requirements`)
      .then((res) => res.data!);
  },
};
