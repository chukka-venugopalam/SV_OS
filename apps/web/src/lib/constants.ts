// Frontend-specific constants that extend the shared @sv-os/config constants

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  SIGNUP: '/signup',
  DASHBOARD: '/dashboard',
  EXPLORE: '/explore',
  CAREERS: '/careers',
  PROJECTS: '/projects',
  KNOWLEDGE: '/knowledge',
  PROGRESS: '/progress',
  BOOKMARKS: '/bookmarks',
  SEARCH: '/search',
  SETTINGS: '/settings',
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
  { label: 'Careers', href: ROUTES.CAREERS, icon: 'Briefcase' },
  { label: 'Projects', href: ROUTES.PROJECTS, icon: 'FolderGit2' },
  { label: 'Progress', href: ROUTES.PROGRESS, icon: 'BarChart3' },
  { label: 'Bookmarks', href: ROUTES.BOOKMARKS, icon: 'Bookmark' },
] as const;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  THEME: 'theme',
  SIDEBAR_OPEN: 'sidebar_open',
} as const;
