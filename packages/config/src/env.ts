// Environment configuration constants

export const ENV_VARS = {
  // Web App (Next.js)
  WEB: {
    NEXT_PUBLIC_API_URL: {
      required: true,
      description: 'Base URL for the FastAPI backend',
      example: 'http://localhost:8000',
    },
    NEXT_PUBLIC_SUPABASE_URL: {
      required: true,
      description: 'Supabase project URL',
      example: 'https://your-project.supabase.co',
    },
    NEXT_PUBLIC_SUPABASE_ANON_KEY: {
      required: true,
      description: 'Supabase anonymous API key',
      example: 'eyJhbGciOiJIUzI1NiIs...',
    },
    NEXT_PUBLIC_APP_URL: {
      required: false,
      description: 'Public URL of the app (for production)',
      example: 'https://sv-os.com',
    },
  },

  // API (FastAPI)
  API: {
    DATABASE_URL: {
      required: true,
      description: 'PostgreSQL connection string',
      example: 'postgresql+asyncpg://svos:password@localhost:5432/svos',
    },
    SUPABASE_URL: {
      required: true,
      description: 'Supabase project URL',
      example: 'https://your-project.supabase.co',
    },
    SUPABASE_SERVICE_KEY: {
      required: true,
      description: 'Supabase service role key (admin)',
      example: 'eyJhbGciOiJIUzI1NiIs...',
    },
    SECRET_KEY: {
      required: true,
      description: 'Secret key for JWT signing and encryption',
      example: 'your-secret-key-at-least-32-chars',
    },
    ENVIRONMENT: {
      required: false,
      description: 'Runtime environment (development, staging, production)',
      default: 'development',
    },
    LOG_LEVEL: {
      required: false,
      description: 'Logging level',
      default: 'INFO',
    },
    CORS_ORIGINS: {
      required: false,
      description: 'Comma-separated allowed CORS origins',
      default: 'http://localhost:3000',
    },
    API_RATE_LIMIT: {
      required: false,
      description: 'Requests per minute (authenticated)',
      default: '100',
    },
  },
} as const;
