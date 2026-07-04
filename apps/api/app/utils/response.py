"""Response helpers — thin wrappers that forward to schemas.

These exist so that ``utils`` can be imported without pulling in
``schemas`` for consumers that only need lightweight helpers.
The real implementations live in ``app.schemas.response``.
"""

from __future__ import annotations

from app.schemas.response import success_response as _success
from app.schemas.response import error_response as _error

# Re-export with shorter, more convenient names
success_response = _success
error_response = _error

__all__ = ['success_response', 'error_response']
