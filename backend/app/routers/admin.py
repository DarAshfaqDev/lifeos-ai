from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Any
from datetime import date, timedelta
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.habit import Habit
from app.models.goal import Goal
from app.models.learning import Skill
from app.utils.dependencies import get_current_user, get_admin_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/admin", tags=["Admin"])


class UserAdminResponse(BaseModel):
    id: int
    email: str
    name: str = None
    age: int = None
    occupation: str = None
    career_goal: str = None
    is_active: bool
    is_verified: bool
    onboarding_completed: bool
    xp_points: int
    level: int
    created_at: Any

    class Config:
        from_attributes = True


class SystemStats(BaseModel):
    total_users: int
    active_users: int
    onboarded_users: int
    total_tasks: int
    total_habits: int
    total_goals: int
    total_skills: int
    users_today: int


@router.get("/users", response_model=List[UserAdminResponse])
def list_users(
    page: int = 1,
    per_page: int = 20,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).offset((page - 1) * per_page).limit(per_page).all()
    return users


@router.get("/stats", response_model=SystemStats)
def get_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    return SystemStats(
        total_users=db.query(User).count(),
        active_users=db.query(User).filter(User.is_active == True).count(),
        onboarded_users=db.query(User).filter(User.onboarding_completed == True).count(),
        total_tasks=db.query(Task).count(),
        total_habits=db.query(Habit).count(),
        total_goals=db.query(Goal).count(),
        total_skills=db.query(Skill).count(),
        users_today=db.query(User).filter(func.date(User.created_at) == today).count(),
    )


@router.put("/users/{user_id}/toggle-active")
def toggle_user_active(
    user_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": f"User {'activated' if user.is_active else 'deactivated'}"}


@router.get("/ai-prompts")
def get_ai_prompts(current_user: User = Depends(get_admin_user)):
    return {
        "roadmap_prompt": "Create a personalized roadmap for this user...",
        "productivity_analysis": "Analyze this user's productivity data...",
        "interview_questions": "Generate interview questions for a {role}...",
    }
