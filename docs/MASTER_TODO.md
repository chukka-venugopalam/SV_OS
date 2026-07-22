# SV-OS Master TODO

> **Infrastructure v1 Complete** | **Date**: July 22, 2026  
> **Next Phase**: Knowledge Import (Phase 1)

---

## How to Use This TODO

- `[ ]` — Not started
- `[x]` — Completed
- `[/]` — In progress
- Tasks are grouped by module/phase
- Priority: P0 (blocking) → P1 (important) → P2 (nice to have)

---

## Phase 1: Knowledge Import System

### JSON Import

- [ ] Create `app/import/sources/json_parser.py` — Parse structured JSON nodes/edges — P0
- [ ] Create import JSON schema with validation — P0
- [ ] Write sample import JSON files for testing — P1
- [ ] Handle nested JSON structures (hierarchical → edges) — P1
- [ ] Support incremental JSON import (append mode) — P2

### CSV Import

- [ ] Create `app/import/sources/csv_parser.py` — Parse CSV with header mapping — P0
- [ ] Define CSV column schema and required columns — P0
- [ ] Support custom column mapping configuration — P1
- [ ] Handle multi-file CSV imports (nodes + edges + resources) — P1

### Markdown Import

- [ ] Create `app/import/sources/markdown_parser.py` — Parse Markdown with YAML frontmatter — P1
- [ ] Extract frontmatter → node attributes — P1
- [ ] Extract content → description — P1
- [ ] Extract internal links → edges — P1
- [ ] Extract external links → resources — P2

### Wikipedia Import

- [ ] Create `app/import/sources/wikipedia_parser.py` — Wikipedia API client — P1
- [ ] Implement CS category traversal — P1
- [ ] Implement infobox extraction — P2
- [ ] Implement link extraction → edges — P2
- [ ] Implement introduction → description extraction — P2
- [ ] Add quality filtering (stub detection, relevance scoring) — P2

### OSS Documentation Import

- [ ] Create `app/import/sources/oss_parser.py` — OSS doc parser — P2
- [ ] Implement README parser — P2
- [ ] Create OSS project index — P2
- [ ] Implement GitHub API integration — P2

### Roadmap Import

- [ ] Create `app/import/sources/roadmap_parser.py` — Roadmap format parser — P2
- [ ] Support roadmap.sh JSON format — P2
- [ ] Support OSS University format — P2
- [ ] Implement hierarchical → edge conversion — P2

### Validation Pipeline

- [ ] Create `app/import/validation/import_validator.py` — P0
- [ ] Implement schema validation — P0
- [ ] Implement constraint validation — P0
- [ ] Implement reference integrity checks — P0
- [ ] Implement semantic quality checks — P1
- [ ] Generate human-readable validation reports — P1
- [ ] Implement per-row error reporting — P1
- [ ] Add batch validation mode — P2

### Deduplication

- [ ] Create `app/import/dedup/dedup_service.py` — P0
- [ ] Implement exact slug matching — P0
- [ ] Implement fuzzy title matching (Levenshtein) — P0
- [ ] Implement context-based matching (prerequisite sets) — P1
- [ ] Implement merge strategy for duplicates — P1
- [ ] Implement flag-for-review for uncertain matches — P1
- [ ] Add configurable threshold parameters — P2

### Graph Generation

- [ ] Create `app/import/graph_generator.py` — P0
- [ ] Implement edge auto-generation from hierarchy — P0
- [ ] Implement node type inference — P1
- [ ] Implement difficulty inference — P1
- [ ] Handle orphan detection (nodes without edges) — P1

### Import Orchestrator

- [ ] Create `app/import/importer.py` — Main orchestrator — P0
- [ ] Implement import pipeline (parse → validate → dedup → generate → store) — P0
- [ ] Create import job model (tracking, status, progress) — P0
- [ ] Implement async import with progress reporting — P1
- [ ] Implement import rollback on critical failure — P1
- [ ] Add import statistics logging — P1
- [ ] Support dry-run mode — P2

### Resource Linking

- [ ] Create `app/import/resource_linker.py` — P1
- [ ] Implement URL pattern → resource type mapping — P1
- [ ] Implement URL accessibility validation — P1
- [ ] Implement resource → node auto-linking — P2

