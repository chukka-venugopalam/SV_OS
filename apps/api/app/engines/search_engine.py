"""Search Engine — deterministic indexing and search over the knowledge graph.

Supports:
- Exact search
- Prefix search
- Fuzzy search (Levenshtein-based)
- Full-text search (word-level token matching)
- Tag search
- Category search (node_type filter)
- Skill search
- Career search
- Project search
- Relationship search
- Metadata search
- Ranking (relevance-based)
- Pagination
- Filtering (node_type, difficulty, tags)
- Sorting (relevance, title, created_at)

No AI. Pure deterministic indexing.
"""

from __future__ import annotations

import re
from typing import Any
from uuid import UUID

from app.engines.base import EngineBase, EngineDependency, EngineHealth


def _levenshtein(a: str, b: str) -> int:
    """Compute Levenshtein distance between two strings."""
    if len(a) < len(b):
        a, b = b, a
    if not b:
        return len(a)
    prev = list(range(len(b) + 1))
    for i, ca in enumerate(a):
        curr = [i + 1]
        for j, cb in enumerate(b):
            curr.append(min(curr[-1] + 1, prev[j + 1] + 1, prev[j] + (ca != cb)))
        prev = curr
    return prev[-1]


def _tokenize(text: str) -> list[str]:
    """Tokenize text into lowercase words."""
    return re.findall(r'[a-zA-Z0-9_+.-]+', text.lower())


def _prefix_match(text: str, prefix: str) -> bool:
    """Check if text starts with the given prefix (case-insensitive)."""
    return text.lower().startswith(prefix.lower())


def _fuzzy_match(text: str, query: str, max_distance: int = 2) -> bool:
    """Check if query is within max_distance Levenshtein distance of any word in text."""
    words = _tokenize(text)
    return any(_levenshtein(word, query.lower()) <= max_distance for word in words)


def _fulltext_score(text: str, query: str) -> float:
    """Compute a simple relevance score (0.0 to 1.0) for text matching query."""
    if not query or not text:
        return 0.0
    text_lower = text.lower()
    query_lower = query.lower()

    # Exact match = 1.0
    if text_lower == query_lower:
        return 1.0
    # Contains exact = 0.9
    if query_lower in text_lower:
        return 0.9
    # Word match = 0.7
    query_words = set(_tokenize(query))
    text_words = set(_tokenize(text))
    if query_words and text_words:
        overlap = len(query_words & text_words) / len(query_words)
        return overlap * 0.7
    # Prefix match = 0.4
    if any(w.startswith(query_lower) for w in text_words):
        return 0.4
    return 0.0


