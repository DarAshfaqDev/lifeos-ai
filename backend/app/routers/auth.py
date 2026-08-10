from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import (
    RegisterRequest, LoginRequest, Token, RefreshTokenRequest,
    VerifyEmailRequest, ForgotPasswordRequest, ResetPasswordRequest,
    ConvertGuestRequest,
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


@router.post("/guest", response_model=Token)
def guest_session(db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.create_guest()


@router.post("/convert-guest", response_model=Token)
def convert_guest(
    req: ConvertGuestRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    service = AuthService(db)
    return service.convert_guest(
        user=current_user,
        name=req.name,
        email=req.email,
        password=req.password,
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


@router.post("/forgot-password")
def forgot_password(req: ForgotPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.forgot_password(email=req.email)


@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    service = AuthService(db)
    return service.reset_password(token=req.token, new_password=req.password)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
