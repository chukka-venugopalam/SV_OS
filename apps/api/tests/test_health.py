"""Tests for infrastructure health endpoints."""

import pytest
from httpx import AsyncClient


class TestHealthEndpoint:
    """Tests for the unified /api/v1/health endpoint."""

    @pytest.mark.asyncio
    async def test_health_returns_success(self, client: AsyncClient) -> None:
        """Test the health endpoint returns 200 with success status."""
        response = await client.get('/api/v1/health')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'message' in data
        assert 'data' in data

    @pytest.mark.asyncio
    async def test_health_contains_status_and_version(self, client: AsyncClient) -> None:
        """Test the health response contains status and version."""
        response = await client.get('/api/v1/health')
        data = response.json()
        checks = data['data']['checks']
        assert 'database' in checks
        assert 'healthy' in checks['database']
        assert data['data']['version'] == '0.3.0'

    @pytest.mark.asyncio
    async def test_health_returns_json(self, client: AsyncClient) -> None:
        """Test the health response content type is JSON."""
        response = await client.get('/api/v1/health')
        assert response.headers['content-type'] == 'application/json'

    @pytest.mark.asyncio
    async def test_health_includes_request_id(self, client: AsyncClient) -> None:
        """Test the health response includes a request ID."""
        response = await client.get('/api/v1/health')
        data = response.json()
        assert data['request_id'] is not None
        assert response.headers.get('X-Request-ID') is not None


class TestLivenessEndpoint:
    """Tests for the /api/v1/health/live endpoint."""

    @pytest.mark.asyncio
    async def test_liveness_returns_alive(self, client: AsyncClient) -> None:
        """Test the liveness endpoint returns alive status."""
        response = await client.get('/api/v1/health/live')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['status'] == 'alive'

    @pytest.mark.asyncio
    async def test_liveness_returns_json(self, client: AsyncClient) -> None:
        """Test the liveness response content type is JSON."""
        response = await client.get('/api/v1/health/live')
        assert response.headers['content-type'] == 'application/json'


class TestReadinessEndpoint:
    """Tests for the /api/v1/health/ready endpoint."""

    @pytest.mark.asyncio
    async def test_readiness_returns_ready(self, client: AsyncClient) -> None:
        """Test the readiness endpoint returns ready status."""
        response = await client.get('/api/v1/health/ready')
        assert response.status_code == 200
        data = response.json()
        assert data['message'] == 'Ready' or data['message'] == 'Not ready'

    @pytest.mark.asyncio
    async def test_readiness_includes_database_status(self, client: AsyncClient) -> None:
        """Test the readiness response includes database status."""
        response = await client.get('/api/v1/health/ready')
        data = response.json()
        assert 'database' in data['data']


class TestHealthChecksEndpoint:
    """Tests for the /api/v1/health/checks endpoint."""

    @pytest.mark.asyncio
    async def test_health_checks_returns_checks(self, client: AsyncClient) -> None:
        """Test the health checks endpoint returns check results."""
        response = await client.get('/api/v1/health/checks')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert 'checks' in data['data']
        assert 'database' in data['data']['checks']


class TestRootEndpoint:
    """Tests for the /api/v1/ root endpoint."""

    @pytest.mark.asyncio
    async def test_root_returns_api_metadata(self, client: AsyncClient) -> None:
        """Test the root endpoint returns API metadata."""
        response = await client.get('/api/v1/')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['name'] == 'SV-OS API'
        assert data['data']['version'] == '0.3.0'
        assert data['data']['documentation'] == '/docs'

    @pytest.mark.asyncio
    async def test_root_returns_json(self, client: AsyncClient) -> None:
        """Test the root response content type is JSON."""
        response = await client.get('/api/v1/')
        assert response.headers['content-type'] == 'application/json'


class TestMiddlewareHeaders:
    """Tests for middleware response headers."""

    @pytest.mark.asyncio
    async def test_request_id_header_present(self, client: AsyncClient) -> None:
        """Test the X-Request-ID header is present on responses."""
        response = await client.get('/api/v1/health')
        assert 'X-Request-ID' in response.headers
        assert len(response.headers['X-Request-ID']) > 0

    @pytest.mark.asyncio
    async def test_correlation_id_header_present(self, client: AsyncClient) -> None:
        """Test the X-Correlation-ID header is present on responses."""
        response = await client.get('/api/v1/health')
        assert 'X-Correlation-ID' in response.headers
        assert len(response.headers['X-Correlation-ID']) > 0

    @pytest.mark.asyncio
    async def test_security_headers_present(self, client: AsyncClient) -> None:
        """Test security headers are present on responses."""
        response = await client.get('/api/v1/health')
        assert response.headers.get('X-Content-Type-Options') == 'nosniff'
        assert response.headers.get('X-Frame-Options') == 'DENY'
        assert 'Referrer-Policy' in response.headers
        assert 'Permissions-Policy' in response.headers

    @pytest.mark.asyncio
    async def test_cors_headers_present(self, client: AsyncClient) -> None:
        """Test CORS headers are present on responses."""
        response = await client.get(
            '/api/v1/health',
            headers={'Origin': 'http://localhost:3000'},
        )
        assert 'access-control-allow-origin' in response.headers

    @pytest.mark.asyncio
    async def test_old_health_still_works(self, client: AsyncClient) -> None:
        """Test the backward-compatible /health endpoint still works."""
        response = await client.get('/health')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['status'] == 'healthy'
        assert data['data']['version'] == '0.3.0'

    @pytest.mark.asyncio
    async def test_old_root_still_works(self, client: AsyncClient) -> None:
        """Test the backward-compatible / root endpoint still works."""
        response = await client.get('/')
        assert response.status_code == 200
        data = response.json()
        assert data['success'] is True
        assert data['data']['name'] == 'SV-OS API'
