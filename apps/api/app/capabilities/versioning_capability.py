"""Versioning Capability — graph versioning, snapshots, and rollback.

Orchestrates: VersioningEngine
No business logic — delegates to engines.
"""

from __future__ import annotations

from typing import Any


class VersioningCapability:
    """Versioning Capability — public API for graph versioning.

    Thin orchestration layer. All business logic lives in engines.
    """

    def __init__(self, versioning_engine: Any | None = None) -> None:
        self._versioning = versioning_engine

    async def create_snapshot(
        self,
        notes: str = '',
        author: str = 'system',
        tags: list[str] | None = None,
        branch: str = 'main',
    ) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.create_snapshot(
            notes=notes,
            author=author,
            tags=tags,
            branch=branch,
        )

    async def get_snapshot(self, version_id: str) -> dict | None:
        if self._versioning is None:
            return None
        return await self._versioning.get_snapshot(version_id)

    async def list_snapshots(self, branch: str | None = None, limit: int = 50) -> list[dict]:
        if self._versioning is None:
            return []
        return await self._versioning.list_snapshots(branch=branch, limit=limit)

    async def restore_snapshot(self, version_id: str) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.restore_snapshot(version_id)

    async def rollback(self, version_id: str) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.rollback(version_id)

    async def rollback_validation(self, version_id: str) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.rollback_validation(version_id)

    async def diff_versions(self, source_version_id: str, target_version_id: str) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.diff_versions(source_version_id, target_version_id)

    async def compare_versions(self, version_id_a: str, version_id_b: str) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.compare_versions(version_id_a, version_id_b)

    async def tag_version(self, version_id: str, tag: str) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.tag_version(version_id, tag)

    async def get_latest_version(self, branch: str = 'main') -> dict | None:
        if self._versioning is None:
            return None
        return await self._versioning.get_latest_version(branch=branch)

    async def create_branch(self, branch_name: str, from_version_id: str | None = None) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.create_branch(branch_name, from_version_id)

    async def list_branches(self) -> list[dict]:
        if self._versioning is None:
            return []
        return await self._versioning.list_branches()

    async def graph_checksum(self) -> dict:
        if self._versioning is None:
            return {'error': 'Versioning engine not available'}
        return await self._versioning.graph_checksum()
