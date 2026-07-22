# SV-OS Security Guide

> **Security architecture and best practices** | **Date**: July 22, 2026

---

## Security Principles

1. **Defense in depth** — Multiple security layers, no single point of failure
2. **Least privilege** — Every component has minimum access required
3. **Never trust user input** — Validate, sanitize, and escape everything
4. **Secure by default** — Default configuration is the most secure
5. **Fail securely** — Errors should not leak sensitive information

---

## Authentication

### JWT Token Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Token Types                       │
├────────────────────┬────────────────────────────────┤
│   Access Token     │   Refresh Token                 │
├────────────────────┼────────────────────────────────┤
│   Short-lived      │   Long-lived                     │
│   60 minutes       │   7 days                         │
│   HS256 signed     │   HS256 signed                   │
│   Contains:        │   Contains:                      │
│   - sub (user_id)  │   - sub (user_id)                │
│   - role           │   - type: "refresh"              │
│   - type: "access" │   - exp, iat                     │
│   - exp, iat       │                                  │
│   Used for:        │   Used for:                      │
│   API auth header  │   Token refresh endpoint         │
└────────────────────┴──────────────────────────────────┘
```

### Token Security Requirements

| Requirement            | Standard                  | Verification      |
| ---------------------- | ------------------------- | ----------------- |
| Algorithm              | HS256 (HMAC with SHA-256) | Code review       |
| Secret key length      | ≥ 256 bits (32+ chars)    | Config validation |
| Access token expiry    | 60 minutes                | Config default    |
| Refresh token expiry   | 7 days                    | Config default    |
| Token storage (client) | httpOnly cookie or memory | Frontend review   |
| Token transport        | HTTPS only                | Infrastructure    |

### Password Security

| Requirement           | Standard        | Implementation       |
| --------------------- | --------------- | -------------------- |
| Hashing algorithm     | bcrypt          | passlib CryptContext |
| Work factor           | 12 rounds       | config.BCRYPT_ROUNDS |
| Minimum length        | 8 characters    | Pydantic validator   |
| Password reset expiry | 1 hour          | Token expiry         |
| Reset token length    | 48 bytes random | `token_urlsafe(48)`  |
| Reset token storage   | SHA-256 hash    | One-way hash         |

### Rate Limiting

```python
# Current configuration
API_RATE_LIMIT = 100       # requests/minute (authenticated)
API_RATE_LIMIT_ANON = 20   # requests/minute (anonymous)
GRAPH_RATE_LIMIT = 30      # requests/minute (graph endpoints)

# Future: separate rate limits per endpoint group
RATE_LIMITS = {
    '/auth/login': 5,          # 5 attempts/minute
    '/auth/register': 3,       # 3 attempts/minute
    '/auth/forgot-password': 2, # 2 attempts/minute
    '/graph/': GRAPH_RATE_LIMIT,
    '/search': 60,
    '/ai/': 20,
}
```

---

## Authorization

### Role-Based Access Control

```python
class UserRole(enum.StrEnum):
    LEARNER = 'learner'   # Default role
    ADMIN = 'admin'        # Elevated privileges

# Permission matrix:
permissions = {
    'read_content': ['learner', 'admin'],
    'create_content': ['admin'],
    'edit_content': ['admin'],
    'delete_content': ['admin'],
    'manage_users': ['admin'],
    'view_analytics': ['admin'],
    'import_export': ['admin'],
}
```

### Permission Check Pattern

```python
from app.services.auth import require_role

@router.delete('/nodes/{node_id}')
async def delete_node(
    node_id: UUID,
    current_user_id: Annotated[UUID, Depends(get_current_user_id)],
    uow: Annotated[UnitOfWork, Depends(get_uow)],
):
    user = await uow.users.get_by_id(current_user_id)
    require_role(user, 'admin')  # Raises 403 if not admin
    # ... proceed with deletion
```

---

## Input Validation

| Layer    | Validation                           | Tool            |
| -------- | ------------------------------------ | --------------- |
| HTTP     | Content-Type, Content-Length, Method | FastAPI         |
| Path     | UUID format, slug format             | Pydantic        |
| Query    | Pagination bounds, filter values     | Pydantic        |
| Body     | Schema validation, type coercion     | Pydantic models |
| Business | Uniqueness, constraints, references  | Service layer   |

### Pydantic Validation Rules

```python
class SignupRequest(BaseModel):
    email: EmailStr  # Validates email format
    username: str = Field(min_length=3, max_length=100, pattern=r'^[a-zA-Z0-9_]+$')
    password: str = Field(min_length=8, max_length=128)
    display_name: str | None = Field(None, max_length=200)
```

---

## Middleware Security

```mermaid
graph LR
    REQ[Request] --> CORS[CORS Check]
    CORS --> HOST[Host Validation]
    HOST --> SEC[Security Headers]
    SEC --> CSRF[CSRF Check]
    CSRF --> RATE[Rate Limit]
    RATE --> AUTH[Auth Check]
    AUTH --> API[API Endpoint]
