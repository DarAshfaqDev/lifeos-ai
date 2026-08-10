from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.utils.schema import ensure_schema
from app.routers import auth, users, tasks, goals, habits, learning, analytics, ai_coach, admin, finance, google_auth

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(tasks.router)
app.include_router(goals.router)
app.include_router(habits.router)
app.include_router(learning.router)
app.include_router(analytics.router)
app.include_router(ai_coach.router)
app.include_router(admin.router)
app.include_router(finance.router)
app.include_router(google_auth.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    ensure_schema(engine)


@app.get("/")
def root():
    return {"status": "online", "service": "LifeOS AI API"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.VERSION}

@app.get("/api/debug-cors")
def debug_cors():
    from app.database import engine
    import sqlalchemy
    try:
        with engine.connect() as conn:
            conn.execute(sqlalchemy.text("SELECT 1"))
            db_ok = True
    except Exception as e:
        db_ok = False
    return {
        "cors_origins": settings.CORS_ORIGINS,
        "cors_list": settings.cors_origins_list,
        "database_url": settings.DATABASE_URL.replace(settings.SECRET_KEY[:4] if len(settings.SECRET_KEY) > 4 else "xxxx", "****") if "postgres" in settings.DATABASE_URL else settings.DATABASE_URL,
        "database_ok": db_ok,
    }