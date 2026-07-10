"""
Ranking Service — configurable multi-signal ranking for recommendations and search.

Provides a flexible scoring framework where signals are computed
and combined with configurable weights. Used internally by
HybridSearchService and RecommendationV2.

Signal functions:
- Each signal returns a float score (0.0 to 1.0)
- Signals are combined: score = Σ(weight_i * signal_i)
- Weights are normalized to sum to 1.0
"""

from __future__ import annotations

import math
from collections.abc import Callable
from dataclasses import dataclass, field

from app.repositories import UnitOfWork

type SignalFunction = Callable[[object, dict], float]


@dataclass
class RankedResult:
    """A single ranked result with score breakdown."""

    node_id: str
    score: float
    signals: dict[str, float]
    metadata: dict = field(default_factory=dict)


class RankingService:
    """Configurable multi-signal ranking engine.

    Usage::

        ranking = RankingService(uow)
        ranking.register_signal('popularity', popularity_fn, weight=0.3)
        ranking.register_signal('difficulty', difficulty_fn, weight=0.2)
        results = await ranking.rank(nodes, user_context={'user_id': user_id})
    """

    def __init__(self, uow: UnitOfWork) -> None:
        self._uow = uow
        self._signals: list[dict] = []

    def register_signal(
        self,
        name: str,
        function: SignalFunction,
        weight: float = 1.0,
    ) -> RankingService:
        """Register a ranking signal with its weight.

        Args:
            name: Signal identifier (e.g. 'popularity', 'semantic').
            function: Callable that takes (node, context) and returns 0.0-1.0.
            weight: Relative importance of this signal.

        Returns:
            self for chaining.
        """
        self._signals.append(
            {
                'name': name,
                'function': function,
                'weight': weight,
            }
        )
        return self

    async def rank(
        self,
        candidates: list,
        context: dict | None = None,
        limit: int | None = None,
    ) -> list[RankedResult]:
        """Rank candidates using all registered signals.

        Args:
            candidates: List of nodes or dicts to rank.
            context: Shared context dict (user_id, query_embedding, etc.).
            limit: Maximum results to return.

        Returns:
            List of RankedResult sorted by score descending.
        """
        if not candidates:
            return []

        context = context or {}

        # Normalize weights to sum to 1.0
        total_weight = sum(s['weight'] for s in self._signals)
        if total_weight == 0:
            normalized = [s | {'weight': 1.0 / len(self._signals)} for s in self._signals]
        else:
            normalized = [s | {'weight': s['weight'] / total_weight} for s in self._signals]

        results: list[RankedResult] = []
        for candidate in candidates:
            signals: dict[str, float] = {}
            composite = 0.0

            for signal in normalized:
                try:
                    score = signal['function'](candidate, context)
                except Exception:
                    score = 0.0

                score = max(0.0, min(1.0, float(score)))
                signals[signal['name']] = round(score, 4)
                composite += score * signal['weight']

            node_id = str(
                getattr(candidate, 'id', None)
                or (candidate.get('id') if isinstance(candidate, dict) else '')
            )

            results.append(
                RankedResult(
                    node_id=node_id,
                    score=round(composite, 4),
                    signals=signals,
                )
            )

        results.sort(key=lambda r: r.score, reverse=True)

        if limit:
            results = results[:limit]

        return results

    # ── Built-in Signal Factories ─────────────────────────────────

    @staticmethod
    def popularity_signal(
        view_count_field: str = 'view_count',
        max_view_count: int = 1000,
    ) -> SignalFunction:
        """Create a popularity signal function."""

        def signal(node, _context) -> float:
            views = getattr(node, view_count_field, 0) or 0
            return min(views / max_view_count, 1.0)

        return signal

    @staticmethod
    def difficulty_signal(
        preferred: list[str] | None = None,
    ) -> SignalFunction:
        """Create a difficulty preference signal."""
        preferred = preferred or ['beginner', 'intermediate']

        def signal(node, _context) -> float:
            diff = getattr(node, 'difficulty', None)
            if diff is None:
                return 0.3
            diff_str = diff.value if hasattr(diff, 'value') else str(diff)
            if diff_str.lower() in preferred:
                return 0.8
            return 0.3

        return signal

    @staticmethod
    def semantic_signal(
        query_embedding: list[float] | None = None,
    ) -> SignalFunction:
        """Create a semantic similarity signal."""

        def signal(node, context) -> float:
            emb = query_embedding or context.get('query_embedding')
            if not emb:
                return 0.0
            metadata = getattr(node, 'extra_metadata', None) or {}
            node_emb = metadata.get('embedding')
            if not node_emb:
                return 0.0
            dot = sum(a * b for a, b in zip(emb, node_emb, strict=False))
            norm_a = math.sqrt(sum(a * a for a in emb))
            norm_b = math.sqrt(sum(b * b for b in node_emb))
            if norm_a == 0 or norm_b == 0:
                return 0.0
            return dot / (norm_a * norm_b)

        return signal
