"""User profile, bookmark, favorite, history, and dashboard DTOs."""

from app.schemas.user.profile import (
    UserProfile,
    UserSettings,
    ProfileUpdate,
    UserSummary,
)
from app.schemas.user.bookmark import (
    BookmarkCreate,
    BookmarkDetail,
    BookmarkList,
)
from app.schemas.user.favorite import (
    FavoriteCreate,
    FavoriteDetail,
    FavoriteList,
)
from app.schemas.user.history import (
    LearningHistoryItem,
    SearchHistoryItem,
    SearchHistoryCreate,
)
from app.schemas.user.dashboard import (
    DashboardSummary,
    UserStatistics,
    RecentActivity,
    InProgressItem,
    DashboardRecommendation,
)

__all__ = [
    'UserProfile',
    'UserSettings',
    'ProfileUpdate',
    'UserSummary',
    'BookmarkCreate',
    'BookmarkDetail',
    'BookmarkList',
    'FavoriteCreate',
    'FavoriteDetail',
    'FavoriteList',
    'LearningHistoryItem',
    'SearchHistoryItem',
    'SearchHistoryCreate',
    'DashboardSummary',
    'UserStatistics',
    'RecentActivity',
    'InProgressItem',
    'DashboardRecommendation',
]
