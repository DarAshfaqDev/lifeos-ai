from sqlalchemy import Column, Integer, String, Boolean, Time, Date, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class HabitCategory(str, enum.Enum):
    MORNING = "morning"
    HEALTH = "health"
    LEARNING = "learning"
    PRODUCTIVITY = "productivity"
    MINDFULNESS = "mindfulness"


class Habit(Base):
    __tablename__ = "habits"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(String(500))
    category = Column(Enum(HabitCategory), default=HabitCategory.PRODUCTIVITY)
    icon = Column(String(50), default="check")
    target_time = Column(Time, nullable=True)
    is_active = Column(Boolean, default=True)
    streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)

    user = relationship("User", backref="habits")
    logs = relationship("HabitLog", back_populates="habit", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class HabitLog(Base):
    __tablename__ = "habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    habit_id = Column(Integer, ForeignKey("habits.id"), nullable=False)
    date = Column(Date, nullable=False)
    is_completed = Column(Boolean, default=True)
    note = Column(String(500))
    completed_at = Column(DateTime(timezone=True), server_default=func.now())

    habit = relationship("Habit", back_populates="logs")
