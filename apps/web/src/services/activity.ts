/**
 * Activity Feed API service.
 *
 * Provides functions for retrieving the user's recent activity feed.
 */

import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────

export type ActivityType = 'started' | 'completed' | 'mastered' | 'bookmarked' | 'favorited';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  node_id: string;
  node_title: string;
  node_slug: string;
  node_type: string;
  created_at: string;
}

export interface ActivityFeedResponse {
  items: ActivityItem[];
  total: number;
}

// ── Service ───────────────────────────────────────────────────────

export const activityService = {
  /** Get the current user's recent activity feed */
  getFeed(params?: { page?: number; page_size?: number }): Promise<ActivityFeedResponse> {
    return apiClient
      .get<ActivityFeedResponse>('/activity/feed', {
        params: params as unknown as Record<string, string | number | boolean | undefined>,
      })
      .then((res) => res.data!);
  },
};
