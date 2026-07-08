"""
AI Knowledge Intelligence — embedding, semantic search, hybrid search, and ranking.

This package provides the AI/ML layer for the SV-OS knowledge graph:
- ``EmbeddingService`` — vector embedding generation with provider abstraction
- ``SemanticSearchService`` — cosine similarity and nearest neighbors
- ``HybridSearchService`` — multi-signal search (keyword + semantic + graph)
- ``RankingService`` — configurable multi-signal ranking engine
- ``RecommendationV2`` — enhanced recommendations with semantic and temporal signals
- ``SimilarityService`` — concept similarity and relationship discovery
"""

from __future__ import annotations

from app.services.ai.embedding_service import EmbeddingService, ProviderType
from app.services.ai.hybrid_search import HybridSearchService
from app.services.ai.ranking_service import RankingService, RankedResult
from app.services.ai.recommendation_v2 import RecommendationV2
from app.services.ai.semantic_search import SemanticSearchService
from app.services.ai.similarity import SimilarityService

__all__ = [
    'EmbeddingService',
    'ProviderType',
    'SemanticSearchService',
    'HybridSearchService',
    'RankingService',
    'RankedResult',
    'RecommendationV2',
    'SimilarityService',
]
