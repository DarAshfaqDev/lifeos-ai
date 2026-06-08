# LifeOS AI

**Your Personal Operating System for Productivity & Career Growth**

[![Frontend](https://img.shields.io/badge/Frontend-Next.js%2015-black?logo=next.js)](https://github.com/DarAshfaqDev/lifeos-ai)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?logo=fastapi)](https://github.com/DarAshfaqDev/lifeos-ai)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-4169E1?logo=postgresql)](https://github.com/DarAshfaqDev/lifeos-ai)
[![AI](https://img.shields.io/badge/AI-OpenAI%20%7C%20Gemini%20%7C%20Claude-8A2BE2)](#)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

A full-stack SaaS platform combining time management, career planning, habit tracking, and AI-powered coaching into one unified dashboard. Built for job seekers, students, and professionals who want to take control of their productivity and career trajectory.

---

## Features

### Core Modules
| Module | Description |
|--------|-------------|
| Dashboard | Daily overview, focus scores, productivity trends at a glance |
| Time Management | Calendar integration, time blocking, Pomodoro timer, deep work sessions |
| Career Planner | Goal tracking, skill roadmaps, milestone management |
| Job Preparation | Resume tracker, AI-powered interview question generator |
| Learning Tracker | Skill progress tracking, hours logged, lesson completion |
| Habit Tracking | Streaks, daily logs, consistency analytics |
| AI Coach | Chat interface with personalized coaching (OpenAI / Gemini / Claude) |
| Anti-Procrastination | Distraction management, focus tools, accountability checks |
| Financial Goals | Life goal tracking — house, marriage, Hajj, business |
| Analytics | Interactive charts, trends, exportable reports |
| Gamification | XP points, levels, achievements, streak rewards |
| Admin Panel | User management, system settings, platform oversight |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS, Radix UI, Framer Motion |
| **State** | Zustand, React Query |
| **Charts** | Recharts |
| **Backend** | FastAPI, Python 3.12, Uvicorn |
| **Database** | PostgreSQL 16, SQLAlchemy, Alembic |
| **AI Providers** | OpenAI, Google Gemini, Anthropic Claude (abstraction layer) |
| **Auth** | JWT, Google OAuth, Email verification (SMTP) |
| **Async Tasks** | Celery + Redis |
| **Infrastructure** | Docker, Docker Compose, Nginx, GitHub Actions |

---

## Architecture

```
                    ┌─────────────────────┐
                    │   Vercel (Frontend) │
                    │   Next.js 15 / SPA  │
                    └─────────┬───────────┘
                              │ HTTPS
                    ┌─────────▼───────────┐
                    │  Render (Backend)   │
                    │  FastAPI + Uvicorn  │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │   Render PostgreSQL │
                    └─────────────────────┘

    AI Providers:  OpenAI ──┐
                    Gemini ──┤──> Abstraction Layer ──> AI Coach
                    Claude ──┘

    Async:         Redis ──> Celery ──> Email / Background Jobs
```

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.12+
- PostgreSQL 16+ (or Docker)

### Environment Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys and database URL

# Frontend
cd frontend
cp .env.example .env.local
```

### Run with Docker (easiest)

```bash
docker-compose up -d
# Frontend: http://localhost:3000
# Backend:  http://localhost:8000
# Swagger:  http://localhost:8000/api/docs
```

### Run without Docker

**Backend:**
```bash
cd backend
python -m venv venv

# Linux/macOS
source venv/bin/activate
# Windows
# .\venv\Scripts\activate

pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deployment

### Frontend → Vercel

A `vercel.json` is already configured to use the `frontend/` directory.

```bash
cd frontend
npm i -g vercel
vercel --prod
```

**Environment variables (set in Vercel dashboard):**
| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://lifeos-ai-api.onrender.com` |
| `NEXT_PUBLIC_APP_URL` | `https://lifeos-ai.vercel.app` |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Your Google OAuth client ID |

### Backend → Render

A `render.yaml` is included — use **Blueprint deploy** (not manual Web Service):

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New+** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` and creates:
   - **Web Service** (`lifeos-ai-api`) — FastAPI
   - **PostgreSQL** (`lifeos-ai-db`) — free tier, 1GB

4. After deploy, add these in **Dashboard → Environment**:
   - `OPENAI_API_KEY`
   - `GEMINI_API_KEY`
   - `CLAUDE_API_KEY`
   - `SMTP_USER` / `SMTP_PASSWORD` (for email)

**⚠️ Free tier:** Render sleeps after 15 min of inactivity and takes ~30s to wake on first request.

---

## API Documentation

Once the backend is running:

| Endpoint | Description |
|----------|-------------|
| `/` | Service status |
| `/api/health` | Health check |
| `/api/docs` | Swagger UI (interactive) |
| `/api/redoc` | ReDoc UI (reference) |

---

## Project Structure

```
lifeos-ai/
├── frontend/                  # Next.js 15 SPA
│   └── src/
│       ├── app/               # Pages & routing
│       ├── components/        # React components (Radix, custom)
│       ├── lib/               # API client, utilities
│       ├── store/             # Zustand state management
│       ├── hooks/             # Custom React hooks
│       └── types/             # TypeScript definitions
├── backend/                   # FastAPI server
│   └── app/
│       ├── ai/                # AI provider abstraction layer
│       ├── models/            # SQLAlchemy ORM models
│       ├── routers/           # API route handlers
│       ├── schemas/           # Pydantic request/response schemas
│       ├── services/          # Business logic layer
│       └── utils/             # Auth, dependencies, helpers
├── nginx/                     # Reverse proxy config
├── .github/workflows/         # CI/CD pipelines
├── docker-compose.yml         # Local development orchestration
├── render.yaml                # Render deployment config
└── vercel.json                # Vercel deployment config
```

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Team/workspace collaboration
- [ ] Calendar sync (Google, Outlook)
- [ ] Notion integration
- [ ] Browser extension (focus mode)
- [ ] Public API for third-party integrations

---

## License

MIT
