from sqlalchemy import Column, Integer, String, Boolean, Text, DateTime, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class AchievementType(str, enum.Enum):
    STREAK = "streak"
    HOURS = "hours"
    TASKS = "tasks"
    GOALS = "goals"
    LEARNING = "learning"
    SPECIAL = "special"


class Achievement(Base):
    __tablename__ = "achievements"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    icon = Column(String(50), default="trophy")
    type = Column(Enum(AchievementType), default=AchievementType.SPECIAL)
    requirement_value = Column(Integer, default=1)
    xp_reward = Column(Integer, default=100)
    is_hidden = Column(Boolean, default=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    unlocked_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", backref="achievements")
    achievement = relationship("Achievement")


class UserStreak(Base):
    __tablename__ = "user_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    streak_type = Column(String(50), default="daily")
    current_count = Column(Integer, default=0)
    longest_count = Column(Integer, default=0)
    last_activity_date = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", backref="streaks")

    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
