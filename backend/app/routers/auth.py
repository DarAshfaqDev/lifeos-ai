from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, Token, RefreshTokenRequest,
    VerifyEmailRequest,
)
from app.schemas.user import UserResponse
from app.services.auth import AuthService
from app.utils.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/register", response_model=Token)
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.register(
        email=req.email,
        password=req.password,
        name=req.name,
        age=req.age,
        education=req.education,
        occupation=req.occupation,
        career_goal=req.career_goal,
    )


@router.post("/login", response_model=Token)
def login(req: LoginRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.login(email=req.email, password=req.password)


@router.post("/refresh", response_model=Token)
def refresh(req: RefreshTokenRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.refresh_token(req.refresh_token)


@router.post("/verify-email")
def verify_email(req: VerifyEmailRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    success = service.verify_email(req.token)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid verification token")
    return {"message": "Email verified successfully"}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
