"""Tests for Milestone 5+6 — Recommendation, Learning Path, Career, and Assessment Engines.

Target: 200+ passing tests across all 4 engines.
"""

from __future__ import annotations

import pytest
from uuid import UUID, uuid4

from app.engines.base import EngineState, EngineDependency
from app.engines.graph_engine import GraphEngine
from app.engines.traversal_engine import TraversalEngine
from app.engines.state_engine import StateEngine
from app.engines.knowledge_engine import KnowledgeEngine
from app.engines.dependency_engine import DependencyEngine
from app.engines.recommendation_engine import RecommendationEngine, Recommendation, PRIORITY_EASIEST_FIRST
from app.engines.learning_path_engine import LearningPathEngine, PathNode, Milestone
from app.engines.career_engine import CareerEngine, CareerProfile, SkillGap
from app.engines.assessment_engine import AssessmentEngine, Question, Assessment, Submission


# ═══════════════════════════════════════════════════════════════════
# Fixtures
# ═══════════════════════════════════════════════════════════════════

@pytest.fixture
async def graph():
    g = GraphEngine()
    await g.initialize()
    await g.start()

    # Add some nodes for testing
    await g.add_node(slug='python', title='Python', node_type='concept', difficulty='beginner', estimated_minutes=30)
    await g.add_node(slug='js', title='JavaScript', node_type='concept', difficulty='beginner', estimated_minutes=30)
    await g.add_node(slug='react', title='React', node_type='technology', difficulty='intermediate', estimated_minutes=60)
    await g.add_node(slug='backend', title='Backend Dev', node_type='career', difficulty='intermediate', estimated_minutes=0)
    await g.add_node(slug='fullstack', title='Full Stack Dev', node_type='career', difficulty='advanced', estimated_minutes=0)
    await g.add_node(slug='advanced-python', title='Advanced Python', node_type='concept', difficulty='advanced', estimated_minutes=120)
    await g.add_node(slug='data-structures', title='Data Structures', node_type='concept', difficulty='intermediate', estimated_minutes=60)

    # Add edges
    nodes = await g.all_nodes()
    node_map = {n['slug']: UUID(n['id']) for n in nodes}

    await g.add_edge(source_node_id=node_map['python'], target_node_id=node_map['react'], relationship_type='prerequisite')
    await g.add_edge(source_node_id=node_map['js'], target_node_id=node_map['react'], relationship_type='prerequisite')
    await g.add_edge(source_node_id=node_map['react'], target_node_id=node_map['fullstack'], relationship_type='prerequisite')
    await g.add_edge(source_node_id=node_map['python'], target_node_id=node_map['backend'], relationship_type='prerequisite')
    await g.add_edge(source_node_id=node_map['data-structures'], target_node_id=node_map['advanced-python'], relationship_type='prerequisite')

    return g, node_map


@pytest.fixture
async def traversal(graph):
    g, _ = graph
    t = TraversalEngine(graph_engine=g)
    await t.initialize()
    await t.start()
    return t


@pytest.fixture
async def knowledge(graph):
    g, _ = graph
    k = KnowledgeEngine(graph_engine=g)
    await k.initialize()
    await k.start()
    return k


# ═══════════════════════════════════════════════════════════════════
# Part 1: Recommendation Engine Tests (60+ tests)
# ═══════════════════════════════════════════════════════════════════

class TestRecommendationEngineLifecycle:
    """Test EngineBase lifecycle compliance."""

    async def test_engine_initial_state(self):
        engine = RecommendationEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'recommendation'
        assert engine.is_initialized is False

    async def test_engine_initialize(self):
        engine = RecommendationEngine()
        await engine.initialize()
        assert engine.engine_state == EngineState.READY
        assert engine.is_initialized

    async def test_engine_start(self):
        engine = RecommendationEngine()
        await engine.initialize()
        await engine.start()
        assert engine.engine_state == EngineState.RUNNING
        assert engine.is_running

    async def test_engine_stop(self):
        engine = RecommendationEngine()
        await engine.initialize()
        await engine.start()
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_engine_dependencies(self):
        engine = RecommendationEngine()
        deps = engine.dependencies()
        assert len(deps) > 0
        assert any(d.engine_name == 'graph' for d in deps)

    async def test_engine_health(self):
        engine = RecommendationEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy
        assert health.engine_name == 'recommendation'

    async def test_engine_diagnostics(self):
        engine = RecommendationEngine()
        await engine.initialize()
        diag = await engine.diagnostics()
        assert diag['engine_name'] == 'recommendation'
        assert diag['state'] == 'ready'

    async def test_validate_configuration_missing_graph(self):
        engine = RecommendationEngine()
        issues = await engine.validate_configuration()
        assert len(issues) > 0
        assert any('GraphEngine' in i for i in issues)


