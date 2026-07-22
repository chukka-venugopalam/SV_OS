"""Import Platform API — endpoints for importing the Stage 5.1 reference dataset.

Provides:
- ``POST /api/v1/import`` — run a full import of a computer_science_map.json
- ``POST /api/v1/import/dry-run`` — validate without persisting
- ``POST /api/v1/import/validate`` — validate only (schema + referential integrity)
- ``GET /api/v1/import/nodes`` — list imported nodes by domain with prerequisites/unlocks
- ``GET /api/v1/import/report`` — get the latest import report
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from structlog.stdlib import get_logger

from app.api.deps import get_uow
from app.schemas.response import success_response

if TYPE_CHECKING:
    from app.repositories import UnitOfWork

logger = get_logger(__name__)

router = APIRouter(prefix='/import', tags=['import-platform'])


@router.post('')
async def start_import(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    body: dict,
) -> dict:
    """Run a full import of a dataset in ``computer_science_map.json`` format.

    Accepts the full JSON payload in the request body.  Validates schema,
    checks referential integrity, builds the graph (with cycle detection),
    and persists all nodes, edges, projects, careers, and resources via
    upsert (safe to re-run).

    Returns an ``ImportReport`` with full stats, errors, and warnings.
    """
    from app.services.knowledge_import import KnowledgeImportService

    service = KnowledgeImportService(uow)
    report = await service.run_import(body)

    return success_response(
        data=report.model_dump(mode='json'),
        message='Import completed' if report.success else 'Import failed',
    )


@router.post('/dry-run')
async def dry_run_import(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    body: dict,
) -> dict:
    """Validate an import payload without persisting anything.

    Runs the full validation pipeline (schema, referential integrity,
    graph building with cycle detection) but does **not** write any data.
    Useful for checking whether a dataset is ready for import.
    """
    from app.schemas.knowledge.import_map import ImportMap, ImportReport

    # Parse only — validate schema and ref integrity, no persistence
    report = ImportReport(success=True)
    parsed_nodes = []
    parsed_projects = []
    parsed_goals = []

    try:
        import_map = ImportMap(**body)
        parsed_nodes = import_map.nodes
        parsed_projects = import_map.projects
        parsed_goals = import_map.learning_goals
    except Exception as exc:
        report.errors.append(f'Failed to parse import data: {exc}')
        report.success = False
        return success_response(
            data=report.model_dump(mode='json'),
            message='Dry-run validation failed',
        )

    # Reuse service validation methods without persisting
    from app.services.knowledge_import import KnowledgeImportService

    # Create a temporary service just for validation
    service = KnowledgeImportService(uow)

    # Schema validation
    service.validate_schema(parsed_nodes)
    if service._report.errors:
        report.errors = service._report.errors
        report.warnings = service._report.warnings
        report.success = False
        return success_response(
            data=report.model_dump(mode='json'),
            message='Dry-run validation failed',
        )

    # Referential integrity
    service.validate_referential_integrity(parsed_nodes, parsed_projects, parsed_goals)
    report.errors = service._report.errors
    report.warnings = service._report.warnings

    # Domain breakdown
    service.compute_domain_breakdown(parsed_nodes)
    report.domain_breakdown = service._report.domain_breakdown
    report.domains = service._report.domains

    # Graph build (cycle detection only)
    graph = service.build_graph(parsed_nodes)
    if graph:
        adjacency = graph.get('adjacency', {})
        nodes_dict = graph.get('nodes', {})
        report.topological_order = graph['topological_order']
        report.topological_order_length = len(graph['topological_order'])
        report.root_nodes = sorted([n.id for n in parsed_nodes if not n.prerequisites])
        report.leaf_nodes = sorted([
            nid
            for nid in nodes_dict
            if nid not in adjacency or not adjacency.get(nid)
        ])
    else:
        report.success = False

    report.total_nodes = len(parsed_nodes)
    report.success = not report.errors

    return success_response(
        data=report.model_dump(mode='json'),
        message='Dry-run validation completed',
    )


@router.post('/validate')
async def validate_import(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    body: dict,
) -> dict:
    """Validate an import payload — schema and referential integrity only.

    Lighter-weight than the full dry-run.  Does not build the graph
    or check for cycles.  Returns a validation report with errors and
    warnings only.
    """
    from app.schemas.knowledge.import_map import ImportReport

    report = ImportReport(success=True)

    try:
        from app.schemas.knowledge.import_map import ImportMap

        import_map = ImportMap(**body)
        parsed_nodes = import_map.nodes
        parsed_projects = import_map.projects
        parsed_goals = import_map.learning_goals
    except Exception as exc:
        report.errors.append(f'Failed to parse import data: {exc}')
        report.success = False
        return success_response(
            data=report.model_dump(mode='json'),
            message='Validation failed',
        )

    from app.services.knowledge_import import KnowledgeImportService

    service = KnowledgeImportService(uow)

    service.validate_schema(parsed_nodes)
    if service._report.errors:
        report.errors = service._report.errors
        report.warnings = service._report.warnings
        report.success = False
        return success_response(
            data=report.model_dump(mode='json'),
            message='Schema validation failed',
        )

    service.validate_referential_integrity(parsed_nodes, parsed_projects, parsed_goals)
    report.errors = service._report.errors
    report.warnings = service._report.warnings
    report.total_nodes = len(parsed_nodes)
    report.success = not report.errors

    return success_response(
        data=report.model_dump(mode='json'),
        message='Validation completed',
    )


@router.get('/nodes')
async def list_imported_nodes(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
    domain: Annotated[str | None, Query(description='Filter by domain (from metadata)')] = None,
    page: Annotated[int, Query(ge=1, description='Page number')] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description='Items per page')] = 100,
) -> dict:
    """List all imported nodes grouped by domain, with resolved prerequisites and unlocks.

    This is the minimal read path proving the imported graph is live
    in the database — not re-served from the JSON file.

    Reads ``extra_metadata->>'domain'`` for domain grouping, and resolves
    prerequisites/unlocks via the ``knowledge_edges`` table on the fly.
    """
    from sqlalchemy import func, select, text

    from app.models.knowledge_edge import KnowledgeEdge
    from app.models.knowledge_node import KnowledgeNode

    # Fetch all published nodes ordered by title
    stmt = (
        select(KnowledgeNode)
        .where(
            not KnowledgeNode.is_deleted,
            KnowledgeNode.is_published,
        )
        .order_by(KnowledgeNode.title)
    )
    result = await uow.session.execute(stmt)
    all_nodes = list(result.scalars().all())

    if domain:
        all_nodes = [
            n
            for n in all_nodes
            if n.extra_metadata and n.extra_metadata.get('domain') == domain
        ]

    # Also fetch all prerequisite edges
    edges_stmt = select(KnowledgeEdge).where(
        not KnowledgeEdge.is_deleted,
        KnowledgeEdge.relationship_type == 'prerequisite',
    )
    edges_result = await uow.session.execute(edges_stmt)
    all_edges = list(edges_result.scalars().all())

    # Build prerequisite and unlock maps by node ID
    prereq_map: dict[str, list[str]] = {}
    unlock_map: dict[str, list[str]] = {}

    # Map UUID → slug for edge resolution
    uuid_to_slug: dict[str, str] = {}
    slug_to_uuid: dict[str, str] = {}
    for n in all_nodes:
        uuid_to_slug[str(n.id)] = n.slug
        slug_to_uuid[n.slug] = str(n.id)

    for edge in all_edges:
        source_slug = uuid_to_slug.get(str(edge.source_node_id))
        target_slug = uuid_to_slug.get(str(edge.target_node_id))
        if source_slug and target_slug:
            if target_slug not in prereq_map:
                prereq_map[target_slug] = []
            prereq_map[target_slug].append(source_slug)
            if source_slug not in unlock_map:
                unlock_map[source_slug] = []
            unlock_map[source_slug].append(target_slug)

    # Group by domain from metadata
    domain_groups: dict[str, list[dict]] = {}
    for n in all_nodes:
        node_domain = n.extra_metadata.get('domain', 'Unknown') if n.extra_metadata else 'Unknown'
        if node_domain not in domain_groups:
            domain_groups[node_domain] = []

        domain_groups[node_domain].append(
            {
                'id': n.slug,
                'title': n.title,
                'description': n.description,
                'difficulty': n.difficulty.value if hasattr(n.difficulty, 'value') else str(n.difficulty),
                'estimated_minutes': n.estimated_minutes,
                'prerequisites': sorted(prereq_map.get(n.slug, [])),
                'unlocks': sorted(unlock_map.get(n.slug, [])),
                'skills': n.extra_metadata.get('skills', []) if n.extra_metadata else [],
                'learning_outcomes': n.extra_metadata.get('learning_outcomes', []) if n.extra_metadata else [],
                'created_at': n.created_at.isoformat() if n.created_at else None,
            },
        )

    # Sort domains alphabetically, nodes by title
    sorted_domains = sorted(domain_groups.keys())
    for d in sorted_domains:
        domain_groups[d].sort(key=lambda x: x['title'])

    # Paginate
    total_nodes = sum(len(v) for v in domain_groups.values())
    total_pages = max(1, (total_nodes + per_page - 1) // per_page)

    return success_response(
        data={
            'domains': sorted_domains,
            'domain_groups': {
                d: domain_groups[d] for d in sorted_domains
            },
            'domain_counts': {d: len(domain_groups[d]) for d in sorted_domains},
            'total_nodes': total_nodes,
            'total_edges': len(all_edges),
            'page': page,
            'per_page': per_page,
            'total_pages': total_pages,
        },
        message='Imported nodes retrieved',
    )


@router.get('/report')
async def get_import_report(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict:
    """Get a summary report of all imported data.

    Returns aggregate counts for nodes, edges, projects, careers,
    and learning resources that were imported via the Stage 5.1
    import pipeline.
    """
    from sqlalchemy import select, func, text

    from app.models.knowledge_node import KnowledgeNode
    from app.models.knowledge_edge import KnowledgeEdge
    from app.models.project import Project
    from app.models.career import Career
    from app.models.learning_resource import LearningResource

    # Count everything
    node_count = (
        await uow.session.execute(
            select(func.count()).select_from(KnowledgeNode).where(
                not KnowledgeNode.is_deleted, KnowledgeNode.is_published,
            ),
        )
    ).scalar() or 0

    edge_count = (
        await uow.session.execute(
            select(func.count()).select_from(KnowledgeEdge).where(
                not KnowledgeEdge.is_deleted,
                KnowledgeEdge.relationship_type == 'prerequisite',
            ),
        )
    ).scalar() or 0

    project_count = (
        await uow.session.execute(
            select(func.count()).select_from(Project).where(
                not Project.is_deleted, Project.is_published,
            ),
        )
    ).scalar() or 0

    career_count = (
        await uow.session.execute(
            select(func.count()).select_from(Career).where(
                not Career.is_deleted, Career.is_published,
            ),
        )
    ).scalar() or 0

    resource_count = (
        await uow.session.execute(
            select(func.count()).select_from(LearningResource),
        )
    ).scalar() or 0

    # Domain breakdown from metadata
    domain_query = (
        select(
            KnowledgeNode.extra_metadata['domain'].astext,
            func.count().label('count'),
        )
        .where(
            not KnowledgeNode.is_deleted,
            KnowledgeNode.is_published,
        )
        .group_by(KnowledgeNode.extra_metadata['domain'].astext)
        .order_by(func.count().desc())
    )
    domain_result = await uow.session.execute(domain_query)
    domains = {
        row[0] if row[0] else 'Unknown': row[1]
        for row in domain_result.all()
    }

    return success_response(
        data={
            'total_nodes': node_count,
            'total_edges': edge_count,
            'total_projects': project_count,
            'total_careers': career_count,
            'total_resources': resource_count,
            'domain_breakdown': domains,
            'node_types': {},
        },
        message='Import report retrieved',
    )


# Backward-compatible aliases kept from original stub
class StartImportRequest:
    pass
