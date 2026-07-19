"""Simulator Capability — run simulation scenarios.

Orchestrates: SimulatorEngine, StateEngine
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from uuid import UUID


class SimulatorCapability:
    """Simulator Capability — public API for simulation scenarios."""

    def __init__(self) -> None:
        # TODO: Inject SimulatorEngine, StateEngine
        pass

    async def run_simulation(self, scenario: dict[str, Any], user_id: UUID | None = None) -> dict:
        """Run a simulation scenario and produce outcomes."""
        raise NotImplementedError
