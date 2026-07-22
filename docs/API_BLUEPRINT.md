# SV-OS API Blueprint

> **Base URL**: `/api/v1/` | **Protocol**: HTTP/REST | **Format**: JSON  
> **Auth**: Bearer JWT | **Version**: 0.3.0 | **Status**: Stable ✅

---

## Response Envelope

All endpoints return a consistent JSON envelope:

```json
{
  "success": true,
  "message": "Operation description",
  "data": { ... },
  "errors": null,
  "timestamp": "2026-07-22T12:00:00.000Z",
  "request_id": "req-abc-123"
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "data": null,
  "errors": [{ "field": "email", "message": "Invalid format" }],
  "timestamp": "2026-07-22T12:00:00.000Z",
  "request_id": "req-abc-123"
}
```

**HTTP Status Codes**:

- `200` — Success
- `201` — Created
- `400` — Bad Request (validation error)
- `401` — Unauthorized (missing/invalid token)
- `403` — Forbidden (insufficient permissions)
- `404` — Not Found
- `409` — Conflict (duplicate entity)
- `422` — Validation Error (Pydantic)
- `429` — Too Many Requests (rate limited)
- `500` — Internal Server Error

---

## Endpoint Catalog

### Infrastructure

| Method | Path             | Auth | Description                                  |
| ------ | ---------------- | ---- | -------------------------------------------- |
| GET    | `/health`        | No   | Unified health check (all registered checks) |
| GET    | `/health/live`   | No   | Liveness probe (no deps)                     |
| GET    | `/health/ready`  | No   | Readiness probe (database check)             |
| GET    | `/health/checks` | No   | Detailed health check results                |
| GET    | `/`              | No   | API metadata (name, version, env)            |

### Authentication

| Method | Path                    | Auth | Description                        |
| ------ | ----------------------- | ---- | ---------------------------------- |
| POST   | `/auth/register`        | No   | Create account                     |
| POST   | `/auth/login`           | No   | Sign in                            |
| POST   | `/auth/refresh`         | No   | Refresh access token               |
| POST   | `/auth/logout`          | Yes  | Logout (client-side token discard) |
| GET    | `/auth/me`              | Yes  | Get current user profile           |
| PUT    | `/auth/me`              | Yes  | Update profile                     |
| POST   | `/auth/change-password` | Yes  | Change password                    |
| POST   | `/auth/forgot-password` | No   | Request password reset             |
| POST   | `/auth/reset-password`  | No   | Reset password with token          |
| GET    | `/auth/me/preferences`  | Yes  | Get user preferences               |
| PUT    | `/auth/me/preferences`  | Yes  | Update preferences (merge)         |

### Graph

| Method | Path                             | Auth | Description                   |
| ------ | -------------------------------- | ---- | ----------------------------- |
| GET    | `/graph/full`                    | Yes  | All published nodes + edges   |
| GET    | `/graph/explore/{node_id}`       | Yes  | Neighborhood around a node    |
| GET    | `/graph/statistics`              | Yes  | Aggregate graph statistics    |
| GET    | `/graph/prerequisites/{node_id}` | Yes  | Prerequisite chain for a node |

### Knowledge Nodes

| Method | Path                 | Auth | Description        |
| ------ | -------------------- | ---- | ------------------ |
| GET    | `/nodes/{node_id}`   | Yes  | Get node by ID     |
| GET    | `/nodes/slug/{slug}` | Yes  | Get node by slug   |
| POST   | `/nodes`             | Yes  | Create node        |
| PUT    | `/nodes/{node_id}`   | Yes  | Update node        |
| DELETE | `/nodes/{node_id}`   | Yes  | Delete node (soft) |

### Knowledge Edges

| Method | Path               | Auth | Description    |
| ------ | ------------------ | ---- | -------------- |
| GET    | `/edges/{edge_id}` | Yes  | Get edge by ID |
| POST   | `/edges`           | Yes  | Create edge    |
| PUT    | `/edges/{edge_id}` | Yes  | Update edge    |
| DELETE | `/edges/{edge_id}` | Yes  | Delete edge    |

### Careers

| Method | Path                           | Auth | Description                 |
| ------ | ------------------------------ | ---- | --------------------------- |
| GET    | `/careers`                     | Yes  | List careers (paginated)    |
| GET    | `/careers/{slug}`              | Yes  | Career detail               |
| GET    | `/careers/{slug}/requirements` | Yes  | Required knowledge nodes    |
| GET    | `/careers/{slug}/roadmap`      | Yes  | Learning roadmap for career |

### Projects

