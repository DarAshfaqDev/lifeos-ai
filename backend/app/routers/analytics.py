from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict, Any
from datetime import date, timedelta, datetime
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.habit import Habit, HabitLog
from app.models.learning import Skill
from app.models.goal import Goal
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


@router.get("/dashboard")
def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    tasks_today = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.date == today,
    ).all()
    completed_today = sum(1 for t in tasks_today if t.status == "done")
    pending_today = sum(1 for t in tasks_today if t.status != "done")

    tasks_week = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.date >= week_start,
        Task.date <= today,
    ).all()
    deep_work_hours = sum(
        (t.duration_minutes or 0) / 60
        for t in tasks_week
        if t.is_deep_work and t.status == "done"
    )

    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    habits_done = sum(1 for h in habits if h.streak > 0)

    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    avg_progress = sum(g.progress for g in goals) / len(goals) if goals else 0

    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    total_learning_hours = sum(s.total_hours or 0 for s in skills)

    today_logs = db.query(HabitLog).filter(
        HabitLog.habit_id.in_([h.id for h in habits]),
        HabitLog.date == today,
    ).all() if habits else []

    focus_score = min(100, int(
        (completed_today / max(len(tasks_today), 1)) * 40 +
        (len(today_logs) / max(len(habits), 1)) * 20 +
        (avg_progress / 100) * 20 +
        20
    ))

    productivity_score = min(100, int(
        (completed_today / max(len(tasks_today), 1)) * 30 +
        (deep_work_hours / 2) * 20 +
        (len(today_logs) / max(len(habits), 1)) * 20 +
        (avg_progress / 100) * 15 +
        15
    ))

    return {
        "tasks_today": {
            "total": len(tasks_today),
            "completed": completed_today,
            "pending": pending_today,
        },
        "deep_work_hours_this_week": round(deep_work_hours, 1),
        "focus_score": focus_score,
        "productivity_score": productivity_score,
        "goal_progress": round(avg_progress, 1),
        "total_learning_hours": round(total_learning_hours, 1),
        "habit_streak_count": len(habits),
        "active_goals": len(goals),
    }


@router.get("/productivity-trends")
def productivity_trends(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    start = today - timedelta(days=days)
    trends = []
    for i in range(days):
        d = start + timedelta(days=i)
        tasks = db.query(Task).filter(
            Task.user_id == current_user.id,
            Task.date == d,
        ).all()
        completed = sum(1 for t in tasks if t.status == "done")
        score = min(100, int((completed / max(len(tasks), 1)) * 100))
        trends.append({"date": d.isoformat(), "score": score, "tasks_completed": completed})
    return trends


@router.get("/study-hours")
def study_hours(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    skills = db.query(Skill).filter(Skill.user_id == current_user.id).all()
    return [
        {
            "name": s.name.value if hasattr(s.name, 'value') else str(s.name),
            "hours": s.total_hours or 0,
            "progress": s.progress or 0,
            "target": s.target_hours or 100,
        }
        for s in skills
    ]


@router.get("/habit-consistency")
def habit_consistency(
    days: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    start = today - timedelta(days=days)
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    result = []
    for habit in habits:
        logs = db.query(HabitLog).filter(
            HabitLog.habit_id == habit.id,
            HabitLog.date >= start,
        ).all()
        completed_days = sum(1 for l in logs if l.is_completed)
        result.append({
            "habit": habit.title,
            "completion_rate": round((completed_days / days) * 100, 1),
            "completed_days": completed_days,
            "total_days": days,
            "streak": habit.streak,
        })
    return result
