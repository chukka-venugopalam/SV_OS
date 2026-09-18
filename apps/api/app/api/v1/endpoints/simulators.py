"""Simulators API endpoint — dynamic registry of interactive learning simulators."""

from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy import text

from app.api.deps import get_uow
from app.repositories import UnitOfWork

router = APIRouter(prefix='/simulators', tags=['simulators'])


class SimulatorItem(BaseModel):
    id: str = Field(..., description='Unique simulator identifier')
    title: str = Field(..., description='Display title of simulator')
    domain: str = Field(..., description='CS subject domain')
    target_node_slug: str = Field(..., description='Target knowledge node slug')
    description: str = Field(..., description='Mechanism explanation')
    component_name: str = Field(..., description='Frontend React component name')
    badge: str = Field(default='Interactive', description='UI badge text')


def _format_domain(district: str | None, act: int | None) -> str:
    """Format database district slug into a clean user-facing subject domain."""
    if not district:
        if act is not None:
            return f'Act {act}'
        return 'Computer Science'
    parts = district.split('-', 1)
    name = parts[1] if len(parts) > 1 else district
    return name.replace('-', ' ').title()


@router.get('', summary='List all interactive simulators')
async def list_simulators(
    uow: Annotated[UnitOfWork, Depends(get_uow)],
) -> dict[str, Any]:
    """Return the dynamic catalog of interactive learning simulators driven from the DB."""
    async with uow:
        query = text("""
            SELECT id, slug, title, description, district, act, chapter_number,
                   metadata->'simulators' as simulators
            FROM knowledge_nodes
            WHERE is_deleted = false
              AND is_published = true
              AND metadata->'simulators' IS NOT NULL
              AND jsonb_array_length(metadata->'simulators') > 0
              AND metadata->'simulators'->0->>'primary' IS NOT NULL
            ORDER BY act NULLS LAST, district NULLS LAST, chapter_number NULLS LAST, title
        """)
        result = await uow.session.execute(query)
        rows = result.fetchall()

        items: list[dict[str, Any]] = []
        for r in rows:
            sim_list = r.simulators or []
            primary = sim_list[0].get('primary') if sim_list else None
            if not primary:
                continue

            domain_label = _format_domain(r.district, r.act)
            desc = r.description or f'Interactive visualizer for {r.title}.'
            if len(desc) > 300:
                desc = desc[:297] + '...'

            items.append({
                'id': f'sim-{r.slug}',
                'title': r.title,
                'domain': domain_label,
                'target_node_slug': r.slug,
                'description': desc,
                'component_name': primary,
                'badge': domain_label,
            })

        return {
            'success': True,
            'message': 'Simulators fetched successfully',
            'data': items,
            'errors': None,
        }
