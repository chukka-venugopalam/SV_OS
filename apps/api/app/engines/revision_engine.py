"""Revision Engine — deterministic revision planning with spaced repetition.

Supports:
- Revision queues per user
- Spaced review intervals (1, 3, 7, 14, 30 days)
- Overdue detection
- Revision history
- Daily and weekly plans
- Completed and skipped revisions tracking
- Revision statistics

No AI. No ML. Pure deterministic rules.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID, uuid4

from app.engines.base import EngineBase, EngineDependency, EngineHealth

SPACED_INTERVALS = [1, 3, 7, 14, 30, 60]  # Days between reviews


@dataclass
class RevisionItem:
    """A single item scheduled for revision."""

    item_id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ''
    node_id: str = ''
    node_title: str = ''
    difficulty: str = 'intermediate'
    interval_days: int = 1
    scheduled_date: str = field(default_factory=lambda: datetime.now(UTC).isoformat())
    completed: bool = False
    skipped: bool = False
    completed_at: str | None = None
    confidence: float = 0.0  # 0.0 to 1.0
    revision_count: int = 0


@dataclass
class RevisionPlan:
    """A daily or weekly revision plan."""

    plan_id: str = field(default_factory=lambda: str(uuid4()))
    user_id: str = ''
    plan_type: str = 'daily'  # daily, weekly
    date: str = field(default_factory=lambda: datetime.now(UTC).date().isoformat())
    items: list[RevisionItem] = field(default_factory=list)
    total_items: int = 0
    completed_items: int = 0
    estimated_minutes: int = 0


class RevisionEngine(EngineBase):
    """Revision Engine — deterministic revision planning.

    Public Interface:
        build_queue, get_daily_plan, get_weekly_plan,
        mark_completed, mark_skipped, get_overdue,
        get_statistics, get_history
    """

    def __init__(self, state_engine: Any | None = None, graph_engine: Any | None = None) -> None:
        super().__init__()
        self._state = state_engine
        self._graph = graph_engine
        self._items: dict[str, RevisionItem] = {}
        self._user_items: dict[str, list[str]] = {}
        self._plans: dict[str, RevisionPlan] = {}

    def _default_name(self) -> str:
        return 'revision'

    def dependencies(self) -> list[EngineDependency]:
        return [
            EngineDependency(engine_name='state', required=False),
            EngineDependency(engine_name='graph', required=False),
        ]

    async def _initialize_impl(self) -> None:
        pass

    async def _start_impl(self) -> None:
        pass

    async def _stop_impl(self) -> None:
        self._items.clear()
        self._user_items.clear()
        self._plans.clear()

    async def health_impl(self) -> EngineHealth:
        return EngineHealth(
            engine_name=self.engine_name,
            state=self.engine_state,
            healthy=True,
            message='Revision engine is operational',
            details={
                'total_items': len(self._items),
                'users_tracking': len(self._user_items),
            },
        )

    async def validate_configuration(self) -> list[str]:
        return []

    async def build_queue(self, user_id: UUID, node_ids: list[str] | None = None) -> list[dict]:
        """Build or rebuild the revision queue for a user."""
        uid = str(user_id)
        item_ids = self._user_items.get(uid, [])

        if node_ids:
            for nid in node_ids:
                existing = next(
                    (i for i in item_ids if self._items.get(i) and self._items[i].node_id == nid),
                    None,
                )
                if not existing:
                    item = RevisionItem(user_id=uid, node_id=nid, node_title=nid)
                    self._items[item.item_id] = item
                    item_ids.append(item.item_id)

        self._user_items[uid] = item_ids
        items = [self._items[iid] for iid in item_ids if iid in self._items]
        return [self._item_to_dict(i) for i in items]

    async def get_daily_plan(self, user_id: UUID, date: str | None = None) -> dict:
        """Get the daily revision plan for a user."""
        uid = str(user_id)
        today = date or datetime.now(UTC).date().isoformat()
        plan_id = f'daily_{uid}_{today}'

        if plan_id in self._plans:
            return self._plan_to_dict(self._plans[plan_id])

        # Build plan from items due today
        due_items = await self._get_due_items(user_id)
        plan = RevisionPlan(
            plan_id=plan_id,
            user_id=uid,
            plan_type='daily',
            date=today,
            items=due_items[:10],
            total_items=len(due_items[:10]),
            estimated_minutes=len(due_items[:10]) * 15,
        )
        self._plans[plan_id] = plan
        return self._plan_to_dict(plan)

    async def get_weekly_plan(self, user_id: UUID) -> dict:
        """Get the weekly revision plan for a user."""
        uid = str(user_id)
        today = datetime.now(UTC).date()
        week_start = today - timedelta(days=today.weekday())
        plan_id = f'weekly_{uid}_{week_start.isoformat()}'

        if plan_id in self._plans:
            return self._plan_to_dict(self._plans[plan_id])

        # Build plan from all overdue items
        overdue = await self._get_overdue_items(user_id)
        plan = RevisionPlan(
            plan_id=plan_id,
            user_id=uid,
            plan_type='weekly',
            date=week_start.isoformat(),
            items=overdue[:30],
            total_items=len(overdue[:30]),
            estimated_minutes=len(overdue[:30]) * 20,
        )
        self._plans[plan_id] = plan
        return self._plan_to_dict(plan)

    async def mark_completed(self, user_id: UUID, node_id: UUID, confidence: float = 0.8) -> dict:
        """Mark a revision item as completed."""
        uid = str(user_id)
        nid = str(node_id)
        item_ids = self._user_items.get(uid, [])
        for iid in item_ids:
            item = self._items.get(iid)
            if item and item.node_id == nid and not item.completed:
                item.completed = True
                item.completed_at = datetime.now(UTC).isoformat()
                item.confidence = confidence
                item.revision_count += 1
                # Increase interval
                idx = min(item.revision_count, len(SPACED_INTERVALS) - 1)
                item.interval_days = SPACED_INTERVALS[idx]
                return self._item_to_dict(item)
        return {'error': 'Item not found'}

    async def mark_skipped(self, user_id: UUID, node_id: UUID) -> dict:
        """Mark a revision item as skipped."""
        uid = str(user_id)
        nid = str(node_id)
        for iid in self._user_items.get(uid, []):
            item = self._items.get(iid)
            if item and item.node_id == nid:
                item.skipped = True
                return self._item_to_dict(item)
        return {'error': 'Item not found'}

    async def get_overdue(self, user_id: UUID) -> list[dict]:
        """Get all overdue revision items for a user."""
        overdue = await self._get_overdue_items(user_id)
        return [self._item_to_dict(i) for i in overdue]

    async def get_statistics(self, user_id: UUID) -> dict:
        """Get revision statistics for a user."""
        uid = str(user_id)
        item_ids = self._user_items.get(uid, [])
        items = [self._items[iid] for iid in item_ids if iid in self._items]

        total = len(items)
        completed = sum(1 for i in items if i.completed)
        skipped = sum(1 for i in items if i.skipped)
        overdue = sum(1 for i in items if not i.completed and not i.skipped and self._is_overdue(i))
        return {
            'total_items': total,
            'completed': completed,
            'skipped': skipped,
            'overdue': overdue,
            'pending': total - completed - skipped,
            'completion_rate': round(completed / total * 100, 1) if total else 0.0,
            'avg_confidence': round(
                sum(i.confidence for i in items if i.completed) / max(completed, 1),
                2,
            ),
        }

    async def get_history(self, user_id: UUID, limit: int = 50) -> list[dict]:
        """Get revision history for a user."""
        uid = str(user_id)
        item_ids = self._user_items.get(uid, [])
        items = [self._items[iid] for iid in item_ids if iid in self._items]
        items.sort(key=lambda i: i.completed_at or '', reverse=True)
        return [self._item_to_dict(i) for i in items[:limit]]

    async def _get_due_items(self, user_id: UUID) -> list[RevisionItem]:
        """Get items due for revision today."""
        uid = str(user_id)
        today = datetime.now(UTC).date().isoformat()
        items = []
        for iid in self._user_items.get(uid, []):
            item = self._items.get(iid)
            if item and not item.completed and not item.skipped:
                scheduled = datetime.fromisoformat(item.scheduled_date).date().isoformat()
                if scheduled <= today:
                    items.append(item)
        return items

    async def _get_overdue_items(self, user_id: UUID) -> list[RevisionItem]:
        """Get all overdue items."""
        items = await self._get_due_items(user_id)
        datetime.now(UTC).date()
        overdue = []
        for item in items:
            if self._is_overdue(item):
                overdue.append(item)
        overdue.sort(key=lambda i: i.scheduled_date)
        return overdue

    def _is_overdue(self, item: RevisionItem) -> bool:
        """Check if a revision item is overdue."""
        try:
            scheduled = datetime.fromisoformat(item.scheduled_date)
            return scheduled.date() < datetime.now(UTC).date()
        except (ValueError, TypeError):
            return False

    def _item_to_dict(self, item: RevisionItem) -> dict:
        return {
            'item_id': item.item_id,
            'user_id': item.user_id,
            'node_id': item.node_id,
            'node_title': item.node_title,
            'difficulty': item.difficulty,
            'interval_days': item.interval_days,
            'scheduled_date': item.scheduled_date,
            'completed': item.completed,
            'skipped': item.skipped,
            'completed_at': item.completed_at,
            'confidence': item.confidence,
            'revision_count': item.revision_count,
        }

    def _plan_to_dict(self, plan: RevisionPlan) -> dict:
        return {
            'plan_id': plan.plan_id,
            'user_id': plan.user_id,
            'plan_type': plan.plan_type,
            'date': plan.date,
            'items': [self._item_to_dict(i) for i in plan.items],
            'total_items': plan.total_items,
            'completed_items': plan.completed_items,
            'estimated_minutes': plan.estimated_minutes,
        }
