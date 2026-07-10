"""Application lifecycle — startup and shutdown logic."""

from app.startup.diagnostics import Diagnostics
from app.startup.lifespan import Lifespan

__all__ = ['Diagnostics', 'Lifespan']
