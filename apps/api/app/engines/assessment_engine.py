"""Assessment Engine — define, submit, and evaluate assessments.

Supports:
- Assessment creation with questions
- Question retrieval by node
- Submission handling
- Grading (manual and automatic)
- Attempt history per user
- Score history per assessment
- Pass/fail determination
- Knowledge updates after assessment
- Confidence updates after assessment
- Recommendation triggers after assessment
- Learning path updates after assessment
- Assessment statistics
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth


# ── Data Structures ────────────────────────────────────────────────


@dataclass
class Question:
    """A single question within an assessment."""
    question_id: str = field(default_factory=lambda: str(uuid4()))
    text: str = ''
    question_type: str = 'multiple_choice'  # multiple_choice, true_false, short_answer, coding
    options: list[str] = field(default_factory=list)  # For MC/TF
    correct_answer: str | list[str] = ''
    points: int = 1
    difficulty: str = 'intermediate'
    tags: list[str] = field(default_factory=list)


@dataclass
class Assessment:
    """An assessment attached to a knowledge node."""
    assessment_id: str = field(default_factory=lambda: str(uuid4()))
    node_id: str = ''
    title: str = ''
    description: str = ''
    questions: list[Question] = field(default_factory=list)
    passing_score: float = 0.7  # 70% to pass
    max_attempts: int = 3
    time_limit_minutes: int = 0  # 0 = no limit
    is_published: bool = True
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    total_points: int = 0


@dataclass
class Submission:
    """A learner's attempt at an assessment."""
    submission_id: str = field(default_factory=lambda: str(uuid4()))
    assessment_id: str = ''
    user_id: str = ''
    node_id: str = ''
    answers: list[dict] = field(default_factory=list)  # [{question_id, answer, score}]
    score: float = 0.0
    total_points: int = 0
    earned_points: int = 0
    passed: bool = False
    graded: bool = False
    attempted_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    graded_at: str | None = None
    grader: str = 'auto'  # 'auto' or 'manual'
    time_spent_seconds: int = 0
    feedback: str = ''


@dataclass
class GradingResult:
    """Result of grading a submission."""
    submission_id: str
    score: float
    passed: bool
    earned_points: int
    total_points: int
    question_results: list[dict] = field(default_factory=list)


# ── Assessment Engine ──────────────────────────────────────────────


