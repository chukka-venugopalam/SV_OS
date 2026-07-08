/** Format a date string into a human-readable format */
export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options,
  });
}

/** Format a date as relative time (e.g., "2 hours ago") */
export function formatRelativeTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 5) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return formatDate(dateObj);
}

// ── Re-exported from utils/ for convenience ────────────────────────
// These are defined in utils/string.ts but re-exported here for
// backward compatibility. Prefer importing from '@/utils' in new code.
export { pluralize, truncate, capitalize, slugToTitle } from '@/utils/string';

/** Format a difficulty level as a human-readable string */
export function formatDifficulty(difficulty: string): string {
  if (!difficulty) return difficulty;
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
