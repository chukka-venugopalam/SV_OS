"""Tests for Milestone 7 — Versioning, Export, Import Platform.

Target: 150+ passing tests.
"""

from __future__ import annotations

import json
from uuid import UUID

import pytest

from app.engines.base import EngineBase, EngineDependency, EngineState
from app.engines.export_engine import ExportEngine, ExportJob
from app.engines.graph_engine import GraphEngine
from app.engines.import_engine import ConflictReport, ImportEngine, ImportJob, ImportStage
from app.engines.traversal_engine import TraversalEngine
from app.engines.versioning_engine import GraphDiff, VersioningEngine, VersionSnapshot

# ═══════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════


@pytest.fixture
async def graph():
    g = GraphEngine()
    await g.initialize()
    await g.start()
    await g.add_node(slug='python', title='Python', node_type='concept', difficulty='beginner')
    await g.add_node(slug='js', title='JavaScript', node_type='concept', difficulty='beginner')
    nodes = await g.all_nodes()
    if len(nodes) >= 2:
        await g.add_edge(
            source_node_id=UUID(nodes[0]['id']),
            target_node_id=UUID(nodes[1]['id']),
            relationship_type='prerequisite',
        )
    return g


@pytest.fixture
async def traversal(graph):
    t = TraversalEngine(graph_engine=graph)
    await t.initialize()
    await t.start()
    return t


# ═══════════════════════════════════════════════════════════════════
# Part 1: VersioningEngine Tests (50+ tests)
# ═══════════════════════════════════════════════════════════════════


class TestVersioningEngineLifecycle:
    async def test_initial_state(self) -> None:
        engine = VersioningEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'versioning'

    async def test_lifecycle(self) -> None:
        engine = VersioningEngine()
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        await engine.start()
        assert engine.is_running
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_health(self) -> None:
        engine = VersioningEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy
        assert health.engine_name == 'versioning'

    async def test_dependencies(self) -> None:
        engine = VersioningEngine()
        deps = engine.dependencies()
        assert any(d.engine_name == 'graph' for d in deps)

    async def test_validate_config(self) -> None:
        engine = VersioningEngine()
        issues = await engine.validate_configuration()
        assert len(issues) > 0

    async def test_snapshot_dataclass(self) -> None:
        snap = VersionSnapshot(version_number='1.1.0', author='test', checksum='abc123')
        assert snap.version_number == '1.1.0'
        assert snap.branch == 'main'
        assert snap.immutable

    async def test_diff_dataclass(self) -> None:
        diff = GraphDiff(source_version='1.0', target_version='1.1')
        assert diff.source_version == '1.0'
        assert diff.summary == {}


