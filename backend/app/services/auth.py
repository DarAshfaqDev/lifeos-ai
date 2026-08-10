import logging
from sqlalchemy.orm import Session
from app.models.user import User
from app.utils.security import hash_password, verify_password, create_access_token, create_refresh_token, create_reset_token, decode_token
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

    def create_guest(self) -> dict:
        """Create an anonymous guest account. Data is stored normally but the
        account can only be accessed while the guest session token is alive."""
        try:
            email = f"guest_{secrets.token_hex(8)}@lifeos.guest"
            while self.db.query(User).filter(User.email == email).first():
                email = f"guest_{secrets.token_hex(8)}@lifeos.guest"
            user = User(
                email=email,
                password_hash=hash_password(secrets.token_urlsafe(24)),
                name="Guest",
                is_guest=True,
                onboarding_completed=False,
            )
            self.db.add(user)
            self.db.commit()
            self.db.refresh(user)
            return {
                "user_id": user.id,
                "access_token": create_access_token(user.id),
                "refresh_token": create_refresh_token(user.id),
            }
        except Exception as e:
            logger.error(f"Guest creation failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not start guest session",
            )

    def convert_guest(self, user: User, name: str, email: str, password: str) -> dict:
        """Convert a guest account into a real account, preserving all data."""
        try:
            if not user.is_guest:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This account is already registered",
                )
            existing = self.db.query(User).filter(User.email == email).first()
            if existing and existing.id != user.id:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Email already registered",
                )
            user.email = email
            user.name = name or user.name
            user.password_hash = hash_password(password)
            user.is_guest = False
            user.is_verified = False
            user.onboarding_completed = False
            self.db.commit()
            self.db.refresh(user)
            return {
                "user_id": user.id,
                "access_token": create_access_token(user.id),
                "refresh_token": create_refresh_token(user.id),
            }
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Guest conversion failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create your account",
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

    def forgot_password(self, email: str) -> dict:
        try:
            user = self.db.query(User).filter(User.email == email).first()
            if not user:
                return {"message": "If an account exists with this email, a reset link has been sent"}

            reset_token = create_reset_token(user.id)
            logger.info(f"Reset token for {email}: {reset_token}")

            return {"message": "If an account exists with this email, a reset link has been sent", "reset_token": reset_token}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Forgot password failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process request",
            )

    def reset_password(self, token: str, new_password: str) -> dict:
        try:
            payload = decode_token(token)
            if not payload or payload.get("type") != "reset":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired reset token",
                )

            user_id = int(payload["sub"])
            user = self.db.query(User).filter(User.id == user_id).first()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid or expired reset token",
                )

            user.password_hash = hash_password(new_password)
            self.db.commit()

            return {"message": "Password reset successfully"}
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Reset password failed: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reset password",
            )

    def _create_verification_token(self, user: User) -> str:
        raw = f"{user.id}{user.email}{secrets.token_hex(16)}"
        return hashlib.sha256(raw.encode()).hexdigest()
