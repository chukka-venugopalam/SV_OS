"""Observability Service — tracks latency, token usage, cost, and errors for AI calls.

Provides:
- Per-request AI telemetry collection
- Token usage tracking per provider
- Cost estimation based on provider pricing
- Latency tracking
- Error rate monitoring
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID, uuid4

from structlog.stdlib import get_logger

logger = get_logger(__name__)

# Approximate cost per 1K tokens (USD) — update as prices change
PROVIDER_COSTS: dict[str, dict[str, float]] = {
    'openai': {'input': 0.0025, 'output': 0.010},
    'anthropic': {'input': 0.003, 'output': 0.015},
    'deepseek': {'input': 0.0005, 'output': 0.002},
    'ollama': {'input': 0.0, 'output': 0.0},
    'gemini': {'input': 0.0005, 'output': 0.0015},
}


@dataclass
class AITelemetry:
    """Telemetry data for a single AI operation."""

    operation_id: str = field(default_factory=lambda: str(uuid4()))
    provider: str = ''
    model: str = ''
    operation: str = ''  # chat, embed, search, tutor, quiz, etc.
    user_id: str = ''
    session_id: str = ''
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    latency_ms: float = 0.0
    estimated_cost: float = 0.0
    success: bool = True
    error: str = ''
    cached: bool = False
    timestamp: float = field(default_factory=time.time)


class ObservabilityService:
    """Tracks AI operation metrics for monitoring and cost analysis.

    Collects per-operation telemetry and exposes aggregate metrics.
    Designed to feed into external monitoring systems (Prometheus,
    DataDog, etc.) via the metrics export method.
    """

    def __init__(self) -> None:
        self._operations: list[AITelemetry] = []
        self._max_operations = 10000

    # ── Tracking ───────────────────────────────────────────────────

    def start_operation(
        self,
        provider: str,
        model: str,
        operation: str,
        user_id: UUID | None = None,
        session_id: UUID | None = None,
    ) -> str:
        """Record the start of an AI operation. Returns operation_id."""
        telemetry = AITelemetry(
            provider=provider,
            model=model,
            operation=operation,
            user_id=str(user_id) if user_id else '',
            session_id=str(session_id) if session_id else '',
        )
        self._operations.append(telemetry)
        if len(self._operations) > self._max_operations:
            self._operations = self._operations[-self._max_operations :]
        return telemetry.operation_id

    def end_operation(
        self,
        operation_id: str,
        success: bool = True,
        error: str = '',
        prompt_tokens: int = 0,
        completion_tokens: int = 0,
        cached: bool = False,
    ) -> None:
        """Record the completion of an AI operation."""
        for op in reversed(self._operations):
            if op.operation_id == operation_id:
                op.success = success
                op.error = error
                op.prompt_tokens = prompt_tokens
                op.completion_tokens = completion_tokens
                op.total_tokens = prompt_tokens + completion_tokens
                op.latency_ms = (time.time() - op.timestamp) * 1000
                op.cached = cached
                op.estimated_cost = self._estimate_cost(
                    op.provider,
                    prompt_tokens,
                    completion_tokens,
                )

                if not success:
                    logger.warning(
                        'ai_operation_failed',
                        provider=op.provider,
                        operation=op.operation,
                        error=error,
                        latency_ms=op.latency_ms,
                    )
                return

    def _estimate_cost(
        self,
        provider: str,
        prompt_tokens: int,
        completion_tokens: int,
    ) -> float:
        """Estimate USD cost for token usage."""
        costs = PROVIDER_COSTS.get(provider, {'input': 0.0, 'output': 0.0})
        input_cost = (prompt_tokens / 1000) * costs['input']
        output_cost = (completion_tokens / 1000) * costs['output']
        return round(input_cost + output_cost, 6)

    # ── Aggregated Metrics ─────────────────────────────────────────

    def get_metrics(self) -> dict:
        """Get aggregated metrics since last reset or session start."""
        total_ops = len(self._operations)
        if total_ops == 0:
            return self._empty_metrics()

        successful = [o for o in self._operations if o.success]
        failed = [o for o in self._operations if not o.success]
        cached_ops = [o for o in self._operations if o.cached]

        latencies = [o.latency_ms for o in successful]
        avg_latency = sum(latencies) / len(latencies) if latencies else 0.0
        max_latency = max(latencies) if latencies else 0.0
        p95_latency = (
            sorted(latencies)[int(len(latencies) * 0.95)] if len(latencies) > 20 else max_latency
        )

        total_prompt = sum(o.prompt_tokens for o in self._operations)
        total_completion = sum(o.completion_tokens for o in self._operations)
        total_cost = sum(o.estimated_cost for o in self._operations)

        # Per-operation breakdown
        by_operation: dict[str, dict[str, Any]] = {}
        for op in self._operations:
            if op.operation not in by_operation:
                by_operation[op.operation] = {'count': 0, 'total_tokens': 0, 'errors': 0}
            by_operation[op.operation]['count'] += 1
            by_operation[op.operation]['total_tokens'] += op.total_tokens
            if not op.success:
                by_operation[op.operation]['errors'] += 1

        return {
            'total_operations': total_ops,
            'successful': len(successful),
            'failed': len(failed),
            'error_rate': round(len(failed) / total_ops * 100, 2) if total_ops else 0.0,
            'cache_hit_rate': round(len(cached_ops) / total_ops * 100, 2) if total_ops else 0.0,
            'latency_ms': {
                'avg': round(avg_latency, 2),
                'max': round(max_latency, 2),
                'p95': round(p95_latency, 2),
            },
            'tokens': {
                'total': total_prompt + total_completion,
                'prompt': total_prompt,
                'completion': total_completion,
            },
            'estimated_cost_usd': round(total_cost, 4),
            'by_operation': by_operation,
        }

    def get_operation_log(
        self,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict]:
        """Get raw operation log for debugging."""
        ops = list(reversed(self._operations))
        return [
            {
                'operation_id': o.operation_id,
                'provider': o.provider,
                'model': o.model,
                'operation': o.operation,
                'latency_ms': round(o.latency_ms, 2),
                'total_tokens': o.total_tokens,
                'estimated_cost': o.estimated_cost,
                'success': o.success,
                'error': o.error,
                'cached': o.cached,
                'timestamp': o.timestamp,
            }
            for o in ops[offset : offset + limit]
        ]

    def reset_metrics(self) -> None:
        """Reset all collected metrics."""
        self._operations.clear()

    def _empty_metrics(self) -> dict:
        return {
            'total_operations': 0,
            'successful': 0,
            'failed': 0,
            'error_rate': 0.0,
            'cache_hit_rate': 0.0,
            'latency_ms': {'avg': 0.0, 'max': 0.0, 'p95': 0.0},
            'tokens': {'total': 0, 'prompt': 0, 'completion': 0},
            'estimated_cost_usd': 0.0,
            'by_operation': {},
        }
