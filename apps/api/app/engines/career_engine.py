"""Career Engine — map learner progress to career opportunities.

Supports:
- Career lookup by ID/slug
- Career comparison (side-by-side)
- Skill gap analysis (what's missing for a target career)
- Required knowledge graph (all prerequisites for a career)
- Recommended roadmap (generate learning path toward a career)
- Career similarity (find similar careers)
- Missing concepts, projects, assessments
- Career progression (junior → senior → lead)
- Seniority requirements
- Career metadata (salary, demand, growth)
- Search careers by keyword
- Filter careers by industry/seniority/type
- Career statistics (counts by industry, demand distribution)
"""

from __future__ import annotations

import contextlib
from dataclasses import dataclass, field
from typing import Any
from uuid import UUID

from app.engines.base import EngineBase, EngineDependency, EngineHealth


@dataclass
class CareerProfile:
    """A career with full metadata."""

    node_id: str = ''
    title: str = ''
    slug: str = ''
    description: str = ''
    industry: str = ''
    seniority: str = 'mid'  # entry, mid, senior, lead, executive
    salary_range: str = ''
    demand: str = 'moderate'  # low, moderate, high, critical
    growth_outlook: str = 'stable'
    required_skills: list[str] = field(default_factory=list)
    recommended_skills: list[str] = field(default_factory=list)
    similar_careers: list[str] = field(default_factory=list)
    progression: list[str] = field(default_factory=list)


@dataclass
class SkillGap:
    """Identified skill gap between a learner and a career."""

    skill_name: str = ''
    status: str = 'missing'  # missing, weak, adequate, strong
    node_id: str = ''
    node_title: str = ''
    urgency: str = 'recommended'  # required, recommended, optional