### Skill Extraction

- [ ] Create `app/import/skill_extractor.py` — P2
- [ ] Implement keyword → skill mapping — P2
- [ ] Implement TF-IDF key phrase extraction — P2
- [ ] Implement automatic skill → node linking — P2

### Models & Schemas

- [ ] Create `app/import/models.py` — ImportJob, ImportResult — P0
- [ ] Create `app/schemas/import/import_request.py` — P0
- [ ] Create `app/schemas/import/import_response.py` — P0
- [ ] Create `app/schemas/import/import_progress.py` — P1

### API Endpoints

- [ ] Create `app/api/v1/endpoints/import_endpoints.py` — P0
- [ ] POST `/platform/import` — Start import job — P0
- [ ] GET `/platform/import/{job_id}` — Get job status — P0
- [ ] GET `/platform/import/history` — Import history — P1
- [ ] POST `/platform/import/dry-run` — Validate without importing — P1

### Frontend

- [ ] Create import page with file upload — P1
- [ ] Create import progress visualization — P1
- [ ] Create import history list — P2
- [ ] Create manual authoring UI (node form, edge form) — P2
- [ ] Add validation error display — P2

### Tests

- [ ] Test JSON parser with valid/invalid input — P0
- [ ] Test CSV parser with valid/invalid input — P0
- [ ] Test Markdown parser — P1
- [ ] Test validation pipeline end-to-end — P0
- [ ] Test deduplication accuracy — P0
- [ ] Test graph generation correctness — P0
- [ ] Test import orchestrator with all source types — P0
- [ ] Test API endpoints — P0
- [ ] Test edge cases (empty, malformed, huge files) — P1
- [ ] Test import rollback — P1

### Integration

- [ ] Wire ImportEngine into import pipeline — P1
- [ ] Wire ValidationEngine into validation pipeline — P1
- [ ] Wire VersioningEngine for before/after snapshots — P1

---

## Phase 2: Graph Enhancements

### Layout Engine

- [ ] Implement force-directed layout algorithm — P1
- [ ] Implement hierarchical layout algorithm — P1
- [ ] Implement concentric layout (center node → neighbors) — P1
- [ ] Add layout parameters to graph API — P1
- [ ] Cache computed layouts — P2

### Graph Diff

- [ ] Create `app/services/graph_diff.py` — P1
- [ ] Implement node-level diff (added, removed, modified) — P1
- [ ] Implement edge-level diff — P1
- [ ] Create diff visualization frontend component — P2

### Subgraph Export

- [ ] Implement JSON subgraph export — P1
- [ ] Implement GraphML subgraph export — P2
- [ ] Create export API endpoint — P1
- [ ] Create export frontend UI — P2

### Statistics Enhancements

- [ ] Add growth rate statistics — P2
- [ ] Add coverage statistics — P2
- [ ] Add node type distribution over time — P2

### GraphEngine Persistence

- [ ] Evaluate graph size thresholds for persistence — P2
- [ ] Implement optional Redis-backed GraphEngine — P2

---

## Phase 3: Search Improvements

### Faceted Search

- [ ] Implement faceted search with aggregated counts — P1
- [ ] Add type facet — P1
- [ ] Add difficulty facet — P1
- [ ] Add tag facet — P1
- [ ] Create faceted search frontend UI — P1
- [ ] Add active filter display and removal — P1

### Autocomplete

- [ ] Implement prefix-based autocomplete — P1
- [ ] Implement fuzzy autocomplete — P2
- [ ] Create autocomplete frontend component — P1
- [ ] Add keyboard navigation for autocomplete — P1

### Search Analytics

- [ ] Create search analytics service — P1
- [ ] Track popular search queries — P1
- [ ] Track zero-result searches — P1
- [ ] Create trending search terms API — P1
- [ ] Create search dashboard UI — P2

### pgvector Integration

- [ ] Add pgvector extension to database — P2
- [ ] Create embedding storage and indexing — P2
- [ ] Implement vector similarity search directly in PostgreSQL — P2
- [ ] Migrate from in-memory embeddings to pgvector — P2

---

