"""Application lifecycle — startup and shutdown logic."""

from app.startup.diagnostics import Diagnostics
from app.startup.lifespan import lifespan

__all__ = ['Diagnostics', 'lifespan']
