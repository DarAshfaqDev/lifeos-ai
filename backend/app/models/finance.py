from sqlalchemy import Column, Integer, String, Float, Boolean, Text, DateTime, Date, ForeignKey, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum


class LifeGoalType(str, enum.Enum):
    HOUSE = "house"
    CAR = "car"
    MARRIAGE = "marriage"
    HAJJ = "hajj"
    BUSINESS = "business"
    EDUCATION = "education"
    TRAVEL = "travel"
    OTHER = "other"


class FinancialGoal(Base):
    __tablename__ = "financial_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    goal_type = Column(Enum(LifeGoalType), default=LifeGoalType.OTHER)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    target_date = Column(Date, nullable=True)
    monthly_contribution = Column(Float, default=0.0)
    is_completed = Column(Boolean, default=False)
    notes = Column(Text)

    user = relationship("User", backref="financial_goals")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_id = Column(Integer, ForeignKey("financial_goals.id"), nullable=True)
    amount = Column(Float, nullable=False)
    type = Column(String(10), default="saving")
    description = Column(String(500))
    date = Column(Date, server_default=func.current_date())

    user = relationship("User", backref="transactions")
    goal = relationship("FinancialGoal", backref="transactions")

    created_at = Column(DateTime(timezone=True), server_default=func.now())
