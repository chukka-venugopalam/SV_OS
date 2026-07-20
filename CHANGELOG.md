# Changelog

## [1.0.0] — 2026-07-20

### Added

- Production health checks: database, cache, engine_registry, event_bus
- Database startup retry with configurable backoff (10 retries, 3s delay)
- CSRF exempt paths for all auth endpoints (login, register, refresh, etc.)
- Docker build verification in CI workflow
- Production documentation: Runbook, Troubleshooting, Backup/Restore, Environment Variables, Production Checklist
- Versioning endpoints for import/export/snapshots

### Fixed

- **Login failure**: CSRF middleware was blocking all POST requests to auth endpoints with 403 Forbidden.
  Auth endpoints now correctly use Bearer token authentication instead of CSRF cookie validation.
- **middleware/**init**.py**: Duplicate `__all__` assignment was causing `CSRFMiddleware` to be excluded from exports.
- **Dockerfile.api healthcheck**: Health check path changed from `/health` to `/api/v1/health/live` for correct routing.
- **Dockerfile.web build**: Fixed build-time environment variable passing (switched from shell substitution to proper Docker ARG+ENV pattern).
- `Lifespan` import error in `main.py` (function name mismatch)
- `# noqa: E402` suppressions removed from `router.py` (imports reorganized)
- `# noqa: ARG002` and `# noqa: F821` suppressions in `knowledge_engine.py` (properly fixed)
- Unused imports/variables across 8 frontend files
- Duplicate `DEFAULT_OLLAMA_URL` constant (llm_ollama.py now imports from ollama.py)
- `.prettierignore` missing `.venv-test/` directory
- Missing `jsdom` dependency for web tests
- Pytest mark warnings for `db` and `slow` markers

### Removed

- 4 unused capability stubs (Simulator, Search, Import, Graph — raised `NotImplementedError`)
- 6 empty stub directories (events/contracts, events/handlers, events/publishers, events/subscribers, persistence/mappers, persistence/transactions)
- ~15 TODO placeholder comments across engine files

### Security

- Auth endpoints exempted from CSRF validation (use Bearer tokens)
- HSTS headers enabled in production (max-age=63072000)
- All user inputs validated via Pydantic schemas
- Rate limiting active: 100 req/min (auth), 20 req/min (anon), 30 req/min (graph)
- Security headers applied to all responses

### Documentation

- `docs/ProductionChecklist.md` — Pre/post-deployment verification
- `docs/EnvironmentVariables.md` — Comprehensive env var reference
- `docs/Runbook.md` — Operations runbook
- `docs/Troubleshooting.md` — Common issues and fixes
- `docs/BackupRestore.md` — Backup and disaster recovery procedures
- `docs/ARCHITECTURE.md` — Complete system architecture
- `docs/DEPLOYMENT.md` — Deployment guide (Vercel, Render, Docker)

### CI/CD

- Docker build steps added to CI workflow
- Ruff: 0 violations (all rules enabled)
- TypeScript: 0 errors (strict mode)
- Prettier: 313 files formatted
- Pytest: 775 tests collected
- Build: 26 pages generated