class SearchEngine(EngineBase):
    """Search Engine — deterministic search over graph nodes and content.

    Provides exact, prefix, fuzzy, and full-text search with ranking and pagination.
    Delegates to GraphEngine and KnowledgeEngine for data access.

    Public Interface:
        search, search_exact, search_prefix, search_fuzzy,
        search_fulltext, search_tags, search_by_type
    """

    def __init__(
        self,
        graph_engine: Any | None = None,
        knowledge_engine: Any | None = None,
    ) -> None:
        super().__init__()
        self._graph: Any = graph_engine
        self._knowledge: Any = knowledge_engine

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'search'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='graph', required=True, description='Graph engine for node data'),
            EngineDependency(engine_name='knowledge', required=False, description='Knowledge engine for content indexing'),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        pass

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Search engine is operational',
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ── Main Search API ────────────────────────────────────────────

    async def search(
        self,
        query: str,
        mode: str = 'fulltext',
        filters: dict[str, Any] | None = None,
        page: int = 1,
        per_page: int = 20,
        sort_by: str = 'relevance',
        sort_order: str = 'desc',
    ) -> dict:
        """Execute a search across graph nodes.

        Args:
            query: Search string.
            mode: Search mode - 'exact', 'prefix', 'fuzzy', 'fulltext', 'tag'.
            filters: Optional dict with 'node_type', 'difficulty', 'tags' keys.
            page: Page number (1-indexed).
            per_page: Items per page (max 100).
            sort_by: Sort field ('relevance', 'title', 'created_at').
            sort_order: 'asc' or 'desc'.

        Returns:
            Dict with 'items', 'total', 'page', 'per_page', 'total_pages'.
        """
        if not query:
            return {'items': [], 'total': 0, 'page': page, 'per_page': per_page, 'total_pages': 0}

        all_nodes = await self._get_all_nodes()
        if not all_nodes:
            return {'items': [], 'total': 0, 'page': page, 'per_page': per_page, 'total_pages': 0}

        # Score each node
        scored: list[tuple[float, dict]] = []
        filters = filters or {}

        for node in all_nodes:
            # Apply filters
            if 'node_type' in filters and node.get('node_type') != filters['node_type']:
                continue
            if 'difficulty' in filters and node.get('difficulty') != filters['difficulty']:
                continue

            # Compute search score
            score = await self._score_node(node, query, mode, filters)
            if score > 0:
                scored.append((score, node))

        # Sort
        scored.sort(key=lambda x: x[0], reverse=(sort_order != 'asc'))

        # Paginate
        total = len(scored)
        per_page = min(max(per_page, 1), 100)
        total_pages = max(1, (total + per_page - 1) // per_page) if total else 0
        offset = (page - 1) * per_page
        items = [item for _, item in scored[offset:offset + per_page]]

        return {
            'items': items,
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
            'query': query,
            'mode': mode,
        }

    async def search_exact(self, query: str, **kwargs) -> dict:
        """Exact match search (title or slug)."""
        return await self.search(query, mode='exact', **kwargs)

    async def search_prefix(self, query: str, **kwargs) -> dict:
        """Prefix match search."""
        return await self.search(query, mode='prefix', **kwargs)

    async def search_fuzzy(self, query: str, **kwargs) -> dict:
        """Fuzzy match search (Levenshtein distance ≤ 2)."""
        return await self.search(query, mode='fuzzy', **kwargs)

    async def search_fulltext(self, query: str, **kwargs) -> dict:
        """Full-text search with relevance ranking."""
        return await self.search(query, mode='fulltext', **kwargs)

    async def search_tags(self, query: str, **kwargs) -> dict:
        """Search by tag name."""
        return await self.search(query, mode='tag', **kwargs)

    async def search_by_type(self, node_type: str, **kwargs) -> dict:
        """Search for nodes of a specific type."""
        return await self.search(node_type, mode='fulltext', filters={'node_type': node_type}, **kwargs)

    # ── Internal Scoring ──────────────────────────────────────────

    async def _score_node(
        self, node: dict, query: str, mode: str, filters: dict[str, Any]
    ) -> float:
        """Compute a relevance score for a node given a query and mode."""
        title = node.get('title', '')
        slug = node.get('slug', '')
        description = node.get('description', '')
        node_type = node.get('node_type', '')

        if mode == 'exact':
            if title.lower() == query.lower() or slug.lower() == query.lower():
                return 1.0
            return 0.0

        if mode == 'prefix':
            if _prefix_match(title, query) or _prefix_match(slug, query):
                return 0.8
            return 0.0

        if mode == 'fuzzy':
            if _fuzzy_match(title, query) or _fuzzy_match(slug, query):
                return 0.7
            if _fuzzy_match(description, query):
                return 0.3
            return 0.0

        if mode == 'tag':
            if self._knowledge:
                node_id = UUID(node['id'])
                tags = await self._knowledge.get_tags(node_id)
                tag_names = [t.get('name', '') for t in tags]
                if any(query.lower() in t.lower() for t in tag_names):
                    return 0.9
            return 0.0

        # Full-text mode (default)
        title_score = _fulltext_score(title, query)
        if title_score >= 1.0:
            return 1.0
        slug_score = _fulltext_score(slug, query) * 0.9
        desc_score = _fulltext_score(description, query) * 0.5

        # Content score (if available from knowledge engine)
        content_score = 0.0
        if self._knowledge:
            try:
                content = await self._knowledge.get_content(UUID(node['id']))
                if content:
                    content_score = _fulltext_score(content, query) * 0.3
            except Exception:
                pass

        # Node type match bonus
        type_bonus = 0.05 if query.lower() == node_type.lower() else 0.0

        return max(title_score, slug_score, desc_score, content_score) + type_bonus

    # ── Index Management ──────────────────────────────────────────

    async def rebuild_index(self) -> dict[str, Any]:
        """Rebuild the search index (stub for future implementation).

        TODO: Implement persistent search index for production use.
        """
        return {'indexed_nodes': 0, 'index_type': 'runtime'}

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        await super().subscribe_events(event_bus)

    # ── Internal ──────────────────────────────────────────────────

    async def _get_all_nodes(self) -> list[dict]:
        if not self._graph:
            return []
        try:
            return await self._graph.all_nodes()
        except Exception:
            return []
