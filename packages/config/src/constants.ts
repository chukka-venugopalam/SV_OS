// Shared constants for SV-OS across all packages and apps

export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  DEFAULT_PAGE: 1,
} as const;

export const GRAPH = {
  MAX_DEPTH: 10,
  DEFAULT_DEPTH: 3,
  CACHE_TTL_MS: 300_000, // 5 minutes
} as const;

export const RATE_LIMIT = {
  AUTHENTICATED: 100, // requests per minute
  UNAUTHENTICATED: 20,
  GRAPH_ENDPOINTS: 30,
} as const;

export const AUTH = {
  ACCESS_TOKEN_EXPIRY_MINUTES: 60,
  REFRESH_TOKEN_EXPIRY_DAYS: 7,
  PASSWORD_MIN_LENGTH: 8,
} as const;

export const DIFFICULTIES = ['beginner', 'intermediate', 'advanced', 'expert'] as const;

export const NODE_TYPES = [
  'subject',
  'concept',
  'technology',
  'tool',
  'career',
  'project',
] as const;

export const EDGE_TYPES = [
  'prerequisite',
  'depends_on',
  'uses',
  'enables',
  'part_of',
  'related_to',
  'leads_to',
  'requires',
] as const;

export const EDGE_DIRECTIONS = ['forward', 'bidirectional', 'unidirectional'] as const;

export const PROGRESS_STATUSES = ['not_started', 'learning', 'completed', 'mastered'] as const;

export const NODE_COLORS: Record<string, string> = {
  subject: '#7c3aed', // Purple
  concept: '#2563eb', // Blue
  technology: '#16a34a', // Green
  tool: '#d97706', // Amber
  career: '#dc2626', // Red
  project: '#db2777', // Pink
} as const;

export const SEARCH_WEIGHTS = {
  TITLE: 'A',
  DESCRIPTION: 'B',
  CONTENT: 'C',
} as const;
