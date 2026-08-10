from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserResponse, UserUpdate, OnboardingData
from app.utils.dependencies import get_current_user
from app.models.user import User
from app.models.goal import Goal
from app.models.task import Task
from app.ai.coach import generate_roadmap

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/profile", response_model=UserResponse)
def get_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    data: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/onboarding", response_model=dict)
def complete_onboarding(
    data: OnboardingData,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    for field, value in data.model_dump(exclude_unset=True).items():
        if value is not None:
            setattr(current_user, field, value)
    current_user.onboarding_completed = True

    created_goal = None
    created_task = None

    top_goal_title = data.career_goal or (data.life_goals or [None])[0]
    if top_goal_title:
        existing_goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
        if not existing_goals:
            created_goal = Goal(
                user_id=current_user.id,
                title=top_goal_title,
                category="career" if data.career_goal else "life",
                priority=1,
                is_high_priority=True,
            )
            db.add(created_goal)
            db.flush()

    if created_goal is not None and not db.query(Task).filter(Task.user_id == current_user.id).first():
        from datetime import date, timedelta
        study_minutes = max(15, int((data.daily_study_hours or 2.0) * 60))
        created_task = Task(
            user_id=current_user.id,
            title=f"Start: {top_goal_title}",
            category="general",
            date=date.today() + timedelta(days=0),
            priority="high",
            duration_minutes=study_minutes,
            is_deep_work=True,
        )
        db.add(created_task)

    db.commit()
    db.refresh(current_user)

    user_data = {
        "age": current_user.age,
        "education": current_user.education,
        "occupation": current_user.occupation,
        "career_goal": current_user.career_goal,
        "skills_learning": current_user.skills_learning,
        "daily_study_hours": current_user.daily_study_hours,
        "sleep_schedule": current_user.sleep_schedule,
        "biggest_distractions": current_user.biggest_distractions,
        "life_goals": current_user.life_goals,
    }

    try:
        roadmap = generate_roadmap(user_data)
    except Exception:
        roadmap = None

    return {
        "message": "Onboarding completed successfully",
        "roadmap": roadmap,
        "created_goal": created_goal.title if created_goal else None,
        "created_task": created_task.title if created_task else None,
    }
