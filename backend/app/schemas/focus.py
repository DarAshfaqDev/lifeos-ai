from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


class FocusSessionCreate(BaseModel):
    task_id: Optional[int] = None
    planned_minutes: int = 25
    actual_minutes: int = 0
    completed: bool = False


class FocusSessionResponse(BaseModel):
    id: int
    task_id: Optional[int]
    planned_minutes: int
    actual_minutes: int
    completed: bool
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    date: date

    class Config:
        from_attributes = True


class FocusStatsResponse(BaseModel):
    today_minutes: int
    week_minutes: int
    sessions_today: int
    sessions_week: int
    avg_session_minutes: int
