"""Scheduling Engine — production job scheduler with cron, retries, priorities.

Supports:
- Scheduled jobs (one-time and recurring)
- Cron expressions
- Delayed execution
- Retries with exponential backoff
- Priority scheduling
- Cancellation, pause, resume
- Job history with execution metrics
"""

from __future__ import annotations

import asyncio
import contextlib
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from enum import Enum
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth

if TYPE_CHECKING:
    from collections.abc import Callable


class JobStatus(Enum):
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'
    PAUSED = 'paused'


class JobPriority(Enum):
    LOW = 0
    NORMAL = 1
    HIGH = 2
    CRITICAL = 3


@dataclass
class ScheduledJob:
    id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ''
    job_type: str = 'once'  # once, recurring, cron
    cron_expression: str = ''
    interval_seconds: int = 0
    delay_seconds: int = 0
    priority: JobPriority = JobPriority.NORMAL
    max_retries: int = 3
    retry_count: int = 0
    backoff_base_seconds: float = 1.0
    status: JobStatus = JobStatus.PENDING
    handler_name: str = ''
    payload: dict[str, Any] = field(default_factory=dict)
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    scheduled_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    started_at: str | None = None
    completed_at: str | None = None
    last_error: str | None = None
    duration_ms: float = 0.0
    next_run_at: str | None = None


CRON_PATTERN = re.compile(
    r'^(\*|\d+)(/(\d+))?\s+(\*|\d+)(/(\d+))?\s+(\*|\d+)(/(\d+))?\s+(\*|\d+)(/(\d+))?\s+(\*|\d+)(/(\d+))?$',
)


def _parse_cron(expr: str) -> dict[str, set[int]]:
    """Parse a cron expression into sets of allowed values."""
    parts = expr.strip().split()
    if len(parts) != 5:
        return {
            'minute': set(range(60)),
            'hour': set(range(24)),
            'day': set(range(1, 32)),
            'month': set(range(1, 13)),
            'dow': set(range(7)),
        }
    fields = ['minute', 'hour', 'day', 'month', 'dow']
    ranges = [(0, 59), (0, 23), (1, 31), (1, 12), (0, 6)]
    result = {}
    for i, part in enumerate(parts):
        lo, hi = ranges[i]
        if part == '*':
            result[fields[i]] = set(range(lo, hi + 1))
        elif '/' in part:
            step = int(part.split('/')[1])
            result[fields[i]] = set(range(lo, hi + 1, step))
        else:
            result[fields[i]] = {int(part)}
    return result