## Phase 4: Recommendations

### API Integration

- [ ] Wire RecommendationEngine into API endpoints — P1
- [ ] Create GET `/recommendations/next` — P1
- [ ] Create GET `/recommendations/daily` — P1
- [ ] Create GET `/recommendations/weekly` — P1
- [ ] Create POST `/recommendations/by-goal` — P1
- [ ] Create POST `/recommendations/after-assessment` — P2

### Frontend

- [ ] Create dashboard recommendation widget — P1
- [ ] Create daily digest page — P1
- [ ] Create weekly plan page — P2
- [ ] Add recommendation explainer tooltips — P1
- [ ] Add thumbs up/down feedback — P2

### Personalization

- [ ] Implement user preference integration — P1
- [ ] Implement history-aware recommendations — P1
- [ ] Implement time-of-day weighting — P2
- [ ] Create A/B testing framework for priority rules — P2

---

## Phase 5: Learning Engine

### Path Generation

- [ ] Wire LearningPathEngine into API — P1
- [ ] Complete all 8 strategy implementations — P1
- [ ] Test dependency_roadmap with real data — P1
- [ ] Test shortest_roadmap — P1
- [ ] Test career_roadmap — P2
- [ ] Test daily/weekly roadmaps — P2

### Path Visualization

- [ ] Create milestone visualization component — P1
- [ ] Create path progress bar — P1
- [ ] Create path node list with status indicators — P1
- [ ] Add path editing (add/remove nodes) — P2
- [ ] Add path comparison view — P2

### Spaced Repetition

- [ ] Complete RevisionEngine scheduling algorithms — P1
- [ ] Implement SM-2 algorithm — P1
- [ ] Create review dashboard UI — P1
- [ ] Add review notification system — P1
- [ ] Implement progress decay tracking — P2

---

## Phase 6: Career Engine

### Career Mapping

- [ ] Complete CareerEngine API integration — P1
- [ ] Enhance career requirement service — P1
- [ ] Add salary/demand data integration — P2
- [ ] Create career comparison API — P2

### Career Roadmap Visualization

- [ ] Create career roadmap timeline component — P1
- [ ] Create skill gap visualization — P1
- [ ] Add career progress indicators — P1
- [ ] Add career switching cost estimation — P2

### Skill Gap Analysis

- [ ] Create `app/services/skill_gap.py` — P1
- [ ] Implement current vs. required comparison — P1
- [ ] Implement gap prioritization — P1
- [ ] Create skill gap frontend component — P1

---

## Phase 7: Analytics

### User Analytics

- [ ] Create user analytics service — P1
- [ ] Implement learning velocity metrics — P1
- [ ] Implement engagement metrics — P1
- [ ] Create analytics dashboard UI — P1
- [ ] Add time-series charts — P2

### Graph Analytics

- [ ] Create graph growth metrics — P1
- [ ] Create content coverage reports — P2
- [ ] Create node popularity tracking — P1
- [ ] Implement graph health dashboard — P2

### Reports

- [ ] Implement exportable analytics reports (PDF/CSV) — P2
- [ ] Create scheduled report generation — P2

---

## Phase 8: AI Integration

### Production Embeddings

- [ ] Deploy embedding providers to production — P1
- [ ] Implement embedding caching (avoid re-computation) — P1
- [ ] Add embedding quality monitoring — P2
- [ ] Implement batch embedding for large imports — P1

### Semantic Search

- [ ] Complete semantic search integration — P1
- [ ] Implement hybrid search (FTS + semantic) — P1
- [ ] Tune semantic search ranking — P2
- [ ] Add vector similarity UI indicators — P2

### AI Recommendations

- [ ] Implement ML-enhanced recommendation scoring — P2
- [ ] Build feedback loop for recommendation learning — P2
- [ ] Create A/B comparison dashboard — P2

### Content AI

- [ ] Implement content summarization — P2
- [ ] Implement auto-tagging of nodes — P2
- [ ] Implement difficulty estimation — P2

---

## Phase 9: Performance Optimization

### Database

- [ ] Profile slow queries — P1
- [ ] Add missing indexes based on query patterns — P1
- [ ] Implement query result caching — P1
- [ ] Optimize N+1 query patterns — P1
- [ ] Add connection pool tuning — P2

