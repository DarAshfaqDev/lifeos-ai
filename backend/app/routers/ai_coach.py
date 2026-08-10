from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.task import Task
from app.models.habit import Habit, HabitLog
from app.models.learning import Skill
from app.models.goal import Goal
from app.ai.coach import chat_with_coach, generate_roadmap, analyze_productivity, generate_interview_questions, breakdown_task, im_stuck
from app.utils.dependencies import get_current_user
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import date, timedelta

router = APIRouter(prefix="/api/ai-coach", tags=["AI Coach"])


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Dict[str, str]]] = None


class ChatResponse(BaseModel):
    response: str


class InterviewQuestionsRequest(BaseModel):
    role: str
    skills: List[str]
    question_type: str = "technical"


class BreakdownRequest(BaseModel):
    task_title: str
    description: Optional[str] = ""


class StuckRequest(BaseModel):
    task_title: str
    blocker: Optional[str] = ""


@router.post("/chat", response_model=ChatResponse)
def chat(
    req: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()

    today_tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.date == today)
        .all()
    )
    today_titles = [
        f"{t.title} ({t.status.value})" for t in today_tasks[:6]
    ]

    goals = (
        db.query(Goal)
        .filter(Goal.user_id == current_user.id)
        .order_by(Goal.priority)
        .all()
    )
    top_goal = goals[0].title if goals else None

    postponed = (
        db.query(Task)
        .filter(
            Task.user_id == current_user.id,
            Task.date.isnot(None),
            Task.date < today,
        )
        .all()
    )
    postponed_count = sum(1 for t in postponed if t.status.value in ("todo", "in_progress"))

    recent_done = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.status == "done")
        .order_by(Task.completed_at.desc())
        .limit(5)
        .all()
    )

    context = {
        "name": current_user.name,
        "career_goal": current_user.career_goal,
        "today_tasks": today_titles,
        "top_goal": top_goal,
        "focus_score": None,
        "postponed_count": postponed_count,
        "recent_completed": [t.title for t in recent_done],
    }

    response = chat_with_coach(req.message, req.conversation_history, user_context=context)
    if not response:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    return ChatResponse(response=response)


@router.post("/breakdown-task", response_model=ChatResponse)
def break_down_task(
    req: BreakdownRequest,
    current_user: User = Depends(get_current_user),
):
    response = breakdown_task(req.task_title, req.description or "")
    if not response:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    return ChatResponse(response=response)


@router.post("/stuck", response_model=ChatResponse)
def stuck_helper(
    req: StuckRequest,
    current_user: User = Depends(get_current_user),
):
    response = im_stuck(req.task_title, req.blocker or "")
    if not response:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    return ChatResponse(response=response)


@router.post("/generate-roadmap", response_model=ChatResponse)
def generate_personalized_roadmap(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_data = {
        "age": current_user.age,
        "education": current_user.education,
        "occupation": current_user.occupation,
        "career_goal": current_user.career_goal,
        "skills_learning": current_user.skills_learning or [],
        "daily_study_hours": current_user.daily_study_hours,
        "sleep_schedule": current_user.sleep_schedule,
        "biggest_distractions": current_user.biggest_distractions or [],
        "life_goals": current_user.life_goals or [],
    }
    response = generate_roadmap(user_data)
    if not response:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    return ChatResponse(response=response)


@router.post("/analyze-productivity", response_model=ChatResponse)
def analyze_my_productivity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    tasks_data = []
    tasks = (
        db.query(Task)
        .filter(Task.user_id == current_user.id, Task.date >= week_start)
        .all()
    )
    for t in tasks:
        tasks_data.append({
            "title": t.title,
            "status": t.status,
            "priority": t.priority,
            "is_deep_work": t.is_deep_work,
            "date": str(t.date),
        })

    habits_data = []
    habits = db.query(Habit).filter(Habit.user_id == current_user.id).all()
    for h in habits:
        habits_data.append({
            "title": h.title,
            "streak": h.streak,
            "longest_streak": h.longest_streak,
        })

    response = analyze_productivity(tasks_data, habits_data)
    if not response:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    return ChatResponse(response=response)


@router.post("/interview-questions", response_model=ChatResponse)
def interview_questions(
    req: InterviewQuestionsRequest,
    current_user: User = Depends(get_current_user),
):
    response = generate_interview_questions(req.role, req.skills, req.question_type)
    if not response:
        raise HTTPException(status_code=503, detail="AI service unavailable")
    return ChatResponse(response=response)
