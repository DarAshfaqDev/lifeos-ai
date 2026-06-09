from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from httpx import AsyncClient
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.utils.security import hash_password, create_access_token, create_refresh_token
from urllib.parse import urlencode
import secrets

router = APIRouter(prefix="/api/auth/google", tags=["Google Auth"])

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"


@router.get("/login")
async def google_login():
    params = {
        "client_id": settings.GOOGLE_CLIENT_ID,
        "redirect_uri": settings.GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "consent",
        "state": secrets.token_urlsafe(32),
    }
    return RedirectResponse(f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/callback")
async def google_callback(code: str, state: str | None = None, db: Session = Depends(get_db)):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    async with AsyncClient() as client:
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.GOOGLE_CLIENT_ID,
                "client_secret": settings.GOOGLE_CLIENT_SECRET,
                "redirect_uri": settings.GOOGLE_REDIRECT_URI,
                "grant_type": "authorization_code",
            },
        )

    if token_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to exchange code for token")

    tokens = token_resp.json()
    access_token_google = tokens.get("access_token")

    async with AsyncClient() as client:
        userinfo_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token_google}"},
        )

    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to get user info")

    google_user = userinfo_resp.json()
    email = google_user.get("email")
    name = google_user.get("name", email.split("@")[0])
    google_id = google_user.get("id")

    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        user = User(
            email=email,
            name=name,
            password_hash=hash_password(secrets.token_urlsafe(32)),
            avatar_url=google_user.get("picture", ""),
            google_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.google_id = google_id
        if google_user.get("picture"):
            user.avatar_url = google_user.get("picture")
        db.commit()

    app_access_token = create_access_token(user.id)
    app_refresh_token = create_refresh_token(user.id)

    params = urlencode({
        "access_token": app_access_token,
        "refresh_token": app_refresh_token,
        "token_type": "bearer",
    })
    return RedirectResponse(f"{settings.FRONTEND_URL}/auth/callback?{params}")

