'use client';

/**
 * SkipNavigation — allows keyboard users to skip to the main content.
 * Renders a visually hidden link that becomes visible on focus.
 */

export function SkipNavigation() {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-transform focus:translate-y-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:bg-primary-500"
    >
      Skip to main content
    </a>
  );
}
