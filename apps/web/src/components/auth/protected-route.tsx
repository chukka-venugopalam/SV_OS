/**
 * Protected route — wraps pages that require authentication.
 *
 * Redirects unauthenticated users to the login page.
 * Shows a loading state while checking authentication.
 */

'use client';

import { LoadingSpinner } from '@sv-os/ui';
import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/providers/auth-provider';

interface ProtectedRouteProps {
  children: ReactNode;
  /**
   * If true, redirects authenticated users to the dashboard.
   * Use for login/signup pages.
   */
  redirectIfAuthenticated?: boolean;
  /**
   * Required role for access. If provided, users without this role
   * will be shown an unauthorized message.
   */
  requiredRole?: string;
}

export function ProtectedRoute({
  children,
  redirectIfAuthenticated = false,
  requiredRole,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (redirectIfAuthenticated && isAuthenticated) {
      router.replace('/dashboard');
      return;
    }

    if (!redirectIfAuthenticated && !isAuthenticated) {
      router.replace('/login');
      return;
    }
  }, [isLoading, isAuthenticated, redirectIfAuthenticated, router]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <LoadingSpinner />
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Verifying authentication...
          </p>
        </div>
      </div>
    );
  }

  // Role check
  if (requiredRole && user?.role !== requiredRole) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <div className="bg-warning-100 text-warning-600 dark:bg-warning-900/30 dark:text-warning-400 flex h-12 w-12 items-center justify-center rounded-full">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
          Access denied
        </h2>
        <p className="max-w-sm text-neutral-500 dark:text-neutral-400">
          You do not have the required permissions to access this page.
        </p>
      </div>
    );
  }

  if (!isAuthenticated && !redirectIfAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
