# DataLens

**AI-powered analytics platform for uploading datasets, running statistical analysis, and generating visual insights — all from the browser.**

Upload a CSV, get instant statistics, auto-generated charts, ML model recommendations, and actionable data quality insights. No external AI APIs required — all analysis is deterministic using stats and rule-based engines.

---

## Features

- **Drag-and-drop CSV upload** with instant profiling and health scoring
- **Automated statistical analysis** — descriptive stats, correlations, distribution metrics, outlier detection
- **Dynamic chart generation** — histograms, bar charts, scatter plots, heatmaps, and line charts generated from your data's structure
- **ML model recommendations** — suggests the right algorithm (Random Forest, XGBoost, CatBoost, KMeans, etc.) based on dataset size, features, and problem type
- **Rule-based data quality insights** — missing values, multicollinearity, skewness, high cardinality, and more, ranked by severity
- **Cinematic UI** — WebGL-powered 3D carousel, glitch effects, depth typography, and parallax animations built with Three.js and Framer Motion
- **Session persistence** — analysis snapshots saved to localStorage with project history management
- **12 customizable settings** — theme, chart type, data density, animation speed, and visual effects
- **Token-based auth** — PBKDF2 password hashing with auto-expiring sessions

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind CSS, Zustand, Recharts, Plotly, Three.js, Framer Motion |
| Backend | FastAPI, Python 3.10+, pandas, scikit-learn, NumPy, SciPy |
| Auth | Custom token-based (PBKDF2-SHA256, 200K rounds, 7-day TTL) |
| Database | SQLite (auto-created at `backend/data/datalens.db`) |
| CI | GitHub Actions — mypy type checking, pytest |

---

## How It Works

```
CSV Upload → Data Profiler → Stats Engine → Visualization Engine → ML Advisor → Insight Engine
                                                                                      ↓
                                                                          Comprehensive Report
```

### Analysis Pipeline (5 engines)

1. **Data Profiler** — Detects column types (numeric, categorical, datetime), computes missing values, memory usage, and dataset health score (0–100%)
2. **Statistics Engine** — Mean, median, std, skewness, kurtosis, IQR, outlier detection for numerics; cardinality, entropy, top categories for categoricals; Pearson correlation matrix
3. **Visualization Engine** — Auto-generates chart configs based on data types: histograms for distributions, bar charts for categories, scatter plots for top correlated pairs, heatmaps for correlation matrices
4. **ML Advisor** — Analyzes problem statement + dataset characteristics to recommend models (e.g., small dataset → Random Forest, large → XGBoost, many categoricals → CatBoost)
5. **Insight Engine** — Rule-based detection of data quality issues with severity scoring: missing values, multicollinearity (r > 0.8), heavy skewness, outlier prevalence, high cardinality columns

---

## Project Structure

```
├── frontend/                    # React + Vite SPA
│   ├── src/
│   │   ├── app/                 # Page components (landing, analysis, dataset, insights, profile, auth)
│   │   ├── components/          # 58 UI components (charts, dashboard, upload, insights, nav)
│   │   ├── engine/              # WebGL/3D engines (glitch, carousel, shaders, simulation, lighting)
│   │   ├── services/            # API layer (axios httpClient, auth, analysis)
│   │   ├── store/               # Zustand stores (analysis, projects, settings)
│   │   ├── hooks/               # Custom React hooks
│   │   └── routes/              # React Router config
│   ├── Dockerfile
│   └── .env.example
├── backend/                     # FastAPI REST API
│   ├── app/
│   │   ├── api/routes/          # Auth & analysis endpoints
│   │   ├── core/                # Config, security, exceptions
│   │   ├── db/                  # SQLite layer
│   │   ├── schemas/             # Pydantic response models
│   │   └── services/            # 5 analysis engines + orchestrator
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── sample-data/                 # Synthetic customer churn dataset (500 rows × 19 columns)
├── docker-compose.yml
└── .github/workflows/           # CI pipeline
```

---

## Prerequisites

- Node.js 20+
- Python 3.10+

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/Ilan-07/DATALENS.git
cd DATALENS
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python -B -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Frontend setup (separate terminal)

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

### 4. Open the app

| Service | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| API Docs (Swagger) | http://localhost:8000/docs |
| API Docs (ReDoc) | http://localhost:8000/redoc |

The SQLite database is auto-created on first startup — no additional setup needed.

---

## Docker

```bash
docker compose up --build
```

Both services start with hot-reload enabled. Frontend on port 3000, backend on port 8000.

---

## API Reference

### Auth (no token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/sign-up` | Create account (`emailAddress`, `password`, `fullName`, `username`) |
| POST | `/api/auth/sign-in` | Login (returns bearer token) |
| POST | `/api/auth/sign-out` | Revoke session token |

### Analysis (requires `Authorization: Bearer <token>`)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload CSV + optional problem statement (multipart form data) |
| GET | `/api/analysis/{session_id}` | Get full analysis report |
| HEAD | `/api/analysis/{session_id}` | Check if analysis exists |
| POST | `/api/analysis/{session_id}/narrative` | Generate AI narrative summary |
| GET | `/api/reports` | List all user reports |
| GET | `/api/users/me/analyses` | Current user's analysis history |

### Health

| Method | Endpoint |
|--------|----------|
| GET | `/api/health` |

---

## Sample Data

A synthetic customer churn dataset is included at `sample-data/eda_test_synthetic.csv`:

- **500 rows × 19 columns**
- Features: `age`, `tenure_months`, `monthly_income`, `credit_score`, `session_count_30d`, `orders_count_30d`, `avg_order_value`, `spend_30d`, `nps_score`, `region`, `device_type`, `plan_tier`, and more
- Target: `churned` (binary 0/1)

Upload it after signing up to see DataLens in action.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `CORS_ORIGINS` | localhost origins | JSON array of allowed origins |
| `PROJECT_NAME` | DataLens API | API title in docs |
| `VERSION` | 2.0.0 | API version |
| `AUTH_TOKEN_TTL_MINUTES` | 10080 (7 days) | Token expiry |

### Frontend (`frontend/.env.local`)

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_URL` | `http://localhost:8000` | Backend API URL |

---

## CI

GitHub Actions runs on push/PR to `main`:

1. **mypy** — static type checking across the backend
2. **pytest** — test suite execution