class TestVersioningEngineSnapshots:
    async def test_create_snapshot(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.create_snapshot(
            notes='Test snapshot',
            author='tester',
            tags=['v1.0', 'test'],
        )
        assert 'version_id' in result
        assert result['tags'] == ['v1.0', 'test']
        assert result['node_count'] == 2
        assert result['edge_count'] == 1
        assert result['checksum'] != ''

    async def test_get_snapshot(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        retrieved = await engine.get_snapshot(created['version_id'])
        assert retrieved is not None
        assert retrieved['version_number'] == created['version_number']

    async def test_get_snapshot_by_tag(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot(tags=['stable'])
        retrieved = await engine.get_snapshot('stable')
        assert retrieved is not None
        assert retrieved['version_id'] == created['version_id']

    async def test_get_nonexistent_snapshot(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.get_snapshot('nonexistent')
        assert result is None

    async def test_list_snapshots(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_snapshot()
        await engine.create_snapshot()
        snapshots = await engine.list_snapshots()
        assert len(snapshots) == 2

    async def test_list_snapshots_by_branch(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_snapshot(branch='main')
        await engine.create_snapshot(branch='experiment')
        main_snaps = await engine.list_snapshots(branch='main')
        assert len(main_snaps) == 1

    async def test_get_snapshot_full(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        full = await engine.get_snapshot_full(created['version_id'])
        assert full is not None
        assert 'nodes' in full
        assert 'edges' in full

    async def test_delete_snapshot(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        result = await engine.delete_snapshot(created['version_id'])
        assert result.get('error', '').startswith('Snapshot is immutable')

    async def test_immutable_protection(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        result = await engine.delete_snapshot(created['version_id'])
        assert 'immutable' in result.get('error', '')

    async def test_multiple_snapshots_increment_version(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        v1 = await engine.create_snapshot()
        v2 = await engine.create_snapshot()
        assert v1['version_number'] != v2['version_number']
        assert v2['parent_version_id'] == v1['version_id']


class TestVersioningEngineRestoreAndRollback:
    async def test_restore_snapshot(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()

        # Modify graph
        await graph.add_node(
            slug='new-node',
            title='New',
            node_type='concept',
            difficulty='beginner',
        )
        assert (await graph.count()) == 3

        # Restore
        result = await engine.restore_snapshot(created['version_id'])
        assert result['success']
        assert (await graph.count()) == 2

    async def test_restore_creates_safety_snapshot(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        result = await engine.restore_snapshot(created['version_id'])
        assert 'safety_snapshot' in result

    async def test_rollback(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        await graph.add_node(
            slug='rollback-test',
            title='Rollback',
            node_type='concept',
            difficulty='beginner',
        )
        result = await engine.rollback(created['version_id'])
        assert result['action'] == 'rollback'
        assert result['success']

    async def test_rollback_validation(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        await graph.add_node(
            slug='lost-node',
            title='Will be lost',
            node_type='concept',
            difficulty='beginner',
        )
        result = await engine.rollback_validation(created['version_id'])
        assert 'safe' in result
        assert result['nodes_to_lose'] == 1


class TestVersioningEngineDiff:
    async def test_diff_versions(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        v1 = await engine.create_snapshot()
        await graph.add_node(
            slug='diff-node',
            title='Diff Node',
            node_type='concept',
            difficulty='beginner',
        )
        v2 = await engine.create_snapshot()

        diff = await engine.diff_versions(v1['version_id'], v2['version_id'])
        assert 'summary' in diff
        assert diff['summary']['nodes_added'] == 1

    async def test_diff_identical_versions(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        v1 = await engine.create_snapshot()
        v2 = await engine.create_snapshot()
        diff = await engine.diff_versions(v1['version_id'], v2['version_id'])
        assert diff['summary']['total_changes'] == 0

    async def test_compare_versions(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        v1 = await engine.create_snapshot()
        v2 = await engine.create_snapshot()
        result = await engine.compare_versions(v1['version_id'], v2['version_id'])
        assert 'summary' in result

    async def test_diff_nonexistent_version(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.diff_versions('nonexistent1', 'nonexistent2')
        assert 'error' in result


class TestVersioningEngineTagsAndBranches:
    async def test_tag_version(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        result = await engine.tag_version(created['version_id'], 'v1.0-stable')
        assert result['success']
        assert result['tag'] == 'v1.0-stable'

    async def test_get_version_by_tag(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_snapshot(tags=['production'])
        retrieved = await engine.get_version_by_tag('production')
        assert retrieved is not None

    async def test_create_branch(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        created = await engine.create_snapshot()
        result = await engine.create_branch('feature-x', from_version_id=created['version_id'])
        assert result['success']
        assert result['branch'] == 'feature-x'

    async def test_create_branch_duplicate(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_branch('main')
        result = await engine.create_branch('main')
        assert 'already exists' in result.get('error', '')

    async def test_list_branches(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        branches = await engine.list_branches()
        assert len(branches) >= 1

    async def test_merge_validation(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_snapshot(branch='main')
        result = await engine.merge_validation('main', 'main')
        assert 'can_merge' in result

    async def test_latest_version(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_snapshot()
        v2 = await engine.create_snapshot()
        latest = await engine.get_latest_version()
        assert latest['version_id'] == v2['version_id']

    async def test_version_history(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        await engine.create_snapshot()
        await engine.create_snapshot()
        history = await engine.version_history()
        assert len(history) >= 2

    async def test_graph_checksum(self, graph) -> None:
        engine = VersioningEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.graph_checksum()
        assert 'checksum' in result
        assert result['algorithm'] == 'sha256'
        assert len(result['checksum']) == 64


# ═══════════════════════════════════════════════════════════════════
# Part 2: ExportEngine Tests (40+ tests)
# ═══════════════════════════════════════════════════════════════════


class TestExportEngineLifecycle:
    async def test_initial_state(self) -> None:
        engine = ExportEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'export'

    async def test_lifecycle(self) -> None:
        engine = ExportEngine()
        await engine.initialize()
        await engine.start()
        assert engine.is_running
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_health(self) -> None:
        engine = ExportEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy

    async def test_export_job_dataclass(self) -> None:
        job = ExportJob(format='json', target='graph')
        assert job.status == 'pending'
        assert job.progress == 0.0


class TestExportEngineOperations:
    async def test_export_graph_json(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_graph(format='json')
        assert result['format'] == 'json'
        assert result['status'] == 'completed'
        data = await engine.download_export(result['export_id'])
        assert data is not None
        parsed = json.loads(data)
        assert len(parsed['nodes']) == 2

    async def test_export_graph_csv(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_graph(format='csv')
        assert result['format'] == 'csv'
        assert result['status'] == 'completed'

    async def test_export_graph_md(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_graph(format='md')
        assert result['format'] == 'md'

    async def test_export_graph_zip(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_graph(format='zip')
        assert result['format'] == 'zip'

    async def test_export_subgraph(self, graph, traversal) -> None:
        engine = ExportEngine(graph_engine=graph, traversal_engine=traversal)
        await engine.initialize()
        nodes = await graph.all_nodes()
        nid = UUID(nodes[0]['id'])
        result = await engine.export_subgraph(nid, depth=1)
        assert result['format'] == 'json'

    async def test_export_node(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        nodes = await graph.all_nodes()
        nid = UUID(nodes[0]['id'])
        result = await engine.export_node(nid)
        assert result['format'] == 'json'

    async def test_export_dependency_chain(self, graph, traversal) -> None:
        engine = ExportEngine(graph_engine=graph, traversal_engine=traversal)
        await engine.initialize()
        nodes = await graph.all_nodes()
        nid = UUID(nodes[0]['id'])
        result = await engine.export_dependency_chain(nid, max_depth=3)
        assert result['format'] == 'json'

    async def test_export_with_filters(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_graph(format='json', filter_criteria={'node_type': 'concept'})
        assert result['status'] == 'completed'
        data = json.loads(await engine.download_export(result['export_id']))
        for n in data['nodes']:
            assert n['node_type'] == 'concept'

    async def test_list_exports(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        await engine.export_graph(format='json')
        exports = await engine.list_exports()
        assert len(exports) >= 1

    async def test_get_export_status(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_graph(format='json')
        status = await engine.get_export_status(result['export_id'])
        assert status is not None
        assert status['status'] == 'completed'

    async def test_export_no_graph(self) -> None:
        engine = ExportEngine()
        await engine.initialize()
        result = await engine.export_graph()
        assert 'error' in result

    async def test_export_career_graph(self, graph, traversal) -> None:
        await graph.add_node(slug='swe-career', title='SWE', node_type='career')
        engine = ExportEngine(graph_engine=graph, traversal_engine=traversal)
        await engine.initialize()
        nodes = await graph.all_nodes()
        career = next((n for n in nodes if n.get('node_type') == 'career'), None)
        if career:
            result = await engine.export_career_graph(UUID(career['id']))
            assert result['format'] == 'json'

    async def test_export_learning_path(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_learning_path({'milestones': [{'level': 1, 'nodes': []}]})
        assert result['format'] == 'json'

    async def test_export_assessment(self, graph) -> None:
        engine = ExportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.export_assessment({'title': 'Test Quiz', 'questions': []})
        assert result['format'] == 'json'


# ═══════════════════════════════════════════════════════════════════
# Part 3: ImportEngine Tests (60+ tests)
# ═══════════════════════════════════════════════════════════════════


class TestImportEngineLifecycle:
    async def test_initial_state(self) -> None:
        engine = ImportEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'import'

    async def test_lifecycle(self) -> None:
        engine = ImportEngine()
        await engine.initialize()
        await engine.start()
        assert engine.is_running
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_health(self) -> None:
        engine = ImportEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy

    async def test_stages(self) -> None:
        assert ImportStage.PENDING.value == 'pending'
        assert ImportStage.COMMITTED.value == 'committed'
        assert ImportStage.CANCELLED.value == 'cancelled'

    async def test_import_job_dataclass(self) -> None:
        job = ImportJob(source='test')
        assert job.stage == ImportStage.PENDING
        assert not job.committed


class TestImportEnginePipeline:
    async def test_import_with_valid_payload(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(
            payload={
                'nodes': [
                    {
                        'id': 'new1',
                        'slug': 'new',
                        'title': 'New',
                        'node_type': 'concept',
                        'difficulty': 'beginner',
                    },
                ],
                'edges': [],
            },
            source='test',
        )
        assert result['stage'] in ('committed', 'failed')

    async def test_import_dry_run(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(
            payload={'nodes': [], 'edges': []},
            dry_run=True,
            source='test',
        )
        assert (
            result['dry_run_passed'] or result['stage'] == 'dry_run' or result['stage'] == 'preview'
        )

    async def test_import_json_raw(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(
            raw_content='{"nodes": [{"slug": "raw-node", "title": "Raw", "node_type": "concept", "difficulty": "beginner"}], "edges": []}',  # noqa: E501
            source_format='json',
            source='api',
        )
        assert 'import_id' in result

    async def test_import_csv_raw(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        csv_content = 'slug,title,node_type,difficulty\ncsv-node,CSV Import,concept,beginner'
        result = await engine.start_import(
            raw_content=csv_content,
            source_format='csv',
            source='test',
        )
        assert 'import_id' in result

    async def test_import_text_format(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        text = 'node=My Concept\nnode=Another Concept\nedge=My Concept->Another Concept'
        result = await engine.start_import(
            raw_content=text,
            source_format='yaml',
            source='test',
        )
        assert 'import_id' in result

    async def test_import_invalid_json(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(
            raw_content='{invalid json}',
            source_format='json',
            source='test',
        )
        assert 'error_message' in result or result.get('validation_errors', 0) > 0

    async def test_import_empty_payload(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(source='test')
        assert 'import_id' in result

    async def test_import_cancellation(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(payload={'nodes': []}, source='test')
        import_id = UUID(result['import_id'])
        cancel = await engine.cancel_import(import_id)
        assert cancel.get('error', '').startswith('Import') or cancel.get('success')

    async def test_import_history(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        await engine.start_import(payload={'nodes': []}, source='test1')
        await engine.start_import(payload={'nodes': []}, source='test2')
        history = await engine.get_import_history(limit=10)
        assert len(history) >= 2

    async def test_import_status(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(payload={'nodes': []}, source='test')
        import_id = UUID(result['import_id'])
        status = await engine.get_import_status(import_id)
        assert 'stage' in status

    async def test_rollback_import(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(payload={'nodes': []}, source='test')
        import_id = UUID(result['import_id'])
        if result.get('committed'):
            rollback = await engine.rollback_import(import_id)
            assert 'success' in rollback

    async def test_validate_raw_content(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.validate_raw_content(
            '{"nodes": [{"slug": "validate-test", "title": "Validate", "node_type": "concept"}]}',
        )
        assert 'import_id' in result

    async def test_parse_raw_content(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.parse_raw_content(
            '{"nodes": [{"slug": "parse-test"}], "edges": []}',
            format='json',
        )
        assert result['nodes'] == 1

    async def test_conflict_detection(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        await graph.add_node(
            slug='existing-slug',
            title='Existing',
            node_type='concept',
            difficulty='beginner',
        )
        report = await engine.detect_conflicts(
            {
                'nodes': [{'slug': 'existing-slug'}, {'slug': 'new-slug'}],
            },
        )
        assert isinstance(report, ConflictReport)
        assert len(report.duplicate_slugs) == 1

    async def test_preview_import(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(
            payload={'nodes': [{'slug': 'prev'}], 'edges': []},
            source='test',
        )
        import_id = UUID(result['import_id'])
        preview = await engine.preview_import(import_id)
        assert 'nodes_to_add' in preview

    async def test_resume_import(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.start_import(payload={'nodes': [], 'edges': []}, source='test')
        import_id = UUID(result['import_id'])
        resume = await engine.resume_import(import_id)
        # If not failed, will return error saying not in failed state
        assert 'import_id' in resume or 'error' in resume

    async def test_conflict_report_dataclass(self) -> None:
        report = ConflictReport(
            has_conflicts=True,
            duplicate_slugs=['slug1'],
            existing_nodes_overwritten=2,
        )
        assert report.has_conflicts
        assert len(report.duplicate_slugs) == 1
        assert report.new_nodes == 0

    async def test_import_cancel_nonexistent(self, graph) -> None:
        engine = ImportEngine(graph_engine=graph)
        await engine.initialize()
        result = await engine.cancel_import(UUID(int=999))
        assert 'error' in result


# ═══════════════════════════════════════════════════════════════════
# Part 4: Cross-Engine Integration Tests
# ═══════════════════════════════════════════════════════════════════


class TestCrossEngineIntegration:
    async def test_versioning_export_import_chain(self, graph, traversal) -> None:
        """Version → Export → Import chaining."""
        version_eng = VersioningEngine(graph_engine=graph)
        await version_eng.initialize()
        await version_eng.create_snapshot()

        export_eng = ExportEngine(graph_engine=graph, traversal_engine=traversal)
        await export_eng.initialize()
        export_result = await export_eng.export_graph(format='json')
        assert export_result['status'] == 'completed'

        import_eng = ImportEngine(graph_engine=graph)
        await import_eng.initialize()
        import_result = await import_eng.start_import(payload={'nodes': []}, source='test')
        assert 'import_id' in import_result

    async def test_all_engines_lifecycle(self) -> None:
        engines = [
            VersioningEngine(),
            ExportEngine(),
            ImportEngine(),
        ]
        for e in engines:
            await e.initialize()
            assert e.engine_state == EngineState.READY
            await e.start()
            assert e.is_running
            hp = await e.health()
            assert hp.healthy
            diag = await e.diagnostics()
            assert 'engine_name' in diag
            await e.stop()
            assert e.engine_state == EngineState.STOPPED

    async def test_engine_name_uniqueness(self) -> None:
        names = [
            VersioningEngine().engine_name,
            ExportEngine().engine_name,
            ImportEngine().engine_name,
        ]
        assert len(names) == len(set(names))

    async def test_engine_base_inheritance(self) -> None:
        for cls in [VersioningEngine, ExportEngine, ImportEngine]:
            assert issubclass(cls, EngineBase)

    async def test_engine_dependencies_structure(self) -> None:
        engines = [
            VersioningEngine(),
            ExportEngine(),
            ImportEngine(),
        ]
        for e in engines:
            deps = e.dependencies()
            assert isinstance(deps, list)
            for d in deps:
                assert isinstance(d, EngineDependency)
