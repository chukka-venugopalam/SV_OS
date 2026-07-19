"""Tests for engine lifecycle, registry ordering, dependency validation,
event publishing, graph loading, state transitions, and import pipeline.

Run with:
    cd apps/api && py -m pytest tests/test_engine_lifecycle.py -v
"""

from __future__ import annotations

from uuid import UUID, uuid4

import pytest

from app.engines.base import EngineBase, EngineDependency, EngineHealth, EngineState
from app.engines.state_engine import StateEngine
from app.engines.import_engine import ImportEngine
from app.engines.validation_engine import (
    DuplicateIdValidator,
    MissingIdValidator,
    SchemaValidator,
    EdgeValidator,
    MetadataValidator,
)
from app.infrastructure.registries.registries import (
    DependencyCycleError,
    DependencyGraph,
    EngineRegistry,
)


# ═══════════════════════════════════════════════════════════════════
# Engine Lifecycle Tests
# ═══════════════════════════════════════════════════════════════════


class TestEngineLifecycle:
    """Verify engine lifecycle state transitions."""

    async def test_engine_starts_uninitialized(self):
        """An engine should start in UNINITIALIZED state."""
        engine = _create_test_engine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert not engine.is_initialized
        assert not engine.is_running

    async def test_initialize_transitions_to_ready(self):
        """initialize() should transition to READY state."""
        engine = _create_test_engine()
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        assert engine.is_initialized

    async def test_start_transitions_to_running(self):
        """start() should transition to RUNNING state."""
        engine = _create_test_engine()
        await engine.initialize()
        await engine.start()
        assert engine.engine_state == EngineState.RUNNING
        assert engine.is_running

    async def test_stop_transitions_to_stopped(self):
        """stop() should transition to STOPPED state."""
        engine = _create_test_engine()
        await engine.initialize()
        await engine.start()
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_health_returns_engine_health(self):
        """health() should return an EngineHealth instance."""
        engine = _create_test_engine()
        await engine.initialize()
        health = await engine.health()
        assert isinstance(health, EngineHealth)
        assert health.engine_name == 'test_engine'
        assert health.healthy

    async def test_diagnostics_returns_full_snapshot(self):
        """diagnostics() should return a comprehensive snapshot."""
        engine = _create_test_engine()
        await engine.initialize()
        diag = await engine.diagnostics()
        assert diag['engine_name'] == 'test_engine'
        assert diag['state'] == 'ready'
        assert diag['initialized']
        assert 'dependencies' in diag
        assert 'config_issues' in diag


# ═══════════════════════════════════════════════════════════════════
# Dependency Graph Tests
# ═══════════════════════════════════════════════════════════════════


class TestDependencyGraph:
    """Verify dependency graph cycle detection and ordering."""

    def test_empty_graph_has_no_cycle(self):
        graph = DependencyGraph()
        assert graph.has_cycle() is None

    def test_linear_graph_has_no_cycle(self):
        graph = DependencyGraph()
        graph.add_node('c', ['b'])
        graph.add_node('b', ['a'])
        graph.add_node('a', [])
        assert graph.has_cycle() is None

    def test_cyclic_graph_detects_cycle(self):
        graph = DependencyGraph()
        graph.add_node('a', ['b'])
        graph.add_node('b', ['c'])
        graph.add_node('c', ['a'])
        cycle = graph.has_cycle()
        assert cycle is not None
        assert len(cycle) >= 2

    def test_startup_order_is_topological(self):
        graph = DependencyGraph()
        graph.add_node('c', ['b'])
        graph.add_node('b', ['a'])
        graph.add_node('a', [])
        order = graph.startup_order()
        assert order.index('a') < order.index('b')
        assert order.index('b') < order.index('c')

    def test_shutdown_order_reverses_startup(self):
        graph = DependencyGraph()
        graph.add_node('c', ['b'])
        graph.add_node('b', ['a'])
        graph.add_node('a', [])
        start = graph.startup_order()
        shutdown = graph.shutdown_order()
        assert start == list(reversed(shutdown))

    def test_shutdown_order_reverses_startup_complex(self):
        graph = DependencyGraph()
        graph.add_node('event', [])
        graph.add_node('graph', ['event'])
        graph.add_node('validation', ['graph'])
        graph.add_node('import', ['validation', 'graph'])
        start = graph.startup_order()
        shutdown = graph.shutdown_order()
        assert start == list(reversed(shutdown))


