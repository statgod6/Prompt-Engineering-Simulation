from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class UserStats(BaseModel):
    username: str
    xp: int
    level: int
    streak_days: int
    modules_completed: int
    total_modules: int = 20
    total_runs: int
    average_score: float
    best_module_score: float
    total_badges: int


class UserProgressResponse(BaseModel):
    user: UserStats
    modules: list  # List of module progress entries
    recent_activity: list  # Recent runs


class BadgeResponse(BaseModel):
    id: int
    badge_type: str
    module_id: Optional[int] = None
    description: Optional[str] = None
    earned_at: datetime

    class Config:
        from_attributes = True


class LeaderboardEntryResponse(BaseModel):
    rank: int
    username: str
    user_id: int
    best_score: float
    attempts: int
    best_time_ms: Optional[int] = None

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    module_id: Optional[int] = None
    module_title: Optional[str] = None
    entries: list[LeaderboardEntryResponse]
    total_participants: int
