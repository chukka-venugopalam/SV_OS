/**
 * React Query hooks for user preferences.
 *
 * Provides hooks for loading, updating, and syncing user preferences
 * with the backend.  Syncs to the local Zustand store for immediate
 * UI responsiveness.
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { settingsService, type UserPreferences } from '@/services/settings';
import { useUIStore } from '@/stores/ui-store';

// ── Query Key Factory ─────────────────────────────────────────────

export const preferencesKeys = {
  all: ['preferences'] as const,
};

// ── Hook: Load Preferences ────────────────────────────────────────

export function usePreferences() {
  return useQuery({
    queryKey: preferencesKeys.all,
    queryFn: settingsService.getPreferences,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Hook: Sync Preferences to Store ───────────────────────────────

export function useSyncPreferences() {
  const { data: preferences, isLoading } = usePreferences();
  const setFontSize = useUIStore((s) => s.setFontSize);
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);

  useEffect(() => {
    if (!preferences || isLoading) return;

    // Sync font size
    if (preferences.font_size && ['sm', 'md', 'lg'].includes(preferences.font_size)) {
      setFontSize(preferences.font_size as 'sm' | 'md' | 'lg');
    }

    // Sync reduced motion
    if (preferences.reduced_motion !== undefined) {
      setReducedMotion(preferences.reduced_motion);
    }
  }, [preferences, isLoading, setFontSize, setReducedMotion]);
}

// ── Hook: Update Preferences ──────────────────────────────────────

export function useUpdatePreferences() {
  const queryClient = useQueryClient();
  const setFontSize = useUIStore((s) => s.setFontSize);
  const setReducedMotion = useUIStore((s) => s.setReducedMotion);

  return useMutation({
    mutationFn: (prefs: Partial<UserPreferences>) => settingsService.updatePreferences(prefs),
    onMutate: async (prefs) => {
      // Optimistic update to local store
      if (prefs.font_size && ['sm', 'md', 'lg'].includes(prefs.font_size)) {
        setFontSize(prefs.font_size as 'sm' | 'md' | 'lg');
      }
      if (prefs.reduced_motion !== undefined) {
        setReducedMotion(prefs.reduced_motion);
      }

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: preferencesKeys.all });

      // Snapshot previous value
      const previous = queryClient.getQueryData(preferencesKeys.all);

      // Optimistic update to cache
      queryClient.setQueryData(preferencesKeys.all, (old: UserPreferences | undefined) => ({
        ...(old ?? {}),
        ...prefs,
      }));

      return { previous };
    },
    onError: (_err, _prefs, context) => {
      // Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(preferencesKeys.all, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: preferencesKeys.all });
    },
  });
}