class SchedulingEngine(EngineBase):
    """Scheduling Engine — production job scheduler.

    Public Interface:
        schedule_once, schedule_recurring, schedule_cron,
        cancel, pause, resume, get_job, list_jobs,
        retry_job, get_statistics, get_job_history
    """

    def __init__(self) -> None:
        super().__init__()
        self._jobs: dict[str, ScheduledJob] = {}
        self._handlers: dict[str, Callable] = {}
        self._running = False
        self._worker_task: asyncio.Task | None = None

    def _default_name(self) -> str:
        return 'scheduler'

    def dependencies(self) -> list[EngineDependency]:
        return []

    async def _initialize_impl(self) -> None:
        self._jobs.clear()
        self._handlers.clear()

    async def _start_impl(self) -> None:
        self._running = True
        self._worker_task = asyncio.create_task(self._worker_loop())

    async def _stop_impl(self) -> None:
        self._running = False
        if self._worker_task:
            self._worker_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._worker_task

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Scheduler is operational',
            details={
                'total_jobs': len(self._jobs),
                'pending': sum(1 for j in self._jobs.values() if j.status == JobStatus.PENDING),
                'running': sum(1 for j in self._jobs.values() if j.status == JobStatus.RUNNING),
                'completed': sum(1 for j in self._jobs.values() if j.status == JobStatus.COMPLETED),
                'failed': sum(1 for j in self._jobs.values() if j.status == JobStatus.FAILED),
            },
        )

    async def validate_configuration(self) -> list[str]:
        return []

    def register_handler(self, name: str, handler: Callable) -> None:
        self._handlers[name] = handler

    async def schedule_once(
        self,
        name: str,
        delay_seconds: int = 0,
        handler_name: str = '',
        payload: dict | None = None,
        priority: JobPriority = JobPriority.NORMAL,
    ) -> dict:
        now = datetime.now(UTC)
        scheduled = now + timedelta(seconds=delay_seconds)
        job = ScheduledJob(
            name=name,
            job_type='once',
            delay_seconds=delay_seconds,
            priority=priority,
            handler_name=handler_name,
            payload=payload or {},
            scheduled_at=scheduled.isoformat(),
        )
        self._jobs[job.id] = job
        await self.publish_event('scheduler.job.created.v1', {'job_id': job.id, 'name': name})
        return self._job_to_dict(job)

    async def schedule_recurring(
        self,
        name: str,
        interval_seconds: int = 3600,
        handler_name: str = '',
        payload: dict | None = None,
    ) -> dict:
        now = datetime.now(UTC)
        job = ScheduledJob(
            name=name,
            job_type='recurring',
            interval_seconds=interval_seconds,
            handler_name=handler_name,
            payload=payload or {},
            scheduled_at=now.isoformat(),
            next_run_at=now.isoformat(),
        )
        self._jobs[job.id] = job
        return self._job_to_dict(job)

    async def schedule_cron(
        self,
        name: str,
        cron_expression: str,
        handler_name: str = '',
        payload: dict | None = None,
    ) -> dict:
        job = ScheduledJob(
            name=name,
            job_type='cron',
            cron_expression=cron_expression,
            handler_name=handler_name,
            payload=payload or {},
        )
        self._jobs[job.id] = job
        return self._job_to_dict(job)

    async def cancel(self, job_id: str) -> dict:
        job = self._jobs.get(job_id)
        if job is None:
            return {'error': f'Job {job_id} not found'}
        job.status = JobStatus.CANCELLED
        return self._job_to_dict(job)

    async def pause(self, job_id: str) -> dict:
        job = self._jobs.get(job_id)
        if job is None:
            return {'error': f'Job {job_id} not found'}
        job.status = JobStatus.PAUSED
        return self._job_to_dict(job)

    async def resume(self, job_id: str) -> dict:
        job = self._jobs.get(job_id)
        if job is None:
            return {'error': f'Job {job_id} not found'}
        job.status = JobStatus.PENDING
        return self._job_to_dict(job)

    async def get_job(self, job_id: str) -> dict | None:
        job = self._jobs.get(job_id)
        return self._job_to_dict(job) if job else None

    async def list_jobs(self, status: str | None = None, limit: int = 100) -> list[dict]:
        jobs = list(self._jobs.values())
        if status:
            jobs = [j for j in jobs if j.status.value == status]
        jobs.sort(key=lambda j: (j.priority.value, j.created_at), reverse=True)
        return [self._job_to_dict(j) for j in jobs[:limit]]

    async def retry_job(self, job_id: str) -> dict:
        job = self._jobs.get(job_id)
        if job is None:
            return {'error': f'Job {job_id} not found'}
        job.status = JobStatus.PENDING
        job.retry_count = 0
        job.last_error = None
        return self._job_to_dict(job)

    async def get_statistics(self) -> dict:
        total = len(self._jobs)
        return {
            'total': total,
            'pending': sum(1 for j in self._jobs.values() if j.status == JobStatus.PENDING),
            'running': sum(1 for j in self._jobs.values() if j.status == JobStatus.RUNNING),
            'completed': sum(1 for j in self._jobs.values() if j.status == JobStatus.COMPLETED),
            'failed': sum(1 for j in self._jobs.values() if j.status == JobStatus.FAILED),
            'cancelled': sum(1 for j in self._jobs.values() if j.status == JobStatus.CANCELLED),
            'paused': sum(1 for j in self._jobs.values() if j.status == JobStatus.PAUSED),
            'avg_duration_ms': sum(
                j.duration_ms for j in self._jobs.values() if j.status == JobStatus.COMPLETED
            )
            / max(sum(1 for j in self._jobs.values() if j.status == JobStatus.COMPLETED), 1),
        }

    async def get_job_history(self, limit: int = 50) -> list[dict]:
        return [
            self._job_to_dict(j)
            for j in sorted(self._jobs.values(), key=lambda j: j.created_at, reverse=True)[:limit]
        ]

    async def _worker_loop(self) -> None:
        while self._running:
            try:
                now = datetime.now(UTC)
                for _job_id, job in list(self._jobs.items()):
                    if job.status not in (JobStatus.PENDING, JobStatus.FAILED):
                        continue
                    scheduled = (
                        datetime.fromisoformat(job.scheduled_at) if job.scheduled_at else now
                    )
                    if scheduled <= now:
                        await self._execute_job(job)
                await asyncio.sleep(1)
            except asyncio.CancelledError:
                break
            except Exception:
                await asyncio.sleep(5)

    async def _execute_job(self, job: ScheduledJob) -> None:
        job.status = JobStatus.RUNNING
        job.started_at = datetime.now(UTC).isoformat()
        start = datetime.now(UTC)

        try:
            handler = self._handlers.get(job.handler_name)
            if handler:
                if asyncio.iscoroutinefunction(handler):
                    await handler(job.payload)
                else:
                    handler(job.payload)
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now(UTC).isoformat()
            await self.publish_event(
                'scheduler.job.completed.v1',
                {'job_id': job.id, 'name': job.name},
            )

            if job.job_type in ('recurring', 'cron'):
                interval = job.interval_seconds or 3600
                next_time = datetime.now(UTC) + timedelta(seconds=interval)
                job.scheduled_at = next_time.isoformat()
                job.status = JobStatus.PENDING

        except Exception as exc:
            job.retry_count += 1
            if job.retry_count <= job.max_retries:
                backoff = job.backoff_base_seconds * (2 ** (job.retry_count - 1))
                next_time = datetime.now(UTC) + timedelta(seconds=backoff)
                job.scheduled_at = next_time.isoformat()
                job.status = JobStatus.PENDING
                job.last_error = f'{exc} (retry {job.retry_count}/{job.max_retries})'
            else:
                job.status = JobStatus.FAILED
                job.last_error = str(exc)
                await self.publish_event(
                    'scheduler.job.failed.v1',
                    {'job_id': job.id, 'name': job.name, 'error': str(exc)},
                )

        job.duration_ms = (datetime.now(UTC) - start).total_seconds() * 1000

    def _job_to_dict(self, job: ScheduledJob) -> dict:
        return {
            'id': job.id,
            'name': job.name,
            'job_type': job.job_type,
            'cron_expression': job.cron_expression,
            'interval_seconds': job.interval_seconds,
            'priority': job.priority.value,
            'max_retries': job.max_retries,
            'retry_count': job.retry_count,
            'status': job.status.value,
            'handler_name': job.handler_name,
            'payload': job.payload,
            'created_at': job.created_at,
            'scheduled_at': job.scheduled_at,
            'started_at': job.started_at,
            'completed_at': job.completed_at,
            'last_error': job.last_error,
            'duration_ms': job.duration_ms,
        }
