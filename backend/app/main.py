from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import engine, Base
from app.routers import auth, users, tasks, goals, habits, learning, analytics, ai_coach, admin, finance

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


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"status": "online", "service": "LifeOS AI API"}


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.VERSION}

@app.get("/api/debug-cors")
def debug_cors():
    return {
        "cors_origins": settings.CORS_ORIGINS,
        "cors_list": settings.cors_origins_list
    }