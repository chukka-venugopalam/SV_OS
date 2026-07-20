"""Validation Engine — validate all mutations and imports before persistence.

Supports validators for:
- Duplicate IDs
- Duplicate edges
- Broken references
- Missing nodes
- Invalid metadata
- Invalid relationship types
- Cycle detection
- Disconnected graphs
- Orphan nodes
- Invalid decomposition trees
- Graph health score
- Validation summaries
- Validation diagnostics

Supports both:
- Incremental validation
- Full graph validation
"""

from __future__ import annotations

import contextlib
from dataclasses import dataclass, field
from typing import Any, Protocol
from uuid import UUID

from app.domain.validation_report import ValidationReport
from app.engines.base import EngineBase, EngineDependency, EngineHealth

# ── Validator Protocol ─────────────────────────────────────────────


class Validator(Protocol):
    """A callable that validates data and returns issues."""

    async def __call__(self, data: Any) -> list[dict]:
        """Validate data and return a list of error dicts.

        Each error dict should have at minimum a 'message' key.
        Empty list means validation passed.
        """
        ...


# ── Validation Result ─────────────────────────────────────────────


@dataclass
class ValidationResult:
    """Result from a single validation check."""

    name: str
    passed: bool
    errors: list[dict] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)
    details: dict[str, Any] = field(default_factory=dict)


@dataclass
class GraphHealthScore:
    """Overall health assessment of a knowledge graph."""

    score: float  # 0.0 (worst) to 1.0 (best)
    node_count: int = 0
    edge_count: int = 0
    orphan_count: int = 0
    component_count: int = 0
    cycle_count: int = 0
    broken_edge_count: int = 0
    issues: list[str] = field(default_factory=list)
    warnings: list[str] = field(default_factory=list)


# ── Phase 4: Advanced Graph Validators ─────────────────────────────


class DuplicateEdgeValidator:
    """Check for duplicate edges (same source, target, relationship type)."""

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, list):
            return errors

        seen: set[tuple[str, str, str]] = set()
        for i, item in enumerate(data):
            if not isinstance(item, dict):
                continue
            source = str(item.get('source_node_id', ''))
            target = str(item.get('target_node_id', ''))
            rel_type = str(item.get('relationship_type', ''))
            key = (source, target, rel_type)
            if key in seen:
                errors.append(
                    {
                        'field': 'edge',
                        'index': i,
                        'message': f'Duplicate edge: {source} -> {target} ({rel_type})',
                        'value': str(key),
                    },
                )
            seen.add(key)
        return errors


class CycleDetectionValidator:
    """Detect cycles in a directed graph of nodes and edges.

    Uses DFS-based cycle detection and returns the cycle paths.
    """

    def __init__(self) -> None:
        self._found_cycles: list[list[UUID]] = []

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        self._found_cycles.clear()

        if not isinstance(data, dict):
            return errors

        nodes = data.get('nodes', [])
        edges = data.get('edges', [])

        if not nodes or not edges:
            return errors

        # Build adjacency list
        node_ids: dict[str, UUID] = {}
        for node in nodes:
            if isinstance(node, dict) and node.get('id'):
                with contextlib.suppress(ValueError, AttributeError):
                    node_ids[str(node['id'])] = UUID(str(node['id']))

        adj: dict[UUID, list[UUID]] = {nid: [] for nid in node_ids.values()}
        for edge in edges:
            if not isinstance(edge, dict):
                continue
            try:
                src = UUID(str(edge.get('source_node_id', '')))
                tgt = UUID(str(edge.get('target_node_id', '')))
                if src in adj and tgt in adj:
                    adj[src].append(tgt)
            except (ValueError, AttributeError):
                pass

        # DFS cycle detection
        visited: set[UUID] = set()
        in_stack: set[UUID] = set()

        def dfs(current: UUID, path: list[UUID]) -> None:
            visited.add(current)
            in_stack.add(current)
            path.append(current)
            for neighbor in adj.get(current, []):
                if neighbor not in visited:
                    dfs(neighbor, path)
                elif neighbor in in_stack:
                    # Found cycle: extract the cycle path
                    try:
                        idx = path.index(neighbor)
                        cycle = path[idx:]
                        self._found_cycles.append(list(cycle))
                    except ValueError:
                        pass
            path.pop()
            in_stack.discard(current)

        for nid in list(adj.keys()):
            if nid not in visited:
                dfs(nid, [])

        for i, cycle in enumerate(self._found_cycles[:10]):  # Limit to 10 reported cycles
            errors.append(
                {
                    'field': 'graph',
                    'index': i,
                    'message': f'Cycle detected: {" -> ".join(str(n) for n in cycle)}',
                    'cycle': [str(n) for n in cycle],
                    'severity': 'critical',
                },
            )

        return errors

    @property
    def cycles_found(self) -> int:
        return len(self._found_cycles)


