import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, decode_token
from fastapi import HTTPException, status
from datetime import timedelta
import secrets
import hashlib

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def register(self, email: str, password: str, name: str, **kwargs) -> dict:
        try:
            existing = self.db.query(User).filter(User.email == email).first()
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered",
                )

            hashed = hash_password(password)
            user = User(
                email=email,
                password_hash=hashed,
                name=name,
                **{k: v for k, v in kwargs.items() if hasattr(User, k)},
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)

            access_token = create_access_token(user.id)
            refresh_token = create_refresh_token(user.id)

            return {
                "user_id": user.id,
                "access_token": access_token,
                "refresh_token": refresh_token,
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Registration failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Registration failed: {str(e)}",
            )

    def login(self, email: str, password: str) -> dict:
        try:
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
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Login failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Login failed: {str(e)}",
            )

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
