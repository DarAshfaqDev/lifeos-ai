from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.learning import Skill, LearningPath, Lesson
from app.utils.dependencies import get_current_user
from pydantic import BaseModel
from datetime import datetime, timezone

router = APIRouter(prefix="/api/learning", tags=["Learning"])


class SkillCreate(BaseModel):
    name: str
    custom_name: str = None
    target_hours: float = 100.0


class SkillUpdate(BaseModel):
    level: int = None
    progress: float = None
    total_hours: float = None


class SkillResponse(BaseModel):
    id: int
    name: str
    custom_name: str = None
    level: int
    progress: float
    total_hours: float
    target_hours: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class LearningPathResponse(BaseModel):
    id: int
    title: str
    description: str = None
    skill_name: str
    is_active: bool
    progress: float
    created_at: datetime

    class Config:
        from_attributes = True


class LessonResponse(BaseModel):
    id: int
    learning_path_id: int
    title: str
    content: str = None
    duration_minutes: int
    order: int
    is_completed: bool
    completed_at: datetime = None
    resource_url: str = None

    class Config:
        from_attributes = True


@router.get("/skills/", response_model=List[SkillResponse])
def list_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Skill).filter(Skill.user_id == current_user.id).all()


@router.post("/skills/", response_model=SkillResponse)
def create_skill(
    data: SkillCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = Skill(
        user_id=current_user.id,
        name=data.name,
        custom_name=data.custom_name,
        target_hours=data.target_hours,
    )
    db.add(skill)
    db.commit()
    db.refresh(skill)
    return skill


@router.put("/skills/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: int,
    data: SkillUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skill = db.query(Skill).filter(Skill.id == skill_id, Skill.user_id == current_user.id).first()
    if not skill:
        raise HTTPException(status_code=404, detail="Skill not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(skill, field, value)
    skill.progress = min(100.0, (skill.total_hours / skill.target_hours) * 100) if skill.target_hours > 0 else 0
    db.commit()
    db.refresh(skill)
    return skill


@router.get("/paths/", response_model=List[LearningPathResponse])
def list_paths(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(LearningPath).filter(LearningPath.user_id == current_user.id).all()


@router.get("/paths/{path_id}/lessons/", response_model=List[LessonResponse])
def list_lessons(
    path_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    path = db.query(LearningPath).filter(
        LearningPath.id == path_id,
        LearningPath.user_id == current_user.id,
    ).first()
    if not path:
        raise HTTPException(status_code=404, detail="Learning path not found")
    return db.query(Lesson).filter(Lesson.learning_path_id == path_id).order_by(Lesson.order).all()


@router.put("/lessons/{lesson_id}/complete", response_model=LessonResponse)
def complete_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    lesson = db.query(Lesson).join(LearningPath).filter(
        Lesson.id == lesson_id,
        LearningPath.user_id == current_user.id,
    ).first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson.is_completed = True
    lesson.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(lesson)

    path = db.query(LearningPath).filter(LearningPath.id == lesson.learning_path_id).first()
    if path:
        total = db.query(Lesson).filter(Lesson.learning_path_id == path.id).count()
        completed = db.query(Lesson).filter(
            Lesson.learning_path_id == path.id,
            Lesson.is_completed == True,
        ).count()
        path.progress = (completed / total * 100) if total > 0 else 0
        db.commit()
    return lesson
