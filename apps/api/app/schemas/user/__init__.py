"""User profile, bookmark, favorite, history, and dashboard DTOs."""

from app.schemas.user.bookmark import (
    BookmarkCreate,
    BookmarkDetail,
    BookmarkList,
)
from app.schemas.user.dashboard import (
    DashboardRecommendation,
    DashboardSummary,
    InProgressItem,
    RecentActivity,
    UserStatistics,
)
from app.schemas.user.favorite import (
    FavoriteCreate,
    FavoriteDetail,
    FavoriteList,
)
from app.schemas.user.history import (
    LearningHistoryItem,
    SearchHistoryCreate,
    SearchHistoryItem,
)
from app.schemas.user.profile import (
    ProfileUpdate,
    UserProfile,
    UserSettings,
    UserSummary,
)

__all__ = [
    'BookmarkCreate',
    'BookmarkDetail',
    'BookmarkList',
    'DashboardRecommendation',
    'DashboardSummary',
    'FavoriteCreate',
    'FavoriteDetail',
    'FavoriteList',
    'InProgressItem',
    'LearningHistoryItem',
    'ProfileUpdate',
    'RecentActivity',
    'SearchHistoryCreate',
    'SearchHistoryItem',
    'UserProfile',
    'UserSettings',
    'UserStatistics',
    'UserSummary',
]