class AssessmentEngine(EngineBase):
    """Assessment Engine — assessment definition, submission, and grading.

    Public Interface:
        create_assessment, get_assessment, get_assessments_for_node,
        submit_assessment, grade_assessment,
        get_attempts_for_user, get_score_history,
        update_knowledge, update_confidence,
        get_assessment_statistics
    """

    def __init__(
        self,
        state_engine: Any | None = None,
        validation_engine: Any | None = None,
        graph_engine: Any | None = None,
    ) -> None:
        super().__init__()
        self._state = state_engine
        self._validation = validation_engine
        self._graph = graph_engine

        # In-memory storage
        self._assessments: dict[str, Assessment] = {}       # assessment_id -> Assessment
        self._node_assessments: dict[str, list[str]] = {}   # node_id -> list of assessment_ids
        self._submissions: dict[str, Submission] = {}       # submission_id -> Submission
        self._user_submissions: dict[str, list[str]] = {}   # user_id -> list of submission_ids

    def _default_name(self) -> str:
        return 'assessment'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='state', required=False, description='State engine for confidence updates'),
            EngineDependency(engine_name='validation', required=False, description='Validation engine for validation'),
            EngineDependency(engine_name='graph', required=False, description='Graph engine for node data'),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._assessments.clear()
        self._node_assessments.clear()
        self._submissions.clear()
        self._user_submissions.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Assessment engine is operational',
            details={
                'total_assessments': len(self._assessments),
                'total_submissions': len(self._submissions),
            },
        )

    async def validate_configuration(self) -> list[str]:
        return []

    # ═══════════════════════════════════════════════════════════════
    # Assessment CRUD
    # ═══════════════════════════════════════════════════════════════

    async def create_assessment(
        self,
        node_id: UUID,
        title: str,
        description: str = '',
        questions: list[dict] | None = None,
        passing_score: float = 0.7,
        time_limit_minutes: int = 0,
    ) -> dict:
        """Create a new assessment for a knowledge node."""
        question_objects = []
        for q_data in (questions or []):
            question_objects.append(Question(
                text=q_data.get('text', ''),
                question_type=q_data.get('question_type', 'multiple_choice'),
                options=q_data.get('options', []),
                correct_answer=q_data.get('correct_answer', ''),
                points=q_data.get('points', 1),
                difficulty=q_data.get('difficulty', 'intermediate'),
                tags=q_data.get('tags', []),
            ))

        total_points = sum(q.points for q in question_objects)

        assessment = Assessment(
            node_id=str(node_id),
            title=title,
            description=description,
            questions=question_objects,
            passing_score=passing_score,
            time_limit_minutes=time_limit_minutes,
            total_points=total_points,
        )

        self._assessments[assessment.assessment_id] = assessment
        self._node_assessments.setdefault(str(node_id), []).append(assessment.assessment_id)

        return self._assessment_to_dict(assessment)

    async def get_assessment(self, assessment_id: UUID) -> dict | None:
        """Get an assessment by ID (without revealing correct answers)."""
        assessment = self._assessments.get(str(assessment_id))
        if assessment is None:
            return None
        return self._assessment_to_dict(assessment, include_answers=False)

    async def get_assessment_with_answers(self, assessment_id: UUID) -> dict | None:
        """Get assessment including correct answers (for graders)."""
        assessment = self._assessments.get(str(assessment_id))
        if assessment is None:
            return None
        return self._assessment_to_dict(assessment, include_answers=True)

    async def get_assessments_for_node(self, node_id: UUID) -> list[dict]:
        """Get all assessments for a knowledge node."""
        assessment_ids = self._node_assessments.get(str(node_id), [])
        return [
            self._assessment_to_dict(self._assessments[aid], include_answers=False)
            for aid in assessment_ids if aid in self._assessments
        ]

    # ═══════════════════════════════════════════════════════════════
    # Submission
    # ═══════════════════════════════════════════════════════════════

    async def submit_assessment(
        self,
        user_id: UUID,
        assessment_id: UUID,
        answers: list[dict],
        time_spent_seconds: int = 0,
    ) -> dict:
        """Submit answers for an assessment.

        Automatically grades the submission and returns the result.

        Args:
            user_id: The user's UUID.
            assessment_id: The assessment UUID.
            answers: List of {question_id, answer} dicts.
            time_spent_seconds: Optional time spent on assessment.

        Returns:
            Dict with submission_id, score, passed, and feedback.
        """
        assessment = self._assessments.get(str(assessment_id))
        if assessment is None:
            return {'error': 'Assessment not found', 'submission_id': None}

        # Check attempt limit
        submissions_for_user = self._user_submissions.get(str(user_id), [])
        attempt_count = sum(
            1 for sid in submissions_for_user
            if self._submissions.get(sid, None) and self._submissions[sid].assessment_id == str(assessment_id)
        )
        if attempt_count >= assessment.max_attempts:
            return {
                'error': f'Maximum attempts ({assessment.max_attempts}) reached',
                'submission_id': None,
            }

        # Create submission
        submission = Submission(
            assessment_id=str(assessment_id),
            user_id=str(user_id),
            node_id=assessment.node_id,
            answers=answers,
            time_spent_seconds=time_spent_seconds,
        )

        # Auto-grade
        grading = await self._grade(submission, assessment)
        submission.score = grading.score
        submission.passed = grading.passed
        submission.earned_points = grading.earned_points
        submission.total_points = grading.total_points
        submission.graded = True
        submission.graded_at = datetime.now(UTC).isoformat()

        self._submissions[submission.submission_id] = submission
        self._user_submissions.setdefault(str(user_id), []).append(submission.submission_id)

        # Publish event
        await self.publish_event(
            'assessment.submitted.v1',
            {
                'submission_id': submission.submission_id,
                'assessment_id': str(assessment_id),
                'user_id': str(user_id),
                'node_id': assessment.node_id,
                'passed': submission.passed,
                'score': submission.score,
                'attempt': attempt_count + 1,
            },
            correlation_id=str(user_id),
            causation_id=submission.submission_id,
        )

        return self._submission_to_dict(submission, grading.question_results)

    # ═══════════════════════════════════════════════════════════════
    # Grading
    # ═══════════════════════════════════════════════════════════════

    async def grade_assessment(self, submission_id: UUID) -> dict:
        """Re-grade an assessment submission.

        Returns the full grading result including per-question feedback.
        """
        submission = self._submissions.get(str(submission_id))
        if submission is None:
            return {'error': 'Submission not found'}

        assessment = self._assessments.get(submission.assessment_id)
        if assessment is None:
            return {'error': 'Assessment not found'}

        grading = await self._grade(submission, assessment)
        submission.score = grading.score
        submission.passed = grading.passed
        submission.earned_points = grading.earned_points
        submission.graded = True
        submission.graded_at = datetime.now(UTC).isoformat()

        # Publish event
        await self.publish_event(
            'assessment.scored.v1',
            {
                'submission_id': submission.submission_id,
                'assessment_id': submission.assessment_id,
                'user_id': submission.user_id,
                'score': submission.score,
                'passed': submission.passed,
            },
            correlation_id=submission.user_id,
        )

        return self._submission_to_dict(submission, grading.question_results)

    async def _grade(self, submission: Submission, assessment: Assessment) -> GradingResult:
        """Auto-grade a submission by comparing answers to correct answers.

        Supports: multiple_choice, true_false, short_answer (exact match),
        coding (exact match by default).
        """
        question_results: list[dict] = []
        question_map = {q.question_id: q for q in assessment.questions}
        earned = 0

        for answer in submission.answers:
            qid = answer.get('question_id', '')
            user_answer = answer.get('answer', '')
            question = question_map.get(qid)

            if question is None:
                continue

            # Determine score
            is_correct = self._check_answer(question, user_answer)
            q_score = question.points if is_correct else 0
            earned += q_score

            question_results.append({
                'question_id': qid,
                'question_text': question.text[:100],
                'question_type': question.question_type,
                'user_answer': user_answer,
                'correct_answer': question.correct_answer,
                'is_correct': is_correct,
                'points': question.points,
                'earned': q_score,
            })

        total_points = assessment.total_points or sum(q.points for q in assessment.questions)
        score = earned / total_points if total_points > 0 else 0.0
        passed = score >= assessment.passing_score

        return GradingResult(
            submission_id=submission.submission_id,
            score=round(score, 4),
            passed=passed,
            earned_points=earned,
            total_points=total_points,
            question_results=question_results,
        )

    def _check_answer(self, question: Question, user_answer: Any) -> bool:
        """Check if a user's answer matches the correct answer.

        Type-specific comparison logic.
        """
        correct = question.correct_answer
        question_type = question.question_type

        if question_type == 'multiple_choice':
            return str(user_answer).strip().lower() == str(correct).strip().lower()

        if question_type == 'true_false':
            return str(user_answer).strip().lower() == str(correct).strip().lower()

        if question_type == 'short_answer':
            # Normalize whitespace and case
            return str(user_answer).strip().lower() == str(correct).strip().lower()

        if question_type == 'coding':
            # Simple exact match for coding answers
            return str(user_answer).strip() == str(correct).strip()

        # Default: exact match
        return str(user_answer) == str(correct)

    # ═══════════════════════════════════════════════════════════════
    # History & Statistics
    # ═══════════════════════════════════════════════════════════════

    async def get_attempts_for_user(self, user_id: UUID, assessment_id: UUID) -> list[dict]:
        """Get all attempts for a user on a specific assessment."""
        submission_ids = self._user_submissions.get(str(user_id), [])
        attempts = []
        for sid in submission_ids:
            sub = self._submissions.get(sid)
            if sub and sub.assessment_id == str(assessment_id):
                attempts.append(self._submission_to_dict(sub))
        return attempts

    async def get_score_history(self, user_id: UUID, node_id: UUID) -> list[dict]:
        """Get all assessment scores for a user on a specific node."""
        submission_ids = self._user_submissions.get(str(user_id), [])
        scores = []
        for sid in submission_ids:
            sub = self._submissions.get(sid)
            if sub and sub.node_id == str(node_id):
                scores.append({
                    'submission_id': sub.submission_id,
                    'score': sub.score,
                    'passed': sub.passed,
                    'attempted_at': sub.attempted_at,
                    'time_spent_seconds': sub.time_spent_seconds,
                })
        return scores

    async def get_assessment_statistics(self, assessment_id: UUID) -> dict:
        """Get statistics for an assessment across all submissions."""
        assessment = self._assessments.get(str(assessment_id))
        if assessment is None:
            return {'error': 'Assessment not found'}

        all_scores = []
        pass_count = 0
        total_count = 0

        for sub in self._submissions.values():
            if sub.assessment_id == str(assessment_id):
                all_scores.append(sub.score)
                total_count += 1
                if sub.passed:
                    pass_count += 1

        avg_score = sum(all_scores) / len(all_scores) if all_scores else 0.0
        pass_rate = pass_count / total_count if total_count > 0 else 0.0
        highest_score = max(all_scores) if all_scores else 0.0
        lowest_score = min(all_scores) if all_scores else 0.0

        return {
            'assessment_id': str(assessment_id),
            'title': assessment.title,
            'total_attempts': total_count,
            'pass_count': pass_count,
            'pass_rate': round(pass_rate, 4),
            'average_score': round(avg_score, 4),
            'highest_score': round(highest_score, 4),
            'lowest_score': round(lowest_score, 4),
            'question_count': len(assessment.questions),
            'total_points': assessment.total_points,
        }

    # ═══════════════════════════════════════════════════════════════
    # Knowledge & Confidence Updates
    # ═══════════════════════════════════════════════════════════════

    async def update_knowledge(self, submission_id: UUID) -> dict:
        """Update learner's knowledge state based on assessment results.

        Called after grading to propagate knowledge state changes.
        Publishes a knowledge.content.updated.v1 event.
        """
        submission = self._submissions.get(str(submission_id))
        if submission is None:
            return {'error': 'Submission not found', 'updated': False}

        try:
            await self.publish_event(
                'knowledge.content.updated.v1',
                {
                    'user_id': submission.user_id,
                    'node_id': submission.node_id,
                    'submission_id': submission.submission_id,
                    'score': submission.score,
                    'passed': submission.passed,
                },
                correlation_id=submission.user_id,
            )
            return {'updated': True, 'user_id': submission.user_id, 'node_id': submission.node_id}
        except Exception as exc:
            return {'error': str(exc), 'updated': False}

    async def update_confidence(self, submission_id: UUID) -> dict:
        """Update confidence scores based on assessment performance.

        Passing an assessment increases confidence; failing decreases it.
        Publishes a state.updated.v1 event.
        """
        submission = self._submissions.get(str(submission_id))
        if submission is None:
            return {'error': 'Submission not found', 'updated': False}

        try:
            await self.publish_event(
                'state.updated.v1',
                {
                    'user_id': submission.user_id,
                    'node_id': submission.node_id,
                    'event': 'assessment_graded',
                    'score': submission.score,
                    'passed': submission.passed,
                },
                correlation_id=submission.user_id,
            )
            return {'updated': True, 'user_id': submission.user_id, 'node_id': submission.node_id}
        except Exception as exc:
            return {'error': str(exc), 'updated': False}

    # ═══════════════════════════════════════════════════════════════
    # Helpers
    # ═══════════════════════════════════════════════════════════════

    def _assessment_to_dict(self, assessment: Assessment, include_answers: bool = False) -> dict:
        """Convert assessment to dict, optionally including correct answers."""
        questions = []
        for q in assessment.questions:
            q_dict = {
                'question_id': q.question_id,
                'text': q.text,
                'question_type': q.question_type,
                'options': q.options,
                'points': q.points,
                'difficulty': q.difficulty,
                'tags': q.tags,
            }
            if include_answers:
                q_dict['correct_answer'] = q.correct_answer
            questions.append(q_dict)

        return {
            'assessment_id': assessment.assessment_id,
            'node_id': assessment.node_id,
            'title': assessment.title,
            'description': assessment.description,
            'questions': questions,
            'question_count': len(assessment.questions),
            'passing_score': assessment.passing_score,
            'max_attempts': assessment.max_attempts,
            'time_limit_minutes': assessment.time_limit_minutes,
            'total_points': assessment.total_points,
            'is_published': assessment.is_published,
            'created_at': assessment.created_at,
        }

    def _submission_to_dict(
        self, submission: Submission, question_results: list[dict] | None = None
    ) -> dict:
        result = {
            'submission_id': submission.submission_id,
            'assessment_id': submission.assessment_id,
            'user_id': submission.user_id,
            'node_id': submission.node_id,
            'score': submission.score,
            'earned_points': submission.earned_points,
            'total_points': submission.total_points,
            'passed': submission.passed,
            'graded': submission.graded,
            'attempted_at': submission.attempted_at,
            'graded_at': submission.graded_at,
            'grader': submission.grader,
            'time_spent_seconds': submission.time_spent_seconds,
            'feedback': submission.feedback,
        }
        if question_results is not None:
            result['question_results'] = question_results
        return result
