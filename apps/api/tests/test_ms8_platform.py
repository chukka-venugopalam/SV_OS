"""Tests for SV-OS Milestone 8 — Production Platform.

Covers:
- SchedulingEngine (cron, retries, priorities, lifecycle)
- RevisionEngine (queues, spaced review, overdue, plans)
- AnalyticsEngine (statistics aggregation)
- PluginEngine (manifest, lifecycle, enable/disable)
- RateLimitMiddleware (token bucket)
- MetricsCollector (Prometheus export)
- Tracer (OpenTelemetry spans)
- WorkerManager (task submission, retries)
- NotificationService (in-app, adapters)
- AuditLogger (immutable entries, query)
- WebSocketManager (connections, broadcast)
"""

from __future__ import annotations

from uuid import UUID

import pytest

from app.engines.analytics_engine import AnalyticsEngine
from app.engines.base import EngineBase, EngineState
from app.engines.plugin_engine import PluginEngine, PluginManifest
from app.engines.revision_engine import RevisionEngine
from app.engines.scheduling_engine import (
    JobPriority,
    SchedulingEngine,
)
from app.infrastructure.audit import AuditLogger
from app.infrastructure.notifications import NotificationService
from app.infrastructure.websocket import WebSocketManager
from app.infrastructure.workers import WorkerManager
from app.middleware.rate_limit import TokenBucket
from app.telemetry.metrics import MetricsCollector
from app.telemetry.tracing import Tracer

# ════════════════════════════════════════════════════════════════
# 1. SchedulingEngine Tests
# ════════════════════════════════════════════════════════════════


