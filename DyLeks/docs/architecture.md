# DyslexiAI — Architecture Documentation

> **AI-Powered Dyslexia Detection & Adaptive Learning Platform**  
> Stack: Next.js · FastAPI · Ollama / Groq · PostgreSQL · PaddleOCR · ONNX Runtime

---

## Table of Contents

1. [Overview](#1-overview)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Project Structure](#4-project-structure)
5. [Frontend Architecture (Responsive Next.js PWA)](#5-frontend-architecture-responsive-nextjs-pwa)
6. [Backend Architecture (FastAPI)](#6-backend-architecture-fastapi)
7. [AI & ML Pipeline](#7-ai--ml-pipeline)
8. [Database Design](#8-database-design)
9. [API Endpoints](#9-api-endpoints)
10. [Environment & Configuration](#10-environment--configuration)
11. [Local Development Setup](#11-local-development-setup)
12. [Deployment Strategy](#12-deployment-strategy)
13. [Data Flow Diagrams](#13-data-flow-diagrams)

---

## 1. Overview

DyslexiAI is a **responsive web application (PWA)** that is built to work equally well on **laptop/desktop** and **mobile/phone** browsers. The layout adapts to the screen size without turning the experience into mobile-only or desktop-only. It provides:

- **Automated dyslexia screening** via handwriting analysis (OCR + ML classification)
- **Adaptive multi-level learning** following Orton-Gillingham principles
- **Gamified exercises** with a personal difficulty engine
- **AI Tutor chatbot** powered by a local LLM (Ollama) or Groq API
- **Parent dashboard** for real-time progress monitoring

The system is designed to run **fully locally** during development and can be deployed for production with minimal code changes (swap Ollama → Groq API key).

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                               │
│                                                             │
│   ┌─────────────────────────────────────────────────┐       │
│   │         Next.js 14 (App Router) — PWA           │       │
│   │   React · Tailwind CSS · Zustand · React Query  │       │
│   └──────────────────────┬──────────────────────────┘       │
│                          │ HTTP / REST                       │
└──────────────────────────┼──────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                       BACKEND                               │
│                                                             │
│   ┌─────────────────────────────────────────────────┐       │
│   │           FastAPI (Python 3.11+)                │       │
│   │   Auth · Screening · Learning · AI Pipeline     │       │
│   └──────┬────────────────────────┬─────────────────┘       │
│          │                        │                         │
│   ┌──────▼──────┐        ┌────────▼────────┐               │
│   │ PaddleOCR   │        │  Ollama (local) │               │
│   │ ONNX Runtime│        │  or Groq API    │               │
│   └─────────────┘        └─────────────────┘               │
│                                                             │
│   ┌─────────────────────────────────────────────────┐       │
│   │              PostgreSQL Database                │       │
│   └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Environment Modes

| Mode | Frontend | Backend | LLM | Database |
|------|----------|---------|-----|----------|
| **Local Dev** | `localhost:3000` | `localhost:8000` | Ollama `localhost:11434` | PostgreSQL local |
| **Demo (Ngrok)** | Ngrok URL | Ngrok tunnel | Ollama / Groq | PostgreSQL local |
| **Production** | Vercel | Railway / GCP Cloud Run | Groq API | Supabase |

---

## 3. Tech Stack

### Frontend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js (App Router) | 14.x | SSR, routing, PWA |
| Language | TypeScript | 5.x | Type safety |
| Styling | Tailwind CSS | 3.x | Utility-first CSS |
| State Management | Zustand | 4.x | Global app state |
| Server State | TanStack Query | 5.x | API data fetching & caching |
| Canvas/Handwriting | Fabric.js or react-sketch-canvas | latest | Handwriting input |
| Audio/TTS | Web Speech API (browser built-in) | — | Text-to-speech |
| Animations | Framer Motion | 10.x | UI animations & transitions |
| PWA | next-pwa | latest | Service worker, offline, installable |
| HTTP Client | Axios | 1.x | API communication |

### Backend
| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | FastAPI | 0.110+ | REST API, async |
| Language | Python | 3.11+ | Core runtime |
| OCR Engine | PaddleOCR | v2.7+ | Handwriting text extraction |
| ML Runtime | ONNX Runtime | 1.17+ | Dyslexia classification model |
| AI/LLM (local) | Ollama | latest | Local LLM inference |
| AI/LLM (prod) | Groq API | — | Fast cloud LLM (swap) |
| ORM | SQLAlchemy + Alembic | 2.x | DB models & migrations |
| Auth | python-jose + passlib | latest | JWT authentication |
| Validation | Pydantic v2 | 2.x | Request/response schemas |
| Task Queue | None (MVP) / Celery (v2) | — | Async heavy tasks |

### Database & Storage
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | PostgreSQL 15+ | All application data |
| Local DB | SQLite (dev fallback) | Quick local testing |
| File Storage | Local filesystem (dev) / S3 (prod) | Handwriting images |
| Caching | Redis (optional v2) | Session & API caching |

---

## 4. Project Structure

```
dyslexiai/
├── apps/
│   ├── web/                          # Next.js frontend
│   │   ├── app/                      # App Router pages
│   │   │   ├── (auth)/               # Login, Register
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   ├── (dashboard)/          # Authenticated routes
│   │   │   │   ├── screening/page.tsx
│   │   │   │   ├── learn/
│   │   │   │   │   └── [level]/page.tsx
│   │   │   │   ├── game/page.tsx
│   │   │   │   ├── tutor/page.tsx
│   │   │   │   └── parent/page.tsx
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx              # Landing / onboarding
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI components
│   │   │   ├── canvas/               # Handwriting canvas
│   │   │   ├── screening/            # Screening flow components
│   │   │   ├── learning/             # Exercise components
│   │   │   ├── games/                # Mini-game components
│   │   │   ├── tutor/                # AI Tutor chat UI
│   │   │   └── parent/               # Parent dashboard
│   │   ├── lib/
│   │   │   ├── api/                  # API client functions
│   │   │   ├── hooks/                # Custom React hooks
│   │   │   ├── store/                # Zustand stores
│   │   │   └── utils/                # Helper utilities
│   │   ├── public/
│   │   │   ├── manifest.json         # PWA manifest
│   │   │   └── sw.js                 # Service worker
│   │   ├── next.config.js
│   │   └── package.json
│   │
│   └── api/                          # FastAPI backend
│       ├── app/
│       │   ├── main.py               # FastAPI entry point
│       │   ├── config.py             # Settings & env vars
│       │   ├── database.py           # DB connection & session
│       │   ├── models/               # SQLAlchemy ORM models
│       │   │   ├── user.py
│       │   │   ├── child_profile.py
│       │   │   ├── screening.py
│       │   │   ├── learning.py
│       │   │   └── gamification.py
│       │   ├── schemas/              # Pydantic request/response schemas
│       │   ├── routers/              # API route handlers
│       │   │   ├── auth.py
│       │   │   ├── screening.py
│       │   │   ├── learning.py
│       │   │   ├── tutor.py
│       │   │   └── parent.py
│       │   ├── services/             # Business logic
│       │   │   ├── ocr_service.py    # PaddleOCR integration
│       │   │   ├── onnx_service.py   # ONNX inference
│       │   │   ├── llm_service.py    # Ollama / Groq abstraction
│       │   │   ├── adaptive_engine.py
│       │   │   └── scoring.py
│       │   └── ml/
│       │       └── models/           # ONNX model files (.onnx)
│       ├── alembic/                  # DB migrations
│       ├── requirements.txt
│       └── Dockerfile
│
├── docs/
│   ├── ARCHITECTURE.md               # ← You are here
│   ├── API.md
│   ├── DEPLOYMENT.md
│   └── diagrams/
│       ├── usecase.png
│       ├── sequence.png
│       ├── erd.png
│       └── class.png
├── docker-compose.yml
└── README.md
```

---

## 5. Frontend Architecture (Responsive Next.js PWA)

### PWA Configuration

The app is configured as a Progressive Web App and, more importantly, as a responsive web interface that stays usable on laptop and mobile browsers. Installability from the browser is a bonus, not the design constraint.

```js
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
})

module.exports = withPWA({
  // ...
})
```

```json
// public/manifest.json
{
  "name": "DyslexiAI",
  "short_name": "DyslexiAI",
  "description": "AI Dyslexia Detection & Learning",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#4F46E5",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### State Management

```
Zustand Stores
├── useAuthStore        → user session, JWT token
├── useChildStore       → active child profile, current level
├── useScreeningStore   → screening session state, score
├── useLearningStore    → current exercise, responses, streak
└── useTutorStore       → chat history with AI Tutor
```

### Canvas / Handwriting Input

The handwriting canvas captures the child's input and exports it as a PNG for the AI pipeline:

```tsx
// components/canvas/HandwritingCanvas.tsx
// Uses react-sketch-canvas or Fabric.js
// Exports: canvas.exportImage('png') → base64 string
// Resolution target: 256x256px (matches ONNX model input)
```

---

## 6. Backend Architecture (FastAPI)

### Application Entry Point

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, screening, learning, tutor, parent

app = FastAPI(title="DyslexiAI API", version="1.0.0")

app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000"])

app.include_router(auth.router,       prefix="/api/auth")
app.include_router(screening.router,  prefix="/api/screening")
app.include_router(learning.router,   prefix="/api/learning")
app.include_router(tutor.router,      prefix="/api/tutor")
app.include_router(parent.router,     prefix="/api/parent")
```

### LLM Service Abstraction

The LLM service is designed to swap between Ollama (local) and Groq (production) with a single environment variable:

```python
# app/services/llm_service.py

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama")  # "ollama" | "groq"

class LLMService:
    async def chat(self, messages: list, context: dict) -> AsyncIterator[str]:
        if LLM_PROVIDER == "ollama":
            return self._ollama_stream(messages)
        elif LLM_PROVIDER == "groq":
            return self._groq_stream(messages)

    async def _ollama_stream(self, messages):
        # POST http://localhost:11434/api/chat
        # Model: qwen2.5:7b (best for Bahasa Indonesia)
        ...

    async def _groq_stream(self, messages):
        # Uses GROQ_API_KEY from environment
        # Model: llama-3.1-8b-instant or qwen-qwq-32b
        ...
```

### Recommended Ollama Model

```bash
# Pull the recommended model for Bahasa Indonesia
ollama pull qwen2.5:7b

# Alternative — lighter option
ollama pull llama3.2:3b
```

---

## 7. AI & ML Pipeline

### Step-by-Step Flow

```
Child writes word on canvas
        │
        ▼
[1] Canvas Capture
    Flutter → PNG 256×256 (base64)
        │
        ▼
[2] POST /api/screening/analyze
    { image_base64, child_id }
        │
        ▼
[3] PaddleOCR Processing
    PP-OCRv4 model (< 10MB)
    → Extracted text + bounding boxes + confidence
        │
        ▼
[4] Feature Extraction (Flask)
    - Stroke ratio
    - Baseline deviation
    - Mirror error detection (b/d, p/q)
    - Kerning abnormality
        │
        ▼
[5] ONNX Inference
    Dyslexia classification model (< 5MB)
    → { dyslexia_probability, error_categories[] }
        │
        ▼
[6] Adaptive Scoring Engine
    - Calculate risk score (0–100)
    - Detect error patterns
    - Determine next exercise
        │
        ▼
[7] Response to Frontend
    {
      score: 72,
      risk_label: "high",
      feedback: "Terdeteksi pembalikan huruf b/d",
      next_exercise: { ... },
      level_up: false
    }
```

### Risk Score Interpretation

| Score | Risk Level | Action |
|-------|-----------|--------|
| > 70 | 🔴 Tinggi | Referral ke psikolog + mulai Level 1 dengan adaptive mode |
| 40–70 | 🟡 Sedang | Masuk Level 1 dengan adaptive mode aktif |
| < 40 | 🟢 Rendah | Masuk Level 2 langsung |

### ONNX Model Requirements

- Input: 256×256 grayscale image (flattened feature vector)
- Output: `[probability_dyslexia, category_id]`
- Target size: < 5MB (for potential on-device use)
- Runtime: ONNX Runtime 1.17+ via Python

---

## 8. Database Design

### Entity Relationship Summary

```
users (parent accounts)
  └─── child_profiles (one parent → many children)
         ├─── screening_sessions  (screening history)
         ├─── learning_sessions   (learning history)
         │       └─── responses   (per-exercise answers)
         ├─── error_patterns      (adaptive engine data)
         ├─── gamification        (XP, badges, streak)
         ├─── referrals           (psychologist referrals)
         └─── chat_histories      (AI tutor conversations)

exercises (global exercise library, referenced by responses)
```

### SQL Schema

```sql
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  role        VARCHAR(20) DEFAULT 'parent',
  created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE child_profiles (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  name           VARCHAR(100) NOT NULL,
  age            SMALLINT,
  current_level  SMALLINT DEFAULT 1,
  risk_score     DECIMAL(5,2),
  created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE screening_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID REFERENCES child_profiles(id),
  score           DECIMAL(5,2),
  risk_label      VARCHAR(20),
  handwriting_url TEXT,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE learning_sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    UUID REFERENCES child_profiles(id),
  level       SMALLINT,
  total_score DECIMAL(5,2),
  started_at  TIMESTAMP,
  ended_at    TIMESTAMP
);

CREATE TABLE exercises (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level        SMALLINT NOT NULL,
  type         VARCHAR(30),       -- 'write' | 'audio' | 'minigame'
  content_json JSONB,
  difficulty   DECIMAL(3,2) DEFAULT 0.5
);

CREATE TABLE responses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id   UUID REFERENCES learning_sessions(id),
  exercise_id  UUID REFERENCES exercises(id),
  answer       TEXT,
  is_correct   BOOLEAN,
  score        DECIMAL(5,2),
  time_spent_ms INT
);

CREATE TABLE error_patterns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID REFERENCES child_profiles(id),
  letter_pair  VARCHAR(10),      -- e.g., "b/d", "p/q"
  error_count  INT DEFAULT 0,
  last_seen    TIMESTAMP
);

CREATE TABLE gamification (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id       UUID REFERENCES child_profiles(id) UNIQUE,
  xp             INT DEFAULT 0,
  streak         INT DEFAULT 0,
  level_unlocked SMALLINT DEFAULT 1,
  badges         JSONB DEFAULT '[]'
);

CREATE TABLE referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id     UUID REFERENCES child_profiles(id),
  triggered_at TIMESTAMP DEFAULT NOW(),
  reason       TEXT,
  status       VARCHAR(20) DEFAULT 'pending'  -- 'pending' | 'completed'
);

CREATE TABLE chat_histories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id   UUID REFERENCES child_profiles(id),
  role       VARCHAR(20),    -- 'user' | 'assistant'
  message    TEXT,
  timestamp  TIMESTAMP DEFAULT NOW()
);
```

---

## 9. API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register parent account |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/child` | Add child profile |

### Screening
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/screening/analyze` | Submit handwriting image, get risk score |
| GET | `/api/screening/{child_id}/history` | Screening history |
| GET | `/api/screening/{child_id}/latest` | Most recent result |

### Learning
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/learning/exercise/{child_id}` | Get next adaptive exercise |
| POST | `/api/learning/submit` | Submit answer, get feedback |
| POST | `/api/learning/level-up` | Trigger level advancement |
| GET | `/api/learning/progress/{child_id}` | Progress summary |

### AI Tutor
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tutor/chat` | Send message, receive streamed response |
| GET | `/api/tutor/history/{child_id}` | Chat history |

### Parent Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/parent/dashboard/{child_id}` | Full dashboard data |
| GET | `/api/parent/report/{child_id}` | Weekly progress report |
| GET | `/api/parent/referral/{child_id}` | Referral recommendations |

---

## 10. Environment & Configuration

### Frontend `.env.local`
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=DyslexiAI
```

### Backend `.env`
```env
# Application
APP_ENV=development
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/dyslexiai

# LLM Provider: "ollama" for local, "groq" for production
LLM_PROVIDER=ollama

# Ollama (local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Groq (swap for demo/production)
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant

# Storage
UPLOAD_DIR=./uploads
```

---

## 11. Local Development Setup

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Ollama (install from [ollama.ai](https://ollama.ai))

### Step 1 — Clone & Install

```bash
# Frontend
cd apps/web
npm install

# Backend
cd apps/api
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Step 2 — Setup Database

```bash
# Create database
createdb dyslexiai

# Run migrations
cd apps/api
alembic upgrade head
```

### Step 3 — Pull Ollama Model

```bash
ollama pull qwen2.5:7b
```

### Step 4 — Run All Services

```bash
# Terminal 1 — Ollama
ollama serve

# Terminal 2 — FastAPI backend
cd apps/api
uvicorn app.main:app --reload --port 8000

# Terminal 3 — Next.js frontend
cd apps/web
npm run dev
```

Access the app at `http://localhost:3000` from laptop or mobile browser on the same local network.

### Docker Compose (Alternative)

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: ./apps/web
    ports: ["3000:3000"]
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000

  api:
    build: ./apps/api
    ports: ["8000:8000"]
    depends_on: [db]
    env_file: ./apps/api/.env

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: dyslexiai
      POSTGRES_PASSWORD: password
    ports: ["5432:5432"]
    volumes: [postgres_data:/var/lib/postgresql/data]

volumes:
  postgres_data:
```

---

## 12. Deployment Strategy

### Development → Demo → Production

```
Phase 1: Local Development
  Next.js localhost:3000
  FastAPI localhost:8000
  Ollama localhost:11434
  PostgreSQL localhost:5432
        │
        ▼
Phase 2: Demo for Jury (Ngrok)
  ngrok http 3000   → share this URL to jury
  ngrok http 8000   → update NEXT_PUBLIC_API_URL
  Ollama still running locally
        │
        ▼
Phase 3: Production
  Next.js    → Vercel (auto deploy from Git)
  FastAPI    → Railway or GCP Cloud Run (Docker)
  LLM        → Swap LLM_PROVIDER=groq + GROQ_API_KEY
  PostgreSQL → Supabase (managed)
  Storage    → Firebase Storage or AWS S3
```

### Ngrok Quick Setup (for jury demo)

```bash
# Install ngrok, then:
ngrok http 3000

# You'll get something like: https://abc123.ngrok.io
# Share this URL with the jury — they open it on their phone browser
# The app is fully installable as a PWA from that URL
```

### Production Swap Checklist

- [ ] Set `LLM_PROVIDER=groq` in environment
- [ ] Add `GROQ_API_KEY` 
- [ ] Update `NEXT_PUBLIC_API_URL` to Railway/GCP URL
- [ ] Set `DATABASE_URL` to Supabase connection string
- [ ] Configure CORS in FastAPI for production domain

---

## 13. Data Flow Diagrams

### Screening Flow

```
User (Parent)                Next.js             FastAPI          PaddleOCR + ONNX
     │                          │                    │                   │
     │── Open app ──────────────▶│                    │                   │
     │── Select "Screening" ────▶│                    │                   │
     │                          │                    │                   │
     │  [Child writes 5 words]  │                    │                   │
     │── Submit canvas ─────────▶│                    │                   │
     │                          │── POST /screening/analyze ──────────────▶│
     │                          │                    │── process_image() ─▶│
     │                          │                    │◀── text + bbox ─────│
     │                          │                    │── run_inference() ──▶│
     │                          │                    │◀── score + labels ──│
     │                          │                    │                   │
     │                          │◀── { score, risk, next_level } ────────│
     │◀── Show result + level ──│                    │                   │
```

### AI Tutor Chat Flow

```
Child                    Next.js              FastAPI             Ollama/Groq
  │                         │                    │                    │
  │── Type question ────────▶│                    │                    │
  │                         │── POST /tutor/chat ─▶│                    │
  │                         │                    │── chat() ──────────▶│
  │                         │                    │                    │
  │                         │            [streaming response]         │
  │◀── Token by token ──────│◀──────── stream ────│◀── stream ─────────│
  │    displayed live       │                    │                    │
```

---

## Notes

- **Offline Support**: Basic exercises work offline via service worker cache. Screening and AI Tutor require local network access to the backend, but the UI is designed to stay responsive on both laptop and mobile screens.
- **Child Safety**: All AI Tutor prompts include system instructions for child-appropriate language (Bahasa Indonesia, encouraging tone).
- **ONNX Model**: The `.onnx` classification model needs to be trained separately on dyslexia handwriting data and placed in `apps/api/app/ml/models/`.
- **PaddleOCR**: Uses PP-OCRv4 mobile-optimized model. First run downloads the model automatically (~40MB).

---

*Last updated: April 2025 — DyslexiAI Hackathon Team*
