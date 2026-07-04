"""Search request and response DTOs."""

from app.schemas.search.request import (
    SearchRequest,
    AutocompleteRequest,
    FilterRequest,
)
from app.schemas.search.result import (
    SearchResult,
    GroupedResult,
    HighlightFragment,
    SearchSuggestion,
)
from app.schemas.search.history import (
    SearchHistoryCreate,
    SearchHistoryResponse,
)

__all__ = [
    'SearchRequest',
    'AutocompleteRequest',
    'FilterRequest',
    'SearchResult',
    'GroupedResult',
    'HighlightFragment',
    'SearchSuggestion',
    'SearchHistoryCreate',
    'SearchHistoryResponse',
]