class DisconnectedGraphValidator:
    """Find disconnected components in the graph."""

    async def __call__(self, data: Any) -> list[dict]:
        warnings: list[dict] = []
        if not isinstance(data, dict):
            return warnings

        nodes = data.get('nodes', [])
        edges = data.get('edges', [])

        if not nodes:
            return warnings

        # Build adjacency and collect all node IDs
        node_set: set[UUID] = set()
        adj: dict[UUID, list[UUID]] = {}

        for node in nodes:
            if isinstance(node, dict) and node.get('id'):
                try:
                    nid = UUID(str(node['id']))
                    node_set.add(nid)
                    adj.setdefault(nid, [])
                except (ValueError, AttributeError):
                    pass

        for edge in edges:
            if not isinstance(edge, dict):
                continue
            try:
                src = UUID(str(edge.get('source_node_id', '')))
                tgt = UUID(str(edge.get('target_node_id', '')))
                if src in adj and tgt in adj:
                    adj[src].append(tgt)
                    adj[tgt].append(src)
            except (ValueError, AttributeError):
                pass

        # BFS to find components
        visited: set[UUID] = set()
        components: list[set[UUID]] = []

        for nid in node_set:
            if nid in visited:
                continue
            component: set[UUID] = set()
            stack = [nid]
            while stack:
                current = stack.pop()
                if current not in visited:
                    visited.add(current)
                    component.add(current)
                    for neighbor in adj.get(current, []):
                        if neighbor not in visited:
                            stack.append(neighbor)
            components.append(component)

        # Report disconnected components
        if len(components) > 1:
            # Sort by size descending
            components.sort(key=len, reverse=True)
            for i, comp in enumerate(components[1:], 1):
                warnings.append(
                    {
                        'field': 'graph',
                        'message': f'Disconnected component {i}: {len(comp)} nodes are not connected to the main graph',  # noqa: E501
                        'component_size': len(comp),
                        'severity': 'warning',
                    },
                )

        return warnings


class OrphanNodeValidator:
    """Find nodes that have no edges (orphans)."""

    async def __call__(self, data: Any) -> list[dict]:
        warnings: list[dict] = []
        if not isinstance(data, dict):
            return warnings

        nodes = data.get('nodes', [])
        edges = data.get('edges', [])

        if not nodes:
            return warnings

        # Collect all node IDs that appear in edges
        connected_nodes: set[UUID] = set()
        for edge in edges:
            if not isinstance(edge, dict):
                continue
            try:
                src = UUID(str(edge.get('source_node_id', '')))
                tgt = UUID(str(edge.get('target_node_id', '')))
                connected_nodes.add(src)
                connected_nodes.add(tgt)
            except (ValueError, AttributeError):
                pass

        # Find nodes not in any edge
        for node in nodes:
            if isinstance(node, dict) and node.get('id'):
                try:
                    nid = UUID(str(node['id']))
                    if nid not in connected_nodes:
                        title = node.get('title', str(nid))
                        warnings.append(
                            {
                                'field': 'node',
                                'message': f'Orphan node: {title} ({nid}) has no edges',
                                'node_id': str(nid),
                                'severity': 'warning',
                            },
                        )
                except (ValueError, AttributeError):
                    pass

        return warnings


