/**
 * Settings API service.
 *
 * Provides functions for managing user preferences and settings.
 * Preferences are stored in the user's JSONB preferences column.
 */

import { apiClient } from '@/lib/api-client';

// ── Types ─────────────────────────────────────────────────────────

export interface UserPreferences {
  theme?: 'light' | 'dark';
  font_size?: 'sm' | 'md' | 'lg';
  reduced_motion?: boolean;
  email_notifications?: boolean;
  learning_reminders?: boolean;
  [key: string]: unknown;
}

// ── Service ───────────────────────────────────────────────────────

export const settingsService = {
  /** Get user preferences */
  async getPreferences(): Promise<UserPreferences> {
    const res = await apiClient.get<UserPreferences>('/auth/me/preferences');
    return res.data ?? {};
  },

  /** Update user preferences (partial merge) */
  async updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
    const res = await apiClient.put<UserPreferences>('/auth/me/preferences', prefs);
    return res.data ?? {};
  },
};
