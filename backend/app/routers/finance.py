from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
from app.database import get_db
from app.models.user import User
from app.models.finance import FinancialGoal, Transaction, LifeGoalType
from app.utils.dependencies import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/finance", tags=["Finance"])


class FinancialGoalCreate(BaseModel):
    title: str
    goal_type: str = "other"
    target_amount: float
    current_amount: float = 0.0
    target_date: date = None
    monthly_contribution: float = 0.0
    notes: str = None


class FinancialGoalResponse(BaseModel):
    id: int
    title: str
    goal_type: str
    target_amount: float
    current_amount: float
    target_date: date = None
    monthly_contribution: float
    progress: float
    is_completed: bool
    notes: str = None
    created_at: datetime

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    goal_id: int = None
    amount: float
    type: str = "saving"
    description: str = None
    date: date = None


class TransactionResponse(BaseModel):
    id: int
    goal_id: int = None
    amount: float
    type: str
    description: str = None
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


@router.get("/goals/", response_model=List[FinancialGoalResponse])
def list_goals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goals = db.query(FinancialGoal).filter(FinancialGoal.user_id == current_user.id).all()
    for g in goals:
        g.progress = min(100.0, (g.current_amount / g.target_amount * 100)) if g.target_amount > 0 else 0
    return goals


@router.post("/goals/", response_model=FinancialGoalResponse)
def create_goal(
    data: FinancialGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = FinancialGoal(user_id=current_user.id, **data.model_dump())
    db.add(goal)
    db.commit()
    db.refresh(goal)
    goal.progress = 0
    return goal


@router.put("/goals/{goal_id}", response_model=FinancialGoalResponse)
def update_goal(
    goal_id: int,
    data: FinancialGoalCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(goal, field, value)
    db.commit()
    db.refresh(goal)
    goal.progress = min(100.0, (goal.current_amount / goal.target_amount * 100)) if goal.target_amount > 0 else 0
    return goal


@router.delete("/goals/{goal_id}")
def delete_goal(
    goal_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    goal = db.query(FinancialGoal).filter(
        FinancialGoal.id == goal_id,
        FinancialGoal.user_id == current_user.id,
    ).first()
    if not goal:
        raise HTTPException(status_code=404, detail="Goal not found")
    db.delete(goal)
    db.commit()
    return {"message": "Goal deleted"}


@router.get("/transactions/", response_model=List[TransactionResponse])
def list_transactions(
    limit: int = 50,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(Transaction)
        .filter(Transaction.user_id == current_user.id)
        .order_by(Transaction.date.desc())
        .limit(limit)
        .all()
    )


@router.post("/transactions/", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    txn = Transaction(
        user_id=current_user.id,
        **data.model_dump(exclude_none=True),
    )
    if not txn.date:
        txn.date = date.today()
    db.add(txn)
    if txn.goal_id and txn.type == "saving":
        goal = db.query(FinancialGoal).filter(FinancialGoal.id == txn.goal_id).first()
        if goal:
            goal.current_amount += txn.amount
    db.commit()
    db.refresh(txn)
    return txn
