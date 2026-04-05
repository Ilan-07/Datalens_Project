from __future__ import annotations

from fastapi import Header

from app.core.exceptions import AuthenticationError
from app.db import sqlite


def _parse_token(authorization: str | None, x_auth_token: str | None) -> str | None:
    if authorization:
        value = authorization.strip()
        if value.lower().startswith("bearer "):
            candidate = value[7:].strip()
            if candidate:
                return candidate
        if value:
            return value

    if x_auth_token:
        candidate = x_auth_token.strip()
        if candidate:
            return candidate

    return None


def get_current_user(
    authorization: str | None = Header(default=None),
    x_auth_token: str | None = Header(default=None),
):
    token = _parse_token(authorization, x_auth_token)
    if not token:
        raise AuthenticationError("Missing authentication token.")

    user = sqlite.get_user_by_token(token)
    if not user:
        raise AuthenticationError("Invalid or expired authentication token.")

    return user
