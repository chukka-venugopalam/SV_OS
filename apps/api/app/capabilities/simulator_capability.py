"""Simulator Capability — run simulation scenarios.

Orchestrates: SimulatorEngine, StateEngine
"""

from __future__ import annotations

from uuid import UUID
from typing import Any


class SimulatorCapability:
    """Simulator Capability — public API for simulation scenarios."""

    def __init__(self) -> None:
        # TODO: Inject SimulatorEngine, StateEngine
        pass

    async def run_simulation(
        self, scenario: dict[str, Any], user_id: UUID | None = None
    ) -> dict:
        """Run a simulation scenario and produce outcomes."""
        raise NotImplementedError
