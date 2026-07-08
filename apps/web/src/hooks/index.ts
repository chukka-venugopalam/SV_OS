export { useMounted } from './use-mounted';
export { useTheme } from './use-theme';
export { useMediaQuery, useIsMobile, useIsTablet, useIsDesktop, useReducedMotion } from './use-media-query';
export { useLocalStorage } from './use-local-storage';
export { useDebounce } from './use-debounce';
export { useKeyboardShortcut } from './use-keyboard-shortcut';
export { useWindowSize } from './use-window-size';
export {
  useCurrentUser,
  useIsAuthenticated,
  useLogin,
  useSignup,
  useLogout,
  useUpdateProfile,
  useChangePassword,
  authKeys,
} from './use-auth';

// ── Graph Hooks ───────────────────────────────────────────────────
export {
  useGraphExplore,
  useGraphPath,
  useGraphStats,
  usePrerequisiteChain,
  graphKeys,
} from './use-graph';

// ── Knowledge Node Hooks ───────────────────────────────────────────
export {
  useKnowledgeNodes,
  useKnowledgeNode,
  usePopularNodes,
  useNodePrerequisites,
  useRelatedNodes,
  useNodeResources,
  useNodeCareers,
  knowledgeKeys,
} from './use-knowledge';

// ── Career Hooks ───────────────────────────────────────────────────
export {
  useCareers,
  useCareer,
  useCareerRoadmap,
  useCareerNodes,
  careerKeys,
} from './use-careers';

// ── Project Hooks ──────────────────────────────────────────────────
export {
  useProjects,
  useProject,
  useProjectRequirements,
  projectKeys,
} from './use-projects';

// ── Search Hooks ───────────────────────────────────────────────────
export {
  useSearch,
  useSearchSuggestions,
  useSearchHistory,
  useClearSearchHistory,
  useTrendingSearches,
  searchKeys,
} from './use-search';

// ── Progress Hooks ─────────────────────────────────────────────────
export {
  useProgressList,
  useProgressStats,
  useUpdateProgress,
  useStartNode,
  useCompleteNode,
  progressKeys,
} from './use-progress';

// ── Bookmark & Favorite Hooks ───────────────────────────────────────
export {
  useBookmarks,
  useToggleBookmark,
  useIsBookmarked,
  useFavorites,
  useAddFavorite,
  useRemoveFavorite,
  useIsFavorited,
  bookmarkKeys,
  favoriteKeys,
} from './use-bookmarks';

// ── Activity Hooks ─────────────────────────────────────────────────
export {
  useActivityFeed,
  activityKeys,
} from './use-activity';
