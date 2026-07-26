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
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "apps", "api"))


async def _main():
    from app.core.database import async_session_factory
    from app.repositories import UnitOfWork
    from app.services.knowledge_import import KnowledgeImportService

    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

    # ── Step 1: Seed categories ─────────────────────────────────────
    categories_path = os.path.join(project_root, "database", "categories_40.json")
    print(f"[1/4] Seeding categories from {categories_path}")
    with open(categories_path, encoding="utf-8") as f:  # noqa: ASYNC230
        category_list = json.load(f)

    async with (
        async_session_factory() as session,
        UnitOfWork(session) as uow,
    ):
        created = 0
        for c in category_list:
            existing = await uow.categories.find_by_slug(c["slug"])
            if not existing:
                await uow.categories.create(
                    slug=c["slug"],
                    display_name=c["display_name"],
                    aliases=c.get("aliases", []),
                    parent_id=c.get("parent_id"),
                )
                created += 1
        print(
            f"  Created {created} categories (skipped {len(category_list) - created} existing)"
        )

    # ── Step 2: Seed careers (as Career records, NOT learning_goals) ─
    careers_path = os.path.join(project_root, "database", "careers_12.json")
    print(f"[2/4] Seeding careers from {careers_path}")
    with open(careers_path, encoding="utf-8") as f:  # noqa: ASYNC230
        careers_data = json.load(f)

    async with (
        async_session_factory() as session,
        UnitOfWork(session) as uow,
    ):
        created = 0
        for c in careers_data["careers"]:
            existing = await uow.careers.find_by_slug(c["id"])
            if not existing:
                await uow.careers.create(
                    slug=c["id"],
                    title=c["title"],
                    description=c["title"],
                    extra_metadata={
                        "recommended_order": c.get("recommended_order", []),
                        "import_source": "stage5.2",
                    },
                )
                created += 1
            else:
                # Update metadata if career already exists
                await uow.careers.update(
                    existing.id,
                    extra_metadata={
                        "recommended_order": c.get("recommended_order", []),
                        "import_source": "stage5.2",
                    },
                )
        print(
            f"  Created {created} careers (processed {len(careers_data['careers'])} total)"
        )

    # ── Step 3: Import 181 nodes ────────────────────────────────────
    import_path = os.path.join(
        project_root, "knowledge", "imports", "stage5_2_import_refactored.json"
    )
    print(f"[3/4] Importing 181 nodes from {import_path}")
    with open(import_path, encoding="utf-8") as f:  # noqa: ASYNC230
        import_data = json.load(f)

    # Pre-process: map domain_id/domain_raw → domain for the import service
    nodes = import_data.get("nodes", [])
    for n in nodes:
        n["domain"] = n.pop("domain_raw", n.get("domain_id", "unknown"))
        n.pop("domain_id", None)
        n.pop("content_status", None)
        n.pop("missing_sections", None)
        if "estimated_hours" not in n:
            n["estimated_hours"] = 10

    # Remove top-level keys not in ImportMap schema
    import_data.pop("careers", None)
    import_data.pop("orphans_resolved", None)

    async with (
        async_session_factory() as session,
        UnitOfWork(session) as uow,
    ):
        service = KnowledgeImportService(uow)
        report = await service.run_import(import_data)
        service.print_report()

        if not report.success:
            print("\n❌ IMPORT FAILED — see errors above")
            raise RuntimeError(
                f"Node import failed with {len(report.errors)} errors: {report.errors}"
            )

    # ── Step 4: Link careers to their recommended nodes ────────────
    print("[4/4] Linking careers to recommended nodes via career_requirements")
    async with (
        async_session_factory() as session,
        UnitOfWork(session) as uow,
    ):
        linked = 0
        all_careers = await uow.careers.get_all(limit=100)
        career_by_slug = {c.slug: c for c in all_careers}

        all_nodes = await uow.knowledge_nodes.get_all(limit=2000)
        node_by_slug = {n.slug: n for n in all_nodes}

        for c in careers_data["careers"]:
            career = career_by_slug.get(c["id"])
            if not career:
                print(
                    f"  WARNING: Career {c['id']} not found in DB, skipping requirements"
                )
                continue

            existing_reqs = await uow.careers.get_requirements(career.id)
            existing_node_ids = {str(r.node_id) for r in existing_reqs}

            for order, node_slug in enumerate(c.get("recommended_order", [])):
                node_db = node_by_slug.get(node_slug)
                if not node_db:
                    print(
                        f'  WARNING: Node "{node_slug}" not found in DB, '
                        f"skipping for career {c['id']}"
                    )
                    continue

                if str(node_db.id) not in existing_node_ids:
                    await uow.careers.add_requirement(
                        career_id=career.id,
                        node_id=node_db.id,
                        requirement_type="required",
                        order_index=order,
                    )
                    linked += 1

        print(f"  Linked {linked} career-requirement edges")

    # ── Step 5: Seed projects from 05_projects.sql ─────────────────
    projects_sql_path = os.path.join(
        project_root, "database", "seeds", "05_projects.sql"
    )
    if os.path.exists(projects_sql_path):
        print(f"[5/5] Seeding projects from {projects_sql_path}")
        with open(projects_sql_path, encoding="utf-8") as f:  # noqa: ASYNC230
            sql_content = f.read()
        async with async_session_factory() as session:
            from sqlalchemy import text

            await session.execute(text(sql_content))
            await session.commit()
            print("  Projects seeded successfully")

    # ── Step 6: Seed multi-domain project_requirements ────────────────
    print("[6/6] Linking projects to multi-domain knowledge nodes")
    PROJECT_NODES_MAP = {
        "personal-website": [
            ("html-and-css-fundamentals", "required"),
            ("javascript-and-the-dom", "required"),
            ("browser-rendering-engine-fundamentals", "required"),
            ("application-layer-protocols-http-dns", "recommended"),
        ],
        "task-manager": [
            ("frontend-frameworks-react", "required"),
            ("backend-development-and-rest-apis", "required"),
            ("relational-model-and-sql", "required"),
            ("threads-and-concurrency", "recommended"),
        ],
        "url-shortener": [
            ("backend-development-and-rest-apis", "required"),
            ("indexing-b-tree-hash", "required"),
            ("caching-strategies", "required"),
            ("relational-model-and-sql", "recommended"),
        ],
        "chat-app": [
            ("threads-and-concurrency", "required"),
            ("processes-and-process-management", "required"),
            ("nosql-and-distributed-databases", "required"),
            ("asymmetric-cryptography-and-pki", "recommended"),
        ],
        "ecommerce-api": [
            ("backend-development-and-rest-apis", "required"),
            ("relational-model-and-sql", "required"),
            ("caching-strategies", "required"),
            ("docker-and-containerization", "recommended"),
        ],
        "netflix-clone": [
            ("microservices-architecture", "required"),
            ("caching-strategies", "required"),
            ("cloud-storage-and-managed-databases", "recommended"),
        ],
        "social-media-dashboard": [
            ("data-visualization", "required"),
            ("relational-model-and-sql", "required"),
            ("message-queues-and-event-streaming", "recommended"),
        ],
        "docker-voting-app": [
            ("docker-and-containerization", "required"),
            ("microservices-architecture", "required"),
            ("scalability-and-load-balancing", "recommended"),
        ],
        "machine-learning-pipeline": [
            ("calculus-and-optimization-basics", "required"),
            ("computer-vision-fundamentals", "required"),
            ("docker-and-containerization", "recommended"),
        ],
        "api-gateway": [
            ("scalability-and-load-balancing", "required"),
            ("backend-development-and-rest-apis", "required"),
            ("caching-strategies", "required"),
            ("microservices-architecture", "recommended"),
        ],
    }

    async with (
        async_session_factory() as session,
        UnitOfWork(session) as uow,
    ):
        req_count = 0
        all_projects = await uow.projects.get_all(limit=100)
        proj_by_slug = {p.slug: p for p in all_projects}

        all_nodes = await uow.knowledge_nodes.get_all(limit=2000)
        node_by_slug = {n.slug: n for n in all_nodes}

        for proj_slug, node_req_list in PROJECT_NODES_MAP.items():
            project = proj_by_slug.get(proj_slug)
            if not project:
                continue

            existing_reqs = await uow.projects.get_requirements(project.id)
            existing_keys = {
                (
                    str(r.node_id),
                    r.requirement_type.value
                    if hasattr(r.requirement_type, "value")
                    else str(r.requirement_type),
                )
                for r in existing_reqs
            }

            for order, (node_slug, req_type) in enumerate(node_req_list):
                node = node_by_slug.get(node_slug)
                if not node:
                    # Find partial match
                    matches = [
                        n
                        for s, n in node_by_slug.items()
                        if node_slug in s or s in node_slug
                    ]
                    if matches:
                        node = matches[0]

                if node and (str(node.id), req_type) not in existing_keys:
                    await uow.projects.add_requirement(
                        project_id=project.id,
                        node_id=node.id,
                        requirement_type=req_type,
                        order_index=order,
                    )
                    req_count += 1

        print(f"  Created {req_count} project requirement links")

    print(
        "\n✅ Phase 0 complete: categories + careers + 181 nodes + requirements + projects + multi-domain links imported"
    )


if __name__ == "__main__":
    asyncio.run(_main())
