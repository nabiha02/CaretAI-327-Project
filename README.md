# CARETAI

## Clinical Analysis for Responsive Evaluation & Tracking using AI

CARETAI is a CSE327 project focused on collecting patient or caregiver information, organizing relevant evidence, and preparing structured reports for doctors to review. The application currently includes a working frontend demo and a FastAPI backend for conversation and report handling.

This project is not a diagnosis tool and does not prescribe treatment or medication. AI assistance is used for information collection and summarization support, while the clinician remains responsible for review and decisions.

## 1. Project status

The repository contains a frontend demo app and a backend service that are designed to work together incrementally:

- Frontend: React + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI + SQLite for local persistence + Supabase migration assets
- Core flow: patient/caregiver intake, structured questions, evidence capture, and draft report generation
- Safety goal: preserve patient-reported facts, highlight uncertainty, and keep AI output clearly separate from medical opinion

## 2. Repository structure

```text
.
├── .gitattributes
├── .gitignore
├── .mise.toml
├── AGENTS.md
├── README.md
├── backend/
│   ├── .gitignore
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── conversations.py
│   │   │   ├── messages.py
│   │   │   ├── reports.py
│   │   │   └── visits.py
│   │   ├── core/
│   │   ├── database/
│   │   │   ├── __init__.py
│   │   │   └── client.py
│   │   ├── main.py
│   │   ├── pipeline/
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── conversation.py
│   │   │   ├── message.py
│   │   │   ├── report.py
│   │   │   └── visit.py
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── conversation.py
│   │   │   └── storage.py
│   │   └── __init__.py
│   ├── requirements.txt
│   ├── supabase/
│   │   └── migrations/
│   └── tests/
│       └── test_conversation_flow.py
├── frontend/
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── src/
│   │   ├── admin/
│   │   ├── app/
│   │   ├── assets/
│   │   ├── auth/
│   │   ├── doctor/
│   │   ├── index.css
│   │   ├── landing/
│   │   ├── main.tsx
│   │   ├── patient/
│   │   └── vite-env.d.ts
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── ...
├── supabase/
│   └── migrations/
│       └── 0001_initial_schema.sql
└── test.txt
```

## 3. Frontend application

The frontend is under `frontend/` and uses:

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- React Router

Main frontend entry points:

- `frontend/src/main.tsx` — app bootstrap
- `frontend/src/app/router.tsx` — route setup and role protection
- `frontend/src/auth/` — sign-in, sign-up, verification, and doctor onboarding
- `frontend/src/patient/` — patient/caregiver flows
- `frontend/src/doctor/` — doctor dashboard and review screens
- `frontend/src/admin/` — admin/demo verification workflows
- `frontend/src/landing/` — public landing page

## 4. Backend service

The backend is under `backend/` and is built with FastAPI.

Key files:

- `backend/app/main.py` — API startup and CORS configuration
- `backend/app/api/conversations.py` — intake session flow
- `backend/app/api/messages.py` — message storage endpoints
- `backend/app/api/reports.py` — report listing and update endpoints
- `backend/app/api/visits.py` — visit and confirmation endpoints
- `backend/app/services/conversation.py` — structured intake and draft-generation logic
- `backend/app/database/client.py` — database connection logic
- `backend/app/schemas/` — request and response models
- `backend/tests/test_conversation_flow.py` — end-to-end API tests

The app currently uses SQLite as the local persistence layer and accepts a database path via the `CARETAI_DB_PATH` environment variable when needed.

## 5. Local setup

### Prerequisites

- Node.js 22 (the repository pins this in `.mise.toml`)
- npm (the project includes `frontend/package-lock.json`)
- Python environment for the backend
- Git

### Frontend

From the repository root:

```bash
cd frontend
npm install
npm run dev
```

The Vite server is configured for host `0.0.0.0` and port `8443` in `frontend/vite.config.ts`.

### Backend

From the repository root:

```bash
cd backend
python -m venv .venv
# Windows
# .venv\Scripts\activate
# macOS/Linux
# source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API docs are available at:

- `http://localhost:8000/docs`

## 6. Testing and validation

The project includes backend API tests for the conversation flow and draft report behavior:

```bash
cd backend
python -m unittest discover -s tests -p "test_*.py"
```

Frontend validation is done through the project build scripts:

```bash
cd frontend
npm run build
```

## 7. Security and clinical safety notes

- AI-generated summaries are support tools and should be reviewed by a clinician.
- The app is not meant to diagnose patients or prescribe medication.
- Sensitive patient information should remain restricted and only accessible through appropriate roles.
- Report drafts preserve patient-reported facts and uncertainty instead of inventing clinical conclusions.

## 8. Supabase and database

The repo includes migration assets for database setup:

- `supabase/migrations/0001_initial_schema.sql`

These files are part of the project’s persistence and schema setup work, alongside the local SQLite-based FastAPI demo workflow.

## 9. Notes

- Repository guidance for contributors is in `AGENTS.md`.
- The build and runtime commands in this README should be run from the correct project directory; the frontend should not be started from the repository root.
- The project is a working demo and educational implementation, not a production healthcare deployment.

