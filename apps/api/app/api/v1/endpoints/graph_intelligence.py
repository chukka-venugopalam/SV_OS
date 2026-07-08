"""
Graph Intelligence API endpoints — advanced graph operations.

Provides endpoints for:
- Path finding (BFS shortest path)
- Graph analytics (centrality, bottlenecks, density)
- Prerequisite and dependent chains
- Subgraph extraction
- Learning path generation
- Progress analysis
"""

from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from structlog.stdlib import get_logger

from app.api.deps import get_optional_user_id, get_uow
from app.repositories import UnitOfWork
from app.repositories.errors import EntityNotFoundError
from app.schemas.response import build_success_response
from app.services.graph.analytics import GraphAnalyticsService
from app.services.graph.traversal import GraphTraversalService
from app.services.learning_path_generator import LearningPathGenerator
from app.services.progress_intelligence import ProgressIntelligence
from app.services.recommendation_engine import RecommendationEngine

logger = get_logger(__name__)

router = APIRouter()


# ── Path Finding ───────────────────────────────────────────────────


@router.get("/path")
async def find_path(
    source_id: UUID = Query(..., description="Source node ID"),
    target_id: UUID = Query(..., description="Target node ID"),
    max_depth: int = Query(10, ge=1, le=20, description="Maximum search depth"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Find the shortest learning path between two nodes using BFS."""
    service = GraphTraversalService(uow)
    path = await service.shortest_learning_path(
        source_id=source_id,
        target_id=target_id,
        max_depth=max_depth,
    )
    return build_success_response(
        data={"path": path, "found": len(path) > 0, "steps": len(path)},
        message="Path search completed",
    )


# ── BFS / DFS Traversal ────────────────────────────────────────────


@router.get("/traverse/bfs")
async def bfs_traverse(
    node_id: UUID = Query(..., description="Start node ID"),
    max_depth: int = Query(5, ge=1, le=15, description="Maximum traversal depth"),
    relationship_type: str | None = Query(None, description="Filter by edge type"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Breadth-first traversal from a start node."""
    service = GraphTraversalService(uow)
    result = await service.bfs(
        start_node_id=node_id,
        max_depth=max_depth,
        relationship_type=relationship_type,
    )
    return build_success_response(
        data={"traversal": result, "node_count": len(result)},
        message="BFS traversal completed",
    )


@router.get("/traverse/dfs")
async def dfs_traverse(
    node_id: UUID = Query(..., description="Start node ID"),
    max_depth: int = Query(10, ge=1, le=20, description="Maximum traversal depth"),
    relationship_type: str | None = Query(None, description="Filter by edge type"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Depth-first traversal from a start node."""
    service = GraphTraversalService(uow)
    result = await service.dfs(
        start_node_id=node_id,
        max_depth=max_depth,
        relationship_type=relationship_type,
    )
    return build_success_response(
        data={"traversal": result, "node_count": len(result)},
        message="DFS traversal completed",
    )


# ── Neighbors ───────────────────────────────────────────────────────


@router.get("/neighbors")
async def get_neighbors(
    node_id: UUID = Query(..., description="Node ID"),
    depth: int = Query(1, ge=1, le=3, description="Neighborhood depth"),
    relationship_type: str | None = Query(None, description="Filter by edge type"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get all neighbors of a node with edge type counts."""
    service = GraphTraversalService(uow)
    result = await service.neighbors_at_depth(
        node_id=node_id,
        depth=depth,
        relationship_type=relationship_type,
    )
    return build_success_response(
        data=result,
        message="Neighbors retrieved",
    )


# ── Subgraph Extraction ────────────────────────────────────────────


@router.get("/subgraph")
async def extract_subgraph(
    node_id: UUID = Query(..., description="Center node ID"),
    depth: int = Query(2, ge=1, le=5, description="Subgraph depth"),
    relationship_type: str | None = Query(None, description="Filter by edge type"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Extract a subgraph around a center node for visualisation."""
    service = GraphTraversalService(uow)
    result = await service.extract_subgraph(
        center_node_id=node_id,
        depth=depth,
        relationship_type=relationship_type,
    )
    return build_success_response(
        data=result,
        message="Subgraph extracted",
    )


# ── Prerequisites ──────────────────────────────────────────────────


@router.get("/prerequisites")
async def get_prerequisite_chain(
    node_id: UUID = Query(..., description="Node ID"),
    max_depth: int = Query(5, ge=1, le=10, description="Maximum chain depth"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get the full prerequisite chain organised by depth level."""
    service = GraphTraversalService(uow)
    chain = await service.prerequisite_chain(
        node_id=node_id,
        max_depth=max_depth,
    )
    return build_success_response(
        data={"levels": chain, "depth": len(chain)},
        message="Prerequisite chain retrieved",
    )


# ── Dependents ─────────────────────────────────────────────────────


@router.get("/dependents")
async def get_dependent_chain(
    node_id: UUID = Query(..., description="Node ID"),
    max_depth: int = Query(5, ge=1, le=10, description="Maximum chain depth"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get the chain of nodes that depend on this node."""
    service = GraphTraversalService(uow)
    chain = await service.dependent_chain(
        node_id=node_id,
        max_depth=max_depth,
    )
    return build_success_response(
        data={"levels": chain, "depth": len(chain)},
        message="Dependent chain retrieved",
    )


# ── Analytics ──────────────────────────────────────────────────────


@router.get("/analytics/centrality")
async def get_central_nodes(
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get the most central (connected) nodes in the graph."""
    service = GraphAnalyticsService(uow)
    result = await service.degree_centrality(limit=limit)
    return build_success_response(
        data={"nodes": result, "count": len(result)},
        message="Central nodes retrieved",
    )


@router.get("/analytics/isolated")
async def get_isolated_nodes(
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get nodes with no edges (disconnected from the graph)."""
    service = GraphAnalyticsService(uow)
    result = await service.isolated_nodes()
    return build_success_response(
        data={"nodes": result, "count": len(result)},
        message="Isolated nodes retrieved",
    )


@router.get("/analytics/bottlenecks")
async def get_prerequisite_bottlenecks(
    limit: int = Query(20, ge=1, le=100, description="Number of results"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get prerequisite bottlenecks — nodes with the most dependents."""
    service = GraphAnalyticsService(uow)
    result = await service.prerequisite_bottlenecks(limit=limit)
    return build_success_response(
        data={"nodes": result, "count": len(result)},
        message="Bottlenecks retrieved",
    )


@router.get("/analytics/depth")
async def get_concept_depth(
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get the depth distribution of concepts in the graph."""
    service = GraphAnalyticsService(uow)
    result = await service.concept_depth_distribution()
    return build_success_response(
        data=result,
        message="Concept depth distribution retrieved",
    )


@router.get("/analytics/density")
async def get_graph_density(
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get graph density and branching factor metrics."""
    service = GraphAnalyticsService(uow)
    result = await service.graph_statistics()
    return build_success_response(
        data=result,
        message="Graph statistics retrieved",
    )


# ── Recommendations ────────────────────────────────────────────────


@router.get("/recommendations")
async def get_recommendations(
    limit: int = Query(20, ge=1, le=50, description="Number of recommendations"),
    user_id: UUID | None = Depends(get_optional_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get personalised recommendations for the current user."""
    if not user_id:
        # Return empty recommendations for anonymous users
        return build_success_response(
            data={"items": [], "count": 0},
            message="Login to get personalised recommendations",
        )

    engine = RecommendationEngine(uow)
    recommendations = await engine.get_recommendations(
        user_id=user_id,
        limit=limit,
        exclude_completed=True,
    )
    return build_success_response(
        data={"items": recommendations, "count": len(recommendations)},
        message="Recommendations retrieved",
    )


@router.get("/recommendations/careers")
async def get_career_recommendations(
    limit: int = Query(5, ge=1, le=20, description="Number of recommendations"),
    user_id: UUID = Depends(get_optional_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get career recommendations based on completed nodes."""
    if not user_id:
        return build_success_response(
            data={"items": [], "count": 0},
            message="Login to get career recommendations",
        )

    engine = RecommendationEngine(uow)
    careers = await engine.get_recommended_careers(
        user_id=user_id,
        limit=limit,
    )
    return build_success_response(
        data={"items": careers, "count": len(careers)},
        message="Career recommendations retrieved",
    )


# ── Learning Path ──────────────────────────────────────────────────


@router.get("/learning-path")
async def generate_learning_path(
    goal_node_id: UUID = Query(..., description="Goal knowledge node ID"),
    user_id: UUID | None = Depends(get_optional_user_id),
    difficulty: str | None = Query(None, description="Preferred difficulty level"),
    estimated_hours: int | None = Query(None, ge=1, le=1000, description="Time constraint"),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Generate a dynamic learning path toward a goal."""
    generator = LearningPathGenerator(uow)
    path = await generator.generate_path(
        goal_node_id=goal_node_id,
        user_id=user_id,
        difficulty=difficulty,
        estimated_hours=estimated_hours,
    )
    return build_success_response(
        data=path,
        message="Learning path generated",
    )


# ── Progress Analysis ──────────────────────────────────────────────


@router.get("/progress-analysis")
async def get_progress_analysis(
    user_id: UUID = Depends(get_optional_user_id),
    uow: UnitOfWork = Depends(get_uow),
) -> dict:
    """Get comprehensive progress analysis for the user."""
    if not user_id:
        return build_success_response(
            data={"error": "Authentication required"},
            message="Login to view progress analysis",
        )

    intelligence = ProgressIntelligence(uow)

    # Run all analyses in parallel
    import asyncio

    next_node_task = intelligence.next_best_node(user_id)
    missing_task = intelligence.missing_prerequisites(user_id)
    weak_task = intelligence.weak_topics(user_id)
    forecast_task = intelligence.completion_forecast(user_id)

    next_node, missing, weak, forecast = await asyncio.gather(
        next_node_task, missing_task, weak_task, forecast_task,
    )

    return build_success_response(
        data={
            "next_best_node": next_node,
            "missing_prerequisites": missing,
            "weak_topics": weak,
            "completion_forecast": forecast,
        },
        message="Progress analysis retrieved",
    )
