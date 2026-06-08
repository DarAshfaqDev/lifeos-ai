from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date
from app.database import get_db
from app.models.user import User
from app.models.task import Task, TimeBlock
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskResponse,
    TimeBlockCreate, TimeBlockResponse,
)
from app.utils.dependencies import get_current_user

router = APIRouter(prefix="/api/tasks", tags=["Tasks"])


@router.get("/", response_model=List[TaskResponse])
def list_tasks(
    status: str = None,
    priority: str = None,
    task_date: date = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(Task).filter(Task.user_id == current_user.id)
    if status:
        query = query.filter(Task.status == status)
    if priority:
        query = query.filter(Task.priority == priority)
    if task_date:
        query = query.filter(Task.date == task_date)
    query = query.order_by(Task.sort_order, Task.created_at.desc())
    return query.all()


@router.post("/", response_model=TaskResponse)
def create_task(
    data: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = Task(
        user_id=current_user.id,
        **data.model_dump(),
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return task


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    data: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    if data.status == "done":
        from datetime import datetime, timezone
        task.completed_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Task deleted"}


@router.get("/time-blocks/", response_model=List[TimeBlockResponse])
def list_time_blocks(
    day_of_week: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(TimeBlock).filter(TimeBlock.user_id == current_user.id)
    if day_of_week is not None:
        query = query.filter(TimeBlock.day_of_week == day_of_week)
    query = query.order_by(TimeBlock.start_time)
    return query.all()


@router.post("/time-blocks/", response_model=TimeBlockResponse)
def create_time_block(
    data: TimeBlockCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    block = TimeBlock(
        user_id=current_user.id,
        **data.model_dump(),
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block


@router.delete("/time-blocks/{block_id}")
def delete_time_block(
    block_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    block = db.query(TimeBlock).filter(
        TimeBlock.id == block_id, TimeBlock.user_id == current_user.id
    ).first()
    if not block:
        raise HTTPException(status_code=404, detail="Time block not found")
    db.delete(block)
    db.commit()
    return {"message": "Time block deleted"}
