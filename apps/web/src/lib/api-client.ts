/**
 * Enhanced API client with automatic token refresh.
 *
 * Features:
 * - Automatic Authorization header injection
 * - Transparent access token refresh on 401
 * - Request deduplication during token refresh
 * - Type-safe response handling
 * - Configurable base URL
 */

import type { ApiResponse } from '@sv-os/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_PREFIX = '/api/v1';

type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
};

// Token refresh state
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_URL}${API_PREFIX}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      return false;
    }

    const json: ApiResponse<{
      user_id: string;
      email: string;
      username: string;
      tokens: {
        access_token: string;
        refresh_token: string;
        expires_at: string;
        token_type: string;
      };
    }> = await response.json();

    if (json.success && json.data) {
      setTokens(json.data.tokens.access_token, json.data.tokens.refresh_token);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

// Storage helpers
function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refresh_token');
}

function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
}

function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}

export function clearAuth(): void {
  clearTokens();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }
}

export function storeTokens(accessToken: string, refreshToken: string): void {
  setTokens(accessToken, refreshToken);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('auth:login'));
  }
}

/**
 * Categorise a network error into a user-friendly message.
 *
 * Returns a tuple of [message, errorCategory] where errorCategory can be
 * used by callers to display even more specific UI.
 */
export const ErrorCategory = {
  NETWORK: 'network',
  CORS: 'cors',
  TIMEOUT: 'timeout',
  PARSE: 'parse',
  DUPLICATE: 'duplicate',
  VALIDATION: 'validation',
  SERVER: 'server',
  UNKNOWN: 'unknown',
} as const;

export type ErrorCategoryType = (typeof ErrorCategory)[keyof typeof ErrorCategory];

export interface NetworkErrorInfo {
  message: string;
  category: ErrorCategoryType;
  status: number;
}

/**
 * Build a user-friendly error info from any error.
 *
 * Use this in UI catch blocks:
 *   const info = getErrorInfo(err);
 *   if (info.category === ErrorCategory.NETWORK) { ... }
 */
export function getErrorInfo(err: unknown): NetworkErrorInfo {
  // Handle ApiRequestError (our own) with status codes
  if (err instanceof ApiRequestError) {
    if (err.status === 0) {
      return categoriseNetworkError(err);
    }
    if (err.status === 409) {
      return {
        message: 'An account with this email or username already exists.',
        category: ErrorCategory.DUPLICATE,
        status: 409,
      };
    }
    if (err.status === 422) {
      return {
        message: 'Please check your input and try again.',
        category: ErrorCategory.VALIDATION,
        status: 422,
      };
    }
    if (err.status >= 500) {
      return {
        message: 'The server encountered an error. Please try again later.',
        category: ErrorCategory.SERVER,
        status: err.status,
      };
    }
    return {
      message: err.message,
      category: ErrorCategory.UNKNOWN,
      status: err.status,
    };
  }

  // Handle transport-level errors (fetch threw TypeError, etc.)
  return categoriseNetworkError(err);
}

function categoriseNetworkError(error: unknown): NetworkErrorInfo {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase();
    if (
      msg.includes('failed to fetch') ||
      msg.includes('networkerror') ||
      msg.includes('network error')
    ) {
      const showUrl = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';
      return {
        message: showUrl
          ? `Server unreachable at ${API_URL}. Check that the backend is running.`
          : 'Cannot connect to the server. Please try again later.',
        category: ErrorCategory.NETWORK,
        status: 0,
      };
    }
    if (msg.includes('cors') || msg.includes('cross-origin')) {
      return {
        message: 'Request blocked by CORS. The backend does not allow requests from this origin.',
        category: ErrorCategory.CORS,
        status: 0,
      };
    }
    if (msg.includes('abort') || msg.includes('timeout')) {
      return {
        message: 'Request timed out. The server may be overloaded or unreachable.',
        category: ErrorCategory.TIMEOUT,
        status: 0,
      };
    }
  }
  if (error instanceof SyntaxError) {
    return {
      message: 'Server returned an unexpected response.',
      category: ErrorCategory.PARSE,
      status: 0,
    };
  }
  return {
    message: error instanceof Error ? error.message : 'An unexpected network error occurred',
    category: ErrorCategory.UNKNOWN,
    status: 0,
  };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const { body, params, headers: customHeaders, skipAuth, ...rest } = options;

  const queryString = params
    ? '?' +
      Object.entries(params)
        .filter(([_, v]) => v !== undefined)
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&')
    : '';

  const url = `${API_URL}${API_PREFIX}${path}${queryString}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (customHeaders) {
    Object.assign(headers, customHeaders);
  }

  // Attach auth token (unless skipAuth)
  if (!skipAuth) {
    const token = getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...rest,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new ApiRequestError(0, categoriseNetworkError(err).message, []);
  }

  // Auto-refresh on 401
  if (response.status === 401 && !skipAuth) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = refreshTokens().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const refreshed = await refreshPromise;
    if (refreshed) {
      const newToken = getAccessToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
      }
      try {
        response = await fetch(url, {
          ...rest,
          headers,
          body: body ? JSON.stringify(body) : undefined,
        });
      } catch (err) {
        throw new ApiRequestError(0, categoriseNetworkError(err).message, []);
      }
    }
  }

  let json: ApiResponse<T>;
  try {
    json = await response.json();
  } catch {
    throw new ApiRequestError(
      response.status,
      'Server returned invalid JSON. The backend may be misconfigured.',
      [],
    );
  }

  if (!response.ok || !json.success) {
    if (response.status === 401 && !skipAuth) {
      clearAuth();
    }

    throw new ApiRequestError(
      response.status,
      json.message ?? 'An unexpected error occurred',
      json.errors ?? [],
    );
  }

  return json;
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly errors: string[] = [],
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};