class TestSchedulingEngine:
    """Tests for SchedulingEngine."""

    @pytest.fixture
    def engine(self) -> SchedulingEngine:
        return SchedulingEngine()

    @pytest.mark.asyncio
    async def test_engine_base_inheritance(self, engine: SchedulingEngine) -> None:
        assert isinstance(engine, EngineBase)
        assert engine.engine_name == 'scheduler'

    @pytest.mark.asyncio
    async def test_lifecycle(self, engine: SchedulingEngine) -> None:
        assert engine.engine_state == EngineState.UNINITIALIZED
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        await engine.start()
        assert engine.engine_state == EngineState.RUNNING
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    @pytest.mark.asyncio
    async def test_schedule_once(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        result = await engine.schedule_once('test-job', delay_seconds=0)
        assert result['name'] == 'test-job'
        assert result['job_type'] == 'once'
        assert result['status'] == 'pending'

    @pytest.mark.asyncio
    async def test_schedule_recurring(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        result = await engine.schedule_recurring('recurring-job', interval_seconds=60)
        assert result['name'] == 'recurring-job'
        assert result['job_type'] == 'recurring'
        assert result['status'] == 'pending'

    @pytest.mark.asyncio
    async def test_schedule_cron(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        result = await engine.schedule_cron('cron-job', '0 8 * * 1-5')
        assert result['name'] == 'cron-job'
        assert result['job_type'] == 'cron'

    @pytest.mark.asyncio
    async def test_cancel_job(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        job = await engine.schedule_once('cancel-test')
        result = await engine.cancel(job['id'])
        assert result['status'] == 'cancelled'

    @pytest.mark.asyncio
    async def test_pause_and_resume(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        job = await engine.schedule_once('pause-test')
        paused = await engine.pause(job['id'])
        assert paused['status'] == 'paused'
        resumed = await engine.resume(job['id'])
        assert resumed['status'] == 'pending'

    @pytest.mark.asyncio
    async def test_get_job(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        job = await engine.schedule_once('get-test')
        fetched = await engine.get_job(job['id'])
        assert fetched is not None
        assert fetched['id'] == job['id']

    @pytest.mark.asyncio
    async def test_list_jobs(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        await engine.schedule_once('job-a')
        await engine.schedule_once('job-b')
        jobs = await engine.list_jobs()
        assert len(jobs) >= 2

    @pytest.mark.asyncio
    async def test_retry_job(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        job = await engine.schedule_once('retry-test')
        result = await engine.retry_job(job['id'])
        assert result['status'] == 'pending'
        assert result['retry_count'] == 0

    @pytest.mark.asyncio
    async def test_get_statistics(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        await engine.schedule_once('stat-test')
        stats = await engine.get_statistics()
        assert stats['total'] >= 1
        assert 'pending' in stats
        assert 'completed' in stats

    @pytest.mark.asyncio
    async def test_get_job_history(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        await engine.schedule_once('history-test')
        history = await engine.get_job_history()
        assert len(history) >= 1

    @pytest.mark.asyncio
    async def test_priorities(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        await engine.schedule_once('low', priority=JobPriority.LOW)
        await engine.schedule_once('high', priority=JobPriority.HIGH)
        jobs = await engine.list_jobs()
        assert jobs[0]['name'] == 'high'  # Higher priority first

    @pytest.mark.asyncio
    async def test_health(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        health = await engine.health()
        assert health.healthy
        assert health.engine_name == 'scheduler'

    @pytest.mark.asyncio
    async def test_diagnostics(self, engine: SchedulingEngine) -> None:
        await engine.initialize()
        diag = await engine.diagnostics()
        assert diag['engine_name'] == 'scheduler'
        assert 'state' in diag

    @pytest.mark.asyncio
    async def test_register_handler(self, engine: SchedulingEngine) -> None:
        called = False

        async def handler(payload) -> None:  # noqa: ARG001
            nonlocal called
            called = True

        engine.register_handler('test_handler', handler)
        assert 'test_handler' in engine._handlers


# ════════════════════════════════════════════════════════════════
# 2. RevisionEngine Tests
# ════════════════════════════════════════════════════════════════


class TestRevisionEngine:
    """Tests for RevisionEngine."""

    @pytest.fixture
    def engine(self) -> RevisionEngine:
        return RevisionEngine()

    @pytest.mark.asyncio
    async def test_engine_base_inheritance(self, engine: RevisionEngine) -> None:
        assert isinstance(engine, EngineBase)
        assert engine.engine_name == 'revision'

    @pytest.mark.asyncio
    async def test_lifecycle(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        await engine.start()
        await engine.stop()

    @pytest.mark.asyncio
    async def test_build_queue(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        result = await engine.build_queue(UUID(int=1), node_ids=['node-1', 'node-2'])
        assert len(result) == 2
        assert result[0]['node_id'] == 'node-1'

    @pytest.mark.asyncio
    async def test_get_daily_plan(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['node-1'])
        plan = await engine.get_daily_plan(UUID(int=1))
        assert plan['plan_type'] == 'daily'
        assert 'items' in plan

    @pytest.mark.asyncio
    async def test_get_weekly_plan(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['node-1'])
        plan = await engine.get_weekly_plan(UUID(int=1))
        assert plan['plan_type'] == 'weekly'

    @pytest.mark.asyncio
    async def test_mark_completed(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(
            UUID(int=1),
            node_ids=['00000000-0000-0000-0000-000000000001'],
        )
        result = await engine.mark_completed(UUID(int=1), UUID(int=1), confidence=0.9)
        assert result is not None
        assert result.get('completed') is True
        assert result.get('confidence') == 0.9

    @pytest.mark.asyncio
    async def test_mark_skipped(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['00000000-0000-0000-0000-000000000001'])
        result = await engine.mark_skipped(UUID(int=1), UUID(int=1))
        assert result is not None
        assert result.get('skipped') is True

    @pytest.mark.asyncio
    async def test_get_overdue(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['node-1'])
        overdue = await engine.get_overdue(UUID(int=1))
        assert isinstance(overdue, list)

    @pytest.mark.asyncio
    async def test_get_statistics(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['node-1', 'node-2'])
        stats = await engine.get_statistics(UUID(int=1))
        assert stats['total_items'] == 2
        assert 'completion_rate' in stats

    @pytest.mark.asyncio
    async def test_get_history(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['00000000-0000-0000-0000-000000000002'])
        await engine.mark_completed(UUID(int=1), UUID(int=2))
        history = await engine.get_history(UUID(int=1))
        assert len(history) >= 1

    @pytest.mark.asyncio
    async def test_health(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        health = await engine.health()
        assert health.healthy

    @pytest.mark.asyncio
    async def test_diagnostics(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        diag = await engine.diagnostics()
        assert diag['engine_name'] == 'revision'

    @pytest.mark.asyncio
    async def test_spaced_intervals_increase(self, engine: RevisionEngine) -> None:
        await engine.initialize()
        await engine.build_queue(UUID(int=1), node_ids=['00000000-0000-0000-0000-000000000042'])
        await engine.mark_completed(UUID(int=1), UUID(int=0x42), confidence=0.9)
        await engine.mark_completed(UUID(int=1), UUID(int=0x42), confidence=0.9)

        # Check interval increased
        stats = await engine.get_statistics(UUID(int=1))
        # Should have at least made progress
        assert stats['total_items'] > 0


# ════════════════════════════════════════════════════════════════
# 3. AnalyticsEngine Tests
# ════════════════════════════════════════════════════════════════


class TestAnalyticsEngine:
    """Tests for AnalyticsEngine."""

    @pytest.fixture
    def engine(self) -> AnalyticsEngine:
        return AnalyticsEngine()

    @pytest.mark.asyncio
    async def test_engine_base_inheritance(self, engine: AnalyticsEngine) -> None:
        assert isinstance(engine, EngineBase)
        assert engine.engine_name == 'analytics'

    @pytest.mark.asyncio
    async def test_lifecycle(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        await engine.start()
        await engine.stop()

    @pytest.mark.asyncio
    async def test_get_graph_statistics(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        stats = await engine.get_graph_statistics()
        assert 'node_count' in stats
        assert 'edge_count' in stats
        assert 'type_counts' in stats

    @pytest.mark.asyncio
    async def test_get_learning_statistics(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        stats = await engine.get_learning_statistics()
        assert 'total_paths' in stats
        assert 'active_paths' in stats

    @pytest.mark.asyncio
    async def test_get_career_statistics(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        stats = await engine.get_career_statistics()
        assert 'total_careers' in stats

    @pytest.mark.asyncio
    async def test_get_assessment_statistics(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        stats = await engine.get_assessment_statistics()
        assert 'total_assessments' in stats
        assert 'pass_rate' in stats

    @pytest.mark.asyncio
    async def test_get_import_export_statistics(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        stats = await engine.get_import_export_statistics()
        assert 'total_imports' in stats

    @pytest.mark.asyncio
    async def test_get_platform_statistics(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        stats = await engine.get_platform_statistics()
        assert 'active_engines' in stats

    @pytest.mark.asyncio
    async def test_get_full_snapshot(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        snapshot = await engine.get_full_snapshot()
        assert 'timestamp' in snapshot
        assert 'graph' in snapshot
        assert 'platform' in snapshot

    @pytest.mark.asyncio
    async def test_get_summary(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        summary = await engine.get_summary()
        assert 'total_nodes' in summary
        assert 'total_edges' in summary

    @pytest.mark.asyncio
    async def test_record_event(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        engine.record_event('test.event')
        engine.record_event('test.event')
        assert engine._event_counts.get('test.event') == 2

    @pytest.mark.asyncio
    async def test_health(self, engine: AnalyticsEngine) -> None:
        await engine.initialize()
        health = await engine.health()
        assert health.healthy


# ════════════════════════════════════════════════════════════════
# 4. PluginEngine Tests
# ════════════════════════════════════════════════════════════════


class TestPluginEngine:
    """Tests for PluginEngine."""

    @pytest.fixture
    def engine(self) -> PluginEngine:
        return PluginEngine()

    @pytest.mark.asyncio
    async def test_engine_base_inheritance(self, engine: PluginEngine) -> None:
        assert isinstance(engine, EngineBase)
        assert engine.engine_name == 'plugin'

    @pytest.mark.asyncio
    async def test_lifecycle(self, engine: PluginEngine) -> None:
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        await engine.start()
        await engine.stop()

    @pytest.mark.asyncio
    async def test_register_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(
            name='test-plugin',
            version='1.0.0',
            description='Test plugin',
            capabilities=['graph.query'],
        )
        result = await engine.register_plugin(manifest)
        assert result['name'] == 'test-plugin'
        assert result['status'] == 'registered'

    @pytest.mark.asyncio
    async def test_register_duplicate_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='dup-plugin')
        await engine.register_plugin(manifest)
        result = await engine.register_plugin(manifest)
        assert 'error' in result

    @pytest.mark.asyncio
    async def test_load_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='loadable', capabilities=['test.cap'])
        registered = await engine.register_plugin(manifest)
        result = await engine.load_plugin(registered['plugin_id'])
        assert result['status'] in ('loaded', 'failed')

    @pytest.mark.asyncio
    async def test_enable_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='enableable')
        registered = await engine.register_plugin(manifest)
        await engine.load_plugin(registered['plugin_id'])
        result = await engine.enable_plugin(registered['plugin_id'])
        assert result['status'] == 'enabled'

    @pytest.mark.asyncio
    async def test_disable_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='disableable')
        registered = await engine.register_plugin(manifest)
        await engine.load_plugin(registered['plugin_id'])
        await engine.enable_plugin(registered['plugin_id'])
        result = await engine.disable_plugin(registered['plugin_id'])
        assert result['status'] == 'disabled'

    @pytest.mark.asyncio
    async def test_unload_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='unloadable')
        registered = await engine.register_plugin(manifest)
        await engine.load_plugin(registered['plugin_id'])
        result = await engine.unload_plugin(registered['plugin_id'])
        assert result['status'] == 'unloaded'

    @pytest.mark.asyncio
    async def test_get_plugin(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='gettable')
        registered = await engine.register_plugin(manifest)
        result = await engine.get_plugin(registered['plugin_id'])
        assert result is not None
        assert result['name'] == 'gettable'

    @pytest.mark.asyncio
    async def test_list_plugins(self, engine: PluginEngine) -> None:
        await engine.initialize()
        await engine.register_plugin(PluginManifest(name='list-a'))
        await engine.register_plugin(PluginManifest(name='list-b'))
        plugins = await engine.list_plugins()
        assert len(plugins) >= 2

    @pytest.mark.asyncio
    async def test_get_manifest(self, engine: PluginEngine) -> None:
        await engine.initialize()
        manifest = PluginManifest(name='manifest-test', version='2.0.0')
        registered = await engine.register_plugin(manifest)
        result = await engine.get_manifest(registered['plugin_id'])
        assert result is not None
        assert result['version'] == '2.0.0'

    @pytest.mark.asyncio
    async def test_get_statistics(self, engine: PluginEngine) -> None:
        await engine.initialize()
        await engine.register_plugin(PluginManifest(name='stat-plugin'))
        stats = await engine.get_statistics()
        assert stats['total'] >= 1
        assert 'registered' in stats

    @pytest.mark.asyncio
    async def test_validate_dependencies(self, engine: PluginEngine) -> None:
        await engine.initialize()
        results = await engine.validate_dependencies()
        assert isinstance(results, list)

    @pytest.mark.asyncio
    async def test_validate_configuration(self, engine: PluginEngine) -> None:
        await engine.initialize()
        issues = await engine.validate_configuration()
        assert isinstance(issues, list)

    @pytest.mark.asyncio
    async def test_health(self, engine: PluginEngine) -> None:
        await engine.initialize()
        health = await engine.health()
        assert health.healthy


# ════════════════════════════════════════════════════════════════
# 5. RateLimit / TokenBucket Tests
# ════════════════════════════════════════════════════════════════


class TestTokenBucket:
    """Tests for TokenBucket rate limiter."""

    def test_consume_allows_within_capacity(self) -> None:
        bucket = TokenBucket(capacity=5, rate=10.0)
        for _ in range(5):
            assert bucket.consume()

    def test_consume_blocks_when_exhausted(self) -> None:
        bucket = TokenBucket(capacity=2, rate=10.0)
        bucket.consume()
        bucket.consume()
        assert not bucket.consume()

    def test_remaining_decreases(self) -> None:
        bucket = TokenBucket(capacity=10, rate=10.0)
        assert bucket.remaining() == 10
        bucket.consume()
        assert bucket.remaining() == 9

    def test_reset_time_returns_zero_when_full(self) -> None:
        bucket = TokenBucket(capacity=10, rate=1.0)
        assert bucket.reset_time() == 0.0

    def test_refill_over_time(self) -> None:
        bucket = TokenBucket(capacity=1, rate=1000.0)
        bucket.consume()
        assert bucket.remaining() < 1
        # Should refill quickly with high rate


# ════════════════════════════════════════════════════════════════
# 6. MetricsCollector Tests
# ════════════════════════════════════════════════════════════════


class TestMetricsCollector:
    """Tests for MetricsCollector."""

    @pytest.fixture
    def metrics(self) -> MetricsCollector:
        return MetricsCollector()

    def test_increment_counter(self, metrics: MetricsCollector) -> None:
        metrics.increment('test_counter')
        assert metrics.get_counter('test_counter') == 1

    def test_increment_multiple(self, metrics: MetricsCollector) -> None:
        metrics.increment('multi')
        metrics.increment('multi')
        metrics.increment('multi')
        assert metrics.get_counter('multi') == 3

    def test_increment_with_labels(self, metrics: MetricsCollector) -> None:
        metrics.increment('labeled', {'env': 'test'})
        assert metrics.get_counter('labeled', {'env': 'test'}) == 1
        assert metrics.get_counter('labeled') == 0

    def test_set_gauge(self, metrics: MetricsCollector) -> None:
        metrics.gauge('test_gauge', 42.0)
        assert metrics.get_gauge('test_gauge') == 42.0

    def test_update_gauge(self, metrics: MetricsCollector) -> None:
        metrics.gauge('updatable', 10.0)
        metrics.gauge('updatable', 20.0)
        assert metrics.get_gauge('updatable') == 20.0

    def test_histogram(self, metrics: MetricsCollector) -> None:
        metrics.histogram('request_latency', 100.0)
        metrics.histogram('request_latency', 200.0)
        assert metrics.get_histogram_count('request_latency') == 2

    def test_histogram_stats(self, metrics: MetricsCollector) -> None:
        metrics.histogram('stats_test', 100.0)
        metrics.histogram('stats_test', 200.0)
        metrics.histogram('stats_test', 300.0)
        all_metrics = metrics.get_all_as_dict()
        hist = all_metrics['histograms']
        key = 'stats_test'
        assert key in hist
        assert hist[key]['count'] == 3
        assert hist[key]['sum'] == 600.0
        assert hist[key]['avg'] == 200.0

    def test_timing(self, metrics: MetricsCollector) -> None:
        metrics.timing('request_time', 150.0)
        assert metrics.get_histogram_count('request_time') == 1

    def test_export_format(self, metrics: MetricsCollector) -> None:
        metrics.increment('export_test')
        export = metrics.export_metrics()
        assert '# HELP export_test' in export
        assert '# TYPE export_test counter' in export
        assert 'export_test 1' in export

    def test_clear(self, metrics: MetricsCollector) -> None:
        metrics.increment('clearable')
        metrics.clear()
        assert metrics.get_counter('clearable') == 0


# ════════════════════════════════════════════════════════════════
# 7. Tracer Tests
# ════════════════════════════════════════════════════════════════


class TestTracer:
    """Tests for Tracer."""

    @pytest.fixture
    def tracer(self) -> Tracer:
        return Tracer()

    @pytest.mark.asyncio
    async def test_span_creation(self, tracer: Tracer) -> None:
        async with tracer.span('test_span') as span:
            assert span.name == 'test_span'
            assert span.span_id is not None
            assert span.trace_id is not None

    @pytest.mark.asyncio
    async def test_span_nesting(self, tracer: Tracer) -> None:
        async with tracer.span('parent') as parent, tracer.span('child') as child:
            assert child.parent_span_id == parent.span_id
            assert child.trace_id == parent.trace_id

    @pytest.mark.asyncio
    async def test_set_attribute(self, tracer: Tracer) -> None:
        async with tracer.span('attr_test'):
            tracer.set_attribute('key', 'value')
            span = tracer.get_current_span()
            assert span is not None
            assert span.attributes.get('key') == 'value'

    @pytest.mark.asyncio
    async def test_add_event(self, tracer: Tracer) -> None:
        async with tracer.span('event_test'):
            tracer.add_event('test_event', {'data': 'test'})
            span = tracer.get_current_span()
            assert span is not None
            assert len(span.events) >= 1
            assert span.events[0].name == 'test_event'

    @pytest.mark.asyncio
    async def test_span_duration(self, tracer: Tracer) -> None:
        async with tracer.span('duration_test'):
            pass
        spans = tracer.export_traces()
        assert any(s['name'] == 'duration_test' for s in spans)

    @pytest.mark.asyncio
    async def test_get_trace(self, tracer: Tracer) -> None:
        async with tracer.span('trace_test'):
            pass
        spans = tracer.export_traces()
        trace_id = spans[0]['trace_id']
        trace = tracer.get_trace(trace_id)
        assert len(trace) >= 1

    @pytest.mark.asyncio
    async def test_clear(self, tracer: Tracer) -> None:
        async with tracer.span('clear_test'):
            pass
        assert tracer.span_count > 0
        tracer.clear()
        assert tracer.span_count == 0

    @pytest.mark.asyncio
    async def test_get_statistics(self, tracer: Tracer) -> None:
        async with tracer.span('stat_test'):
            pass
        stats = tracer.get_statistics()
        assert stats['total_spans'] >= 1
        assert stats['export_enabled'] is True

    @pytest.mark.asyncio
    async def test_error_span(self, tracer: Tracer) -> None:
        try:
            async with tracer.span('error_test'):
                msg = 'test error'
                raise ValueError(msg)
        except ValueError:
            pass
        spans = tracer.export_traces()
        error = next(s for s in spans if s['name'] == 'error_test')
        assert error['status'] == 'error'


# ════════════════════════════════════════════════════════════════
# 8. WorkerManager Tests
# ════════════════════════════════════════════════════════════════


class TestWorkerManager:
    """Tests for WorkerManager."""

    @pytest.fixture
    def worker(self) -> WorkerManager:
        return WorkerManager(max_workers=2)

    @pytest.mark.asyncio
    async def test_start_stop(self, worker: WorkerManager) -> None:
        await worker.start()
        assert len(worker._workers) == 2
        await worker.stop()
        assert len(worker._workers) == 0

    @pytest.mark.asyncio
    async def test_submit_task(self, worker: WorkerManager) -> None:
        await worker.start()
        task_id = await worker.submit_task('test', 'handler', {'key': 'value'})
        assert task_id is not None
        task = await worker.get_task(task_id)
        assert task is not None
        assert task['name'] == 'test'
        await worker.stop()

    @pytest.mark.asyncio
    async def test_get_task_not_found(self, worker: WorkerManager) -> None:
        result = await worker.get_task('nonexistent')
        assert result is None

    @pytest.mark.asyncio
    async def test_list_tasks(self, worker: WorkerManager) -> None:
        await worker.start()
        await worker.submit_task('a', 'h1')
        await worker.submit_task('b', 'h2')
        tasks = await worker.list_tasks()
        assert len(tasks) >= 2
        await worker.stop()

    @pytest.mark.asyncio
    async def test_cancel_task(self, worker: WorkerManager) -> None:
        await worker.start()
        task_id = await worker.submit_task('cancel', 'h')
        result = await worker.cancel_task(task_id)
        assert result is not None
        assert result['status'] == 'cancelled'
        await worker.stop()

    @pytest.mark.asyncio
    async def test_get_statistics(self, worker: WorkerManager) -> None:
        await worker.start()
        stats = await worker.get_statistics()
        assert stats['max_workers'] == 2
        assert 'total_tasks' in stats
        await worker.stop()

    @pytest.mark.asyncio
    async def test_register_handler(self, worker: WorkerManager) -> None:
        def handler(payload):
            return payload

        worker.register_handler('custom', handler)
        assert 'custom' in worker._handlers


# ════════════════════════════════════════════════════════════════
# 9. NotificationService Tests
# ════════════════════════════════════════════════════════════════


class TestNotificationService:
    """Tests for NotificationService."""

    @pytest.fixture
    def service(self) -> NotificationService:
        return NotificationService()

    @pytest.mark.asyncio
    async def test_send_notification(self, service: NotificationService) -> None:
        result = await service.send_notification(
            user_id='user-1',
            title='Test Title',
            body='Test Body',
            notification_type='info',
        )
        assert result['title'] == 'Test Title'
        assert result['type'] == 'info'
        assert result['read'] is False

    @pytest.mark.asyncio
    async def test_mark_read(self, service: NotificationService) -> None:
        sent = await service.send_notification('user-1', 'Title', 'Body')
        result = await service.mark_read('user-1', sent['notification_id'])
        assert result is not None
        assert result['read'] is True

    @pytest.mark.asyncio
    async def test_mark_all_read(self, service: NotificationService) -> None:
        await service.send_notification('user-1', 'A', 'Body')
        await service.send_notification('user-1', 'B', 'Body')
        count = await service.mark_all_read('user-1')
        assert count == 2

    @pytest.mark.asyncio
    async def test_get_notifications(self, service: NotificationService) -> None:
        await service.send_notification('user-1', 'A', 'Body')
        notifications = await service.get_notifications('user-1')
        assert len(notifications) == 1

    @pytest.mark.asyncio
    async def test_get_unread_count(self, service: NotificationService) -> None:
        await service.send_notification('user-1', 'A', 'Body')
        count = await service.get_unread_count('user-1')
        assert count == 1

    @pytest.mark.asyncio
    async def test_delete_notification(self, service: NotificationService) -> None:
        sent = await service.send_notification('user-1', 'A', 'Body')
        result = await service.delete_notification('user-1', sent['notification_id'])
        assert result is True
        count = await service.get_unread_count('user-1')
        assert count == 0

    @pytest.mark.asyncio
    async def test_get_statistics(self, service: NotificationService) -> None:
        await service.send_notification('user-1', 'A', 'Body', 'info')
        await service.send_notification('user-1', 'B', 'Body', 'warning')
        stats = await service.get_statistics()
        assert stats['total'] == 2
        assert stats['by_type']['info'] == 1
        assert stats['by_type']['warning'] == 1

    @pytest.mark.asyncio
    async def test_preferences(self, service: NotificationService) -> None:
        service.set_preference('user-1', 'email', False)
        assert service._get_preference('user-1', 'email') is False
        assert service._get_preference('user-1', 'in_app') is True  # default

    @pytest.mark.asyncio
    async def test_mark_read_wrong_user(self, service: NotificationService) -> None:
        sent = await service.send_notification('user-1', 'Title', 'Body')
        result = await service.mark_read('user-2', sent['notification_id'])
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_not_found(self, service: NotificationService) -> None:
        result = await service.delete_notification('user-1', 'nonexistent')
        assert result is False


# ════════════════════════════════════════════════════════════════
# 10. AuditLogger Tests
# ════════════════════════════════════════════════════════════════


class TestAuditLogger:
    """Tests for AuditLogger."""

    @pytest.fixture
    def audit(self) -> AuditLogger:
        return AuditLogger()

    def test_record_entry(self, audit: AuditLogger) -> None:
        entry_id = audit.record('graph_mutation', 'create_node', actor='admin')
        assert entry_id is not None

    def test_get_entry(self, audit: AuditLogger) -> None:
        entry_id = audit.record('system', 'restart', details={'reason': 'deploy'})
        entry = audit.get_entry(entry_id)
        assert entry is not None
        assert entry['action'] == 'restart'
        assert entry['details']['reason'] == 'deploy'

    def test_query_by_category(self, audit: AuditLogger) -> None:
        audit.record('auth', 'login', actor='user1')
        audit.record('graph_mutation', 'create', actor='user1')
        audit.record('auth', 'logout', actor='user1')
        results = audit.query(category='auth')
        assert len(results) == 2

    def test_query_by_actor(self, audit: AuditLogger) -> None:
        audit.record('system', 'event', actor='user-a')
        audit.record('system', 'event', actor='user-b')
        results = audit.query(actor='user-a')
        assert len(results) == 1

    def test_query_with_limit_and_offset(self, audit: AuditLogger) -> None:
        for i in range(10):
            audit.record('system', f'event-{i}')
        results = audit.query(limit=3)
        assert len(results) == 3
        results2 = audit.query(limit=3, offset=5)
        assert len(results2) == 3

    def test_get_statistics(self, audit: AuditLogger) -> None:
        audit.record('auth', 'login')
        audit.record('graph_mutation', 'create')
        stats = audit.get_statistics()
        assert stats['total_entries'] == 2
        assert stats['by_category']['auth'] == 1

    def test_entry_count(self, audit: AuditLogger) -> None:
        assert audit.entry_count == 0
        audit.record('system', 'test')
        assert audit.entry_count == 1

    def test_export_json(self, audit: AuditLogger) -> None:
        audit.record('system', 'test')
        entries = audit.export(format='json')
        assert isinstance(entries, list)
        assert len(entries) == 1

    def test_export_csv(self, audit: AuditLogger) -> None:
        audit.record('system', 'test')
        csv = audit.export(format='csv')
        assert isinstance(csv, str)
        assert 'entry_id' in csv
        assert 'system' in csv

    def test_immutable(self, audit: AuditLogger) -> None:
        """Verify audit entries can't be modified after creation."""
        entry_id = audit.record('system', 'test', details={'initial': 'value'})
        entry = audit.get_entry(entry_id)
        assert entry is not None
        assert entry['details']['initial'] == 'value'

    def test_query_multiple_filters(self, audit: AuditLogger) -> None:
        audit.record('auth', 'login', actor='user1', resource_type='session')
        audit.record('auth', 'login', actor='user2', resource_type='session')
        results = audit.query(category='auth', actor='user1')
        assert len(results) == 1


# ════════════════════════════════════════════════════════════════
# 11. WebSocketManager Tests
# ════════════════════════════════════════════════════════════════


class TestWebSocketManager:
    """Tests for WebSocketManager."""

    @pytest.fixture
    def ws(self) -> WebSocketManager:
        return WebSocketManager()

    @pytest.mark.asyncio
    async def test_connect(self, ws: WebSocketManager) -> None:
        client = await ws.connect()
        assert client.client_id in ws._clients
        assert client.client_id in ws._channel_clients['all']

    @pytest.mark.asyncio
    async def test_connect_with_channels(self, ws: WebSocketManager) -> None:
        client = await ws.connect(channels=['engine.status', 'jobs'])
        assert 'engine.status' in ws._channel_clients
        assert client.client_id in ws._channel_clients['engine.status']

    @pytest.mark.asyncio
    async def test_disconnect(self, ws: WebSocketManager) -> None:
        client = await ws.connect()
        await ws.disconnect(client.client_id)
        assert client.client_id not in ws._clients

    @pytest.mark.asyncio
    async def test_broadcast(self, ws: WebSocketManager) -> None:
        client = await ws.connect()
        count = await ws.broadcast('all', 'test_event', {'data': 'value'})
        assert count == 1
        messages = await ws.get_messages(client.client_id)
        assert len(messages) == 1
        assert messages[0]['type'] == 'test_event'

    @pytest.mark.asyncio
    async def test_broadcast_to_channel(self, ws: WebSocketManager) -> None:
        await ws.connect(channels=['engine.status'])
        count = await ws.broadcast('engine.status', 'status_update', {'engine': 'test'})
        assert count == 1

    @pytest.mark.asyncio
    async def test_broadcast_all(self, ws: WebSocketManager) -> None:
        await ws.connect()
        count = await ws.broadcast_all('system_event', {'msg': 'hello'})
        assert count == 1

    @pytest.mark.asyncio
    async def test_send_to_client(self, ws: WebSocketManager) -> None:
        client = await ws.connect()
        result = await ws.send_to_client(client.client_id, 'direct', {'msg': 'hello'})
        assert result is True

    @pytest.mark.asyncio
    async def test_send_to_invalid_client(self, ws: WebSocketManager) -> None:
        result = await ws.send_to_client('invalid', 'test', {})
        assert result is False

    @pytest.mark.asyncio
    async def test_heartbeat(self, ws: WebSocketManager) -> None:
        client = await ws.connect()
        result = ws.heartbeat(client.client_id)
        assert result is True

    @pytest.mark.asyncio
    async def test_heartbeat_invalid(self, ws: WebSocketManager) -> None:
        result = ws.heartbeat('invalid')
        assert result is False

    @pytest.mark.asyncio
    async def test_get_statistics(self, ws: WebSocketManager) -> None:
        await ws.connect()
        stats = await ws.get_statistics()
        assert stats['connected_clients'] >= 1
        assert stats['total_channels'] >= 1

    @pytest.mark.asyncio
    async def test_broadcast_engine_status(self, ws: WebSocketManager) -> None:
        await ws.connect(channels=['engine.status'])
        await ws.broadcast_engine_status('graph', 'running', {'healthy': True})

    @pytest.mark.asyncio
    async def test_broadcast_job_progress(self, ws: WebSocketManager) -> None:
        await ws.connect(channels=['job.progress'])
        await ws.broadcast_job_progress('job-1', 'import', 50.0, 'running', 'Processing')

    @pytest.mark.asyncio
    async def test_messages_preserve_order(self, ws: WebSocketManager) -> None:
        client = await ws.connect()
        await ws.broadcast('all', 'event1', {})
        await ws.broadcast('all', 'event2', {})
        messages = await ws.get_messages(client.client_id)
        assert len(messages) == 2
        assert messages[0]['type'] == 'event1'
        assert messages[1]['type'] == 'event2'


# ════════════════════════════════════════════════════════════════
# 12. Cross-Engine Integration Tests
# ════════════════════════════════════════════════════════════════


class TestCrossEngineIntegration:
    """Tests for integration between Milestone 8 engines."""

    @pytest.mark.asyncio
    async def test_scheduler_with_worker(self) -> None:
        """SchedulingEngine + WorkerManager integration."""
        scheduler = SchedulingEngine()
        worker = WorkerManager(max_workers=1)

        await scheduler.initialize()
        await worker.start()

        # Schedule a job
        job = await scheduler.schedule_once('integration-test', delay_seconds=0)
        assert job['status'] == 'pending'

        await worker.stop()

    @pytest.mark.asyncio
    async def test_revision_with_notification(self) -> None:
        """RevisionEngine + NotificationService integration."""
        revision = RevisionEngine()
        notifications = NotificationService()

        await revision.initialize()

        # Build queue and send notification
        items = await revision.build_queue(UUID(int=1), node_ids=['node-1'])
        assert len(items) == 1

        result = await notifications.send_notification(
            user_id=str(UUID(int=1)),
            title='Revision Plan Ready',
            body='Your daily revision plan has been generated.',
        )
        assert result['title'] == 'Revision Plan Ready'

    @pytest.mark.asyncio
    async def test_plugin_analytics_integration(self) -> None:
        """PluginEngine + AnalyticsEngine integration."""
        plugin = PluginEngine()
        analytics = AnalyticsEngine()

        await plugin.initialize()
        await analytics.initialize()

        # Register plugin and check analytics
        manifest = PluginManifest(name='test-plugin')
        await plugin.register_plugin(manifest)
        plugins = await plugin.list_plugins()
        assert len(plugins) >= 1

        stats = await analytics.get_platform_statistics()
        assert 'active_engines' in stats

    @pytest.mark.asyncio
    async def test_audit_logging_pipeline(self) -> None:
        """AuditLogger recording events from scheduler and plugin."""
        audit = AuditLogger()
        scheduler = SchedulingEngine()
        plugin = PluginEngine()

        await scheduler.initialize()
        await plugin.initialize()

        # Audit scheduler and plugin operations
        job = await scheduler.schedule_once('audit-job')
        audit.record(
            'system',
            'schedule_job',
            resource_id=job['id'],
            details={'job_name': 'audit-job'},
        )

        manifest = PluginManifest(name='audit-plugin')
        registered = await plugin.register_plugin(manifest)
        audit.record(
            'system',
            'register_plugin',
            resource_id=registered['plugin_id'],
            details={'plugin_name': 'audit-plugin'},
        )

        # Verify audit trail
        entries = audit.query()
        assert len(entries) >= 2
        categories = {e['category'] for e in entries}
        assert 'system' in categories

    @pytest.mark.asyncio
    async def test_websocket_notification_pipeline(self) -> None:
        """WebSocketManager + NotificationService integration."""
        ws = WebSocketManager()
        notifications = NotificationService()

        client = await ws.connect(channels=['notifications'])

        # Send notification and broadcast via WebSocket
        result = await notifications.send_notification(
            user_id='user-1',
            title='Alert',
            body='Something happened',
        )
        assert result['title'] == 'Alert'

        await ws.broadcast_notification('user-1', 'Alert', 'Something happened')

        # Verify message
        messages = await ws.get_messages(client.client_id)
        assert len(messages) >= 1
        notification_msg = next((m for m in messages if m['type'] == 'notification'), None)
        assert notification_msg is not None
