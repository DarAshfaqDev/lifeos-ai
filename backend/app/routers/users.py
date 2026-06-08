from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserResponse, UserUpdate, OnboardingData
from app.utils.dependencies import get_current_user
from app.models.user import User
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
    for field, value in data.model_dump().items():
        setattr(current_user, field, value)
    current_user.onboarding_completed = True
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
    }
