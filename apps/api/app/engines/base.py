"""EngineBase — common base class for every SV-OS engine.

Defines the engine lifecycle and the interface every engine must implement.
All canonical engines inherit from EngineBase.
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import UTC, datetime
from enum import Enum
from typing import Any
from uuid import uuid4

# ── Engine Lifecycle States ───────────────────────────────────────


class EngineState(Enum):
    """Lifecycle state of an engine."""

    UNINITIALIZED = 'uninitialized'
    INITIALIZING = 'initializing'
    READY = 'ready'
    RUNNING = 'running'
    STOPPING = 'stopping'
    STOPPED = 'stopped'
    FAILED = 'failed'


# ── Engine Metadata ───────────────────────────────────────────────


@dataclass
class EngineMetadata:
    """Metadata describing an engine instance."""

    engine_id: str = field(default_factory=lambda: str(uuid4()))
    engine_name: str = ''
    engine_version: str = '0.1.0'
    engine_class: str = ''
    state: EngineState = EngineState.UNINITIALIZED
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    initialized_at: str | None = None
    started_at: str | None = None
    stopped_at: str | None = None
    error_message: str | None = None


# ── Dependency Descriptor ─────────────────────────────────────────


@dataclass
class EngineDependency:
    """Describes a dependency on another engine."""

    engine_name: str
    required: bool = True
    description: str = ''


# ── Engine Health ─────────────────────────────────────────────────


@dataclass
class EngineHealth:
    """Health status of an engine at a point in time."""

    engine_name: str
    state: EngineState
    healthy: bool
    message: str = ''
    details: dict[str, Any] = field(default_factory=dict)
    checked_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())


# ── EngineBase ────────────────────────────────────────────────────


class EngineBase(ABC):
    """Abstract base class for all SV-OS engines.

    Every canonical engine inherits from EngineBase and implements the
    abstract interface methods.

    Lifecycle:
        1. Instantiate (state = UNINITIALIZED)
        2. initialize() -> READY or FAILED
        3. start() -> RUNNING
        4. stop() -> STOPPED
    """

    def __init__(self) -> None:
        self._metadata = EngineMetadata(
            engine_name=self._default_name(),
            engine_class=type(self).__name__,
        )
        self._event_bus: Any = None  # Injected after construction
        self._initialized = False
        self._started = False

    # ── Abstract Interface ─────────────────────────────────────────

    @abstractmethod
    def _default_name(self) -> str:
        """Return the canonical name for this engine type."""
        ...

    @abstractmethod
    async def _initialize_impl(self) -> None:
        """Engine-specific initialization logic.

        Called by initialize() after state transitions.
        Override this instead of initialize() to ensure lifecycle
        state tracking is preserved.
        """
        ...

    @abstractmethod
    async def _start_impl(self) -> None:
        """Engine-specific start logic.

        Called by start() after state transitions.
        """
        ...

    @abstractmethod
    async def _stop_impl(self) -> None:
        """Engine-specific stop / teardown logic.

        Called by stop() before state transitions.
        """
        ...

    @abstractmethod
    async def health_impl(self) -> EngineHealth:
        """Engine-specific health check logic."""
        ...

    @abstractmethod
    async def validate_configuration(self) -> list[str]:
        """Validate engine configuration and return a list of issues.

        Returns an empty list if configuration is valid.
        """
        ...

    @abstractmethod
    def dependencies(self) -> list[EngineDependency]:
        """Return the list of engines this engine depends on."""
        ...

    # ── Lifecycle ─────────────────────────────────────────────────

    async def initialize(self) -> None:
        """Initialize the engine. Sets state to READY or FAILED."""
        if self._metadata.state not in (EngineState.UNINITIALIZED, EngineState.FAILED):
            return

        self._set_state(EngineState.INITIALIZING)
        try:
            await self._initialize_impl()
            self._initialized = True
            self._metadata.initialized_at = datetime.now(UTC).isoformat()
            self._set_state(EngineState.READY)
        except Exception as exc:
            self._set_state(EngineState.FAILED, str(exc))
            raise

    async def start(self) -> None:
        """Start the engine. Sets state to RUNNING."""
        if self._metadata.state != EngineState.READY:
            await self.initialize()

        try:
            await self._start_impl()
            self._started = True
            self._metadata.started_at = datetime.now(UTC).isoformat()
            self._set_state(EngineState.RUNNING)
        except Exception as exc:
            self._set_state(EngineState.FAILED, str(exc))
            raise

    async def stop(self) -> None:
        """Stop the engine. Sets state to STOPPED."""
        if self._metadata.state not in (EngineState.RUNNING, EngineState.READY, EngineState.FAILED):
            return

        self._set_state(EngineState.STOPPING)
        try:
            await self._stop_impl()
            self._started = False
            self._metadata.stopped_at = datetime.now(UTC).isoformat()
            self._set_state(EngineState.STOPPED)
        except Exception as exc:
            self._set_state(EngineState.FAILED, str(exc))
            raise

    async def health(self) -> EngineHealth:
        """Run a health check and return the result."""
        try:
            if self._metadata.state == EngineState.FAILED:
                return EngineHealth(
                    engine_name=self._metadata.engine_name,
                    state=self._metadata.state,
                    healthy=False,
                    message=self._metadata.error_message or 'Engine is in FAILED state',
                )
            return await self.health_impl()
        except Exception as exc:
            return EngineHealth(
                engine_name=self._metadata.engine_name,
                state=self._metadata.state,
                healthy=False,
                message=str(exc),
            )

    # ── Diagnostics ────────────────────────────────────────────────

    async def diagnostics(self) -> dict[str, Any]:
        """Return a comprehensive diagnostics snapshot of the engine."""
        health_status = await self.health()
        config_issues = await self.validate_configuration()

        return {
            'engine_id': self._metadata.engine_id,
            'engine_name': self._metadata.engine_name,
            'engine_class': self._metadata.engine_class,
            'engine_version': self._metadata.engine_version,
            'state': self._metadata.state.value,
            'healthy': health_status.healthy,
            'health_message': health_status.message,
            'initialized': self._initialized,
            'started': self._started,
            'config_issues': config_issues,
            'dependencies': [dep.engine_name for dep in self.dependencies()],
            'created_at': self._metadata.created_at,
            'initialized_at': self._metadata.initialized_at,
            'started_at': self._metadata.started_at,
            'stopped_at': self._metadata.stopped_at,
            'error': self._metadata.error_message,
        }

    # ── Event Hooks ────────────────────────────────────────────────

    async def subscribe_events(self, event_bus: Any) -> None:
        """Register event subscriptions on the event bus.

        Override this in subclasses to subscribe to domain events.
        """
        self._event_bus = event_bus

    async def publish_event(
        self,
        event_name: str,
        payload: dict[str, Any],
        *,
        correlation_id: str | None = None,
        causation_id: str | None = None,
        idempotency_key: str | None = None,
    ) -> None:
        """Publish a domain event through the event bus (if available)."""
        if self._event_bus is not None:
            await self._event_bus.publish(
                event_name=event_name,
                payload=payload,
                correlation_id=correlation_id or self._metadata.engine_id,
                causation_id=causation_id,
                idempotency_key=idempotency_key,
            )

    # ── Properties ─────────────────────────────────────────────────

    @property
    def engine_id(self) -> str:
        return self._metadata.engine_id

    @property
    def engine_name(self) -> str:
        return self._metadata.engine_name

    @property
    def engine_version(self) -> str:
        return self._metadata.engine_version

    @property
    def engine_state(self) -> EngineState:
        return self._metadata.state

    @property
    def is_initialized(self) -> bool:
        return self._initialized

    @property
    def is_running(self) -> bool:
        return self._started and self._metadata.state == EngineState.RUNNING

    # ── Internal ───────────────────────────────────────────────────

    def _set_state(self, state: EngineState, error_message: str | None = None) -> None:
        """Transition to a new lifecycle state."""
        self._metadata.state = state
        if error_message:
            self._metadata.error_message = error_message

    def __repr__(self) -> str:
        return f'<{self._metadata.engine_class}: {self._metadata.engine_name} [{self._metadata.state.value}]>'  # noqa: E501
