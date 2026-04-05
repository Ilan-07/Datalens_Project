# DataLens

DataLens is an AI-powered analytics platform for uploading datasets, running statistical analysis, and generating visual insights — all from the browser.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Recharts, Plotly, Three.js, Framer Motion |
| Backend | FastAPI, Python 3.10+, pandas, scikit-learn, NumPy, SciPy |
| Auth | Custom token-based auth (PBKDF2 password hashing, SQLite-backed tokens) |
| Database | SQLite (auto-created at `backend/data/datalens.db`) |
| CI | GitHub Actions — type checking (mypy), lockfile validation, pytest |

## Project Structure

```
├── frontend/               # React + Vite SPA
│   ├── src/
│   │   ├── app/            # Page components
│   │   ├── components/     # UI components
│   │   ├── engine/         # WebGL, glitch, carousel, simulation engines
│   │   ├── services/       # API layer (axios httpClient)
│   │   ├── store/          # Zustand state management
│   │   └── routes/         # React Router config
│   └── vite.config.ts
├── backend/                # FastAPI API
│   ├── app/
│   │   ├── api/routes/     # auth, analysis endpoints
│   │   ├── core/           # config, security, exceptions
│   │   ├── db/             # SQLite layer
│   │   ├── schemas/        # Pydantic response models
│   │   └── services/       # stats, ML, insights, visualization engines
│   └── requirements.txt
├── sample-data/            # Example CSV for testing
└── docker-compose.yml
```

## Prerequisites

- Node.js 20+
- npm 10+
- Python 3.10–3.14

## Environment Setup

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Optionally adjust `CORS_ORIGINS` for your deployment URLs.
4. The SQLite database is auto-created on first startup.

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env.local`.
2. Set `VITE_API_URL=http://localhost:8000` (default).

## Running Locally

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -B -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

- Frontend: http://localhost:3000 (or next available port)
- Backend API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Docker Compose

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000 |

## API Endpoints

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Create account |
| POST | `/api/auth/sign-in` | Login |
| POST | `/api/auth/sign-out` | Revoke tokens |

### Analysis (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload a dataset |
| GET | `/api/analysis/{session_id}` | Retrieve analysis results |
| HEAD | `/api/analysis/{session_id}` | Check if analysis exists |
| POST | `/api/analysis/{session_id}/narrative` | Generate AI narrative |
| GET | `/api/reports` | List all reports |
| GET | `/api/users/me/analyses` | Current user's analyses |

### Health

| Method | Endpoint |
|--------|----------|
| GET | `/api/health` |

## CI

The GitHub Actions workflow (`.github/workflows/backend.yml`) runs on push/PR to `main`:

1. `pip-compile` lockfile validation
2. `mypy` type checking
3. `pytest` test suite
