from sqlalchemy import Column, Integer, String, Float, Boolean, Date, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class GoalCategory(str, enum.Enum):
    CAREER = "career"
    LEARNING = "learning"
    FINANCIAL = "financial"
    LIFE = "life"
    HEALTH = "health"


class GoalStatus(str, enum.Enum):
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class Goal(Base):
    __tablename__ = "goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    category = Column(Enum(GoalCategory), default=GoalCategory.CAREER)
    status = Column(Enum(GoalStatus), default=GoalStatus.NOT_STARTED)
    target_date = Column(Date, nullable=True)
    progress = Column(Float, default=0.0)
    priority = Column(Integer, default=3)
    is_high_priority = Column(Boolean, default=False)

    user = relationship("User", backref="goals")
    milestones = relationship("Milestone", back_populates="goal", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Milestone(Base):
    __tablename__ = "milestones"

    id = Column(Integer, primary_key=True, index=True)
    goal_id = Column(Integer, ForeignKey("goals.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    due_date = Column(Date, nullable=True)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    order = Column(Integer, default=0)

    goal = relationship("Goal", back_populates="milestones")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
