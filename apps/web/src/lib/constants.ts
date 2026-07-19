// Frontend-specific constants that extend the shared @sv-os/config constants

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  EXPLORE: '/explore',
  GRAPH: '/graph',
  CAREERS: '/careers',
  PROJECTS: '/projects',
  KNOWLEDGE: '/knowledge',
  PROGRESS: '/progress',
  BOOKMARKS: '/bookmarks',
  SEARCH: '/search',
  AI_CHAT: '/ai-chat',
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_PREFERENCES: '/settings/preferences',
  SETTINGS_ACCOUNT: '/settings/account',
  // System routes
  HEALTH: '/health',
  VERSIONS: '/versions',
  IMPORT_EXPORT: '/import-export',
  NOTIFICATIONS: '/notifications',
  LEARNING: '/learning',
} as const;

export const API_ROUTES = {
  HEALTH: '/health',
  NODES: '/nodes',
  GRAPH: '/graph',
  CAREERS: '/careers',
  PROJECTS: '/projects',
  PROGRESS: '/progress',
  SEARCH: '/search',
  AUTH: '/auth',
  BOOKMARKS: '/bookmarks',
} as const;

export const NAV_ITEMS = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD, icon: 'LayoutDashboard' },
  { label: 'Explore', href: ROUTES.EXPLORE, icon: 'Compass' },
  { label: 'Graph', href: ROUTES.GRAPH, icon: 'Share2' },
  { label: 'AI Chat', href: ROUTES.AI_CHAT, icon: 'Bot' },
  { label: 'Careers', href: ROUTES.CAREERS, icon: 'Briefcase' },
  { label: 'Projects', href: ROUTES.PROJECTS, icon: 'FolderGit2' },
  { label: 'Progress', href: ROUTES.PROGRESS, icon: 'BarChart3' },
  { label: 'Bookmarks', href: ROUTES.BOOKMARKS, icon: 'Bookmark' },
  { label: 'Learning', href: ROUTES.LEARNING, icon: 'BookOpen' },
  { label: 'Settings', href: ROUTES.SETTINGS, icon: 'Settings' },
] as const;

export const SYSTEM_NAV_ITEMS = [
  { label: 'System Health', href: ROUTES.HEALTH, icon: 'Activity' },
  { label: 'Versions', href: ROUTES.VERSIONS, icon: 'History' },
  { label: 'Import/Export', href: ROUTES.IMPORT_EXPORT, icon: 'Download' },
  { label: 'Notifications', href: ROUTES.NOTIFICATIONS, icon: 'Bell' },
] as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME: 'theme',
  SIDEBAR_OPEN: 'sidebar_open',
} as const;
