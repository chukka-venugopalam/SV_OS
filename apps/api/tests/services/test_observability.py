"""Tests for ObservabilityService — AI telemetry tracking."""

from __future__ import annotations

from app.services.ai.observability import ObservabilityService


class TestObservabilityService:
    """Test AI operation telemetry tracking."""

    async def test_start_operation_returns_id(self) -> None:
        """Start operation returns a unique operation ID."""
        obs = ObservabilityService()
        op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
        assert op_id is not None
        assert isinstance(op_id, str)

    async def test_end_operation_updates_metrics(self) -> None:
        """End operation updates telemetry with results."""
        obs = ObservabilityService()
        op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
        obs.end_operation(op_id, success=True, prompt_tokens=100, completion_tokens=50)

        metrics = obs.get_metrics()
        assert metrics['total_operations'] == 1
        assert metrics['successful'] == 1
        assert metrics['tokens']['prompt'] == 100
        assert metrics['tokens']['completion'] == 50
        assert metrics['tokens']['total'] == 150

    async def test_cost_estimation(self) -> None:
        """Cost is estimated based on token usage and provider pricing."""
        obs = ObservabilityService()
        op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
        obs.end_operation(op_id, success=True, prompt_tokens=1000, completion_tokens=500)

        metrics = obs.get_metrics()
        assert metrics['estimated_cost_usd'] > 0

        # OpenAI: 1000 * 0.0025/1000 + 500 * 0.010/1000 = 0.0025 + 0.005 = 0.0075
        assert round(metrics['estimated_cost_usd'], 4) == 0.0075

    async def test_failed_operation_tracking(self) -> None:
        """Failed operations are counted separately."""
        obs = ObservabilityService()
        op_id = obs.start_operation('ollama', 'llama3', 'chat')
        obs.end_operation(op_id, success=False, error='API timeout')

        metrics = obs.get_metrics()
        assert metrics['total_operations'] == 1
        assert metrics['successful'] == 0
        assert metrics['failed'] == 1
        assert metrics['error_rate'] == 100.0

    async def test_cached_operation_tracking(self) -> None:
        """Cached operations are tracked separately."""
        obs = ObservabilityService()
        op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
        obs.end_operation(op_id, success=True, cached=True)

        metrics = obs.get_metrics()
        assert metrics['cache_hit_rate'] > 0

    async def test_latency_tracking(self) -> None:
        """Latency is tracked in milliseconds."""
        import time

        obs = ObservabilityService()
        op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
        time.sleep(0.01)
        obs.end_operation(op_id, success=True)

        metrics = obs.get_metrics()
        assert metrics['latency_ms']['avg'] > 0
        assert metrics['latency_ms']['max'] > 0

    async def test_operation_log(self) -> None:
        """Operation log entries contain full details."""
        obs = ObservabilityService()
        op_id = obs.start_operation('deepseek', 'deepseek-chat', 'tutor')
        obs.end_operation(op_id, success=True, prompt_tokens=50, completion_tokens=30)

        log = obs.get_operation_log()
        assert len(log) == 1
        assert log[0]['provider'] == 'deepseek'
        assert log[0]['operation'] == 'tutor'
        assert log[0]['total_tokens'] == 80

    async def test_operation_log_pagination(self) -> None:
        """Operation log supports limit and offset."""
        obs = ObservabilityService()
        for _i in range(10):
            op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
            obs.end_operation(op_id, success=True)

        log = obs.get_operation_log(limit=3, offset=0)
        assert len(log) == 3

    async def test_reset_metrics(self) -> None:
        """Reset clears all collected metrics."""
        obs = ObservabilityService()
        op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
        obs.end_operation(op_id, success=True)
        obs.reset_metrics()

        metrics = obs.get_metrics()
        assert metrics['total_operations'] == 0

    async def test_by_operation_breakdown(self) -> None:
        """Metrics break down by operation type."""
        obs = ObservabilityService()
        for _i in range(3):
            op_id = obs.start_operation('openai', 'gpt-4o', 'chat')
            obs.end_operation(op_id, success=True, prompt_tokens=100, completion_tokens=50)

        op_id = obs.start_operation('anthropic', 'claude-3', 'tutor')
        obs.end_operation(op_id, success=True, prompt_tokens=200, completion_tokens=100)

        metrics = obs.get_metrics()
        assert 'chat' in metrics['by_operation']
        assert 'tutor' in metrics['by_operation']
        assert metrics['by_operation']['tutor']['count'] == 1

    async def test_empty_metrics(self) -> None:
        """Empty state returns zeros."""
        obs = ObservabilityService()
        metrics = obs.get_metrics()
        assert metrics['total_operations'] == 0
        assert metrics['estimated_cost_usd'] == 0.0

    async def test_ollama_cost_zero(self) -> None:
        """Ollama operations cost $0."""
        obs = ObservabilityService()
        op_id = obs.start_operation('ollama', 'llama3', 'chat')
        obs.end_operation(op_id, success=True, prompt_tokens=10000, completion_tokens=5000)
        metrics = obs.get_metrics()
        assert metrics['estimated_cost_usd'] == 0.0