| Method | Path                            | Auth | Description               |
| ------ | ------------------------------- | ---- | ------------------------- |
| GET    | `/projects`                     | Yes  | List projects (paginated) |
| GET    | `/projects/{slug}`              | Yes  | Project detail            |
| GET    | `/projects/{slug}/requirements` | Yes  | Required knowledge nodes  |

### Learning Paths

| Method | Path                                 | Auth | Description                |
| ------ | ------------------------------------ | ---- | -------------------------- |
| GET    | `/learning-paths`                    | Yes  | List user's learning paths |
| POST   | `/learning-paths/generate`           | Yes  | Generate path to goal      |
| GET    | `/learning-paths/{path_id}`          | Yes  | Get path detail            |
| PUT    | `/learning-paths/{path_id}/progress` | Yes  | Update path progress       |
| POST   | `/learning-paths/{path_id}/pause`    | Yes  | Pause path                 |
| POST   | `/learning-paths/{path_id}/resume`   | Yes  | Resume path                |
| DELETE | `/learning-paths/{path_id}`          | Yes  | Delete path                |

### Progress

| Method | Path                  | Auth | Description                    |
| ------ | --------------------- | ---- | ------------------------------ |
| GET    | `/progress`           | Yes  | User progress list (paginated) |
| GET    | `/progress/stats`     | Yes  | Aggregated progress statistics |
| GET    | `/progress/{node_id}` | Yes  | Progress for a specific node   |
| PUT    | `/progress/{node_id}` | Yes  | Update progress for a node     |

### Bookmarks

| Method | Path                       | Auth | Description           |
| ------ | -------------------------- | ---- | --------------------- |
| GET    | `/bookmarks`               | Yes  | List user's bookmarks |
| POST   | `/bookmarks`               | Yes  | Create bookmark       |
| DELETE | `/bookmarks/{bookmark_id}` | Yes  | Remove bookmark       |

### Favorites

| Method | Path                       | Auth | Description           |
| ------ | -------------------------- | ---- | --------------------- |
| GET    | `/favorites`               | Yes  | List user's favorites |
| POST   | `/favorites`               | Yes  | Add favorite          |
| DELETE | `/favorites/{favorite_id}` | Yes  | Remove favorite       |

### Search

| Method | Path               | Auth | Description           |
| ------ | ------------------ | ---- | --------------------- |
| GET    | `/search`          | Yes  | Full-text search      |
| GET    | `/search/trending` | No   | Trending search terms |

### Activity

| Method | Path               | Auth | Description             |
| ------ | ------------------ | ---- | ----------------------- |
| GET    | `/activity`        | Yes  | User activity feed      |
| GET    | `/activity/recent` | Yes  | Recent activity summary |

### AI

| Method | Path               | Auth | Description                  |
| ------ | ------------------ | ---- | ---------------------------- |
| POST   | `/ai/chat`         | Yes  | Send message to AI assistant |
| GET    | `/ai/chat/history` | Yes  | Chat session history         |
| POST   | `/ai/embed`        | Yes  | Generate embedding for text  |
| POST   | `/ai/search`       | Yes  | Semantic search              |

### Recommendations

| Method | Path                                | Auth | Description                     |
| ------ | ----------------------------------- | ---- | ------------------------------- |
| GET    | `/recommendations/next`             | Yes  | Next learning recommendation    |
| GET    | `/recommendations/daily`            | Yes  | Daily digest                    |
| GET    | `/recommendations/weekly`           | Yes  | Weekly plan                     |
| POST   | `/recommendations/by-goal`          | Yes  | Recommendations toward a goal   |
| POST   | `/recommendations/after-assessment` | Yes  | Post-assessment recommendations |

### Skills

| Method | Path                       | Auth | Description               |
| ------ | -------------------------- | ---- | ------------------------- |
| GET    | `/skills`                  | Yes  | List skills               |
| GET    | `/skills/{skill_id}`       | Yes  | Skill detail              |
| GET    | `/skills/{skill_id}/nodes` | Yes  | Nodes teaching this skill |

### Platform

| Method | Path                          | Auth | Description                 |
| ------ | ----------------------------- | ---- | --------------------------- |
| GET    | `/platform/status`            | Yes  | Platform runtime status     |
| GET    | `/platform/engines`           | Yes  | Engine health status        |
| POST   | `/platform/import`            | Yes  | Import knowledge data       |
| POST   | `/platform/export`            | Yes  | Export knowledge data       |
| POST   | `/platform/versions/snapshot` | Yes  | Create graph snapshot       |
| GET    | `/platform/versions`          | Yes  | List graph versions         |
| POST   | `/platform/versions/restore`  | Yes  | Restore graph from snapshot |

---

## Request/Response Examples

### POST /auth/register

