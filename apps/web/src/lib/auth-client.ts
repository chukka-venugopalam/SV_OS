/**
 * Auth client — wraps the API client for authentication operations.
 *
 * Provides login, signup, token refresh, logout, and profile CRUD.
 * Uses localStorage for token persistence.
 */

import type { ApiResponse } from '@sv-os/types';

import { apiClient, clearAuth, storeTokens } from './api-client';

// ── Types ─────────────────────────────────────────────────────────

export interface LoginResponse {
  user_id: string;
  email: string;
  username: string;
  display_name: string | null;
  role: string;
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_at: string;
  };
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  role: string;
  preferences: Record<string, unknown>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

export interface ProfileUpdate {
  display_name?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  preferences?: Record<string, unknown>;
}

// ── Auth Client ────────────────────────────────────────────────────

export const authClient = {
  /** Register a new user account */
  async signup(params: {
    email: string;
    username: string;
    password: string;
    display_name?: string;
  }): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>('/auth/register', params, {
      skipAuth: true,
    });
    if (res.data) {
      storeTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
    }
    return res.data!;
  },

  /** Login with email and password */
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<LoginResponse>(
      '/auth/login',
      { email, password },
      { skipAuth: true },
    );
    if (res.data) {
      storeTokens(res.data.tokens.access_token, res.data.tokens.refresh_token);
    }
    return res.data!;
  },

  /** Get the current user's profile */
  async getProfile(): Promise<UserProfile> {
    const res = await apiClient.get<UserProfile>('/auth/me');
    return res.data!;
  },

  /** Update the current user's profile */
  async updateProfile(params: ProfileUpdate): Promise<UserProfile> {
    const res = await apiClient.put<UserProfile>('/auth/me', params);
    return res.data!;
  },

  /** Change password */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  },

  /** Logout — clears client-side tokens */
  logout(): void {
    clearAuth();
  },
};
