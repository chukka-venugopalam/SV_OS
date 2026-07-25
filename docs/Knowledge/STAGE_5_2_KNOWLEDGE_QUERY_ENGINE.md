# Stage 5.2 — Knowledge Query & Navigation Engine

> **Version**: 0.1 | **Status**: Implemented ✅ | **Phase**: Stage 5.2

---

## Overview

The Knowledge Query & Navigation Engine makes the SV-OS knowledge graph usable.
It provides rich querying, path finding, navigation, and recommendation
capabilities on top of the imported graph data.

### Capabilities

- **Knowledge Query**: Retrieve nodes by slug, domain, type, difficulty
- **Graph Navigation**: Shortest path (hops/hours), longest path (DAG-only), topological order
- **Domain Traversal**: Navigate within or across knowledge domains
- **Learning Journeys**: Generate personalised learning paths with multiple strategies
- **Statistics**: Full-graph aggregate statistics
- **Unlocks**: Reverse-prerequisite computation (never stored — always derived)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    API Layer                             │
│  /api/v1/knowledge/ (15+ endpoints)                     │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │KnowledgeQuery│  │GraphNavigation │  │ Statistics   │ │
│  │  Service     │  │   Service      │  │   Service    │ │
│  └──────┬───────┘  └───────┬────────┘  └──────┬───────┘ │
├─────────┼──────────────────┼───────────────────┼─────────┤
│         ▼                  ▼                   ▼         │
│  ┌──────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │GraphTraversal│  │ KnowledgeNode  │  │ Graph        │ │
│  │  Service     │  │   Repository   │  │  Repository  │ │
│  └──────────────┘  └────────────────┘  └──────────────┘ │
├─────────────────────────────────────────────────────────┤
│                    Data Layer (PostgreSQL 16)            │
│  knowledge_nodes | knowledge_edges | projects | careers │
└─────────────────────────────────────────────────────────┘
```

---

## Services

### 1. KnowledgeQueryService (`services/knowledge_query.py`)

Rich queries for the knowledge graph.

| Method                                                | Description                                      |
| ----------------------------------------------------- | ------------------------------------------------ |
| `get_by_slug(slug)`                                   | Get a published node by slug                     |
| `get_by_id(node_id)`                                  | Get a published node by ID                       |
| `find_by_title(title, exact)`                         | Find nodes by title (SQL-based)                  |
| `get_nodes_by_domain(domain, page, per_page)`         | Nodes filtered by metadata domain                |
| `get_nodes_by_type(node_type, page, per_page)`        | Nodes filtered by node_type                      |
| `get_nodes_by_difficulty(difficulty, page, per_page)` | Nodes filtered by difficulty                     |
| `get_all_domains()`                                   | Distinct domains with node counts                |
| `get_unlocks(slug)`                                   | Nodes unlocked by this node (derived from edges) |
| `get_prerequisites(slug)`                             | Prerequisite nodes                               |
| `get_recently_unlocked(completed_ids, limit)`         | Nodes whose prerequisites are all satisfied      |
| `get_recommended_next(completed_ids, limit)`          | Next best topics to study                        |
| `get_related_projects(slug)`                          | Projects referencing a node                      |
| `get_related_careers(slug)`                           | Careers requiring a node                         |
| `get_related_resources(slug, page, per_page)`         | Learning resources for a node                    |
| `get_related_nodes(slug, relationship_type)`          | All neighbor nodes                               |
| `get_dependency_tree(slug, max_depth)`                | Nested prerequisite tree                         |

### 2. GraphNavigationService (`services/graph_navigation.py`)

Path finding, traversal, and journey generation.

| Method                                                      | Description                                             |
| ----------------------------------------------------------- | ------------------------------------------------------- |
| `shortest_path(from_slug, to_slug, metric, max_depth)`      | Shortest path (BFS or Dijkstra)                         |
| `longest_path(slug, max_depth)`                             | Longest prerequisite chain (DAG only, Kahn's algorithm) |
| `topological_order(domain)`                                 | Full topological sort (Kahn's)                          |
| `domain_traversal(domain, max_depth)`                       | Dependency-safe order within a domain                   |
| `cross_domain_traversal(from_domain, to_domain, max_depth)` | Path crossing domain boundaries                         |
| `generate_learning_journey(from_slug, to_slug, strategy)`   | Personalised learning path                              |

#### Path Metrics

- **`hops`** (BFS): Fewest edges. `O(V + E)` time.
- **`hours`** (Dijkstra): Minimum cumulative estimated hours. `O((V + E) log V)` time.

#### Longest Path (DAG Only)

**Critical precondition**: The graph must be a DAG. Cycle detection in
Stage 5.1's import pipeline rejects cyclic graphs at import time.
Longest-path in a general graph is NP-hard, but the DAG invariant makes
this tractable via a single forward pass over topological order.

Algorithm:

1. Compute prerequisite subgraph reachable from the target node
2. Build adjacency list and in-degree map
3. Kahn's algorithm for topological order
4. Single forward pass: `depth_map[neighbor] = max(depth_map[neighbor], depth_map[current] + 1)`
5. Trace back predecessor chain to find the longest path

### 3. StatisticsService (`services/statistics_service.py`)

Full-graph aggregate statistics.

| Method                          | Description                                                                                                                |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `get_graph_statistics()`        | Total nodes/edges, type/difficulty/domain distribution, most connected node, root/leaf nodes, longest chain, graph density |
| `get_domain_statistics(domain)` | Per-domain node count, edge count, difficulty distribution                                                                 |

**Performance note**: All statistics are full-graph aggregates suitable
for caching with a short TTL. None norrmally change between imports.

---

## API Reference

All endpoints are under `/api/v1/knowledge/` and return the standard
SV-OS response envelope (`success`, `message`, `data`, `timestamp`, etc.).

### Node Endpoints

| Method | Path                         | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| GET    | `/knowledge/node/{slug}`     | Full node detail              |
| GET    | `/knowledge/domain/{domain}` | Nodes in a domain (paginated) |
| GET    | `/knowledge/search`          | Full-text search with filters |

### Relationship Endpoints

| Method | Path                              | Description                                 |
| ------ | --------------------------------- | ------------------------------------------- |
| GET    | `/knowledge/prerequisites/{slug}` | Prerequisite nodes                          |
| GET    | `/knowledge/unlocks/{slug}`       | Unlocked nodes (derived from prerequisites) |
| GET    | `/knowledge/related/{slug}`       | All neighbor nodes                          |
| GET    | `/knowledge/tree/{slug}`          | Nested dependency tree                      |

### Path Endpoints

| Method | Path                   | Params                                                    | Description      |
| ------ | ---------------------- | --------------------------------------------------------- | ---------------- |
| GET    | `/knowledge/path`      | `from_slug`, `to_slug`, `metric=hops\|hours`, `max_depth` | Shortest path    |
| GET    | `/knowledge/path/full` | `from_slug`, `to_slug`, `strategy`                        | Learning journey |

### Listing Endpoints

| Method | Path                          | Description                      |
| ------ | ----------------------------- | -------------------------------- |
| GET    | `/knowledge/domains`          | All distinct domains with counts |
| GET    | `/knowledge/projects`         | All published projects           |
| GET    | `/knowledge/projects/{slug}`  | Projects for a specific node     |
| GET    | `/knowledge/careers/{slug}`   | Careers requiring a node         |
| GET    | `/knowledge/resources/{slug}` | Learning resources for a node    |

### Statistics & Recommendation

| Method | Path                         | Description                      |
| ------ | ---------------------------- | -------------------------------- |
| GET    | `/knowledge/statistics`      | Full graph statistics            |
| GET    | `/knowledge/recommendations` | Recommendations or popular nodes |

---

## Key Design Decisions

### Unlocks Are Always Derived

**Unlocks** are computed by reversing `KnowledgeEdge` prerequisite
relationships at query time. They are never stored as a separate column
or table. This prevents graph drift when edges are edited — if a
prerequisite edge changes, the unlocks change automatically without
requiring a sync.

### Longest Path Precondition

Longest path in a general graph is NP-hard. It is tractable here
specifically because the Stage 5.1 import pipeline rejects cyclic
graphs at import time. The implementation validates this invariant
by checking that Kahn's algorithm produces a full ordering — if a
cycle is detected, an error is returned.

### Shortest Path Metrics

- **hops**: Unweighted BFS (fewest edges). Appropriate for "what's the
  shortest curriculum?"
- **hours**: Weighted Dijkstra (minimum cumulative estimated time).
  Appropriate for "what's the fastest way to learn X?"

### Learning Journey Strategies

| Strategy        | Description                                   |
| --------------- | --------------------------------------------- |
| `fastest`       | Minimum cumulative estimated hours (Dijkstra) |
| `complete`      | Full transitive closure in topological order  |
| `breadth_first` | BFS-based exploration, level by level         |
| `depth_first`   | Deep dive down the prerequisite chain first   |

---

## Performance Notes

- **BFS/DFS**: `O(V + E)` time — scales linearly with graph size
- **Dijkstra**: `O((V + E) log V)` — efficient for weighted paths
- **Kahn's algorithm**: `O(V + E)` — used for topological sort and longest path
- **Statistics**: All aggregate queries — cache with short TTL recommended
- **Indexing**: B-tree on `slug`, GIN on `search_vector` (TSVECTOR), GIN on `extra_metadata` (JSONB)

---

## Testing Strategy

Unit tests should cover:

1. Repository methods (find_by_slug, find_by_domain, find_unlocks, etc.)
2. Service methods (shortest_path, longest_path, topological_order)
3. API endpoints (all 15+ endpoints)
4. Edge cases: empty graph, single node, cycles (rejected), self-loops
5. Unlocks derivation (must match inverse of prerequisites)

---

## Extension Points

- **Pgvector integration**: The search endpoint is designed to be
  extended with pgvector for hybrid (full-text + vector) search
- **Additional strategies**: The learning journey generator accepts
  a `strategy` parameter — add new strategies without changing the API
- **Caching**: StatisticsService methods are ideal candidates for
  in-memory caching with Redis or a materialized view