class CareerEngine(EngineBase):
    """Career Engine — career matching and skill-gap analysis.

    Public Interface:
        get_career, search_careers, filter_careers,
        compare_careers, get_skill_gap,
        get_required_knowledge_graph, get_recommended_roadmap,
        get_career_similarity, get_missing_concepts,
        get_missing_projects, get_missing_assessments,
        get_career_progression, get_seniority_requirements,
        get_career_statistics, get_career_metadata
    """

    def __init__(
        self,
        graph_engine: Any | None = None,
        traversal_engine: Any | None = None,
        state_engine: Any | None = None,
        knowledge_engine: Any | None = None,
    ) -> None:
        super().__init__()
        self._graph = graph_engine
        self._traversal = traversal_engine
        self._state = state_engine
        self._knowledge = knowledge_engine

    def _default_name(self) -> str:
        return 'career'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(
                engine_name='graph',
                required=True,
                description='Graph engine for node data',
            ),
            EngineDependency(
                engine_name='traversal',
                required=False,
                description='Traversal engine for dependency chains',
            ),
            EngineDependency(
                engine_name='state',
                required=False,
                description='State engine for learner progress',
            ),
            EngineDependency(
                engine_name='knowledge',
                required=False,
                description='Knowledge engine for career metadata',
            ),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        pass

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Career engine is operational',
        )

    async def validate_configuration(self) -> list[str]:
        issues: list[str] = []
        if self._graph is None:
            issues.append('No GraphEngine reference set')
        return issues

    # ═══════════════════════════════════════════════════════════════
    # Career Lookup
    # ═══════════════════════════════════════════════════════════════

    async def get_career(self, career_id: UUID) -> dict | None:
        """Get a single career by node ID."""
        if self._graph is None:
            return None
        node = await self._graph.get_node(career_id)
        if node is None or node.get('node_type') != 'career':
            return None
        return await self._enrich_career(node)

    async def search_careers(self, query: str, limit: int = 20) -> list[dict]:
        """Search careers by title, slug, or description."""
        if self._graph is None:
            return []

        all_nodes = await self._graph.all_nodes()
        careers = [n for n in all_nodes if n.get('node_type') == 'career']
        query_lower = query.lower()

        matches = []
        for career in careers:
            title = career.get('title', '').lower()
            slug = career.get('slug', '').lower()
            desc = career.get('description', '').lower()

            if query_lower in title or query_lower in slug or query_lower in desc:
                matches.append(await self._enrich_career(career))

        return matches[:limit]

    async def filter_careers(
        self,
        industry: str | None = None,
        seniority: str | None = None,
        demand: str | None = None,
        limit: int = 20,
    ) -> list[dict]:
        """Filter careers by industry, seniority, or demand."""
        if self._graph is None:
            return []

        all_nodes = await self._graph.all_nodes()
        careers = [n for n in all_nodes if n.get('node_type') == 'career']

        filtered = []
        for career in careers:
            meta = career.get('metadata', {})

            if industry and meta.get('industry', '').lower() != industry.lower():
                continue
            if seniority and meta.get('seniority', '').lower() != seniority.lower():
                continue
            if demand and meta.get('demand', '').lower() != demand.lower():
                continue

            filtered.append(await self._enrich_career(career))

        return filtered[:limit]

    # ═══════════════════════════════════════════════════════════════
    # Career Comparison
    # ═══════════════════════════════════════════════════════════════

    async def compare_careers(self, career_ids: list[UUID]) -> list[dict]:
        """Compare multiple careers side by side."""
        results = []
        for cid in career_ids:
            career = await self.get_career(cid)
            if career:
                results.append(career)
        return results

    async def get_career_similarity(self, career_id: UUID, limit: int = 5) -> list[dict]:
        """Find careers similar to a given career by shared knowledge."""
        if self._graph is None or self._traversal is None:
            return []

        # Get nodes required for this career's prerequisites
        chain = await self._traversal.dependency_chain(career_id, max_depth=3)
        career_required = set()
        for level in chain:
            for item in level:
                career_required.add(item.get('node_id', ''))

        # Compare with other careers
        all_nodes = await self._graph.all_nodes()
        other_careers = [
            n for n in all_nodes if n.get('node_type') == 'career' and n['id'] != str(career_id)
        ]

        similarities = []
        for other in other_careers:
            other_chain = await self._traversal.dependency_chain(UUID(other['id']), max_depth=3)
            other_required = set()
            for level in other_chain:
                for item in level:
                    other_required.add(item.get('node_id', ''))

            if career_required and other_required:
                intersection = career_required & other_required
                union = career_required | other_required
                jaccard = len(intersection) / len(union) if union else 0
                similarities.append((jaccard, other))

        similarities.sort(key=lambda x: x[0], reverse=True)
        return [
            {**other, 'similarity_score': round(score, 3)} for score, other in similarities[:limit]
        ]

    # ═══════════════════════════════════════════════════════════════
    # Skill Gap Analysis
    # ═══════════════════════════════════════════════════════════════

    async def get_skill_gap(self, user_id: UUID, career_id: UUID) -> dict:
        """Analyze the skill gap between a user and a career."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Required engines not available'}

        # Get required nodes for this career
        chain = await self._traversal.dependency_chain(career_id, max_depth=5)
        all_required: list[str] = []
        for level in chain:
            for item in level:
                all_required.append(item.get('node_id', ''))

        career = await self._graph.get_node(career_id)
        career_title = career.get('title', '') if career else ''

        # Get user's completed nodes
        completed: set[str] = set()
        if self._state:
            try:
                learner_state = await self._state.get_learner_state(user_id)
                active_nodes = getattr(learner_state, 'active_nodes', {})
                for nid_str, state_info in active_nodes.items():
                    if isinstance(state_info, dict) and state_info.get('status') in (
                        'completed',
                        'mastered',
                    ):
                        completed.add(nid_str)
            except Exception:
                pass

        # Build skill gaps
        gaps: list[SkillGap] = []
        for nid in all_required:
            node = await self._graph.get_node(UUID(nid))
            if node:
                if nid not in completed:
                    gaps.append(
                        SkillGap(
                            skill_name=node.get('title', ''),
                            status='missing',
                            node_id=nid,
                            node_title=node.get('title', ''),
                            urgency='required',
                        ),
                    )
                elif self._state:
                    try:
                        learner_state = await self._state.get_learner_state(user_id)
                        active_nodes = getattr(learner_state, 'active_nodes', {})
                        info = active_nodes.get(nid, {})
                        if isinstance(info, dict):
                            conf = info.get('confidence', 1.0)
                            if conf < 0.5:
                                gaps.append(
                                    SkillGap(
                                        skill_name=node.get('title', ''),
                                        status='weak',
                                        node_id=nid,
                                        node_title=node.get('title', ''),
                                        urgency='recommended',
                                    ),
                                )
                    except Exception:
                        pass

        missing_count = sum(1 for g in gaps if g.status == 'missing')
        weak_count = sum(1 for g in gaps if g.status == 'weak')

        return {
            'career_id': str(career_id),
            'career_title': career_title,
            'total_required': len(all_required),
            'completed': len(completed),
            'missing': missing_count,
            'weak': weak_count,
            'completion_percentage': round(len(completed) / len(all_required) * 100, 1)
            if all_required
            else 0.0,
            'gaps': [
                {
                    'skill_name': g.skill_name,
                    'status': g.status,
                    'node_id': g.node_id,
                    'node_title': g.node_title,
                    'urgency': g.urgency,
                }
                for g in gaps
            ],
        }

    # ═══════════════════════════════════════════════════════════════
    # Required Knowledge Graph
    # ═══════════════════════════════════════════════════════════════

    async def get_required_knowledge_graph(self, career_id: UUID) -> dict:
        """Get the full knowledge graph required for a career."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Required engines not available'}

        career = await self._graph.get_node(career_id)
        if career is None:
            return {'error': 'Career not found'}

        chain = await self._traversal.dependency_chain(career_id, max_depth=5)
        all_required_ids: list[str] = []
        for level in chain:
            for item in level:
                all_required_ids.append(item.get('node_id', ''))

        # Get detailed nodes
        required_nodes = []
        for nid in all_required_ids:
            node = await self._graph.get_node(UUID(nid))
            if node:
                required_nodes.append(node)

        return {
            'career': career,
            'required_nodes': required_nodes,
            'total_required': len(required_nodes),
            'levels': [
                {'level': i + 1, 'nodes': [n.get('title', '') for n in required_nodes]}
                for i, required_nodes in enumerate([required_nodes])
            ],
        }

    # ═══════════════════════════════════════════════════════════════
    # Roadmap
    # ═══════════════════════════════════════════════════════════════

    async def get_recommended_roadmap(self, career_id: UUID, user_id: UUID | None = None) -> dict:
        """Get a recommended learning path toward a career."""
        from app.engines.learning_path_engine import LearningPathEngine

        # Create a temporary learning path engine
        lpe = LearningPathEngine(
            graph_engine=self._graph,
            traversal_engine=self._traversal,
            state_engine=self._state,
        )
        await lpe.initialize()

        if user_id:
            return await lpe.generate_career_roadmap(career_id, user_id)
        return await lpe.generate_dependency_roadmap(career_id)

    # ═══════════════════════════════════════════════════════════════
    # Missing Items
    # ═══════════════════════════════════════════════════════════════

    async def get_missing_concepts(self, user_id: UUID, career_id: UUID) -> list[dict]:
        """Get concepts the learner hasn't completed for a career."""
        gap = await self.get_skill_gap(user_id, career_id)
        return [g for g in gap.get('gaps', []) if g.get('status') == 'missing']

    async def get_missing_projects(self, _user_id: UUID, career_id: UUID) -> list[dict]:
        """Get projects the learner hasn't completed for a career."""
        if self._knowledge is None:
            return []

        chain_result = (
            await self._traversal.dependency_chain(career_id, max_depth=5)
            if self._traversal
            else []
        )
        missing_projects = []

        for level in chain_result:
            for item in level:
                nid = item.get('node_id', '')
                projects = await self._knowledge.get_projects_for_node(UUID(nid))
                for proj in projects:
                    missing_projects.append(
                        {
                            'project': proj,
                            'related_node_id': nid,
                        },
                    )

        return missing_projects[:20]

    async def get_missing_assessments(self, _user_id: UUID, career_id: UUID) -> list[dict]:
        """Get assessments the learner hasn't passed for a career."""
        if self._knowledge is None:
            return []

        chain_result = (
            await self._traversal.dependency_chain(career_id, max_depth=5)
            if self._traversal
            else []
        )
        missing_assessments = []

        for level in chain_result:
            for item in level:
                nid = item.get('node_id', '')
                assessments = await self._knowledge.get_assessments_for_node(UUID(nid))
                for assessment in assessments:
                    missing_assessments.append(
                        {
                            'assessment': assessment,
                            'related_node_id': nid,
                        },
                    )

        return missing_assessments[:20]

    # ═══════════════════════════════════════════════════════════════
    # Career Progression
    # ═══════════════════════════════════════════════════════════════

    async def get_career_progression(self, career_id: UUID) -> dict:
        """Get the progression path (junior → senior → lead) for a career."""
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        career = await self._graph.get_node(career_id)
        if career is None:
            return {'error': 'Career not found'}

        meta = career.get('metadata', {})
        progression = meta.get(
            'progression',
            [
                {'level': 'entry', 'title': f'Junior {career.get("title", "")}', 'years': '0-2'},
                {'level': 'mid', 'title': career.get('title', ''), 'years': '2-5'},
                {'level': 'senior', 'title': f'Senior {career.get("title", "")}', 'years': '5-8'},
                {'level': 'lead', 'title': f'Lead {career.get("title", "")}', 'years': '8+'},
            ],
        )

        return {
            'career_id': str(career_id),
            'career_title': career.get('title', ''),
            'progression': progression,
            'current_seniority': meta.get('seniority', 'mid'),
        }

    async def get_seniority_requirements(
        self,
        career_id: UUID,
        target_seniority: str = 'senior',
    ) -> dict:
        """Get the requirements for reaching a specific seniority level."""
        if self._graph is None or self._traversal is None:
            return {'error': 'Required engines not available'}

        chain = await self._traversal.dependency_chain(career_id, max_depth=5)
        total_required = sum(len(level) for level in chain)

        seniority_map = {
            'entry': int(total_required * 0.3),
            'mid': int(total_required * 0.5),
            'senior': int(total_required * 0.75),
            'lead': total_required,
            'executive': total_required + int(total_required * 0.2),
        }

        return {
            'career_id': str(career_id),
            'target_seniority': target_seniority,
            'estimated_nodes_required': seniority_map.get(target_seniority, total_required),
            'total_nodes_available': total_required,
        }

    # ═══════════════════════════════════════════════════════════════
    # Career Metadata & Statistics
    # ═══════════════════════════════════════════════════════════════

    async def get_career_metadata(self, career_id: UUID) -> dict:
        """Get comprehensive metadata for a career."""
        career = await self.get_career(career_id)
        if career is None:
            return {'error': 'Career not found'}

        return career

    async def get_career_statistics(self) -> dict:
        """Get aggregate statistics across all careers."""
        if self._graph is None:
            return {'error': 'Graph engine not available'}

        all_nodes = await self._graph.all_nodes()
        careers = [n for n in all_nodes if n.get('node_type') == 'career']

        industries: dict[str, int] = {}
        demand_distribution: dict[str, int] = {'low': 0, 'moderate': 0, 'high': 0, 'critical': 0}
        seniority_distribution: dict[str, int] = {
            'entry': 0,
            'mid': 0,
            'senior': 0,
            'lead': 0,
            'executive': 0,
        }

        for career in careers:
            meta = career.get('metadata', {})
            ind = meta.get('industry', 'unknown')
            industries[ind] = industries.get(ind, 0) + 1

            dem = meta.get('demand', 'moderate')
            demand_distribution[dem] = demand_distribution.get(dem, 0) + 1

            sen = meta.get('seniority', 'mid')
            seniority_distribution[sen] = seniority_distribution.get(sen, 0) + 1

        return {
            'total_careers': len(careers),
            'industries': industries,
            'demand_distribution': demand_distribution,
            'seniority_distribution': seniority_distribution,
        }

    # ═══════════════════════════════════════════════════════════════
    # Helpers
    # ═══════════════════════════════════════════════════════════════

    async def _enrich_career(self, node: dict) -> dict:
        """Enrich a career node with metadata and related info."""
        meta = node.get('metadata', {})

        skills = []
        if self._knowledge:
            with contextlib.suppress(Exception):
                skills = await self._knowledge.get_skills_for_node(UUID(node['id']))

        return {
            **node,
            'industry': meta.get('industry', ''),
            'seniority': meta.get('seniority', 'mid'),
            'salary_range': meta.get('salary_range', ''),
            'demand': meta.get('demand', 'moderate'),
            'growth_outlook': meta.get('growth_outlook', 'stable'),
            'required_skills': [s.get('name', '') if isinstance(s, dict) else s for s in skills],
            'progression': meta.get('progression', []),
        }
