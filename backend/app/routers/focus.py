from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, timedelta, datetime, timezone
from app.database import get_db
from app.models.user import User
from app.models.focus import FocusSession
from app.schemas.focus import FocusSessionCreate, FocusSessionResponse, FocusStatsResponse
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/focus", tags=["Focus"])


@router.post("/sessions", response_model=FocusSessionResponse)
def create_session(
    data: FocusSessionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    session = FocusSession(
        user_id=current_user.id,
        task_id=data.task_id,
        planned_minutes=max(1, data.planned_minutes),
        actual_minutes=max(0, data.actual_minutes),
        completed=data.completed,
        ended_at=datetime.now(timezone.utc),
        date=date.today(),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


@router.get("/sessions", response_model=List[FocusSessionResponse])
def list_sessions(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id)
        .order_by(FocusSession.started_at.desc())
        .limit(min(limit, 100))
        .all()
    )


@router.get("/stats", response_model=FocusStatsResponse)
def focus_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    today = date.today()
    week_start = today - timedelta(days=today.weekday())

    sessions = (
        db.query(FocusSession)
        .filter(FocusSession.user_id == current_user.id)
        .all()
    )
    today_sessions = [s for s in sessions if s.date == today]
    week_sessions = [s for s in sessions if s.date >= week_start]

    avg = 0
    if week_sessions:
        avg = round(
            sum(s.actual_minutes or 0 for s in week_sessions) / len(week_sessions)
        )

    return {
        "today_minutes": sum(s.actual_minutes or 0 for s in today_sessions),
        "week_minutes": sum(s.actual_minutes or 0 for s in week_sessions),
        "sessions_today": len(today_sessions),
        "sessions_week": len(week_sessions),
        "avg_session_minutes": avg,
    }
