from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date, time


class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    category: str = "general"
    date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    duration_minutes: int = 25
    is_deep_work: bool = False
    is_recurring: bool = False
    recurring_pattern: Optional[str] = None
    tags: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[str]
    priority: Optional[str]
    category: Optional[str]
    date: Optional[date]
    start_time: Optional[time]
    end_time: Optional[time]
    duration_minutes: Optional[int]
    is_deep_work: Optional[bool]
    sort_order: Optional[int]


class TaskResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    status: str
    priority: str
    category: str
    date: Optional[date]
    start_time: Optional[time]
    end_time: Optional[time]
    duration_minutes: int
    is_deep_work: bool
    is_recurring: bool
    sort_order: int
    tags: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class TimeBlockCreate(BaseModel):
    task_id: Optional[int] = None
    title: str
    block_type: str = "focus"
    day_of_week: Optional[int] = None
    start_time: time
    end_time: time
    is_recurring: bool = True
    color: str = "#3B82F6"


class TimeBlockResponse(BaseModel):
    id: int
    task_id: Optional[int]
    title: str
    block_type: str
    day_of_week: Optional[int]
    start_time: time
    end_time: time
    is_recurring: bool
    color: str

    class Config:
        from_attributes = True
