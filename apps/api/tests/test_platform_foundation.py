"""Platform foundation tests for registries, events, configuration, and API status endpoints."""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

import pytest

from app.core.config import Settings
from app.platform.events import EventBus
from app.platform.registries import CapabilityRegistry, PluginRegistry

if TYPE_CHECKING:
    from pathlib import Path

    from httpx import AsyncClient


def test_settings_supports_feature_flags_and_profiles() -> None:
    """Settings should expose feature flags and environment profile helpers."""
    settings = Settings(
        ENVIRONMENT='production',
        SECRET_KEY='a-valid-production-secret-key-that-passes-validation',
        FEATURE_FLAGS='analytics:on,search:off',
    )

    assert settings.environment_profile == 'production'
    assert settings.feature_flags['analytics'] is True
    assert settings.feature_flags['search'] is False
    assert settings.is_feature_enabled('analytics') is True
    assert settings.is_feature_enabled('search') is False


@pytest.mark.asyncio
async def test_event_bus_supports_async_handlers_and_idempotency() -> None:
    """The event bus should invoke async subscribers once per unique idempotency key."""
    bus = EventBus()
    seen: list[str] = []

    async def handler(event) -> None:
        seen.append(event.payload['value'])

    bus.subscribe('platform.started', handler)
    await bus.publish(
        'platform.started',
        {'value': 'alpha'},
        correlation_id='corr-1',
        idempotency_key='abc',
    )
    await bus.publish(
        'platform.started',
        {'value': 'beta'},
        correlation_id='corr-2',
        idempotency_key='abc',
    )

    assert seen == ['alpha']


def test_capability_registry_resolves_dependencies() -> None:
    """Capabilities should be resolved in dependency order."""
    registry = CapabilityRegistry()
    registry.register_capability('search', dependencies=['auth'])
    registry.register_capability('auth')

    ordered = registry.resolve_dependencies(['search'])

    assert ordered == ['auth', 'search']


def test_plugin_registry_loads_manifest_and_checks_version(tmp_path: Path) -> None:
    """Plugins should load manifests and validate basic version compatibility."""
    manifest_path = tmp_path / 'plugin.json'
    manifest_path.write_text(
        json.dumps(
            {
                'name': 'core-plugin',
                'version': '1.0.0',
                'description': 'Test plugin',
                'entrypoint': 'plugin:app',
                'capabilities': ['analytics'],
            },
        ),
        encoding='utf-8',
    )

    registry = PluginRegistry()
    plugin = registry.load_manifest(manifest_path)

    assert plugin.name == 'core-plugin'
    assert registry.is_version_compatible('1.0.0', '>=1.0.0') is True
    assert registry.is_version_compatible('2.0.0', '<=1.0.0') is False


@pytest.mark.asyncio
async def test_platform_status_endpoint(client: AsyncClient) -> None:
    """The platform status endpoint should expose registry and config information."""
    response = await client.get('/api/v1/platform/status')
    assert response.status_code == 200
    data = response.json()
    assert data['success'] is True
    assert 'engines' in data['data']
    assert 'capabilities' in data['data']
    assert 'features' in data['data']