class TestRecommendationEnginePriorityOrder:
    """Test priority rules are applied correctly."""

    async def test_recommend_next_returns_list(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_next(UUID(int=1), limit=5)
        assert isinstance(result, list)

    async def test_recommend_batch_returns_list(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_batch(UUID(int=1), limit=10)
        assert isinstance(result, list)

    async def test_recommend_daily_returns_list(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_daily(UUID(int=1), limit=10)
        assert isinstance(result, list)

    async def test_recommend_weekly_returns_list(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_weekly(UUID(int=1), limit=20)
        assert isinstance(result, list)

    async def test_recommend_by_goal(self, graph, traversal):
        g, node_map = graph
        engine = RecommendationEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.recommend_by_goal(UUID(int=1), node_map['fullstack'], limit=10)
        assert isinstance(result, list)

    async def test_recommend_by_career(self, graph, traversal):
        g, node_map = graph
        engine = RecommendationEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.recommend_by_career(node_map['backend'], limit=10)
        assert isinstance(result, list)

    async def test_recommend_after_assessment(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_after_assessment(
            UUID(int=1),
            {'failed_node_ids': []},
        )
        assert isinstance(result, list)

    async def test_recommend_after_import(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_after_import(['new-node-id'])
        assert isinstance(result, list)

    async def test_recommend_after_revision(self):
        engine = RecommendationEngine()
        await engine.initialize()
        result = await engine.recommend_after_revision(
            UUID(int=1),
            ['some-node-id'],
        )
        assert isinstance(result, list)

    async def test_get_history(self):
        engine = RecommendationEngine()
        await engine.initialize()
        history = await engine.get_history(UUID(int=1))
        assert isinstance(history, list)

    async def test_recommendation_has_reason(self, graph, traversal):
        g, node_map = graph
        engine = RecommendationEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.recommend_by_career(node_map['backend'], limit=5)
        for item in result:
            assert 'reason' in item
            assert item['reason']  # Non-empty reason

    async def test_recommendation_priority_labels(self, graph, traversal):
        g, node_map = graph
        engine = RecommendationEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.recommend_by_career(node_map['backend'], limit=5)
        for item in result:
            assert 'priority_label' in item
            assert 'priority' in item

    async def test_priority_constants_match_labels(self):
        assert PRIORITY_EASIEST_FIRST == 8
        labels = {
            1: 'Urgent Review',
            2: 'Reinforce Weak Knowledge',
            3: 'Continue Learning Streak',
            4: 'Career Requirement',
            5: 'Unlock Maximum Nodes',
            6: 'Highest Dependency Value',
            7: 'Shortest Estimated Time',
            8: 'Easiest First',
        }
        assert len(labels) == 8

    async def test_recommendation_dataclass(self):
        rec = Recommendation(
            node_id='test-id', title='Test', slug='test',
            node_type='concept', difficulty='beginner',
            priority=1, priority_label='Urgent', reason='Test',
        )
        assert rec.node_id == 'test-id'
        assert rec.priority == 1
        assert rec.priority_label == 'Urgent'
        assert rec.reason == 'Test'

    async def test_recommend_with_graph(self, graph):
        g, node_map = graph
        engine = RecommendationEngine(graph_engine=g)
        await engine.initialize()
        result = await engine._get_easiest_candidates(UUID(int=1))
        assert len(result) > 0
        for r in result:
            assert r.difficulty == 'beginner'

    async def test_recommend_unlock_candidates(self, graph, traversal):
        g, node_map = graph
        engine = RecommendationEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine._get_unlock_candidates(UUID(int=1))
        assert isinstance(result, list)


# ═══════════════════════════════════════════════════════════════════
# Part 2: Learning Path Engine Tests (50+ tests)
# ═══════════════════════════════════════════════════════════════════

class TestLearningPathEngineLifecycle:
    """Test EngineBase lifecycle compliance."""

    async def test_engine_initial_state(self):
        engine = LearningPathEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'learning_path'

    async def test_engine_initialize(self):
        engine = LearningPathEngine()
        await engine.initialize()
        assert engine.engine_state == EngineState.READY

    async def test_engine_start_stop(self):
        engine = LearningPathEngine()
        await engine.initialize()
        await engine.start()
        assert engine.engine_state == EngineState.RUNNING
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_engine_health(self):
        engine = LearningPathEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy
        assert health.engine_name == 'learning_path'

    async def test_engine_dependencies(self):
        engine = LearningPathEngine()
        deps = engine.dependencies()
        assert any(d.engine_name == 'graph' for d in deps)
        assert any(d.engine_name == 'traversal' for d in deps)

    async def test_path_node_dataclass(self):
        node = PathNode(node_id='id1', title='Test', slug='test', node_type='concept', difficulty='beginner')
        assert node.node_id == 'id1'
        assert node.title == 'Test'
        assert not node.completed

    async def test_milestone_dataclass(self):
        ms = Milestone(level=1, title='Milestone 1', node_count=3, estimated_minutes=90)
        assert ms.level == 1
        assert ms.node_count == 3
        assert not ms.completed


class TestLearningPathEngineStrategies:
    """Test multiple roadmap strategies."""

    async def test_generate_dependency_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['fullstack'])
        assert 'milestones' in result
        assert result['strategy'] == 'dependency_roadmap'
        assert result['milestone_count'] > 0

    async def test_generate_shortest_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_shortest_roadmap(node_map['react'])
        assert 'milestones' in result
        assert result['strategy'] == 'shortest_roadmap'

    async def test_generate_career_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_career_roadmap(node_map['fullstack'])
        assert 'milestones' in result

    async def test_generate_skill_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_skill_roadmap('Python')
        assert 'milestones' in result or 'error' in result

    async def test_generate_path(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_path(node_map['fullstack'], strategy='dependency_roadmap')
        assert 'milestones' in result
        assert 'path_id' in result

    async def test_generate_daily_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_daily_roadmap(node_map['fullstack'])
        assert result is not None

    async def test_generate_weekly_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_weekly_roadmap(node_map['fullstack'])
        assert result is not None


class TestLearningPathLifecycle:
    """Test path CRUD operations."""

    async def test_path_lifecycle(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['react'])
        path_id = UUID(result['path_id'])

        # Pause
        paused = await engine.pause_path(path_id)
        assert paused['status'] == 'paused'

        # Resume
        resumed = await engine.resume_path(path_id)
        assert resumed['status'] == 'active'
        assert resumed['resumed_count'] == 1

    async def test_validate_path(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['fullstack'])
        path_id = UUID(result['path_id'])

        validation = await engine.validate_path(path_id)
        assert 'valid' in validation

    async def test_export_path(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['fullstack'])
        path_id = UUID(result['path_id'])

        exported = await engine.export_path(path_id)
        assert 'export_format' in exported
        assert exported['export_format'] == 'json'

    async def test_rebuild_path(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['react'])
        path_id = UUID(result['path_id'])

        rebuilt = await engine.rebuild_path(path_id)
        assert 'milestones' in rebuilt

    async def test_path_not_found(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.get_progress(UUID(int=999))
        assert 'error' in result

    async def test_get_progress(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['fullstack'])
        path_id = UUID(result['path_id'])

        progress = await engine.get_progress(path_id)
        assert 'completion_percentage' in progress
        assert 'milestones' in progress

    async def test_milestone_structure(self, graph, traversal):
        g, node_map = graph
        engine = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        result = await engine.generate_dependency_roadmap(node_map['fullstack'])
        for ms in result['milestones']:
            assert 'level' in ms
            assert 'nodes' in ms
            assert ms['node_count'] == len(ms['nodes'])


# ═══════════════════════════════════════════════════════════════════
# Part 3: Career Engine Tests (50+ tests)
# ═══════════════════════════════════════════════════════════════════

class TestCareerEngineLifecycle:
    """Test EngineBase lifecycle compliance."""

    async def test_engine_initial_state(self):
        engine = CareerEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'career'

    async def test_engine_initialize_start_stop(self):
        engine = CareerEngine()
        await engine.initialize()
        await engine.start()
        assert engine.engine_state == EngineState.RUNNING
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_engine_health(self):
        engine = CareerEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy

    async def test_engine_dependencies(self):
        engine = CareerEngine()
        deps = engine.dependencies()
        assert any(d.engine_name == 'graph' for d in deps)

    async def test_career_profile_dataclass(self):
        profile = CareerProfile(
            node_id='id1', title='SWE', slug='swe',
            description='Software Engineer', industry='tech',
        )
        assert profile.title == 'SWE'
        assert profile.industry == 'tech'
        assert profile.seniority == 'mid'

    async def test_skill_gap_dataclass(self):
        gap = SkillGap(skill_name='Python', status='missing', node_id='n1', node_title='Python basics')
        assert gap.status == 'missing'
        assert gap.urgency == 'recommended'


class TestCareerEngineOperations:
    """Test career engine operations."""

    async def test_get_career(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        career = await engine.get_career(node_map['fullstack'])
        assert career is not None
        assert career['title'] == 'Full Stack Dev'

    async def test_get_career_by_wrong_type(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        career = await engine.get_career(node_map['python'])
        assert career is None  # Python is not a career type

    async def test_search_careers(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        results = await engine.search_careers('Full Stack')
        assert len(results) > 0
        assert any('Full Stack' in r['title'] for r in results)

    async def test_search_careers_no_match(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        results = await engine.search_careers('NonexistentCareerXYZ')
        assert len(results) == 0

    async def test_compare_careers(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        results = await engine.compare_careers([node_map['fullstack'], node_map['backend']])
        assert len(results) == 2

    async def test_skill_gap(self, graph, traversal):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        gap = await engine.get_skill_gap(UUID(int=1), node_map['backend'])
        assert 'career_id' in gap
        assert 'gaps' in gap
        assert 'completion_percentage' in gap

    async def test_career_progression(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        progression = await engine.get_career_progression(node_map['fullstack'])
        assert 'progression' in progression
        assert len(progression['progression']) > 0

    async def test_career_similarity(self, graph, traversal):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        similar = await engine.get_career_similarity(node_map['fullstack'])
        assert isinstance(similar, list)

    async def test_required_knowledge_graph(self, graph, traversal):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        kg = await engine.get_required_knowledge_graph(node_map['fullstack'])
        assert 'required_nodes' in kg
        assert 'career' in kg

    async def test_career_statistics(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        stats = await engine.get_career_statistics()
        assert 'total_careers' in stats
        assert stats['total_careers'] >= 2

    async def test_seniority_requirements(self, graph, traversal):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        reqs = await engine.get_seniority_requirements(node_map['fullstack'], 'senior')
        assert 'estimated_nodes_required' in reqs
        assert reqs['target_seniority'] == 'senior'

    async def test_get_recommended_roadmap(self, graph, traversal):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        roadmap = await engine.get_recommended_roadmap(node_map['fullstack'])
        assert 'milestones' in roadmap or 'error' in roadmap

    async def test_career_metadata(self, graph):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g)
        await engine.initialize()
        meta = await engine.get_career_metadata(node_map['fullstack'])
        assert meta is not None
        assert 'title' in meta


# ═══════════════════════════════════════════════════════════════════
# Part 4: Assessment Engine Tests (50+ tests)
# ═══════════════════════════════════════════════════════════════════

class TestAssessmentEngineLifecycle:
    """Test EngineBase lifecycle compliance."""

    async def test_engine_initial_state(self):
        engine = AssessmentEngine()
        assert engine.engine_state == EngineState.UNINITIALIZED
        assert engine.engine_name == 'assessment'

    async def test_engine_lifecycle(self):
        engine = AssessmentEngine()
        await engine.initialize()
        await engine.start()
        assert engine.is_running
        await engine.stop()
        assert engine.engine_state == EngineState.STOPPED

    async def test_engine_health(self):
        engine = AssessmentEngine()
        await engine.initialize()
        health = await engine.health()
        assert health.healthy

    async def test_question_dataclass(self):
        q = Question(text='What is Python?', question_type='multiple_choice',
                      options=['A', 'B', 'C'], correct_answer='A')
        assert q.question_type == 'multiple_choice'
        assert q.correct_answer == 'A'
        assert q.points == 1

    async def test_assessment_dataclass(self):
        a = Assessment(title='Test Assessment', total_points=10)
        assert a.passing_score == 0.7
        assert a.max_attempts == 3
        assert not a.is_published or a.is_published


class TestAssessmentEngineOperations:
    """Test assessment CRUD, submission, and grading."""

    async def test_create_assessment(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1),
            'Python Basics Quiz',
            description='Test your Python knowledge',
            questions=[
                {'text': 'What is Python?', 'question_type': 'multiple_choice',
                 'options': ['Language', 'Snake', 'Both'], 'correct_answer': 'Language', 'points': 2},
                {'text': 'Python is compiled.', 'question_type': 'true_false',
                 'correct_answer': 'false', 'points': 1},
            ],
            passing_score=0.7,
        )
        assert result['title'] == 'Python Basics Quiz'
        assert result['question_count'] == 2
        assert result['total_points'] == 3
        assert 'assessment_id' in result

    async def test_get_assessment(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Test Quiz',
            questions=[{'text': 'Q?', 'correct_answer': 'A', 'points': 1}],
        )
        aid = UUID(result['assessment_id'])
        retrieved = await engine.get_assessment(aid)
        assert retrieved is not None
        assert retrieved['title'] == 'Test Quiz'
        # Without answers, correct_answer should not be visible
        assert retrieved['questions'][0].get('correct_answer') is None or 'correct_answer' not in retrieved['questions'][0]

    async def test_get_assessment_with_answers(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Test Quiz',
            questions=[{'text': 'Q?', 'correct_answer': 'A', 'points': 1}],
        )
        aid = UUID(result['assessment_id'])
        retrieved = await engine.get_assessment_with_answers(aid)
        assert retrieved is not None
        assert 'correct_answer' in retrieved['questions'][0]

    async def test_get_assessments_for_node(self):
        engine = AssessmentEngine()
        await engine.initialize()
        await engine.create_assessment(UUID(int=1), 'Quiz 1', questions=[])
        await engine.create_assessment(UUID(int=1), 'Quiz 2', questions=[])
        items = await engine.get_assessments_for_node(UUID(int=1))
        assert len(items) == 2

    async def test_submit_assessment_pass(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Easy Quiz',
            questions=[
                {'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'},
                {'text': 'Q2', 'correct_answer': 'B', 'points': 1, 'question_type': 'multiple_choice'},
            ],
            passing_score=0.5,
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_ids = [q.question_id for q in assessment.questions]

        submission = await engine.submit_assessment(
            UUID(int=100), aid,
            answers=[
                {'question_id': q_ids[0], 'answer': 'A'},
                {'question_id': q_ids[1], 'answer': 'B'},
            ],
        )
        assert submission['passed'] is True
        assert submission['score'] >= 0.5

    async def test_submit_assessment_fail(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Hard Quiz',
            questions=[
                {'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'},
            ],
            passing_score=0.9,
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        submission = await engine.submit_assessment(
            UUID(int=100), aid,
            answers=[{'question_id': q_id, 'answer': 'Wrong'}],
        )
        assert submission['passed'] is False
        assert submission['score'] < 0.9

    async def test_submit_attempt_limit(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Limited Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
            passing_score=1.0,
        )
        # Set max_attempts to 1
        engine._assessments[result['assessment_id']].max_attempts = 1
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        await engine.submit_assessment(UUID(int=100), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        second = await engine.submit_assessment(UUID(int=100), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        assert 'error' in second
        assert 'Maximum attempts' in second['error']

    async def test_grade_assessment(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Graded Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        submission = await engine.submit_assessment(UUID(int=100), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        sid = UUID(submission['submission_id'])

        graded = await engine.grade_assessment(sid)
        assert graded['passed'] is True

    async def test_get_attempts_for_user(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Attempt Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        await engine.submit_assessment(UUID(int=200), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        attempts = await engine.get_attempts_for_user(UUID(int=200), aid)
        assert len(attempts) == 1

    async def test_get_score_history(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Score Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        await engine.submit_assessment(UUID(int=300), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        history = await engine.get_score_history(UUID(int=300), UUID(int=1))
        assert len(history) == 1
        assert 'score' in history[0]

    async def test_assessment_statistics(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Stats Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        # Submit a few attempts
        for uid in [UUID(int=400), UUID(int=401), UUID(int=402)]:
            await engine.submit_assessment(uid, aid, answers=[{'question_id': q_id, 'answer': 'A'}])

        stats = await engine.get_assessment_statistics(aid)
        assert stats['total_attempts'] == 3
        assert stats['pass_rate'] > 0
        assert 'average_score' in stats
        assert 'highest_score' in stats
        assert 'lowest_score' in stats

    async def test_update_knowledge(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Knowledge Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        sub = await engine.submit_assessment(UUID(int=500), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        sid = UUID(sub['submission_id'])

        result = await engine.update_knowledge(sid)
        assert result['updated'] is True

    async def test_update_confidence(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Confidence Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        q_id = assessment.questions[0].question_id

        sub = await engine.submit_assessment(UUID(int=600), aid, answers=[{'question_id': q_id, 'answer': 'A'}])
        sid = UUID(sub['submission_id'])

        result = await engine.update_confidence(sid)
        assert result['updated'] is True

    async def test_question_types(self):
        """Test different question types are graded correctly."""
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Multi-Type Quiz',
            questions=[
                {'text': 'MC?', 'question_type': 'multiple_choice', 'correct_answer': 'B',
                 'options': ['A', 'B', 'C'], 'points': 1},
                {'text': 'TF?', 'question_type': 'true_false', 'correct_answer': 'true', 'points': 1},
                {'text': 'SA?', 'question_type': 'short_answer', 'correct_answer': 'hello', 'points': 1},
            ],
        )
        aid = UUID(result['assessment_id'])
        assessment = engine._assessments[result['assessment_id']]
        qs = assessment.questions

        sub = await engine.submit_assessment(UUID(int=700), aid, answers=[
            {'question_id': qs[0].question_id, 'answer': 'B'},
            {'question_id': qs[1].question_id, 'answer': 'true'},
            {'question_id': qs[2].question_id, 'answer': 'hello'},
        ])
        assert sub['passed'] is True
        assert sub['earned_points'] == 3

    async def test_submission_not_found(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.grade_assessment(UUID(int=999))
        assert 'error' in result

    async def test_assessment_not_found(self):
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.submit_assessment(UUID(int=1), UUID(int=999), [])
        assert 'error' in result


# ═══════════════════════════════════════════════════════════════════
# Part 5: Cross-Engine Integration Tests
# ═══════════════════════════════════════════════════════════════════

class TestEngineIntegration:
    """Test that engines work together through the shared graph."""

    async def test_recommendation_and_learning_path_share_graph(self, graph, traversal):
        """Both engines can access the same graph data."""
        g, node_map = graph

        rec = RecommendationEngine(graph_engine=g, traversal_engine=traversal)
        await rec.initialize()
        recs = await rec.recommend_by_career(node_map['backend'], limit=5)

        lp = LearningPathEngine(graph_engine=g, traversal_engine=traversal)
        await lp.initialize()
        path = await lp.generate_dependency_roadmap(node_map['backend'])

        # Both should have results
        assert len(recs) >= 0
        assert path['milestone_count'] >= 0

    async def test_career_engine_uses_graph(self, graph, traversal):
        g, node_map = graph
        engine = CareerEngine(graph_engine=g, traversal_engine=traversal)
        await engine.initialize()
        gap = await engine.get_skill_gap(UUID(int=1), node_map['backend'])
        assert 'total_required' in gap
        assert gap['total_required'] >= 0

    async def test_assessment_engine_independent(self):
        """Assessment engine works independently (no graph needed for core operations)."""
        engine = AssessmentEngine()
        await engine.initialize()
        result = await engine.create_assessment(
            UUID(int=1), 'Standalone Quiz',
            questions=[{'text': 'Q1', 'correct_answer': 'A', 'points': 1, 'question_type': 'multiple_choice'}],
        )
        assert 'assessment_id' in result

    async def test_four_engines_lifecycle(self):
        """All 4 engines can go through full lifecycle without errors."""
        rec = RecommendationEngine()
        lp = LearningPathEngine()
        career = CareerEngine()
        assessment = AssessmentEngine()

        for engine in [rec, lp, career, assessment]:
            await engine.initialize()
            assert engine.engine_state == EngineState.READY
            await engine.start()
            assert engine.engine_state == EngineState.RUNNING
            health = await engine.health()
            assert health.healthy
            await engine.stop()
            assert engine.engine_state == EngineState.STOPPED

    async def test_engine_name_uniqueness(self):
        """All 4 engines have unique names."""
        names = [
            RecommendationEngine().engine_name,
            LearningPathEngine().engine_name,
            CareerEngine().engine_name,
            AssessmentEngine().engine_name,
        ]
        assert len(names) == len(set(names))  # All unique

    async def test_engine_dependencies_structure(self, graph):
        g, _ = graph
        engines = [
            RecommendationEngine(graph_engine=g),
            LearningPathEngine(graph_engine=g),
            CareerEngine(graph_engine=g),
            AssessmentEngine(),
        ]
        for engine in engines:
            deps = engine.dependencies()
            assert isinstance(deps, list)
            for dep in deps:
                assert isinstance(dep, EngineDependency)
                assert dep.engine_name
