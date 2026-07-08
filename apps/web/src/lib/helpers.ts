/** Generate a unique ID */
export function generateId(): string {
  return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2, 11);
}

/** Get base URL from environment */
export function getBaseUrl(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
}

// ── Re-exported from utils/ for convenience ────────────────────────
// These are defined in utils/ but re-exported here for backward
// compatibility. Prefer importing from '@/utils' in new code.
export { clamp } from '@/utils/number';
export { debounce, throttle } from '@/utils/function';
export { isNullish } from '@/utils/object';
