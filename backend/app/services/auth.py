from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from fastapi import HTTPException, status
from datetime import timedelta
import secrets
import hashlib


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, email: str, password: str, name: str, **kwargs) -> dict:
        existing = self.db.query(User).filter(User.email == email).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )

        user = User(
            email=email,
            password_hash=hash_password(password),
            name=name,
            **{k: v for k, v in kwargs.items() if hasattr(User, k)},
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)

        verification_token = self._create_verification_token(user)
        # In production: send verification email

        return {
            "user_id": user.id,
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
        }

    def login(self, email: str, password: str) -> dict:
        user = self.db.query(User).filter(User.email == email).first()
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )
        return {
            "user_id": user.id,
            "access_token": create_access_token(user.id),
            "refresh_token": create_refresh_token(user.id),
        }

    def refresh_token(self, refresh_token: str) -> dict:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        user_id = int(payload["sub"])
        return {
            "access_token": create_access_token(user_id),
            "refresh_token": create_refresh_token(user_id),
        }

    def verify_email(self, token: str) -> bool:
        user_id = decode_token(token)
        if not user_id:
            return False
        user = self.db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            return False
        user.is_verified = True
        self.db.commit()
        return True

    def _create_verification_token(self, user: User) -> str:
        raw = f"{user.id}{user.email}{secrets.token_hex(16)}"
        return hashlib.sha256(raw.encode()).hexdigest()
