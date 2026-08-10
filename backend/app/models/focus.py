from sqlalchemy import Column, Integer, Boolean, DateTime, Date, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base


class FocusSession(Base):
    __tablename__ = "focus_sessions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    task_id = Column(Integer, ForeignKey("tasks.id"), nullable=True)

    planned_minutes = Column(Integer, default=25)
    actual_minutes = Column(Integer, default=0)
    completed = Column(Boolean, default=False)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    ended_at = Column(DateTime(timezone=True), nullable=True)
    date = Column(Date, nullable=False)

    user = relationship("User", backref="focus_sessions")
    task = relationship("Task", backref="focus_sessions")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