**Request**:

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecurePass123!",
  "display_name": "John Doe"
}
```

**Response (201)**:

```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "role": "learner",
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "bearer",
      "expires_at": "2026-07-22T13:00:00Z"
    }
  }
}
```

### POST /auth/login

**Request**:

```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "username": "johndoe",
    "display_name": "John Doe",
    "role": "learner",
    "tokens": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
      "token_type": "bearer",
      "expires_at": "2026-07-22T13:00:00Z"
    }
  }
}
```

### GET /graph/full

**Response (200)**:

```json
{
  "success": true,
  "message": "Full graph retrieved",
  "data": {
    "nodes": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "slug": "javascript",
        "title": "JavaScript",
        "description": "A high-level programming language...",
        "node_type": "technology",
        "difficulty": "beginner",
        "estimated_minutes": 120,
        "icon": "code",
        "color": "#f7df1e"
      }
    ],
    "edges": [
      {
        "id": "660e8400-e29b-41d4-a716-446655440010",
        "source_id": "550e8400-e29b-41d4-a716-446655440001",
        "target_id": "550e8400-e29b-41d4-a716-446655440002",
        "relationship_type": "prerequisite",
        "direction": "forward"
      }
    ],
    "total_nodes": 150,
    "total_edges": 450
  }
}
```

### GET /search?q=react&mode=fulltext

**Response (200)**:

```json
{
  "success": true,
  "message": "Search results",
  "data": {
    "items": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440020",
        "title": "React",
        "slug": "react",
        "node_type": "technology",
        "difficulty": "intermediate",
        "score": 0.95
      }
    ],
    "total": 12,
    "page": 1,
    "per_page": 20,
    "total_pages": 1,
    "query": "react",
    "mode": "fulltext"
  }
}
```

### POST /learning-paths/generate

**Request**:

```json
{
  "goal_node_id": "550e8400-e29b-41d4-a716-446655440030",
  "strategy": "dependency_roadmap",
  "milestone_size": 5
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Learning path generated",
  "data": {
    "path_id": "abc-123-def-456",
    "goal_title": "Full Stack Developer",
    "strategy": "dependency_roadmap",
    "milestones": [
      {
        "level": 1,
        "title": "Foundations",
        "node_count": 5,
        "estimated_minutes": 240,
        "nodes": []
      }
    ],
    "total_estimated_minutes": 2400,
    "completion_percentage": 0
  }
}
```

### GET /recommendations/next

**Response (200)**:

```json
{
  "success": true,
  "message": "Recommendations retrieved",
  "data": [
    {
      "node_id": "550e8400-e29b-41d4-a716-446655440040",
      "title": "JavaScript Promises",
      "slug": "javascript-promises",
      "node_type": "concept",
      "difficulty": "intermediate",
      "priority": 3,
      "priority_label": "Continue Learning Streak",
      "reason": "Continue your streak — next step from current topic",
      "estimated_minutes": 45
    }
  ]
}
```

### POST /ai/chat

**Request**:

```json
{
  "message": "What are React Hooks?",
  "session_id": "session-abc-123"
}
```

**Response (200)**:

```json
{
  "success": true,
  "message": "Response generated",
  "data": {
    "response": "React Hooks are functions introduced in React 16.8...",
    "session_id": "session-abc-123",
    "sources": [{ "node_id": "...", "title": "React Hooks", "relevance": 0.95 }],
    "tokens_used": 450
  }
}
```

---

## Future Endpoints

### AI / Knowledge

| Method | Path                    | Purpose                                 |
| ------ | ----------------------- | --------------------------------------- |
| POST   | `/ai/recommend`         | AI-powered personalized recommendations |
| POST   | `/ai/analyze-knowledge` | Analyze knowledge gaps                  |
| POST   | `/ai/summarize`         | Summarize a set of nodes                |

### Admin

| Method | Path                     | Purpose               |
| ------ | ------------------------ | --------------------- |
| GET    | `/admin/users`           | List all users        |
| PUT    | `/admin/users/{id}/role` | Change user role      |
| POST   | `/admin/bulk-import`     | Bulk knowledge import |
| GET    | `/admin/analytics`       | Platform analytics    |

### Community

| Method | Path                       | Purpose                      |
| ------ | -------------------------- | ---------------------------- |
| POST   | `/community/nodes`         | Submit node for review       |
| GET    | `/community/contributions` | User's contributions         |
| POST   | `/community/review`        | Review pending contributions |

---

_Cross-reference: [BACKEND_BLUEPRINT.md](./BACKEND_BLUEPRINT.md), [FRONTEND_BLUEPRINT.md](./FRONTEND_BLUEPRINT.md)_
