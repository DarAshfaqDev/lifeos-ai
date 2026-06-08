from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date


class MilestoneCreate(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    order: int = 0


class MilestoneResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    due_date: Optional[date]
    is_completed: bool
    completed_at: Optional[datetime]
    order: int

    class Config:
        from_attributes = True


class GoalCreate(BaseModel):
    title: str
    description: Optional[str] = None
    category: str = "career"
    target_date: Optional[date] = None
    priority: int = 3
    is_high_priority: bool = False
    milestones: Optional[List[MilestoneCreate]] = None


class GoalUpdate(BaseModel):
    title: Optional[str]
    description: Optional[str]
    status: Optional[str]
    category: Optional[str]
    target_date: Optional[date]
    progress: Optional[float]
    priority: Optional[int]
    is_high_priority: Optional[bool]


class GoalResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    category: str
    status: str
    target_date: Optional[date]
    progress: float
    priority: int
    is_high_priority: bool
    milestones: List[MilestoneResponse]
    created_at: datetime

    class Config:
        from_attributes = True