```

### Security Headers (Current)

| Header                      | Value                                      | Effect                 |
| --------------------------- | ------------------------------------------ | ---------------------- |
| `X-Content-Type-Options`    | `nosniff`                                  | Prevents MIME sniffing |
| `X-Frame-Options`           | `DENY`                                     | Prevents clickjacking  |
| `X-XSS-Protection`          | `1; mode=block`                            | XSS filter (legacy)    |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains`      | Enforces HTTPS         |
| `Content-Security-Policy`   | Configured per environment                 | Prevents XSS           |
| `Referrer-Policy`           | `strict-origin-when-cross-origin`          | Controls referrer info |
| `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` | Restricts API access   |

---

## Secrets Management

### Environment Variables

```yaml
# Production secrets must NEVER be in code
# Use environment variables or secret manager

critical_secrets:
  - SECRET_KEY          # JWT signing key
  - DATABASE_URL        # Database connection
  - SUPABASE_SERVICE_KEY # Supabase admin key
  - OPENAI_API_KEY      # AI provider key
  - SENTRY_DSN          # Error reporting

# Secret validation (in config.py):
@field_validator('SECRET_KEY')
def validate_secret_key(cls, v, info):
    if info.data.get('ENVIRONMENT') == 'production' and v == 'change-me-in-production':
        raise ValueError('SECRET_KEY must be changed from default in production')
```

### Docker Secrets

```yaml
# For production Docker deployment:
secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

services:
  api:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DATABASE_URL: 'postgresql+asyncpg://svos:${db_password}@postgres:5432/svos'
```

---

## Docker Security

| Practice           | Implementation                       | Dockerfile       |
| ------------------ | ------------------------------------ | ---------------- |
| Non-root user      | `USER nextjs`                        | Web runner stage |
| Minimal base image | `python:3.12-slim`, `node:22-alpine` | Both Dockerfiles |
| Multi-stage builds | Separate deps/builder/runner         | Both Dockerfiles |
| No package caches  | `--no-cache-dir` for pip             | API Dockerfile   |
| Health checks      | `HEALTHCHECK` instruction            | Both Dockerfiles |
| `.dockerignore`    | Excludes node_modules, .git, etc.    | Root             |

---

## Dependency Security

| Tool          | Purpose                     | Frequency |
| ------------- | --------------------------- | --------- |
| Dependabot    | Automated dependency PRs    | Weekly    |
| `pnpm audit`  | NPM vulnerability scan      | CI        |
| `pip audit`   | Python vulnerability scan   | CI        |
| Manual review | Critical dependency updates | Per PR    |

**Policy**:

- Critical vulnerabilities: Fix within 24 hours
- High vulnerabilities: Fix within 1 week
- Medium/low: Fix within next sprint

---

## Knowledge Integrity

### Content Security

| Threat                      | Mitigation                                     |
| --------------------------- | ---------------------------------------------- |
| Malicious content injection | Input sanitization, Pydantic validation        |
| SQL injection via content   | Parameterized queries (SQLAlchemy)             |
| XSS in displayed content    | React escaping + CSP headers                   |
| Graph data corruption       | Strict validation, integrity checks, snapshots |

### Graph Integrity

| Check                    | Frequency         | Action on Failure        |
| ------------------------ | ----------------- | ------------------------ |
| No circular dependencies | On every mutation | Reject mutation          |
| Edge reference validity  | On every mutation | Reject if orphaned       |
| Node type consistency    | On import         | Warning                  |
| Graph snapshot integrity | On every snapshot | Reject corrupt snapshots |

---

## Future AI Safety

| Concern          | Mitigation                            | Priority |
| ---------------- | ------------------------------------- | -------- |
| Prompt injection | Input filtering, context isolation    | High     |
| Data leakage     | Input/output validation               | High     |
| Hallucination    | RAG grounding, citation requirements  | High     |
| Rate abuse       | Separate rate limits for AI endpoints | Medium   |
| Cost explosion   | Token budgets, usage monitoring       | Medium   |
| Model bias       | Content review, diverse training data | Low      |

### AI Security Service (Existing)

```python
class AISecurityService:
    """Filters AI inputs and outputs for safety."""

    async def validate_input(self, prompt: str) -> bool:
        """Check for prompt injection attempts."""

    async def sanitize_output(self, response: str) -> str:
        """Remove sensitive information from AI responses."""

    async def detect_abuse(self, user_id: UUID, prompt: str) -> bool:
        """Detect abusive usage patterns."""
```

---

## Security Incident Response

| Severity | Response Time | Action                              |
| -------- | ------------- | ----------------------------------- |
| Critical | < 1 hour      | Rotate secrets, patch, notify users |
| High     | < 4 hours     | Patch, monitor                      |
| Medium   | < 24 hours    | Schedule fix in next sprint         |
| Low      | < 1 week      | Log, track                          |

---

_Cross-reference: [PERFORMANCE_GUIDE.md](./PERFORMANCE_GUIDE.md), [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)_
