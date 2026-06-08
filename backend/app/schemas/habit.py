from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time


class HabitCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "productivity"
    icon: str = "check"
    target_time: Optional[time] = None


class HabitUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    category: Optional[str]
    is_active: Optional[bool]


class HabitResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    icon: str
    target_time: Optional[time]
    is_active: bool
    streak: int
    longest_streak: int
    created_at: datetime

    class Config:
        from_attributes = True


class HabitLogCreate(BaseModel):
    habit_id: int
    date: date
    note: Optional[str] = None


class HabitLogResponse(BaseModel):
    id: int
    habit_id: int
    date: date
    is_completed: bool
    note: Optional[str]
    completed_at: datetime

    class Config:
        from_attributes = True
