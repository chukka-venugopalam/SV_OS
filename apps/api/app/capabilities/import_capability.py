"""Import Capability — manage import workflows.

Orchestrates: ImportEngine, ValidationEngine, GraphEngine, KnowledgeEngine
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from uuid import UUID


class ImportCapability:
    """Import Capability — public API for content imports."""

    def __init__(self) -> None:
        # TODO: Inject ImportEngine, ValidationEngine, GraphEngine, KnowledgeEngine
        pass

    async def start_import(self, payload: dict[str, Any], dry_run: bool = False) -> dict:
        """Start an import workflow."""
        raise NotImplementedError

    async def get_status(self, import_id: UUID) -> dict:
        """Get import job status."""
        raise NotImplementedError

    async def rollback(self, import_id: UUID) -> dict:
        """Roll back an import."""
        raise NotImplementedError