class TestEngineRegistry:
    """Verify the EngineRegistry implementation."""

    async def test_register_engine(self):
        registry = EngineRegistry()
        registry.register('test', _create_test_engine_class)
        assert registry.is_registered('test')

    async def test_register_duplicate_raises(self):
        registry = EngineRegistry()
        registry.register('test', _create_test_engine_class)
        with pytest.raises(ValueError, match='already registered'):
            registry.register('test', _create_test_engine_class)

    async def test_get_returns_engine(self):
        registry = EngineRegistry()
        registry.register('test', _create_test_engine_class)
        engine = registry.get('test')
        assert isinstance(engine, EngineBase)

    async def test_get_unregistered_raises(self):
        registry = EngineRegistry()
        with pytest.raises(KeyError, match='not registered'):
            registry.get('nonexistent')

    async def test_try_get_unregistered_returns_none(self):
        registry = EngineRegistry()
        assert registry.try_get('nonexistent') is None

    async def test_names_returns_sorted(self):
        registry = EngineRegistry()
        registry.register('z_engine', _create_test_engine_class)
        registry.register('a_engine', _create_test_engine_class)
        assert registry.names() == ['a_engine', 'z_engine']

    async def test_cyclic_dependency_raises(self):
        registry = EngineRegistry()
        registry.register('a', _create_test_engine_class)
        registry.register('b', _create_test_engine_class)
        # Manually create a cycle
        registry._graph.add_node('a', ['b'])
        registry._graph.add_node('b', ['a'])
        with pytest.raises(DependencyCycleError):
            registry.validate_graph()


# ═══════════════════════════════════════════════════════════════════
# State Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestStateEngine:
    """Verify state engine transitions."""

    async def test_initial_state_is_none(self):
        engine = StateEngine()
        state = await engine.get_state(uuid4(), uuid4())
        assert state is None

    async def test_update_creates_new_state(self):
        engine = StateEngine()
        user_id = uuid4()
        node_id = uuid4()
        result = await engine.update_state(user_id, node_id, 'learning')
        assert result['status'] == 'learning'
        assert result['user_id'] == str(user_id)
        assert result['node_id'] == str(node_id)

    async def test_valid_transition_succeeds(self):
        engine = StateEngine()
        user_id = uuid4()
        node_id = uuid4()
        await engine.update_state(user_id, node_id, 'learning')
        result = await engine.update_state(user_id, node_id, 'completed')
        assert result['status'] == 'completed'

    async def test_invalid_transition_raises(self):
        engine = StateEngine()
        user_id = uuid4()
        node_id = uuid4()
        await engine.update_state(user_id, node_id, 'learning')
        with pytest.raises(ValueError, match='Invalid state transition'):
            await engine.update_state(user_id, node_id, 'mastered')

    async def test_confidence_update(self):
        engine = StateEngine()
        user_id = uuid4()
        node_id = uuid4()
        await engine.update_state(user_id, node_id, 'learning')
        confidence = await engine.update_confidence(user_id, node_id, 0.2)
        assert confidence == pytest.approx(0.2, abs=0.01)

    async def test_transition_history(self):
        engine = StateEngine()
        user_id = uuid4()
        node_id = uuid4()
        await engine.update_state(user_id, node_id, 'learning')
        await engine.update_state(user_id, node_id, 'completed')
        history = await engine.get_transition_history(user_id, node_id)
        assert len(history) == 2

    async def test_list_states_by_status(self):
        engine = StateEngine()
        user_id = uuid4()
        node_a = uuid4()
        node_b = uuid4()
        await engine.update_state(user_id, node_a, 'learning')
        await engine.update_state(user_id, node_b, 'learning')
        await engine.update_state(user_id, node_b, 'completed')
        states = await engine.list_states(user_id, status='learning')
        assert len(states) == 1
        assert states[0]['status'] == 'learning'

    async def test_count_by_status(self):
        engine = StateEngine()
        user_id = uuid4()
        node_a = uuid4()
        node_b = uuid4()
        await engine.update_state(user_id, node_a, 'learning')
        await engine.update_state(user_id, node_b, 'learning')
        await engine.update_state(user_id, node_b, 'completed')
        counts = await engine.count_by_status(user_id)
        assert counts.get('learning') == 1
        assert counts.get('completed') == 1


