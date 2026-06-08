from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from datetime import date, datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.habit import Habit, HabitLog
from app.schemas.habit import HabitCreate, HabitUpdate, HabitResponse, HabitLogCreate, HabitLogResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/habits", tags=["Habits"])


def _update_streaks(habit: Habit, db: Session):
    logs = db.query(HabitLog).filter(
        HabitLog.habit_id == habit.id,
        HabitLog.date >= date.today()
    ).order_by(HabitLog.date.desc()).all()
    streak = 0
    from datetime import timedelta
    check_date = date.today()
    for log in logs:
        if log.date == check_date and log.is_completed:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break
    habit.streak = streak
    if streak > habit.longest_streak:
        habit.longest_streak = streak
    db.commit()


@router.get("/", response_model=List[HabitResponse])
def list_habits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(Habit).filter(
        Habit.user_id == current_user.id,
        Habit.is_active == True,
    ).all()


@router.post("/", response_model=HabitResponse)
def create_habit(
    data: HabitCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = Habit(user_id=current_user.id, **data.model_dump())
    db.add(habit)
    db.commit()
    db.refresh(habit)
    return habit


@router.put("/{habit_id}", response_model=HabitResponse)
def update_habit(
    habit_id: int,
    data: HabitUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(habit, field, value)
    db.commit()
    db.refresh(habit)
    return habit


@router.delete("/{habit_id}")
def delete_habit(
    habit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    habit = db.query(Habit).filter(Habit.id == habit_id, Habit.user_id == current_user.id).first()
    if not habit:
        raise HTTPException(status_code=404, detail="Habit not found")
    db.delete(habit)
    db.commit()
    return {"message": "Habit deleted"}


@router.post("/logs/", response_model=HabitLogResponse)
def log_habit(
    data: HabitLogCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing = db.query(HabitLog).filter(
        HabitLog.habit_id == data.habit_id,
        HabitLog.date == data.date,
    ).first()
    if existing:
        existing.is_completed = not existing.is_completed
        db.commit()
        db.refresh(existing)
        return existing

    log = HabitLog(
        habit_id=data.habit_id,
        date=data.date,
        note=data.note,
    )
    db.add(log)
    db.commit()
    db.refresh(log)

    habit = db.query(Habit).filter(Habit.id == data.habit_id).first()
    if habit:
        _update_streaks(habit, db)
    return log


@router.get("/logs/", response_model=List[HabitLogResponse])
def list_habit_logs(
    start_date: date = None,
    end_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(HabitLog).join(Habit).filter(Habit.user_id == current_user.id)
    if start_date:
        query = query.filter(HabitLog.date >= start_date)
    if end_date:
        query = query.filter(HabitLog.date <= end_date)
    return query.order_by(HabitLog.date.desc()).all()
