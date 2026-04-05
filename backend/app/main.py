"""
DataLens — FastAPI Backend Entry Point
=======================================
Run:  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
"""

from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.routes import analysis
from app.api.routes import auth
from app.core.config import settings
from app.core.exceptions import AppException, app_exception_handler, general_exception_handler
from app.db.sqlite import init_db

# Configure basic logging for Production and Dev
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# ── Lifespan ───────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup / shutdown hooks via FastAPI Lifespan."""
    logger.info("Starting up DataLens Backend...")
    init_db()
    logger.info("✅ SQLite database initialized.")
    logger.info("✅ DataLens API is fully ready.")
    yield
    logger.info("🛑 DataLens API shutting down.")


# ── App instance ───────────────────────────────────────────────────────────────
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Analytics Platform — Secure API integrations.",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ── Exception Handlers ─────────────────────────────────────────────────────────
app.add_exception_handler(AppException, app_exception_handler)  # type: ignore[arg-type]
app.add_exception_handler(Exception, general_exception_handler)  # type: ignore[arg-type]

# ── CORS ───────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(analysis.router, tags=["Analysis"])
app.include_router(auth.router)


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check() -> JSONResponse:
    # A standard JSON structure
    return JSONResponse(status_code=200, content={"status": "healthy", "version": settings.VERSION})


# ── Dev server entrypoint ──────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
