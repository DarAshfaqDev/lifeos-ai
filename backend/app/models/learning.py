from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Date, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class SkillName(str, enum.Enum):
    SQL = "sql"
    PYTHON = "python"
    EXCEL = "excel"
    POWER_BI = "power_bi"
    ENGLISH = "english"
    MACHINE_LEARNING = "machine_learning"
    STATISTICS = "statistics"
    OTHER = "other"


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(Enum(SkillName), nullable=False)
    custom_name = Column(String(100), nullable=True)
    level = Column(Integer, default=1)
    progress = Column(Float, default=0.0)
    total_hours = Column(Float, default=0.0)
    target_hours = Column(Float, default=100.0)
    is_active = Column(Boolean, default=True)

    user = relationship("User", backref="skills")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text)
    skill_name = Column(Enum(SkillName), nullable=False)
    is_active = Column(Boolean, default=True)
    progress = Column(Float, default=0.0)

    user = relationship("User", backref="learning_paths")
    lessons = relationship("Lesson", back_populates="learning_path", cascade="all, delete-orphan")

    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Lesson(Base):
    __tablename__ = "lessons"

    id = Column(Integer, primary_key=True, index=True)
    learning_path_id = Column(Integer, ForeignKey("learning_paths.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text)
    duration_minutes = Column(Integer, default=30)
    order = Column(Integer, default=0)
    is_completed = Column(Boolean, default=False)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    resource_url = Column(String(500), nullable=True)

    learning_path = relationship("LearningPath", back_populates="lessons")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
