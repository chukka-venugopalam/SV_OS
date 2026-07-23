"""Knowledge Import Service — Stage 5.1 reference dataset import.

Ports the validation and graph-building logic from ``import_engine.py``
(reference implementation) into the real FastAPI service/repository layer.

Key design rules carried over from the reference:
1. ``unlocks`` is **computed from prerequisites**, never accepted as input.
2. Cycle detection (Kahn's algorithm) runs before any write commits.
3. Validation happens in two passes (schema → referential integrity) before
   any database writes begin — all-or-nothing import.
4. Upsert by node/project/career ID (slug) — safe to re-run, no duplicates.

Usage::

    service = KnowledgeImportService(uow)
    report = await service.run_import(data)
    if not report.success:
        # handle errors
        ...

Or as a CLI command::

    python -m app.services.knowledge_import path/to/data.json
"""

from __future__ import annotations

import json
import sys
from collections import defaultdict, deque
from typing import TYPE_CHECKING, Any

from structlog.stdlib import get_logger

from app.schemas.knowledge.import_map import (
    ImportLearningGoal,
    ImportMap,
    ImportNode,
    ImportNodeResult,
    ImportProject,
    ImportReport,
)

if TYPE_CHECKING:
    from uuid import UUID

    from app.repositories import UnitOfWork

logger = get_logger(__name__)

# ── Constants ────────────────────────────────────────────────────────

# Fields required on every node in the import payload.
# 'unlocks' is intentionally excluded — it is a computed/derived field.
REQUIRED_INPUT_FIELDS = {
    'id',
    'title',
    'summary',
    'domain',
    'difficulty',
    'estimated_time',
    'prerequisites',
    'skills',
    'projects',
    'careers',
    'resources',
    'simulators',
    'learning_outcomes',
}

# Map 1-5 integer difficulty to the string enum values the DB expects.
DIFFICULTY_MAP = {
    1: 'beginner',
    2: 'intermediate',
    3: 'advanced',
    4: 'expert',
    5: 'expert',
}

# ── Service ──────────────────────────────────────────────────────────


class ImportValidationError(Exception):
    """Raised when validation fails and import cannot proceed."""

    pass