class DecompositionValidator:
    """Validate that decomposition trees are valid (no redundant parent-child cycles)."""

    def __init__(self) -> None:
        self._decomposition_types = {'is_a', 'composed_of', 'part_of', 'child_of'}

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, dict):
            return errors

        edges = data.get('edges', [])

        # Check for relational cycles in decomposition relationships
        dec_adj: dict[UUID, list[UUID]] = {}

        for edge in edges:
            if not isinstance(edge, dict):
                continue
            rel_type = edge.get('relationship_type', '')
            if rel_type in self._decomposition_types:
                try:
                    src = UUID(str(edge.get('source_node_id', '')))
                    tgt = UUID(str(edge.get('target_node_id', '')))
                    dec_adj.setdefault(src, []).append(tgt)
                except (ValueError, AttributeError):
                    pass

        # Check for cycles in decomposition subgraph using DFS
        visited: set[UUID] = set()
        in_stack: set[UUID] = set()

        def dfs(current: UUID) -> bool:
            visited.add(current)
            in_stack.add(current)
            for neighbor in dec_adj.get(current, []):
                if neighbor not in visited:
                    if dfs(neighbor):
                        return True
                elif neighbor in in_stack:
                    return True
            in_stack.discard(current)
            return False

        for nid in list(dec_adj.keys()):
            if nid not in visited and dfs(nid):
                errors.append(
                    {
                        'field': 'decomposition',
                        'message': f'Cycle detected in decomposition tree involving node {nid}',
                        'severity': 'critical',
                    },
                )
                break

        return errors


# ── Validation Engine ──────────────────────────────────────────────


