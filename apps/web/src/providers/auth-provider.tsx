/**
 * Auth provider — manages authentication state and provides
 * login/signup/logout functionality to the entire app.
 *
 * Uses React Query under the hood for server state management.
 * Provides both a React context and hooks for convenient access.
 */

'use client';

import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';

import { useCurrentUser, useLogin, useSignup, authKeys } from '@/hooks/use-auth';
import { authClient, type UserProfile } from '@/lib/auth-client';

// ── Context ───────────────────────────────────────────────────────

interface AuthContextValue {
  user: UserProfile | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  isError: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: {
    email: string;
    username: string;
    password: string;
    display_name?: string;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ── Provider ──────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();

  // Current user query
  const { data: user, isLoading, isError, error } = useCurrentUser();

  // Login mutation
  const loginMutation = useLogin();
  const signupMutation = useSignup();

  const isAuthenticated = !!user && !isError;

  const login = useCallback(
    async (email: string, password: string) => {
      await loginMutation.mutateAsync({ email, password });
      await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    [loginMutation, queryClient],
  );

  const signup = useCallback(
    async (params: {
      email: string;
      username: string;
      password: string;
      display_name?: string;
    }) => {
      await signupMutation.mutateAsync(params);
      await queryClient.invalidateQueries({ queryKey: authKeys.profile() });
    },
    [signupMutation, queryClient],
  );

  const logout = useCallback(() => {
    authClient.logout();
    queryClient.setQueryData(authKeys.profile(), null);
    queryClient.invalidateQueries({ queryKey: authKeys.profile() });
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isError,
      error: error ?? null,
      login,
      signup,
      logout,
    }),
    [user, isLoading, isAuthenticated, isError, error, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
