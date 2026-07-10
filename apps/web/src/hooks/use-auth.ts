/**
 * React Query hooks for authentication.
 *
 * Provides hooks for login, signup, logout, profile fetching/updating,
 * and current user state management.
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { authClient } from '@/lib/auth-client';

// ── Query Key Factory ─────────────────────────────────────────────

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// ── Hook: Current User (Session) ─────────────────────────────────

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: authClient.getProfile,
    retry: false,
    staleTime: 5 * 60 * 1000,
    enabled: hasTokens(),
  });
}

function hasTokens(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('access_token');
}

// ── Hook: Is Authenticated ────────────────────────────────────────

export function useIsAuthenticated(): boolean {
  const { data, isError, isLoading } = useCurrentUser();
  if (isLoading) return false;
  if (isError) return false;
  return !!data;
}

// ── Hook: Login Mutation ──────────────────────────────────────────

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authClient.login(email, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

// ── Hook: Signup Mutation ─────────────────────────────────────────

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: {
      email: string;
      username: string;
      password: string;
      display_name?: string;
    }) => authClient.signup(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

// ── Hook: Logout ──────────────────────────────────────────────────

export function useLogout() {
  const queryClient = useQueryClient();

  return useCallback(() => {
    authClient.logout();
    queryClient.setQueryData(authKeys.profile(), null);
    queryClient.invalidateQueries({ queryKey: authKeys.profile() });
  }, [queryClient]);
}

// ── Hook: Update Profile ──────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: Parameters<typeof authClient.updateProfile>[0]) =>
      authClient.updateProfile(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
  });
}

// ── Hook: Change Password ─────────────────────────────────────────

export function useChangePassword() {
  return useMutation({
    mutationFn: ({
      currentPassword,
      newPassword,
    }: {
      currentPassword: string;
      newPassword: string;
    }) => authClient.changePassword(currentPassword, newPassword),
  });
}

// ── Hook: Auth Listener (for token refresh events) ───────────────

export function useAuthListener() {
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const handleLogin = () => setVersion((v) => v + 1);
    const handleLogout = () => setVersion((v) => v + 1);

    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  return version;
}
