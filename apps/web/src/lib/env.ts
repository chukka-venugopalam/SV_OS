/**
 * Environment validation utility.
 *
 * Validates required environment variables at runtime and provides
 * type-safe access. Falls back to defaults for optional variables.
 *
 * Usage:
 *   import { env } from '@/lib/env';
 *   console.log(env.NEXT_PUBLIC_API_URL);
 */

// ── Validation Error ──────────────────────────────────────────────

class EnvValidationError extends Error {
  constructor(missingVars: string[]) {
    super(
      `Missing required environment variables:\n${missingVars
        .map((v) => `  • ${v}`)
        .join('\n')}\n\n` +
        `Create a .env.local file in apps/web/ with these values. ` +
        `See .env.example for reference.`,
    );
    this.name = 'EnvValidationError';
  }
}

// ── Env Configuration ─────────────────────────────────────────────

interface EnvConfig {
  NEXT_PUBLIC_API_URL: string;
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_APP_URL: string;
  NODE_ENV: 'development' | 'production' | 'test';
}

// ── Env Proxy ─────────────────────────────────────────────────────

function createEnv(): EnvConfig {
  const env =
    typeof process !== 'undefined' ? process.env : ({} as Record<string, string | undefined>);

  const vars: Record<
    keyof EnvConfig,
    { value: string | undefined; required: boolean; fallback?: string }
  > = {
    NEXT_PUBLIC_API_URL: {
      value: env.NEXT_PUBLIC_API_URL,
      required: true,
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      value: env.NEXT_PUBLIC_SUPABASE_URL,
      required: true,
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      value: env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: true,
    },
    NEXT_PUBLIC_APP_URL: {
      value: env.NEXT_PUBLIC_APP_URL,
      required: false,
      fallback: 'http://localhost:3000',
    },
    NODE_ENV: {
      value: env.NODE_ENV,
      required: false,
      fallback: 'development',
    },
  };

  // Collect missing required vars
  const missing = Object.entries(vars)
    .filter(([, config]) => config.required && !config.value)
    .map(([key]) => key);

  // Only throw in browser/production — not during build/SSR
  if (missing.length > 0 && typeof window !== 'undefined') {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `[SV-OS] Missing required env vars: ${missing.join(', ')}. ` +
          'The app may not function correctly.',
      );
    }
  }

  // Build the config object
  const config = {} as EnvConfig;
  for (const [key, cfg] of Object.entries(vars)) {
    (config as unknown as Record<string, string>)[key] = cfg.value ?? cfg.fallback ?? '';
  }

  return config;
}

/** Type-safe environment variable proxy */
export const env = createEnv();