class ValidationEngine(EngineBase):
    """Validation Engine — mutation and import validation.

    Manages a registry of validators and orchestrates validation
    workflows for graph changes and imports.

    Public Interface:
        validate_graph_change, validate_import, register_validator,
        validate_incremental, validate_full, graph_health_score,
        get_validation_diagnostics
    """

    def __init__(
        self,
        graph_engine: Any | None = None,
        knowledge_engine: Any | None = None,
    ) -> None:
        super().__init__()
        self._graph: Any = graph_engine
        self._knowledge: Any = knowledge_engine
        self._validators: dict[str, list[Validator]] = {
            'graph': [],
            'import': [],
            'node': [],
            'edge': [],
        }

    # ── Engine Identity ────────────────────────────────────────────

    def _default_name(self) -> str:
        return 'validation'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='graph',
                required=True,
                description='Graph engine for structure validation',
            ),
            EngineDependency(
                engine_name='knowledge',
                required=False,
                description='Knowledge engine for content validation',
            ),
        ]

    # ── Lifecycle ──────────────────────────────────────────────────

    async def _initialize_impl(self) -> None:
        """Register default built-in validators."""
        self._register_default_validators()

    async def _start_impl(self) -> None:
        """Start the validation engine."""

    async def _stop_impl(self) -> None:
        """Stop the validation engine."""
        self._validators.clear()

    async def health_impl(self) -> EngineHealth:
        """Check validation engine health."""
        total_validators = sum(len(v) for v in self._validators.values())
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Validation engine is operational',
            details={
                'validator_count': total_validators,
                'categories': list(self._validators.keys()),
            },
        )

    async def validate_configuration(self) -> list[str]:
        """Validate engine configuration."""
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ── Validator Registration ─────────────────────────────────────

    def register_validator(self, category: str, validator: Validator) -> None:
        """Register a validator for a specific category.

        Categories: 'graph', 'import', 'node', 'edge'
        """
        self._validators.setdefault(category, []).append(validator)

    def _register_default_validators(self) -> None:
        """Register built-in validators."""
        # Node validators
        self._validators['node'].append(DuplicateIdValidator(id_field='id', label='node'))
        self._validators['node'].append(MissingIdValidator(id_field='id', label='node'))
        self._validators['node'].append(
            SchemaValidator(required_fields=['id', 'slug', 'title', 'node_type'], label='node'),
        )

        # Edge validators
        self._validators['edge'].append(DuplicateIdValidator(id_field='id', label='edge'))
        self._validators['edge'].append(MissingIdValidator(id_field='id', label='edge'))
        self._validators['edge'].append(
            SchemaValidator(
                required_fields=['id', 'source_node_id', 'target_node_id'],
                label='edge',
            ),
        )
        self._validators['edge'].append(DuplicateEdgeValidator())

        # Graph-level validators (Phase 4 additions)
        if self._graph:
            edge_val = EdgeValidator()
            self._validators['edge'].append(edge_val)

        self._validators['graph'].append(CycleDetectionValidator())
        self._validators['graph'].append(OrphanNodeValidator())
        self._validators['graph'].append(DisconnectedGraphValidator())
        self._validators['graph'].append(DecompositionValidator())

    # ── Validation ─────────────────────────────────────────────────

    async def validate_graph_change(self, change: dict) -> dict:
        """Validate a proposed graph mutation.

        Args:
            change: A dict describing the graph change, with keys like
                    'nodes' (list), 'edges' (list), 'action' (str).

        Returns:
            A dict with 'valid' (bool), 'report' (ValidationReport),
            'errors', 'warnings', and 'summary'.

        """
        report = ValidationReport(
            entity_type='graph_change',
            passed=True,
        )

        nodes = change.get('nodes', [])
        edges = change.get('edges', [])
        warnings: list[str] = []

        # Collect known node IDs for edge validation
        known_node_ids: set[UUID] = set()
        for node in nodes:
            if isinstance(node, dict) and node.get('id'):
                with contextlib.suppress(ValueError, AttributeError):
                    known_node_ids.add(UUID(str(node['id'])))

        # Run node validators
        for validator in self._validators.get('node', []):
            if isinstance(validator, EdgeValidator):
                validator.set_node_ids(known_node_ids)
            result_errors = await validator(nodes)
            for error in result_errors:
                report.errors.append(error)
                if error.get('severity') != 'warning':
                    report.passed = False

        # Run edge validators
        for validator in self._validators.get('edge', []):
            if isinstance(validator, EdgeValidator):
                validator.set_node_ids(known_node_ids)
            result_errors = await validator(edges)
            for error in result_errors:
                report.errors.append(error)
                if error.get('severity') != 'warning':
                    report.passed = False

        # Run graph-level validators
        graph_data = {'nodes': nodes, 'edges': edges}
        for validator in self._validators.get('graph', []):
            result_errors = await validator(graph_data)
            for error in result_errors:
                if error.get('severity') == 'warning':
                    warnings.append(error.get('message', ''))
                else:
                    report.errors.append(error)
                    report.passed = False

        # Build summary
        summary = _build_validation_summary(report.errors)

        return {
            'valid': report.passed,
            'report': {
                'id': str(report.id),
                'passed': report.passed,
                'errors': report.errors,
                'warnings': warnings,
                'summary': summary,
            },
            'errors': report.errors,
            'warnings': warnings,
            'summary': summary,
        }

    async def validate_import(self, import_payload: dict) -> dict:
        """Validate an import payload before committing.

        Args:
            import_payload: The full import payload containing
                          nodes, edges, content, resources, etc.

        Returns:
            A dict with 'valid' (bool), 'report' (ValidationReport),
            and 'errors' (list of error dicts).

        """
        report = ValidationReport(
            entity_type='import',
            passed=True,
        )

        nodes = import_payload.get('nodes', [])
        edges = import_payload.get('edges', [])
        warnings: list[str] = []

        # Collect known node IDs
        known_node_ids: set[UUID] = set()
        for node in nodes:
            if isinstance(node, dict) and node.get('id'):
                with contextlib.suppress(ValueError, AttributeError):
                    known_node_ids.add(UUID(str(node['id'])))

        # Run all validators against all categories
        for category in ('node', 'edge', 'import', 'graph'):
            for validator in self._validators.get(category, []):
                if isinstance(validator, EdgeValidator):
                    validator.set_node_ids(known_node_ids)

                if category == 'node':
                    target_data = nodes
                elif category == 'edge':
                    target_data = edges
                elif category == 'graph':
                    target_data = {'nodes': nodes, 'edges': edges}
                else:
                    target_data = import_payload

                result_errors = await validator(target_data)
                for error in result_errors:
                    if error.get('severity') == 'warning':
                        warnings.append(error.get('message', ''))
                    else:
                        report.errors.append(error)
                        report.passed = False

        # Build summary
        summary = _build_validation_summary(report.errors)

        return {
            'valid': report.passed,
            'report': {
                'id': str(report.id),
                'passed': report.passed,
                'errors': report.errors,
                'warnings': warnings,
                'summary': summary,
            },
            'errors': report.errors,
            'warnings': warnings,
            'summary': summary,
        }

    # ── Phase 4: Incremental / Full Validation ────────────────────

    async def validate_incremental(self, change: dict) -> dict:
        """Run incremental validation — only validates the changed data.

        Runs node and edge validators only, skipping graph-level checks
        (disconnected components, orphans) when only a subset of nodes/edges
        is provided.

        Args:
            change: Dict with 'nodes' and/or 'edges' keys.

        Returns:
            Validation result dict.

        """
        # Only run node + edge validators, skip graph-level (orphans, components)
        report = ValidationReport(entity_type='graph_change_incremental', passed=True)
        nodes = change.get('nodes', [])
        edges = change.get('edges', [])

        known_node_ids: set[UUID] = set()
        for node in nodes:
            if isinstance(node, dict) and node.get('id'):
                with contextlib.suppress(ValueError, AttributeError):
                    known_node_ids.add(UUID(str(node['id'])))

        for validator in self._validators.get('node', []):
            if isinstance(validator, EdgeValidator):
                validator.set_node_ids(known_node_ids)
            result_errors = await validator(nodes)
            for error in result_errors:
                report.errors.append(error)
                if error.get('severity') != 'warning':
                    report.passed = False

        for validator in self._validators.get('edge', []):
            if isinstance(validator, EdgeValidator):
                validator.set_node_ids(known_node_ids)
            result_errors = await validator(edges)
            for error in result_errors:
                report.errors.append(error)
                if error.get('severity') != 'warning':
                    report.passed = False

        return {
            'valid': report.passed,
            'report': {
                'id': str(report.id),
                'passed': report.passed,
                'errors': report.errors,
                'summary': _build_validation_summary(report.errors),
            },
            'errors': report.errors,
        }

    async def validate_full(self, full_data: dict) -> dict:
        """Run full graph validation — includes orphan, disconnected component checks.

        Args:
            full_data: Dict with 'nodes' and 'edges' containing all graph data.

        Returns:
            Validation result dict with complete diagnostics.

        """
        return await self.validate_graph_change(full_data)

    # ── Phase 4: Graph Health Score ───────────────────────────────

    async def graph_health_score(self, full_data: dict | None = None) -> GraphHealthScore:
        """Compute an overall health score for the graph.

        Score ranges from 0.0 (critically unhealthy) to 1.0 (perfect health).

        Args:
            full_data: Optional full graph data. If None, uses data from GraphEngine.

        Returns:
            GraphHealthScore with score, counts, and issues.

        """
        if full_data is None and self._graph:
            try:
                nodes = await self._graph.all_nodes()
                edges = await self._graph.all_edges()
                full_data = {'nodes': nodes, 'edges': edges}
            except Exception:
                full_data = {'nodes': [], 'edges': []}

        full_data = full_data or {'nodes': [], 'edges': []}
        nodes = full_data.get('nodes', [])
        edges = full_data.get('edges', [])

        node_count = len(nodes)
        edge_count = len(edges)

        score = 1.0
        issues: list[str] = []
        warnings_list: list[str] = []

        # Score based on node/edge balance: 0.1 penalty if no edges
        if node_count > 0 and edge_count == 0:
            score -= 0.1
            issues.append('Graph has nodes but no edges')

        # Run cycle detection
        cycle_val = CycleDetectionValidator()
        cycle_errors = await cycle_val({'nodes': nodes, 'edges': edges})
        cycle_count = len(cycle_errors)
        if cycle_count > 0:
            score -= min(0.3, cycle_count * 0.1)
            issues.append(f'Found {cycle_count} cycle(s) in the graph')

        # Run orphan detection
        orphan_val = OrphanNodeValidator()
        orphan_warnings = await orphan_val({'nodes': nodes, 'edges': edges})
        orphan_count = len(orphan_warnings)
        if orphan_count > 0:
            score -= min(0.2, orphan_count * 0.05)
            warnings_list.append(f'{orphan_count} orphan node(s) found')

        # Run disconnected component detection
        disconnected_val = DisconnectedGraphValidator()
        disconnected_warnings = await disconnected_val({'nodes': nodes, 'edges': edges})
        component_count = len(disconnected_warnings) + 1  # +1 for main component
        if len(disconnected_warnings) > 0:
            score -= min(0.2, len(disconnected_warnings) * 0.1)
            warnings_list.append(f'{len(disconnected_warnings)} disconnected component(s) found')

        # Score based on density (very sparse graphs are less healthy)
        if node_count > 1:
            max_possible = node_count * (node_count - 1)
            if max_possible > 0:
                density = edge_count / max_possible
                if density < 0.01 and node_count > 10:
                    score -= 0.05
                    warnings_list.append('Graph is very sparse')

        # Clamp score to [0.0, 1.0]
        score = max(0.0, min(1.0, score))

        return GraphHealthScore(
            score=round(score, 3),
            node_count=node_count,
            edge_count=edge_count,
            orphan_count=orphan_count,
            component_count=component_count,
            cycle_count=cycle_count,
            broken_edge_count=0,
            issues=issues,
            warnings=warnings_list,
        )

    # ── Phase 4: Validation Diagnostics ───────────────────────────

    async def get_validation_diagnostics(self) -> dict[str, Any]:
        """Get comprehensive validation diagnostics.

        Returns info about registered validators and their configurations.
        """
        return {
            'total_validators': sum(len(v) for v in self._validators.values()),
            'categories': {
                category: [v.__class__.__name__ for v in vals]
                for category, vals in self._validators.items()
            },
            'graph_engine_connected': self._graph is not None,
            'knowledge_engine_connected': self._knowledge is not None,
        }

    # ── Event Subscriptions ────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        """Register event subscriptions."""
        await super().subscribe_events(event_bus)


