from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.user import User


class OnboardingData(BaseModel):
    age: Optional[int] = None
    education: Optional[str] = None
    occupation: Optional[str] = None
    career_goal: Optional[str] = None
    skills_learning: List[str] = []
    daily_study_hours: float = 2.0
    sleep_schedule: Dict[str, str] = {"bed": "22:00", "wake": "06:00"}
    biggest_distractions: List[str] = []
    monthly_income: float = 0.0
    life_goals: List[str] = []


class UserResponse(BaseModel):
    id: int
    email: str
    name: Optional[str]
    age: Optional[int]
    education: Optional[str]
    occupation: Optional[str]
    career_goal: Optional[str]
    skills_learning: List[Any]
    daily_study_hours: float
    sleep_schedule: Dict[str, Any]
    biggest_distractions: List[Any]
    monthly_income: float
    life_goals: List[Any]
    xp_points: int
    level: int
    onboarding_completed: bool
    is_guest: bool = False
    avatar_url: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    name: Optional[str]
    age: Optional[int]
    education: Optional[str]
    occupation: Optional[str]
    career_goal: Optional[str]
    skills_learning: Optional[List[str]]
    daily_study_hours: Optional[float]
    sleep_schedule: Optional[Dict[str, str]]
    biggest_distractions: Optional[List[str]]
    monthly_income: Optional[float]
    life_goals: Optional[List[str]]
