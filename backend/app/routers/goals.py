from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.user import User
from app.models.goal import Goal, Milestone
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse, MilestoneCreate, MilestoneResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/goals", tags=["Goals"])


@router.get("/", response_model=List[GoalResponse])
def list_goals(
    category: str = None,
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Goal).filter(Goal.user_id == current_user.id)
    if category:
        query = query.filter(Goal.category == category)
    if status:
        query = query.filter(Goal.status == status)
    return query.order_by(Goal.priority, Goal.created_at.desc()).all()


@router.post("/", response_model=GoalResponse)
def create_goal(
    data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    milestones = data.milestones or []
    goal = Goal(
        user_id=current_user.id,
        title=data.title,
        description=data.description,
        category=data.category,
        target_date=data.target_date,
        priority=data.priority,
        is_high_priority=data.is_high_priority,
    )
    db.add(goal)
    db.flush()
    for m in milestones:
        milestone = Milestone(
            goal_id=goal.id,
            title=m.title,
            description=m.description,
            due_date=m.due_date,
            order=m.order,
        )
        db.add(milestone)
    db.commit()
    db.refresh(goal)
    return goal


@router.put("/{goal_id}", response_model=GoalResponse)
def update_goal(
    goal_id: int,
    data: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    return goal


@router.delete("/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}


@router.put("/milestones/{milestone_id}", response_model=MilestoneResponse)
def toggle_milestone(
    milestone_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    milestone = db.query(Milestone).join(Goal).filter(
        Milestone.id == milestone_id,
        Goal.user_id == current_user.id,
    ).first()
    if not milestone:
        raise HTTPException(status_code=404, detail="Milestone not found")
    from datetime import datetime, timezone
    milestone.is_completed = not milestone.is_completed
    milestone.completed_at = datetime.now(timezone.utc) if milestone.is_completed else None
    db.commit()
    db.refresh(milestone)
    return milestone