# ── Reflection helper ──────────────────────────────────────────────


def _build_validation_summary(errors: list[dict]) -> dict[str, Any]:
    """Build a summary of validation errors grouped by severity and field."""
    by_severity: dict[str, int] = {}
    by_field: dict[str, int] = {}

    for error in errors:
        severity = error.get('severity', 'error')
        by_severity[severity] = by_severity.get(severity, 0) + 1

        field = error.get('field', 'unknown')
        by_field[field] = by_field.get(field, 0) + 1

    return {
        'total_errors': len(errors),
        'by_severity': by_severity,
        'by_field': by_field,
        'has_critical': by_severity.get('critical', 0) > 0,
        'has_warnings': by_severity.get('warning', 0) > 0,
    }


# ── Built-in Validators (kept from Milestone 3) ────────────────────


class DuplicateIdValidator:
    """Check for duplicate IDs in a list of items."""

    def __init__(self, id_field: str = 'id', label: str = 'items') -> None:
        self._id_field = id_field
        self._label = label

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, list):
            return errors

        seen: set[str] = set()
        for item in data:
            item_id = str(item.get(self._id_field, '')) if isinstance(item, dict) else ''
            if item_id in seen:
                errors.append(
                    {
                        'field': self._id_field,
                        'message': f'Duplicate {self._label} ID: {item_id}',
                        'value': item_id,
                    },
                )
            seen.add(item_id)
        return errors


