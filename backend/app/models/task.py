from sqlalchemy import Column, Integer, String, Boolean, Float, Text, DateTime, Date, Time, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class TaskStatus(str, enum.Enum):
    TODO = "todo"
    IN_PROGRESS = "in_progress"
    DONE = "done"
    CANCELLED = "cancelled"


class TaskPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    status = Column(Enum(TaskStatus), default=TaskStatus.TODO)
    priority = Column(Enum(TaskPriority), default=TaskPriority.MEDIUM)
    category = Column(String(50), default="general")
    date = Column(Date, nullable=True)
    start_time = Column(Time, nullable=True)
    end_time = Column(Time, nullable=True)
    duration_minutes = Column(Integer, default=25)
    is_deep_work = Column(Boolean, default=False)
    is_recurring = Column(Boolean, default=False)
    recurring_pattern = Column(String(100), nullable=True)
    sort_order = Column(Integer, default=0)
    tags = Column(String(500), nullable=True)
    postponed_count = Column(Integer, default=0)

    user = relationship("User", backref="tasks")
    time_blocks = relationship("TimeBlock", back_populates="task", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


class TimeBlock(Base):
    __tablename__ = "time_blocks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)
    title = Column(String(255), nullable=False)
    block_type = Column(String(50), default="focus")
    day_of_week = Column(Integer, nullable=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_recurring = Column(Boolean, default=True)
    color = Column(String(7), default="#3B82F6")

    user = relationship("User", backref="time_blocks")
    task = relationship("Task", back_populates="time_blocks")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
