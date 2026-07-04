"""Application lifecycle — startup and shutdown logic."""

from app.startup.lifespan import Lifespan
from app.startup.diagnostics import Diagnostics

__all__ = ['Lifespan', 'Diagnostics']
