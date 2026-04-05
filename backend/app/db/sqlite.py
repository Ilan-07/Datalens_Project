from __future__ import annotations

import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Generator, List, Optional

from app.core.exceptions import NotFoundError

DB_PATH = Path(__file__).resolve().parents[2] / "data" / "datalens.db"


def _to_json(value: Dict[str, Any]) -> str:
    return json.dumps(value, default=str)


def _from_json(value: str) -> Dict[str, Any]:
    return json.loads(value)


@contextmanager
def get_conn() -> Generator[sqlite3.Connection, None, None]:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def created_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def init_db() -> None:
    with get_conn() as conn:
        conn.executescript(
            """
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT NOT NULL UNIQUE,
                username TEXT NOT NULL UNIQUE,
                full_name TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                password_hash TEXT NOT NULL,
                image_url TEXT,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS auth_tokens (
                token TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL,
                revoked_at TEXT,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS analysis_sessions (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                dataset_hash TEXT NOT NULL,
                dataset_name TEXT NOT NULL,
                problem_statement TEXT,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                last_accessed TEXT NOT NULL,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS analysis_results (
                session_id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY(session_id) REFERENCES analysis_sessions(id) ON DELETE CASCADE,
                FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
            CREATE INDEX IF NOT EXISTS idx_auth_tokens_user_id ON auth_tokens(user_id);
            CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
            CREATE INDEX IF NOT EXISTS idx_analysis_sessions_dataset_hash ON analysis_sessions(dataset_hash);
            CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
            """
        )


def create_user(user: Dict[str, Any]) -> Dict[str, Any]:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO users (id, email, username, full_name, first_name, last_name, password_hash, image_url, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                user["email"],
                user["username"],
                user["full_name"],
                user.get("first_name"),
                user.get("last_name"),
                user["password_hash"],
                user.get("image_url"),
                user["created_at"],
                user["updated_at"],
            ),
        )
    return user


def get_user_by_email(email: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE lower(email) = lower(?)", (email,)).fetchone()
    return dict(row) if row else None


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE lower(username) = lower(?)", (username,)).fetchone()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return dict(row) if row else None


def create_auth_token(token: str, user_id: str, created_at: str, expires_at: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "INSERT INTO auth_tokens (token, user_id, created_at, expires_at, revoked_at) VALUES (?, ?, ?, ?, NULL)",
            (token, user_id, created_at, expires_at),
        )


def revoke_auth_token(token: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE auth_tokens SET revoked_at = ? WHERE token = ? AND revoked_at IS NULL",
            (created_timestamp(), token),
        )


def revoke_all_tokens_for_user(user_id: str) -> None:
    with get_conn() as conn:
        conn.execute(
            "UPDATE auth_tokens SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL",
            (created_timestamp(), user_id),
        )


def get_user_by_token(token: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT u.*, t.expires_at
            FROM auth_tokens t
            JOIN users u ON u.id = t.user_id
            WHERE t.token = ? AND t.revoked_at IS NULL
            """,
            (token,),
        ).fetchone()

    if not row:
        return None

    expires_at_raw = row["expires_at"]
    try:
        expires_at = datetime.fromisoformat(expires_at_raw)
    except Exception:
        return None

    if expires_at <= datetime.now(timezone.utc):
        return None

    user = dict(row)
    user.pop("expires_at", None)
    return user


def create_analysis_session(session: Dict[str, Any]) -> None:
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO analysis_sessions (id, user_id, dataset_hash, dataset_name, problem_statement, status, created_at, last_accessed)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                status = excluded.status,
                last_accessed = excluded.last_accessed,
                problem_statement = excluded.problem_statement,
                dataset_name = excluded.dataset_name
            """,
            (
                session["id"],
                session["user_id"],
                session["dataset_hash"],
                session["dataset_name"],
                session.get("problem_statement", ""),
                session["status"],
                session["created_at"],
                session["last_accessed"],
            ),
        )


def get_analysis_session(session_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute("SELECT * FROM analysis_sessions WHERE id = ?", (session_id,)).fetchone()
    return dict(row) if row else None


def touch_analysis_session(session_id: str, accessed_at: str) -> None:
    with get_conn() as conn:
        conn.execute("UPDATE analysis_sessions SET last_accessed = ? WHERE id = ?", (accessed_at, session_id))


def get_completed_session_for_dataset(user_id: str, dataset_hash: str) -> Optional[str]:
    with get_conn() as conn:
        row = conn.execute(
            """
            SELECT id
            FROM analysis_sessions
            WHERE user_id = ? AND dataset_hash = ? AND status = 'completed'
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (user_id, dataset_hash),
        ).fetchone()

    if not row:
        return None
    return str(row["id"])


def save_analysis_result(session_id: str, user_id: str, payload: Dict[str, Any], created_at: str, updated_at: str) -> None:
    payload_json = _to_json(payload)
    with get_conn() as conn:
        conn.execute(
            """
            INSERT INTO analysis_results (session_id, user_id, payload_json, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(session_id) DO UPDATE SET
                payload_json = excluded.payload_json,
                updated_at = excluded.updated_at
            """,
            (session_id, user_id, payload_json, created_at, updated_at),
        )


def get_analysis_result(session_id: str) -> Optional[Dict[str, Any]]:
    with get_conn() as conn:
        row = conn.execute("SELECT payload_json FROM analysis_results WHERE session_id = ?", (session_id,)).fetchone()
    if not row:
        return None
    return _from_json(row["payload_json"])


def list_user_reports(user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
    with get_conn() as conn:
        rows = conn.execute(
            """
            SELECT s.id, s.dataset_name, s.status, s.created_at, r.payload_json
            FROM analysis_sessions s
            LEFT JOIN analysis_results r ON s.id = r.session_id
            WHERE s.user_id = ?
            ORDER BY s.created_at DESC
            LIMIT ?
            """,
            (user_id, limit),
        ).fetchall()

    reports: List[Dict[str, Any]] = []
    for row in rows:
        payload = _from_json(row["payload_json"]) if row["payload_json"] else {}
        reports.append(
            {
                "id": row["id"],
                "filename": row["dataset_name"],
                "created_at": row["created_at"],
                "status": row["status"],
                "rows": payload.get("rows"),
                "columns": payload.get("columns"),
                "health_score": payload.get("health_score"),
            }
        )

    return reports


def ensure_user_owns_session(user_id: str, session_id: str) -> None:
    session = get_analysis_session(session_id)
    if not session:
        raise NotFoundError("Session not found.", details={"session_id": session_id})
    if session["user_id"] != user_id:
        raise NotFoundError("Session not found.", details={"session_id": session_id})
