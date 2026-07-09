'use client';

import { Button } from '@sv-os/ui';
import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Unhandled error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="bg-error-100 text-error-600 dark:bg-error-900/30 dark:text-error-400 flex h-16 w-16 items-center justify-center rounded-full">
        <svg
          width="32"
          height="32"
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
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
          Something went wrong
        </h1>
        <p className="max-w-md text-neutral-500 dark:text-neutral-400">
          An unexpected error occurred. Please try again or contact support if the problem persists.
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="default" onClick={reset}>
          Try again
        </Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go home
        </Button>
      </div>
    </div>
  );
}
