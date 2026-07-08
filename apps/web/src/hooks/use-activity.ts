/**
 * React Query hook for the activity feed.
 */

'use client';

import { useQuery } from '@tanstack/react-query';
import { activityService } from '@/services/activity';

// ── Query Key Factory ─────────────────────────────────────────────

export const activityKeys = {
  all: ['activity'] as const,
  feed: (params?: Record<string, unknown>) => [...activityKeys.all, 'feed', params] as const,
};

// ── Hooks ─────────────────────────────────────────────────────────

/** Get the current user's recent activity feed */
export function useActivityFeed(params?: {
  page?: number;
  page_size?: number;
}) {
  return useQuery({
    queryKey: activityKeys.feed(params),
    queryFn: () => activityService.getFeed(params),
    staleTime: 60 * 1000,
  });
}
