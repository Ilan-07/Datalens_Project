import hashlib
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import APIRouter, Depends, File, Form, Response, UploadFile

from app.api.deps import get_current_user
from app.core.exceptions import NotFoundError, ValidationError
from app.db import sqlite
from app.schemas.responses import ReportListResponse
from app.services.orchestrator import AnalysisOrchestrator

router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_analysis_payload(session_id: str) -> Dict[str, Any]:
    report = sqlite.get_analysis_result(session_id)
    if not report:
        raise NotFoundError("Analysis results data missing from registry.", details={"session_id": session_id})
    return report


def _touch_session_activity(session_id: str) -> None:
    sqlite.touch_analysis_session(session_id, _utc_now_iso())


def _load_user_report(user_id: str, session_id: str) -> Dict[str, Any]:
    sqlite.ensure_user_owns_session(user_id, session_id)
    _touch_session_activity(session_id)
    return _get_analysis_payload(session_id)


def _build_narrative(report: Dict[str, Any]) -> str:
    filename = report.get("filename") or "uploaded dataset"
    rows = int(report.get("rows") or 0)
    columns = int(report.get("columns") or 0)
    health_score = report.get("health_score")
    missing_pct = report.get("missing_pct")

    opening = (
        f"Dataset '{filename}' was analyzed with {rows:,} rows and {columns} columns. "
        f"Data health score is {health_score}% and missing value coverage is {missing_pct}%"
        if health_score is not None and missing_pct is not None
        else f"Dataset '{filename}' was analyzed with {rows:,} rows and {columns} columns."
    )

    insight_messages = []
    for insight in (report.get("insights") or [])[:4]:
        if isinstance(insight, dict):
            message = insight.get("message")
        else:
            message = str(insight)

        if message:
            insight_messages.append(f"- {message}")

    insights_block = "\n".join(insight_messages)
    if not insights_block:
        insights_block = "- No high-severity anomalies were detected in this run."

    recommendation = ""
    ml_recommendation = report.get("ml_recommendation") or {}
    recommended_model = ml_recommendation.get("recommended_model")
    recommended_reason = ml_recommendation.get("reason")
    if recommended_model:
        recommendation = f"\n\nRecommended model: {recommended_model}."
        if recommended_reason:
            recommendation += f" {recommended_reason}"

    return (
        f"Executive summary\n"
        f"{opening}.\n\n"
        f"Key findings\n"
        f"{insights_block}"
        f"{recommendation}"
    )

@router.post("/upload")
async def upload_csv(
    file: UploadFile = File(...),
    problem_statement: str = Form(""),
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    if not file.filename or not file.filename.endswith(".csv"):
        raise ValidationError("Only CSV files are allowed.", details={"filename": file.filename})

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise ValidationError(f"File exceeds {MAX_FILE_SIZE // (1024*1024)}MB limit.", details={"size": len(content)})
    if len(content) == 0:
        raise ValidationError("File is empty.")

    try:
        # Generate stable dataset ID based on file content
        content_bytes = content if isinstance(content, bytes) else str(content).encode('utf-8')
        dataset_id = hashlib.md5(content_bytes).hexdigest()

        # Reuse completed analysis for same user+dataset when available.
        existing_session_id = sqlite.get_completed_session_for_dataset(user["id"], dataset_id)
        if existing_session_id:
            return _load_user_report(user["id"], existing_session_id)

        # No duplicate found - proceed with heavy orchestration
        session_id = str(uuid.uuid4())
        timestamp_now = _utc_now_iso()

        sqlite.create_analysis_session(
            {
                "id": session_id,
                "user_id": user["id"],
                "dataset_hash": dataset_id,
                "dataset_name": file.filename,
                "problem_statement": problem_statement,
                "status": "processing",
                "created_at": timestamp_now,
                "last_accessed": timestamp_now,
            }
        )

        # Run Heavy Machine Learning / Stats Orchestrator
        report = AnalysisOrchestrator.process_upload(content, file.filename, problem_statement)
        
        # Override orchestrator generated id with persisted session id.
        report["session_id"] = session_id

        sqlite.save_analysis_result(
            session_id=session_id,
            user_id=user["id"],
            payload=report,
            created_at=timestamp_now,
            updated_at=_utc_now_iso(),
        )

        sqlite.create_analysis_session(
            {
                "id": session_id,
                "user_id": user["id"],
                "dataset_hash": dataset_id,
                "dataset_name": file.filename,
                "problem_statement": problem_statement,
                "status": "completed",
                "created_at": timestamp_now,
                "last_accessed": _utc_now_iso(),
            }
        )

        return report

    except ValueError as e:
        raise ValidationError(str(e))

@router.get("/analysis/{session_id}")
async def get_analysis(session_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    return _load_user_report(user["id"], session_id)


@router.head("/analysis/{session_id}", status_code=204)
async def touch_analysis(session_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Response:
    sqlite.ensure_user_owns_session(user["id"], session_id)
    _touch_session_activity(session_id)
    return Response(status_code=204)


@router.post("/analysis/{session_id}/narrative")
async def generate_narrative(session_id: str, user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
    sqlite.ensure_user_owns_session(user["id"], session_id)

    report = _get_analysis_payload(session_id)
    _touch_session_activity(session_id)

    return {
        "session_id": session_id,
        "narrative": _build_narrative(report),
    }

@router.get("/reports", response_model=ReportListResponse)
async def list_reports(user: Dict[str, Any] = Depends(get_current_user)):
    reports = sqlite.list_user_reports(user["id"], limit=20)
    return ReportListResponse(reports=reports)


@router.get("/users/me/analyses", response_model=ReportListResponse)
async def list_my_analyses(user: Dict[str, Any] = Depends(get_current_user)):
    reports = sqlite.list_user_reports(user["id"], limit=100)
    return ReportListResponse(reports=reports)
