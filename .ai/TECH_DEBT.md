# Technical Debt

| ID | Description | Reason | Impact | Risk | Priority | Status |
|----|-------------|--------|--------|------|----------|--------|
| TD-001 | No recursive CTE query timeout | Deep graph traversals could be expensive | Slow queries on deep (10+) graph dives | Low | Low | Open |
| TD-002 | Adjacency list vs graph DB at scale | Relational graph may not scale to millions of nodes | Performance degradation at extreme scale | Low (MVP) | Low | Deferred |
| TD-003 | No caching tier yet | Cache designed but not implemented | Slower responses until caching is added | Medium | Medium | Open |
| TD-004 | No test coverage | Frontend: no tests; Backend: 3 health tests | Regression risk during development | High | High | Open |
| TD-005 | No rate limiting in code | Rate limiting designed but not implemented | Potential for abuse before deployment | Medium | Medium | Open |
| TD-006 | No API versioning middleware | Routes structured for v1 but no version negotiation | Breaking changes would affect clients | Low | Low | Deferred |
| TD-007 | Tailwind v4 config file is stub | JS config retained for tooling compat only | Dead config that could confuse developers | Low | Low | Resolved |
