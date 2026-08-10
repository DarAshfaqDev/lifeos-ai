from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import List, Dict, Any, Optional
from datetime import date, timedelta, datetime
from app.database import get_db
from app.models.user import User
from app.models.task import Task, TaskStatus
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


_PRIORITY_WEIGHT = {"urgent": 4, "high": 3, "medium": 2, "low": 1}


def _focus_explanation(score: int) -> str:
    if score >= 80:
        return "Strong day. Keep the same pace."
    if score >= 60:
        return "Good progress. Finish one more important task."
    if score >= 40:
        return "You're getting there. Start with your smallest task."
    return "A slow start is fine. Pick one small task and begin."


@router.get("/today")
def get_today(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Structured 'Today' data for the command-center dashboard.

    Deterministic logic only (no AI): picks the next action, groups today's
    tasks into must/should/optional, flags postponed work, and explains the
    focus score.
    """
    today = date.today()

    tasks_today = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.date == today)
        .all()
    )
    pending = [
        t for t in tasks_today
        if t.status.value in ("todo", "in_progress")
    ]
    pending.sort(
        key=lambda t: (_PRIORITY_WEIGHT.get(t.priority.value, 1), t.sort_order),
        reverse=True,
    )
    completed_today = sum(1 for t in tasks_today if t.status.value == "done")

    postponed = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.date.isnot(None),
            Task.date < today,
            Task.status.in_([TaskStatus.TODO, TaskStatus.IN_PROGRESS]),
        )
        .all()
    )

    goals = db.query(Goal).filter(Goal.user_id == current_user.id).all()
    active_goals = [g for g in goals if g.status.value in ("not_started", "in_progress")]

    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    today_logs = (
        db.query(HabitLog).filter(
            HabitLog.habit_id.in_([h.id for h in habits]),
            HabitLog.date == today,
        ).all()
        if habits else []
    )
    avg_progress = sum(g.progress for g in active_goals) / len(active_goals) if active_goals else 0

    focus_score = min(100, int(
        (completed_today / max(len(tasks_today), 1)) * 40 +
        (len(today_logs) / max(len(habits), 1)) * 20 +
        (avg_progress / 100) * 20 +
        20
    ))

    next_action = None
    if pending:
        next_action = pending[0]

    mission = None
    if next_action:
        prefix = "Finish your priority" if next_action.priority.value in ("urgent", "high") else "Your next task"
        mission = f"{prefix}: {next_action.title}"
    elif completed_today > 0:
        mission = "All planned tasks are done. Add tomorrow's most important task or rest."
    elif not tasks_today and not postponed and not active_goals:
        mission = "Set one goal and your plan starts here."

    plan = {
        "must_do": [t for t in pending if t.priority.value in ("urgent", "high")],
        "should_do": [t for t in pending if t.priority.value == "medium"],
        "optional": [t for t in pending if t.priority.value == "low"],
    }

    recovery = None
    if postponed:
        recovery = {
            "postponed_count": len(postponed),
            "message": (
                f"You have {len(postponed)} unfinished task{'s' if len(postponed) > 1 else ''} "
                "from earlier days. Let's recover without overloading today."
            ),
            "tasks": [
                {"id": t.id, "title": t.title, "priority": t.priority.value}
                for t in postponed[:5]
            ],
        }

    return {
        "date": today.isoformat(),
        "greeting_name": current_user.name or "there",
        "mission": mission,
        "next_action": _task_summary(next_action),
        "plan": plan,
        "tasks_today": {
            "total": len(tasks_today),
            "completed": completed_today,
            "pending": len(pending),
        },
        "focus_score": focus_score,
        "focus_explanation": _focus_explanation(focus_score),
        "recovery": recovery,
        "has_active_goals": len(active_goals) > 0,
        "has_habits": len(habits) > 0,
        "onboarding_completed": current_user.onboarding_completed,
        "is_guest": current_user.is_guest,
    }


def _task_summary(task: Optional[Task]) -> Optional[Dict[str, Any]]:
    if not task:
        return None
    return {
        "id": task.id,
        "title": task.title,
        "priority": task.priority.value,
        "duration_minutes": task.duration_minutes,
        "is_deep_work": task.is_deep_work,
        "category": task.category,
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
