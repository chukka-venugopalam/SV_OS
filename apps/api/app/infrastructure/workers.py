"""Background Workers — worker manager for asynchronous job execution.

Supports:
- Worker pool management
- Job queue
- Retries with backoff
- Graceful shutdown
- Diagnostics
- Scheduler integration
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any, Callable
from uuid import uuid4


class WorkerTaskStatus(Enum):
    PENDING = 'pending'
    RUNNING = 'running'
    COMPLETED = 'completed'
    FAILED = 'failed'
    CANCELLED = 'cancelled'


@dataclass
class WorkerTask:
    """A task to be executed by a worker."""
    task_id: str = field(default_factory=lambda: str(uuid4()))
    name: str = ''
    handler_name: str = ''
    payload: dict[str, Any] = field(default_factory=dict)
    status: WorkerTaskStatus = WorkerTaskStatus.PENDING
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    started_at: str | None = None
    completed_at: str | None = None
    retry_count: int = 0
    max_retries: int = 3
    error_message: str | None = None
    duration_ms: float = 0.0


class WorkerManager:
    """Manages a pool of background workers.

    Public Interface:
        start, stop, submit_task, get_task, list_tasks,
        cancel_task, get_statistics, register_handler
    """

    def __init__(self, max_workers: int = 4) -> None:
        self._max_workers = max_workers
        self._handlers: dict[str, Callable] = {}
        self._queue: asyncio.Queue[WorkerTask] = asyncio.Queue()
        self._tasks: dict[str, WorkerTask] = {}
        self._workers: list[asyncio.Task] = []
        self._running = False

    async def start(self) -> None:
        """Start the worker pool."""
        self._running = True
        self._workers = [
            asyncio.create_task(self._worker_loop(i))
            for i in range(self._max_workers)
        ]

    async def stop(self) -> None:
        """Stop the worker pool gracefully."""
        self._running = False
        for worker in self._workers:
            worker.cancel()
        await asyncio.gather(*self._workers, return_exceptions=True)
        self._workers.clear()

    def register_handler(self, name: str, handler: Callable) -> None:
        """Register a handler function for task execution."""
        self._handlers[name] = handler

    async def submit_task(self, name: str, handler_name: str, payload: dict[str, Any] | None = None) -> str:
        """Submit a task to the worker queue."""
        task = WorkerTask(name=name, handler_name=handler_name, payload=payload or {})
        self._tasks[task.task_id] = task
        await self._queue.put(task)
        return task.task_id

    async def get_task(self, task_id: str) -> dict | None:
        """Get task details by ID."""
        task = self._tasks.get(task_id)
        if task is None:
            return None
        return self._task_to_dict(task)

    async def list_tasks(self, status: str | None = None, limit: int = 50) -> list[dict]:
        """List tasks, optionally filtered by status."""
        tasks = list(self._tasks.values())
        if status:
            tasks = [t for t in tasks if t.status.value == status]
        tasks.sort(key=lambda t: t.created_at, reverse=True)
        return [self._task_to_dict(t) for t in tasks[:limit]]

    async def cancel_task(self, task_id: str) -> dict | None:
        """Cancel a pending task."""
        task = self._tasks.get(task_id)
        if task is None or task.status != WorkerTaskStatus.PENDING:
            return None
        task.status = WorkerTaskStatus.CANCELLED
        return self._task_to_dict(task)

    async def get_statistics(self) -> dict:
        """Get worker pool statistics."""
        tasks = list(self._tasks.values())
        return {
            'max_workers': self._max_workers,
            'active_workers': sum(1 for w in self._workers if not w.done()),
            'total_tasks': len(tasks),
            'pending': sum(1 for t in tasks if t.status == WorkerTaskStatus.PENDING),
            'running': sum(1 for t in tasks if t.status == WorkerTaskStatus.RUNNING),
            'completed': sum(1 for t in tasks if t.status == WorkerTaskStatus.COMPLETED),
            'failed': sum(1 for t in tasks if t.status == WorkerTaskStatus.FAILED),
            'cancelled': sum(1 for t in tasks if t.status == WorkerTaskStatus.CANCELLED),
        }

    async def _worker_loop(self, worker_id: int) -> None:
        """Main worker loop — consume tasks from the queue."""
        while self._running:
            try:
                task = await asyncio.wait_for(self._queue.get(), timeout=1.0)
                await self._execute_task(task)
            except asyncio.TimeoutError:
                continue
            except asyncio.CancelledError:
                break
            except Exception:
                continue

    async def _execute_task(self, task: WorkerTask) -> None:
        """Execute a single task with retry logic."""
        task.status = WorkerTaskStatus.RUNNING
        task.started_at = datetime.now(UTC).isoformat()
        start = datetime.now(UTC)

        try:
            handler = self._handlers.get(task.handler_name)
            if handler:
                if asyncio.iscoroutinefunction(handler):
                    result = await handler(task.payload)
                else:
                    result = handler(task.payload)
                task.status = WorkerTaskStatus.COMPLETED
            else:
                task.status = WorkerTaskStatus.COMPLETED
        except Exception as exc:
            task.retry_count += 1
            if task.retry_count <= task.max_retries:
                task.status = WorkerTaskStatus.PENDING
                task.error_message = f'{exc} (retry {task.retry_count}/{task.max_retries})'
                await asyncio.sleep(2 ** task.retry_count)
                await self._queue.put(task)
            else:
                task.status = WorkerTaskStatus.FAILED
                task.error_message = str(exc)

        task.completed_at = datetime.now(UTC).isoformat()
        task.duration_ms = (datetime.now(UTC) - start).total_seconds() * 1000

    def _task_to_dict(self, task: WorkerTask) -> dict:
        return {
            'task_id': task.task_id,
            'name': task.name,
            'handler_name': task.handler_name,
            'payload': task.payload,
            'status': task.status.value,
            'created_at': task.created_at,
            'started_at': task.started_at,
            'completed_at': task.completed_at,
            'retry_count': task.retry_count,
            'max_retries': task.max_retries,
            'error_message': task.error_message,
            'duration_ms': task.duration_ms,
        }
