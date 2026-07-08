/**
 * String utility functions.
 */

/** Capitalize the first letter of a string */
export function capitalize(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Convert a slug to a human-readable title */
export function slugToTitle(slug: string): string {
  return slug
    .split(/[-_]/)
    .map((word) => capitalize(word))
    .join(' ');
}

/** Truncate text to a maximum length with suffix */
export function truncate(text: string, maxLength: number, suffix = '...'): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + suffix;
}

/** Pluralize a word based on count */
export function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`);
}

/** Convert a string to kebab-case */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/** Convert a string to snake_case */
export function toSnakeCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1_$2')
    .replace(/[\s-]+/g, '_')
    .toLowerCase();
}

/** Convert a string to camelCase */
export function toCamelCase(text: string): string {
  return text
    .replace(/[-_\s]+(.)/g, (_, c) => (c as string).toUpperCase())
    .replace(/^[A-Z]/, (c) => c.toLowerCase());
}

/** Check if a string is empty or whitespace-only */
export function isBlank(text: string | null | undefined): boolean {
  return text == null || text.trim().length === 0;
}

/** Generate a random alphanumeric string */
export function randomString(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