# ═══════════════════════════════════════════════════════════════════
# Validation Engine Tests
# ═══════════════════════════════════════════════════════════════════


class TestValidators:
    """Verify built-in validators."""

    async def test_duplicate_id_validator_detects_duplicates(self):
        validator = DuplicateIdValidator(id_field='id', label='node')
        data = [{'id': 'a'}, {'id': 'b'}, {'id': 'a'}]
        errors = await validator(data)
        assert len(errors) == 1
        assert 'Duplicate' in errors[0]['message']

    async def test_missing_id_validator_detects_missing(self):
        validator = MissingIdValidator(id_field='id', label='node')
        data = [{'id': 'a'}, {'name': 'no-id'}]
        errors = await validator(data)
        assert len(errors) == 1

    async def test_schema_validator_checks_required_fields(self):
        validator = SchemaValidator(required_fields=['id', 'title'], label='node')
        data = [{'id': 'a', 'title': 'OK'}, {'id': 'b'}]
        errors = await validator(data)
        assert len(errors) == 1
        assert 'title' in errors[0]['message']

    async def test_edge_validator_checks_source_target(self):
        validator = EdgeValidator(node_ids={UUID(int=1)})
        data = [
            {'id': 'e1', 'source_node_id': UUID(int=1), 'target_node_id': UUID(int=2)},
        ]
        errors = await validator(data)
        # target_node_id 2 doesn't exist
        assert len(errors) >= 1

    async def test_self_loop_detected(self):
        validator = EdgeValidator(node_ids={UUID(int=1)})
        nid = UUID(int=1)
        data = [{'id': 'e1', 'source_node_id': nid, 'target_node_id': nid}]
        errors = await validator(data)
        self_loop_errors = [e for e in errors if 'Self-loop' in e.get('message', '')]
        assert len(self_loop_errors) == 1
        assert self_loop_errors[0]['message'] == f'Self-loop edge detected: {nid} -> {nid}'

    async def test_metadata_validator_checks_type(self):
        validator = MetadataValidator()
        data = [{'metadata': 'not-a-dict'}]
        errors = await validator(data)
        assert len(errors) == 1


# ═══════════════════════════════════════════════════════════════════
# Import Pipeline Tests
# ═══════════════════════════════════════════════════════════════════


class TestImportPipeline:
    """Verify import pipeline lifecycle."""

    async def test_import_creates_job(self):
        engine = ImportEngine()
        result = await engine.start_import(
            payload={'source': 'test', 'nodes': [], 'edges': []},
        )
        assert result['source'] == 'test'
        assert 'import_id' in result

    async def test_dry_run_does_not_commit(self):
        engine = ImportEngine()
        result = await engine.start_import(
            payload={'source': 'test', 'nodes': [], 'edges': []},
            dry_run=True,
        )
        assert result['committed'] is False

    async def test_get_import_status(self):
        engine = ImportEngine()
        result = await engine.start_import(
            payload={'source': 'test', 'nodes': [], 'edges': []},
        )
        status = await engine.get_import_status(UUID(result['import_id']))
        assert status['import_id'] == result['import_id']

    async def test_import_history(self):
        engine = ImportEngine()
        await engine.start_import(payload={'source': 'test', 'nodes': [], 'edges': []})
        await engine.start_import(payload={'source': 'test2', 'nodes': [], 'edges': []})
        history = await engine.get_import_history()
        assert len(history) == 2


# ═══════════════════════════════════════════════════════════════════
# Helpers
# ═══════════════════════════════════════════════════════════════════


class _TestEngine(EngineBase):
    """Minimal test engine implementing the abstract interface."""

    def _default_name(self) -> str:
        return 'test_engine'

    def dependencies(self) -> list[EngineDependency]:
        return []

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        pass

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Test engine is healthy',
        )

    async def validate_configuration(self) -> list[str]:
        return []


def _create_test_engine() -> _TestEngine:
    return _TestEngine()


def _create_test_engine_class() -> EngineBase:
    return _TestEngine()
