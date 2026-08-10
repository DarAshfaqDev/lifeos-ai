from sqlalchemy import Column, Integer, String, Boolean, Float, Date, Text, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    is_verified = Column(Boolean, default=False)

    name = Column(String(255))
    age = Column(Integer, nullable=True)
    education = Column(String(255), nullable=True)
    occupation = Column(String(255), nullable=True)
    career_goal = Column(String(255), nullable=True)
    skills_learning = Column(JSON, default=list)
    daily_study_hours = Column(Float, default=2.0)
    sleep_schedule = Column(JSON, default={"bed": "22:00", "wake": "06:00"})
    biggest_distractions = Column(JSON, default=list)
    monthly_income = Column(Float, default=0.0)
    life_goals = Column(JSON, default=list)
    timezone = Column(String(50), default="UTC")

    xp_points = Column(Integer, default=0)
    level = Column(Integer, default=1)
    onboarding_completed = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_guest = Column(Boolean, default=False)

    google_id = Column(String(255), unique=True, nullable=True)
    avatar_url = Column(String(500), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
