"""Search Capability — search graph and content.

Orchestrates: SearchEngine, GraphEngine, KnowledgeEngine
"""

from __future__ import annotations

from typing import Any


class SearchCapability:
    """Search Capability — public API for search."""

    def __init__(self) -> None:
        # TODO: Inject SearchEngine, GraphEngine, KnowledgeEngine
        pass

    async def search(
        self,
        query: str,
        filters: dict[str, Any] | None = None,
        page: int = 1,
        per_page: int = 20,
    ) -> dict:
        """Execute a search across the knowledge graph."""
        raise NotImplementedError

    async def get_suggestions(self, query: str, limit: int = 10) -> list[str]:
        """Get autocomplete suggestions."""
        raise NotImplementedError