class KnowledgeImportService:
    """Business logic for importing the Stage 5.1 reference dataset.

    Ports the complete validation + graph-building pipeline from the
    reference ``import_engine.py`` into the real service layer, using
    the existing ``KnowledgeNodeRepository``, ``KnowledgeEdgeRepository``,
    ``CareerRepository``, ``ProjectRepository``, and
    ``LearningResourceRepository`` for persistence.
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._report = ImportReport(success=True)

    # ── Public Entry Point ───────────────────────────────────────────

    async def run_import(self, data: dict[str, Any]) -> ImportReport:
        """Full import pipeline: validate → build graph → persist.

        Steps:
        1. Parse the raw dict into validated Pydantic models.
        2. ``validate_schema`` — required-fields + type checks.
        3. ``validate_referential_integrity`` — all cross-references resolve.
        4. ``build_graph`` — compute adjacency, topology, detect cycles.
        5. ``_persist_*`` — upsert nodes, edges, projects, careers, resources.

        Returns:
            An ``ImportReport`` with full stats, errors, and warnings.
            ``report.success`` is ``True`` only if everything committed clean.
        """
        # Step 1: Parse
        try:
            import_map = ImportMap(**data)
        except Exception as exc:
            self._report.errors.append(f'Failed to parse import data: {exc}')
            self._report.success = False
            return self._report

        nodes = import_map.nodes
        projects = import_map.projects
        goals = import_map.learning_goals

        # Check for 'unlocks' in raw data and warn (ported from import_engine.py)
        self._check_unlocks_in_source(data)

        # Step 2: Schema validation (ported from import_engine.py)
        self.validate_schema(nodes)
        if not self._report.success:
            return self._report

        # Step 3: Referential integrity (ported from import_engine.py)
        self.validate_referential_integrity(nodes, projects, goals)
        if not self._report.success:
            return self._report

        # Step 4: Domain breakdown + graph building
        self.compute_domain_breakdown(nodes)
        graph = self.build_graph(nodes)
        if graph is None:
            self._report.success = False
            return self._report

        # Step 5: Compute longest prerequisite chain
        self._compute_longest_chain(graph)

        # Step 6: Persist everything
        # NOTE: The caller (FastAPI ``get_uow`` dependency) owns the UoW lifecycle.
        # We use ``self._uow`` directly without nesting another context manager,
        # avoiding a double-commit when the caller's ``__aexit__`` commits.
        try:
            uow = self._uow
            node_results, edges_created = await self._persist_nodes(uow, graph['nodes'])
            projects_created = await self._persist_projects(uow, projects)
            goals_created = await self._persist_learning_goals(uow, goals)
            resources_created = await self._persist_resources(uow, nodes)

            self._report.total_nodes = len(node_results)
            self._report.total_edges = edges_created
            self._report.total_projects = projects_created
            self._report.total_goals = goals_created
            self._report.total_resources = resources_created
            self._report.node_results = node_results
            self._report.topological_order = graph['topological_order']
            self._report.topological_order_length = len(graph['topological_order'])
            self._report.success = True

            logger.info(
                'import_completed',
                total_nodes=self._report.total_nodes,
                total_edges=self._report.total_edges,
                total_projects=self._report.total_projects,
                total_goals=self._report.total_goals,
                total_resources=self._report.total_resources,
                errors=len(self._report.errors),
                warnings=len(self._report.warnings),
            )
        except Exception as exc:
            self._report.errors.append(f'Import failed during persistence: {exc}')
            self._report.success = False

        return self._report

    # ── Additional input checks (ported from import_engine.py) ─

    def _check_unlocks_in_source(self, data: dict) -> None:
        """Check for 'unlocks' in raw source data and warn if present.

        Ported from ``import_engine.validate_schema``: if source data
        includes a non-empty 'unlocks' field, it will be silently dropped
        by Pydantic but we warn the user to stop sending this field.
        """
        raw_nodes = data.get('nodes', [])
        for i, raw_node in enumerate(raw_nodes):
            node_id = raw_node.get('id', f'index_{i}')
            unlocks = raw_node.get('unlocks')
            if unlocks is not None and len(unlocks) > 0:
                self._report.warnings.append(
                    f"Node '{node_id}' has a non-empty 'unlocks' in source data — "
                    f'this will be IGNORED and recomputed from prerequisites. '
                    f'Fix the source data to stop sending this field.',
                )

    def validate_schema(self, nodes: list[ImportNode]) -> None:
        """Structural validation: every node has required fields, correct types.

        Ported from ``import_engine.validate_schema``.
        """
        seen_ids: set[str] = set()

        for i, n in enumerate(nodes):
            n_dict = n.model_dump()
            missing = REQUIRED_INPUT_FIELDS - set(n_dict.keys())
            if missing:
                self._report.errors.append(
                    f'Node at index {i} (id={n.id or "?"}) missing fields: {missing}',
                )
                continue

            # Duplicate ID detection
            if n.id in seen_ids:
                self._report.errors.append(f"Duplicate node id: '{n.id}'")
            seen_ids.add(n.id)

            # Type checks
            if not isinstance(n.difficulty, int) or not (1 <= n.difficulty <= 5):
                self._report.errors.append(
                    f"Node '{n.id}': difficulty must be an int 1-5, got {n.difficulty!r}",
                )
            if not isinstance(n.estimated_time, (int, float)) or n.estimated_time <= 0:
                self._report.errors.append(
                    f"Node '{n.id}': estimated_time must be a positive number",
                )
            for list_field in (
                'prerequisites',
                'skills',
                'projects',
                'careers',
                'resources',
                'simulators',
                'learning_outcomes',
            ):
                value = getattr(n, list_field)
                if not isinstance(value, list):
                    self._report.errors.append(
                        f"Node '{n.id}': '{list_field}' must be a list",
                    )

        self._report.total_nodes = len(seen_ids)

    # ── Step 2: Referential Integrity ────────────────────────────────

    def validate_referential_integrity(
        self,
        nodes: list[ImportNode],
        projects: list[ImportProject],
        goals: list[ImportLearningGoal],
    ) -> None:
        """Every prerequisite / project link / learning_goal reference must resolve.

        Ported from ``import_engine.validate_referential_integrity``.
        """
        node_ids = {n.id for n in nodes}
        project_ids = {p.id for p in projects}
        goal_ids = {g.id for g in goals}

        for n in nodes:
            for prereq in n.prerequisites:
                if prereq not in node_ids:
                    self._report.errors.append(
                        f"Node '{n.id}' has unresolved prerequisite '{prereq}'",
                    )
            for proj in n.projects:
                if proj not in project_ids:
                    self._report.errors.append(
                        f"Node '{n.id}' references unknown project '{proj}'",
                    )

        for p in projects:
            for nid in p.linked_nodes:
                if nid not in node_ids:
                    self._report.errors.append(
                        f"Project '{p.id}' links to unknown node '{nid}'",
                    )

        for g in goals:
            for nid in g.recommended_order:
                if nid not in node_ids:
                    self._report.errors.append(
                        f"Learning goal '{g.id}' references unknown node '{nid}'",
                    )

        # Cross-field consistency: if a node claims a career/goal tag,
        # does that goal exist at the top level?
        for n in nodes:
            for c in n.careers:
                if c not in goal_ids:
                    self._report.warnings.append(
                        f"Node '{n.id}' tags career/goal '{c}' which has no matching "
                        f"entry in top-level 'learning_goals' — likely a typo",
                    )

    # ── Step 3: Domain Breakdown ─────────────────────────────────────

    def compute_domain_breakdown(self, nodes: list[ImportNode]) -> None:
        """Count nodes per domain."""
        counts: dict[str, int] = defaultdict(int)
        domains_seen: set[str] = set()
        for n in nodes:
            counts[n.domain] += 1
            domains_seen.add(n.domain)
        self._report.domains = sorted(domains_seen)
        self._report.domain_breakdown = dict(sorted(counts.items()))

    # ── Step 4: Graph Building ───────────────────────────────────────

    def build_graph(
        self,
        nodes: list[ImportNode],
    ) -> dict[str, Any] | None:
        """Build the derived graph structure from validated nodes.

        Ported from ``import_engine.build_graph``.

        1. Adjacency list (prerequisite → dependents).
        2. Recomputed ``unlocks`` (never trusted from source data).
        3. Cycle detection via Kahn's algorithm.
        4. Topological order for valid learning sequence.

        Returns:
            The graph dict with ``nodes``, ``adjacency``, and
            ``topological_order`` keys, or ``None`` if a cycle was found.
        """
        nodes_dict: dict[str, ImportNode] = {n.id: n for n in nodes}
        adjacency: dict[str, list[str]] = defaultdict(list)
        in_degree: dict[str, int] = {nid: 0 for nid in nodes_dict}

        for n in nodes:
            for prereq in n.prerequisites:
                adjacency[prereq].append(n.id)
                in_degree[n.id] += 1

        # Kahn's algorithm: topological sort + cycle detection
        queue = deque([nid for nid, deg in in_degree.items() if deg == 0])
        topo_order: list[str] = []
        remaining_in_degree = dict(in_degree)

        while queue:
            current = queue.popleft()
            topo_order.append(current)
            for dependent in adjacency[current]:
                remaining_in_degree[dependent] -= 1
                if remaining_in_degree[dependent] == 0:
                    queue.append(dependent)

        if len(topo_order) != len(nodes_dict):
            cyclic_nodes = [nid for nid, deg in remaining_in_degree.items() if deg > 0]
            self._report.errors.append(
                f'Cycle detected in prerequisite graph — involves nodes: {cyclic_nodes}',
            )
            return None

        # Compute root and leaf nodes
        root_nodes = [n.id for n in nodes if not n.prerequisites]
        leaf_nodes = [
            nid for nid, n in nodes_dict.items() if nid not in adjacency or not adjacency[nid]
        ]

        self._report.topological_order = topo_order
        self._report.topological_order_length = len(topo_order)
        self._report.root_nodes = root_nodes
        self._report.leaf_nodes = leaf_nodes

        return {
            'nodes': nodes_dict,
            'adjacency': dict(adjacency),
            'topological_order': topo_order,
        }

    # ── Step 5: Longest Prerequisite Chain ───────────────────────────

    def _compute_longest_chain(self, graph: dict[str, Any]) -> None:
        """Compute the deepest/longest dependency chain in the graph.

        Ported from ``import_engine.longest_prerequisite_chain``.
        """
        nodes = graph['nodes']
        depth: dict[str, int] = {}

        def compute_depth(nid: str) -> int:
            if nid in depth:
                return depth[nid]
            n = nodes[nid]
            if not n.prerequisites:
                depth[nid] = 0
            else:
                depth[nid] = 1 + max(compute_depth(p) for p in n.prerequisites)
            return depth[nid]

        for nid in nodes:
            compute_depth(nid)

        deepest_id = max(depth, key=depth.get) if depth else None  # type: ignore[arg-type]
        if deepest_id is not None:
            self._report.deepest_node = f'{deepest_id} (depth {depth[deepest_id]})'

    # ── Step 6: Persistence ──────────────────────────────────────────

    async def _persist_nodes(
        self,
        uow: UnitOfWork,
        nodes: dict[str, ImportNode],
    ) -> tuple[list[ImportNodeResult], int]:
        """Upsert nodes and their prerequisite edges.

        For each node:
        1. Look up by slug — if exists, update; otherwise create.
        2. Create ``KnowledgeEdge`` records for each prerequisite.
           Direction: prerequisite → node (source=prereq, target=node).

        Returns:
            Tuple of (node_results list, total_edges_created count).
        """
        results: list[ImportNodeResult] = []
        edges_created = 0

        # First pass: upsert all nodes, collect slug→ID mappings
        slug_to_id: dict[str, UUID] = {}

        for _, n in nodes.items():
            difficulty_str = DIFFICULTY_MAP.get(n.difficulty, 'beginner')
            estimated_minutes = (
                int(n.estimated_time * 60) if n.estimated_time < 100 else int(n.estimated_time)
            )

            metadata = {
                'domain': n.domain,
                'skills': n.skills,
                'learning_outcomes': n.learning_outcomes,
                'simulators': n.simulators,
                'import_version': '5.1',
            }

            # Check if node already exists by slug
            existing = await uow.knowledge_nodes.find_by_slug(n.id)
            if existing:
                # Update
                updated = await uow.knowledge_nodes.update(
                    existing.id,
                    title=n.title,
                    description=n.summary,
                    difficulty=difficulty_str,
                    estimated_minutes=estimated_minutes,
                    extra_metadata=metadata,
                    is_published=True,
                )
                slug_to_id[n.id] = updated.id
                results.append(
                    ImportNodeResult(
                        id=n.id,
                        title=n.title,
                        domain=n.domain,
                        difficulty=n.difficulty,
                        prerequisites=list(n.prerequisites),
                        unlocks=[],  # Will be filled below
                        action='updated',
                    ),
                )
            else:
                # Create
                created = await uow.knowledge_nodes.create(
                    slug=n.id,
                    title=n.title,
                    description=n.summary,
                    content=None,
                    node_type='concept',
                    difficulty=difficulty_str,
                    estimated_minutes=estimated_minutes,
                    extra_metadata=metadata,
                    is_published=True,
                )
                slug_to_id[n.id] = created.id
                results.append(
                    ImportNodeResult(
                        id=n.id,
                        title=n.title,
                        domain=n.domain,
                        difficulty=n.difficulty,
                        prerequisites=list(n.prerequisites),
                        unlocks=[],
                        action='created',
                    ),
                )

        # Second pass: create prerequisite edges
        for current_nid, current_node in nodes.items():
            target_id = slug_to_id.get(current_nid)
            if not target_id:
                continue

            for prereq_id in current_node.prerequisites:
                source_id = slug_to_id.get(prereq_id)
                if not source_id:
                    self._report.warnings.append(
                        f"Node '{current_nid}': prerequisite '{prereq_id}' has no DB ID (skipped)",
                    )
                    continue

                # Check if edge already exists (safe upsert — no IntegrityError)
                edge_exists = await uow.knowledge_edges.exists_edge(
                    source_node_id=source_id,
                    target_node_id=target_id,
                    relationship_type='prerequisite',
                )
                if not edge_exists:
                    await uow.knowledge_edges.create(
                        source_node_id=source_id,
                        target_node_id=target_id,
                        relationship_type='prerequisite',
                        direction='forward',
                        description=f'{current_nid} requires {prereq_id}',
                        weight=1.0,
                    )
                    edges_created += 1

            # Update result with computed unlocks
            # Unlocks for this node = nodes that list this node as a prerequisite
            for r in results:
                if r.id == current_nid:
                    # Compute what this node unlocks by finding nodes that
                    # have this node as a prerequisite
                    dependent_nodes = [
                        other_id
                        for other_id, other_n in nodes.items()
                        if current_nid in other_n.prerequisites
                    ]
                    r.unlocks = sorted(dependent_nodes)
                    break

        return results, edges_created

    async def _persist_projects(
        self,
        uow: UnitOfWork,
        projects: list[ImportProject],
    ) -> int:
        """Upsert projects and their node requirement links.

        Checks for existing requirements before inserting to avoid
        IntegrityError (which would rollback the entire transaction).
        """
        created_count = 0

        for p in projects:
            difficulty_str = DIFFICULTY_MAP.get(p.difficulty, 'intermediate')
            estimated_hours = (
                int(p.estimated_time) if p.estimated_time <= 100 else int(p.estimated_time / 60)
            )

            existing = await uow.projects.find_by_slug(p.id)
            if existing:
                await uow.projects.update(
                    existing.id,
                    title=p.title,
                    difficulty=difficulty_str,
                    estimated_hours=estimated_hours,
                    extra_metadata={
                        'portfolio_value': p.portfolio_value,
                        'import_version': '5.1',
                    },
                    is_published=True,
                )
                project_id = existing.id
            else:
                created = await uow.projects.create(
                    slug=p.id,
                    title=p.title,
                    description=p.title,
                    difficulty=difficulty_str,
                    estimated_hours=estimated_hours,
                    extra_metadata={
                        'portfolio_value': p.portfolio_value,
                        'import_version': '5.1',
                    },
                    is_published=True,
                )
                project_id = created.id

            # Upsert project requirement links (check first to avoid IntegrityError)
            for order, nid in enumerate(p.linked_nodes):
                node_id = await self._resolve_node_id(uow, nid)
                if node_id is None:
                    self._report.warnings.append(
                        f"Project '{p.id}': linked node '{nid}' not found in DB",
                    )
                    continue

                # Check if requirement already exists before inserting
                existing_reqs = await uow.projects.get_requirements(project_id)
                already_linked = any(
                    r.node_id == node_id and r.requirement_type == 'required' for r in existing_reqs
                )
                if not already_linked:
                    await uow.projects.add_requirement(
                        project_id=project_id,
                        node_id=node_id,
                        requirement_type='required',
                        order_index=order,
                    )

            created_count += 1

        return created_count

    async def _persist_learning_goals(
        self,
        uow: UnitOfWork,
        goals: list[ImportLearningGoal],
    ) -> int:
        """Upsert learning goals and their node requirement links.

        Checks for existing requirements before inserting to avoid
        IntegrityError (which would rollback the entire transaction).
        """
        created_count = 0

        for g in goals:
            existing = await uow.careers.find_by_slug(g.id)
            if existing:
                await uow.careers.update(
                    existing.id,
                    title=g.title,
                    description=g.title,
                    extra_metadata={
                        'recommended_order': g.recommended_order,
                        'import_version': '5.1',
                        'is_learning_goal': True,
                    },
                    is_published=True,
                )
                career_id = existing.id
            else:
                created = await uow.careers.create(
                    slug=g.id,
                    title=g.title,
                    description=g.title,
                    extra_metadata={
                        'recommended_order': g.recommended_order,
                        'import_version': '5.1',
                        'is_learning_goal': True,
                    },
                    is_published=True,
                )
                career_id = created.id

            # Upsert career requirement links (check first to avoid IntegrityError)
            for order, nid in enumerate(g.recommended_order):
                node_id = await self._resolve_node_id(uow, nid)
                if node_id is None:
                    self._report.warnings.append(
                        f"Learning goal '{g.id}': node '{nid}' not found in DB",
                    )
                    continue

                # Check if requirement already exists before inserting
                existing_reqs = await uow.careers.get_requirements(career_id)
                already_linked = any(
                    r.node_id == node_id and r.requirement_type == 'required' for r in existing_reqs
                )
                if not already_linked:
                    await uow.careers.add_requirement(
                        career_id=career_id,
                        node_id=node_id,
                        requirement_type='required',
                        order_index=order,
                    )

            created_count += 1

        return created_count

    async def _persist_resources(
        self,
        uow: UnitOfWork,
        resource_nodes: list[ImportNode],
    ) -> int:
        """Upsert learning resources linked to each node."""
        created_count = 0

        for n in resource_nodes:
            node_id = await self._resolve_node_id(uow, n.id)
            if node_id is None:
                continue

            for resource_text in n.resources:
                if not resource_text.strip():
                    continue

                # Auto-detect resource type
                resource_type = self._detect_resource_type(resource_text)
                # Use the resource text as both title and a placeholder URL
                slug_safe = n.id.replace('_', '-')
                resource_url = f'https://sv-os.com/resources/{slug_safe}/{created_count}'

                existing_resources = await uow.learning_resources.find_by_node(
                    node_id=node_id,
                    per_page=100,
                )
                already_exists = any(r.title == resource_text for r in existing_resources.items)
                if not already_exists:
                    await uow.learning_resources.create(
                        node_id=node_id,
                        title=resource_text,
                        url=resource_url,
                        resource_type=resource_type,
                        is_free=True,
                    )
                    created_count += 1

        return created_count

    # ── Helpers ──────────────────────────────────────────────────────

    async def _resolve_node_id(
        self,
        uow: UnitOfWork,
        slug: str,
    ) -> UUID | None:
        """Resolve a node slug to its UUID in the database."""
        existing = await uow.knowledge_nodes.find_by_slug(slug)
        if existing:
            return existing.id
        return None

    @staticmethod
    def _detect_resource_type(text: str) -> str:
        """Heuristic resource type detection from description text."""
        lower = text.lower()
        # Doc/syllabus keywords map to article
        doc_keywords = {'guide', 'paper', 'notes'}
        if any(k in lower for k in doc_keywords):
            return 'article'
        # Tutorial maps to video (most online CS tutorials are video-based)
        if 'tutorial' in lower:
            return 'video'
        # Exact keyword matches
        if 'book' in lower or 'textbook' in lower:
            return 'book'
        if 'course' in lower or 'class' in lower:
            return 'course'
        if 'documentation' in lower or 'docs' in lower or 'reference' in lower:
            return 'documentation'
        if 'video' in lower or 'lecture' in lower or 'talk' in lower:
            return 'video'
        return 'article'

    def print_report(self) -> None:
        """Print a human-readable import report (like import_engine.py)."""
        sep = '=' * 70
        print(sep)
        print('IMPORT REPORT')
        print(sep)
        print(f'  Total nodes: {self._report.total_nodes}')
        print(f'  Total edges: {self._report.total_edges}')
        print(f'  Total projects: {self._report.total_projects}')
        print(f'  Total learning goals: {self._report.total_goals}')
        print(f'  Total resources: {self._report.total_resources}')
        print(f'  Domains: {len(self._report.domains)}')
        for domain, count in self._report.domain_breakdown.items():
            print(f"    domain '{domain}': {count} nodes")
        print(f'  Root nodes (no prereqs): {len(self._report.root_nodes)}')
        print(f'  Leaf nodes (nothing unlocks): {len(self._report.leaf_nodes)}')
        print(f'  Deepest node: {self._report.deepest_node}')
        print(f'  Topological order length: {self._report.topological_order_length}')
        print(f'\nErrors: {len(self._report.errors)}')
        for e in self._report.errors:
            print(f'  [ERROR] {e}')
        print(f'\nWarnings: {len(self._report.warnings)}')
        for w in self._report.warnings:
            print(f'  [WARN] {w}')
        result_text = 'PASS - import successful' if self._report.success else 'FAIL - do not import'
        print(f'\nRESULT: {result_text}')
        print(sep)

        if self._report.topological_order:
            print('\nFirst 15 nodes in valid learning-sequence (topological) order:')
            for nid in self._report.topological_order[:15]:
                print(f'  - {nid}')

    @property
    def report(self) -> ImportReport:
        """Return the current import report."""
        return self._report


# ── CLI Entry Point ──────────────────────────────────────────────────


async def _run_cli_import(path: str) -> None:
    """Run the import from a JSON file via the CLI.

    Creates a temporary database session and UnitOfWork to perform
    the import, then prints the report.

    Usage::

        python -m app.services.knowledge_import path/to/data.json
    """

    from app.core.database import async_session_factory

    # Load the JSON file
    with open(path, encoding='utf-8') as f:
        data = json.load(f)

    print(
        f'Loaded {path}: {len(data.get("nodes", []))} nodes, '
        f'{len(data.get("projects", []))} projects, '
        f'{len(data.get("learning_goals", []))} learning goals'
    )
    print()

    # Run the import
    async with async_session_factory() as session:
        from app.repositories import UnitOfWork

        async with UnitOfWork(session) as uow:
            service = KnowledgeImportService(uow)
            report = await service.run_import(data)
            service.print_report()

            if not report.success:
                sys.exit(1)


if __name__ == '__main__':
    import asyncio

    path = sys.argv[1] if len(sys.argv) > 1 else 'computer_science_map.json'
    asyncio.run(_run_cli_import(path))
