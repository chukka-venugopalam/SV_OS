/**
 * Services — domain-specific API service functions.
 *
 * Each service module encapsulates all API calls for a single domain.
 * Services use the shared `apiClient` from `@/lib/api-client` which
 * handles auth token injection, auto-refresh, and error normalization.
 *
 * Usage in components/hooks:
 *   import { graphService } from '@/services';
 *   const data = await graphService.explore({ depth: 2 });
 */

export { graphService } from './graph';
export type { GraphExploreParams, GraphPathParams, GraphStats } from './graph';

export { careerService } from './careers';

export { projectService } from './projects';

export { knowledgeService } from './knowledge';

export { searchService } from './search';
export type { SearchResult, SearchSuggestion, SearchHistoryItem } from './search';

export { progressService } from './progress';

export { bookmarkService } from './bookmarks';
export type { Bookmark, Favorite } from './bookmarks';
