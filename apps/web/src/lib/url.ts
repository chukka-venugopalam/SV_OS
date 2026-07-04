import { API_PREFIX } from '@sv-os/config';

/** Build an absolute API URL from a relative path */
export function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
  return `${baseUrl}${API_PREFIX}${path}`;
}

/** Build a frontend route URL */
export function routeUrl(path: string): string {
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  return `${baseUrl}${path}`;
}

/** Append query parameters to a URL */
export function withQueryParams(
  url: string,
  params: Record<string, string | number | boolean | undefined | null>,
): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.set(key, String(value));
    }
  }
  const queryString = searchParams.toString();
  return queryString ? `${url}?${queryString}` : url;
}
