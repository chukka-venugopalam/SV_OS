"""Search request and response DTOs."""

from app.schemas.search.history import (
    SearchHistoryCreate,
    SearchHistoryResponse,
)
from app.schemas.search.request import (
    AutocompleteRequest,
    FilterRequest,
    SearchRequest,
)
from app.schemas.search.result import (
    GroupedResult,
    HighlightFragment,
    SearchResult,
    SearchSuggestion,
)

__all__ = [
    'AutocompleteRequest',
    'FilterRequest',
    'GroupedResult',
    'HighlightFragment',
    'SearchHistoryCreate',
    'SearchHistoryResponse',
    'SearchRequest',
    'SearchResult',
    'SearchSuggestion',
]