### Redis Cache

- [ ] Deploy Redis service — P1
- [ ] Implement Redis cache backend — P1
- [ ] Migrate from InMemoryCache to RedisCache — P1
- [ ] Implement cache invalidation on mutations — P1
- [ ] Add cache hit/miss monitoring — P2

### Frontend

- [ ] Analyze and optimize bundle size — P1
- [ ] Implement lazy loading for heavy pages (graph, chat) — P1
- [ ] Implement code splitting by route — P1
- [ ] Add image optimization — P2
- [ ] Add CDN configuration for static assets — P2

### Graph

- [ ] Implement virtualized graph rendering (1000+ nodes) — P1
- [ ] Implement graph level-of-detail (show more on zoom) — P1
- [ ] Implement graph chunked loading — P2

### API

- [ ] Add response compression tuning — P1
- [ ] Add HTTP caching headers — P1
- [ ] Implement conditional requests (ETag, If-Modified-Since) — P2

---

## Phase 10: Production Launch

### Deployment

- [ ] Choose production hosting provider — P0
- [ ] Configure production Docker Compose — P0
- [ ] Set up SSL/TLS certificates — P0
- [ ] Configure domain and DNS — P0
- [ ] Set up database backup automation — P0
- [ ] Configure environment variables for production — P0
- [ ] Implement secret management — P1
- [ ] Set up staging environment — P1

### Monitoring

- [ ] Set up Sentry error tracking — P0
- [ ] Create Grafana dashboard — P1
- [ ] Set up uptime monitoring — P1
- [ ] Configure alerting rules — P1
- [ ] Set up log aggregation (Loki/ELK) — P2

### Testing

- [ ] Run load tests (k6/locust) — P1
- [ ] Run security audit — P1
- [ ] Run accessibility audit — P1
- [ ] Perform production dry-run — P1

### Documentation

- [ ] Create production runbook — P0
- [ ] Create incident response plan — P1
- [ ] Create disaster recovery plan — P1
- [ ] Update deployment documentation — P1

---

## Cross-Cutting Concerns

### Testing

- [ ] Add frontend tests to CI pipeline — P1
- [ ] Increase backend test coverage to 85%+ — P1
- [ ] Add end-to-end tests (Playwright) — P2
- [ ] Add integration tests for import pipeline — P1
- [ ] Add performance regression tests — P2

### Documentation

- [ ] Create Postman/Insomnia API collection — P1
- [ ] Create developer onboarding guide — P1
- [ ] Create video walkthrough — P2
- [ ] Add inline code documentation coverage — P1

### Accessibility

- [ ] Run WCAG 2.1 AA audit — P1
- [ ] Fix accessibility issues — P1
- [ ] Add keyboard navigation for graph — P1
- [ ] Test with screen readers — P2

### Security

- [ ] Set up dependency scanning (Dependabot already configured) — P1
- [ ] Run penetration testing — P2
- [ ] Implement rate limiting for auth endpoints — P1
- [ ] Add audit logging for sensitive operations — P1

---

## Summary

| Phase                   | Total Tasks | Completed | Remaining |
| ----------------------- | ----------- | --------- | --------- |
| P1: Knowledge Import    | ~85         | 0         | 85        |
| P2: Graph Enhancements  | ~25         | 0         | 25        |
| P3: Search Improvements | ~20         | 0         | 20        |
| P4: Recommendations     | ~18         | 0         | 18        |
| P5: Learning Engine     | ~18         | 0         | 18        |
| P6: Career Engine       | ~15         | 0         | 15        |
| P7: Analytics           | ~12         | 0         | 12        |
| P8: AI Integration      | ~12         | 0         | 12        |
| P9: Performance         | ~20         | 0         | 20        |
| P10: Production Launch  | ~22         | 0         | 22        |
| Cross-Cutting           | ~18         | 0         | 18        |
| **Total**               | **~265**    | **0**     | **~265**  |

---

_Cross-reference: [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md), [KNOWLEDGE_IMPORT_PLAN.md](./KNOWLEDGE_IMPORT_PLAN.md)_
