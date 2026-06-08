# LifeOS AI

**Your Personal Operating System for Productivity & Career Growth**

LifeOS AI is a full-stack SaaS platform that combines time management, career planning, habit tracking, and AI coaching into one unified dashboard. Built for job seekers, students, and professionals.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Tailwind CSS, ShadCN UI |
| Backend | FastAPI, SQLAlchemy, Alembic, PostgreSQL |
| AI | OpenAI, Gemini, Claude (abstraction layer) |
| Auth | JWT, Google OAuth, Email Verification |
| Infra | Docker, Nginx, GitHub Actions |

## Features

- **Dashboard** — Daily overview, focus scores, productivity trends
- **Time Management** — Calendar, time blocking, Pomodoro timer, deep work sessions
- **Career Planner** — Goal tracking, skill roadmaps, milestone management
- **Job Preparation** — Resume tracker, interview question generator (AI)
- **Learning Tracker** — Skill progress, hours logged, lesson completion
- **Habit Tracking** — Streaks, daily logs, consistency analytics
- **Anti-Procrastination** — Distraction management, focus tools
- **Financial Goals** — Life goal tracking (house, marriage, Hajj, business)
- **AI Coach** — Chat interface with personalized coaching
- **Analytics** — Charts, trends, reports
- **Admin Panel** — User management, system settings
- **Gamification** — XP points, levels, achievements, streaks

## Quick Start

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Environment Setup

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your API keys

# Frontend
cd frontend
cp .env.example .env.local
```

### Run with Docker

```bash
docker-compose up -d
```

### Run without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
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

Open http://localhost:3000

## API Documentation

When the backend is running:
- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

## Project Structure

```
lifeos-ai/
├── backend/
│   ├── app/
│   │   ├── ai/           # AI provider abstraction
│   │   ├── models/       # SQLAlchemy models
│   │   ├── routers/      # API endpoints
│   │   ├── schemas/      # Pydantic schemas
│   │   ├── services/     # Business logic
│   │   └── utils/        # Auth, dependencies
│   ├── alembic/          # Database migrations
│   └── tests/
├── frontend/
│   ├── src/
│   │   ├── app/          # Next.js pages
│   │   ├── components/   # React components
│   │   ├── lib/          # API client, utils
│   │   ├── store/        # Zustand state
│   │   ├── hooks/        # Custom hooks
│   │   └── types/        # TypeScript types
│   └── __tests__/
├── nginx/                # Nginx configuration
├── .github/workflows/    # CI/CD pipelines
└── docker-compose.yml
```

## Deployment

### Frontend (Vercel)

```bash
cd frontend
vercel --prod
```

### Backend (Railway/Render/AWS)

```bash
cd backend
# Deploy using the Dockerfile or directly
```

## License

MIT