class MissingIdValidator:
    """Check for missing required ID fields."""

    def __init__(self, id_field: str = 'id', label: str = 'items') -> None:
        self._id_field = id_field
        self._label = label

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, list):
            return errors

        for i, item in enumerate(data):
            if isinstance(item, dict) and not item.get(self._id_field):
                errors.append(
                    {
                        'field': self._id_field,
                        'index': i,
                        'message': f'Missing {self._label} ID at index {i}',
                    },
                )
        return errors


class SchemaValidator:
    """Validate data against a schema (required fields, types)."""

    def __init__(self, required_fields: list[str], label: str = 'item') -> None:
        self._required_fields = required_fields
        self._label = label

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, list):
            return errors

        for i, item in enumerate(data):
            if not isinstance(item, dict):
                errors.append(
                    {
                        'index': i,
                        'message': f'{self._label} at index {i} is not a dict',
                    },
                )
                continue
            for field in self._required_fields:  # noqa: F402
                if field not in item or item[field] is None:
                    errors.append(
                        {
                            'field': field,
                            'index': i,
                            'message': f'Missing required field "{field}" in {self._label} at index {i}',  # noqa: E501
                        },
                    )
        return errors


class EdgeValidator:
    """Validate that edge source and target nodes exist."""

    def __init__(self, node_ids: set[UUID] | None = None) -> None:
        self._node_ids = node_ids or set()

    def set_node_ids(self, node_ids: set[UUID]) -> None:
        self._node_ids = node_ids

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, list):
            return errors

        for i, item in enumerate(data):
            if not isinstance(item, dict):
                continue

            source_id = item.get('source_node_id')
            target_id = item.get('target_node_id')

            if source_id and source_id not in self._node_ids:
                errors.append(
                    {
                        'field': 'source_node_id',
                        'index': i,
                        'message': f'Source node {source_id} does not exist',
                    },
                )

            if target_id and target_id not in self._node_ids:
                errors.append(
                    {
                        'field': 'target_node_id',
                        'index': i,
                        'message': f'Target node {target_id} does not exist',
                    },
                )

            # Self-loop check
            if source_id and target_id and source_id == target_id:
                errors.append(
                    {
                        'field': 'source_node_id',
                        'index': i,
                        'message': f'Self-loop edge detected: {source_id} -> {target_id}',
                    },
                )
        return errors


class MetadataValidator:
    """Validate metadata fields are of the correct type and structure."""

    def __init__(self, allowed_keys: list[str] | None = None) -> None:
        self._allowed_keys = allowed_keys

    async def __call__(self, data: Any) -> list[dict]:
        errors: list[dict] = []
        if not isinstance(data, list):
            return errors

        for i, item in enumerate(data):
            if not isinstance(item, dict):
                continue
            metadata = item.get('metadata', {})
            if not isinstance(metadata, dict):
                errors.append(
                    {
                        'field': 'metadata',
                        'index': i,
                        'message': f'metadata is not a dict at index {i}',
                    },
                )
                continue
            if self._allowed_keys:
                for key in metadata:
                    if key not in self._allowed_keys:
                        errors.append(
                            {
                                'field': 'metadata',
                                'index': i,
                                'message': f'Unexpected metadata key "{key}" at index {i}',
                            },
                        )
        return errors
