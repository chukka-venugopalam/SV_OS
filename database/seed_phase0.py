"""Phase 0 — Seed script for category taxonomy, careers, and 181-node import.

Usage:
    python database/seed_phase0.py

    (Run from the project root — the script adds apps/api to sys.path)

Requirements:
    - PostgreSQL running locally (via Docker or native install)
    - Alembic migrations applied (alembic upgrade head)
    - Virtual environment activated

This script performs four operations:
    1. Seed 39 canonical categories from database/categories_40.json
    2. Seed 12 careers (professional roles) into the careers table
    3. Import 181 knowledge nodes from knowledge/imports/stage5_2_import_refactored.json
    4. Link careers to their recommended nodes via career_requirements
"""

import asyncio
import json
import os
import sys

# Add the api directory to the path so imports work
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'apps', 'api'))


async def _main():
    from app.core.database import async_session_factory
    from app.repositories import UnitOfWork
    from app.services.knowledge_import import KnowledgeImportService

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # ── Step 1: Seed categories ─────────────────────────────────────
    categories_path = os.path.join(project_root, 'database', 'categories_40.json')
    print(f'[1/4] Seeding categories from {categories_path}')
    with open(categories_path, encoding='utf-8') as f:
        category_list = json.load(f)

    async with async_session_factory() as session:
        async with UnitOfWork(session) as uow:
            created = 0
            for c in category_list:
                existing = await uow.categories.find_by_slug(c['slug'])
                if not existing:
                    await uow.categories.create(
                        slug=c['slug'],
                        display_name=c['display_name'],
                        aliases=c.get('aliases', []),
                        parent_id=c.get('parent_id'),
                    )
                    created += 1
            print(f'  Created {created} categories (skipped {len(category_list) - created} existing)')

    # ── Step 2: Seed careers (as Career records, NOT learning_goals) ─
    careers_path = os.path.join(project_root, 'database', 'careers_12.json')
    print(f'[2/4] Seeding careers from {careers_path}')
    with open(careers_path, encoding='utf-8') as f:
        careers_data = json.load(f)

    async with async_session_factory() as session:
        async with UnitOfWork(session) as uow:
            created = 0
            for c in careers_data['careers']:
                existing = await uow.careers.find_by_slug(c['id'])
                if not existing:
                    await uow.careers.create(
                        slug=c['id'],
                        title=c['title'],
                        description=c['title'],
                        extra_metadata={
                            'recommended_order': c.get('recommended_order', []),
                            'import_source': 'stage5.2',
                        },
                    )
                    created += 1
                else:
                    # Update metadata if career already exists
                    await uow.careers.update(
                        existing.id,
                        extra_metadata={
                            'recommended_order': c.get('recommended_order', []),
                            'import_source': 'stage5.2',
                        },
                    )
            print(f'  Created {created} careers (processed {len(careers_data["careers"])} total)')

    # ── Step 3: Import 181 nodes ────────────────────────────────────
    import_path = os.path.join(
        project_root, 'knowledge', 'imports', 'stage5_2_import_refactored.json'
    )
    print(f'[3/4] Importing 181 nodes from {import_path}')
    with open(import_path, encoding='utf-8') as f:
        import_data = json.load(f)

    # Pre-process: map domain_id/domain_raw → domain for the import service
    nodes = import_data.get('nodes', [])
    for n in nodes:
        n['domain'] = n.pop('domain_raw', n.get('domain_id', 'unknown'))
        n.pop('domain_id', None)
        n.pop('content_status', None)
        n.pop('missing_sections', None)
        if 'estimated_hours' not in n:
            n['estimated_hours'] = 10

    # Remove top-level keys not in ImportMap schema
    import_data.pop('careers', None)
    import_data.pop('orphans_resolved', None)

    async with async_session_factory() as session:
        async with UnitOfWork(session) as uow:
            service = KnowledgeImportService(uow)
            report = await service.run_import(import_data)
            service.print_report()

            if not report.success:
                print('\n❌ IMPORT FAILED — see errors above')
                raise RuntimeError(f'Node import failed with {len(report.errors)} errors: {report.errors}')

    # ── Step 4: Link careers to their recommended nodes ────────────
    print('[4/4] Linking careers to recommended nodes via career_requirements')
    async with async_session_factory() as session:
        async with UnitOfWork(session) as uow:
            linked = 0
            for c in careers_data['careers']:
                career = await uow.careers.find_by_slug(c['id'])
                if not career:
                    print(f'  WARNING: Career {c["id"]} not found in DB, skipping requirements')
                    continue

                existing_reqs = await uow.careers.get_requirements(career.id)
                existing_node_ids = {str(r.node_id) for r in existing_reqs}

                for order, node_slug in enumerate(c.get('recommended_order', [])):
                    node_db = await uow.knowledge_nodes.find_by_slug(node_slug)
                    if not node_db:
                        print(
                            f'  WARNING: Node "{node_slug}" not found in DB, '
                            f'skipping for career {c["id"]}'
                        )
                        continue

                    if str(node_db.id) not in existing_node_ids:
                        await uow.careers.add_requirement(
                            career_id=career.id,
                            node_id=node_db.id,
                            requirement_type='required',
                            order_index=order,
                        )
                        linked += 1

            print(f'  Linked {linked} career-requirement edges')

    # ── Step 5: Seed projects from 05_projects.sql ─────────────────
    projects_sql_path = os.path.join(project_root, 'database', 'seeds', '05_projects.sql')
    if os.path.exists(projects_sql_path):
        print(f'[5/5] Seeding projects from {projects_sql_path}')
        with open(projects_sql_path, encoding='utf-8') as f:
            sql_content = f.read()
        async with async_session_factory() as session:
            from sqlalchemy import text
            await session.execute(text(sql_content))
            await session.commit()
            print('  Projects seeded successfully')

    print('\n✅ Phase 0 complete: categories + careers + 181 nodes + requirements + projects imported')


if __name__ == '__main__':
    asyncio.run(_main())
