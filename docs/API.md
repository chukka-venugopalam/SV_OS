# SV-OS — API Reference

## Base URL

```
Production:  https://api.sv-os.com/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication

All protected endpoints require a JWT token in the `Authorization` header:

```
Authorization: Bearer <jwt_token>
```

---

## Universal Response Format

### Success Response

```json
{
    "success": true,
    "message": "Nodes retrieved successfully",
    "data": { ... },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

### Error Response

```json
{
    "success": false,
    "message": "Node 'python-basics' not found",
    "data": null,
    "errors": [
        {
            "field": "slug",
            "message": "No node with slug 'python-basics' exists"
        }
    ],
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

### Paginated Response (wrapped in data)

```json
{
    "success": true,
    "message": "Nodes retrieved successfully",
    "data": {
        "items": [ ... ],
        "total": 150,
        "page": 1,
        "per_page": 20,
        "total_pages": 8
    },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

---

## Infrastructure Endpoints (Implemented)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/` | No | API metadata (name, version, docs) |
| GET | `/api/v1/health` | No | Unified health check with all dependency checks |
| GET | `/api/v1/health/live` | No | Liveness probe |
| GET | `/api/v1/health/ready` | No | Readiness probe (checks database) |
| GET | `/api/v1/health/checks` | No | Detailed health check results |
| GET | `/health` | No | Legacy backward-compatible health |
| GET | `/` | No | Legacy backward-compatible root |

### GET /api/v1/health

```json
// Response 200
{
    "success": true,
    "message": "Service is healthy",
    "data": {
        "status": "healthy",
        "version": "0.3.0",
        "environment": "development",
        "checks": {
            "database": {
                "healthy": true,
                "message": "Database connection is healthy",
                "details": { "url": "localhost:5432/svos" }
            }
        }
    },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

### GET /api/v1/health/live

```json
// Response 200
{
    "success": true,
    "message": "Alive",
    "data": { "status": "alive" },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

### GET /api/v1/health/ready

```json
// Response 200 (ready)
{
    "success": true,
    "message": "Ready",
    "data": { "status": "ready", "database": "connected" },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}

// Response 200 (not ready)
{
    "success": false,
    "message": "Not ready",
    "data": { "status": "not_ready", "database": "disconnected" },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

### GET /api/v1/

```json
// Response 200
{
    "success": true,
    "message": "SV-OS API",
    "data": {
        "name": "SV-OS API",
        "description": "Silicon Valley Learning OS — Backend API",
        "version": "0.3.0",
        "environment": "development",
        "documentation": "/docs",
        "api_version": "v1"
    },
    "errors": null,
    "timestamp": "2026-01-15T10:30:00.123456Z",
    "request_id": "req_abc123def456"
}
```

---

## Planned Business Endpoints

### Authentication (Phase 4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /auth/signup | No | Create account |
| POST | /auth/login | No | Login |
| POST | /auth/logout | Yes | Logout |
| POST | /auth/refresh | Yes | Refresh token |
| GET | /auth/me | Yes | Get current user |
| PUT | /auth/me | Yes | Update profile |
| POST | /auth/reset-password | No | Request password reset |
| POST | /auth/change-password | Yes | Change password |

### Knowledge Nodes (Phase 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /nodes | No | List nodes (paginated, filterable) |
| GET | /nodes/{slug} | No | Get node details with relationships |
| GET | /nodes/{slug}/prerequisites | No | Get prerequisite nodes |
| GET | /nodes/{slug}/unlocks | No | Get nodes this unlocks |
| GET | /nodes/{slug}/related | No | Get related nodes |
| GET | /nodes/{slug}/careers | No | Careers involving this node |
| GET | /nodes/{slug}/projects | No | Projects using this node |
| GET | /nodes/{slug}/resources | No | Learning resources |
| POST | /nodes | Admin | Create node |
| PUT | /nodes/{slug} | Admin | Update node |
| DELETE | /nodes/{slug} | Admin | Delete node |

### Knowledge Graph (Phase 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /graph/explore | No | Get visible graph nodes (viewport-based) |
| GET | /graph/explore/{node_id} | No | Get subgraph around a node |
| GET | /graph/path | No | Find path between two nodes |
| GET | /graph/statistics | No | Graph-wide statistics |

### Careers (Phase 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /careers | No | List careers |
| GET | /careers/{slug} | No | Get career details |
| GET | /careers/{slug}/roadmap | No | Get phased learning roadmap |
| GET | /careers/{slug}/nodes | No | Get all knowledge nodes for this career |

### Projects (Phase 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /projects | No | List projects |
| GET | /projects/{slug} | No | Get project details |
| GET | /projects/{slug}/roadmap | No | Learning roadmap for project |

### Progress (Phase 4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /progress | Yes | Get all user progress |
| GET | /progress/stats | Yes | Get progress statistics |
| PUT | /progress/{node_id} | Yes | Update node progress |
| POST | /progress/{node_id}/start | Yes | Mark as started |
| POST | /progress/{node_id}/complete | Yes | Mark as completed |
| POST | /progress/{node_id}/master | Yes | Mark as mastered |

### Bookmarks & Favorites (Phase 4)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /bookmarks | Yes | List bookmarks |
| POST | /bookmarks | Yes | Add bookmark |
| DELETE | /bookmarks/{node_id} | Yes | Remove bookmark |
| GET | /favorites | Yes | List favorites |
| POST | /favorites | Yes | Add favorite |
| DELETE | /favorites/{node_id} | Yes | Remove favorite |

### Search (Phase 3)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /search | No | Full-text search across nodes |
| GET | /search/suggestions | No | Get search suggestions |
| GET | /search/history | Yes | Get user search history |
| DELETE | /search/history | Yes | Clear search history |

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 400 | BAD_REQUEST | Invalid input — malformed request body or parameters |
| 401 | UNAUTHORIZED | Missing or invalid authentication token |
| 403 | FORBIDDEN | Insufficient permissions for this resource |
| 404 | NOT_FOUND | Requested resource does not exist |
| 409 | CONFLICT | Resource already exists (duplicate) |
| 422 | VALIDATION_ERROR | Request failed schema validation |
| 429 | RATE_LIMITED | Too many requests — slow down |
| 500 | INTERNAL_ERROR | Unexpected server error (no stack traces exposed) |
| 503 | SERVICE_UNAVAILABLE | Downstream dependency unavailable |
