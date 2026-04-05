from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.exceptions import AuthenticationError, ValidationError
from app.core.security import build_expiry_iso, generate_token, hash_password, verify_password
from app.db import sqlite

router = APIRouter(prefix="/api/auth", tags=["Auth"])


class AuthCredentials(BaseModel):
    emailAddress: str
    password: str = Field(min_length=8)
    fullName: str | None = None
    username: str | None = None


class SignOutPayload(BaseModel):
    token: str | None = None


def _derive_name_parts(full_name: str) -> tuple[str, str]:
    parts = [p for p in full_name.strip().split(" ") if p]
    if not parts:
        return ("DataLens", "User")
    first_name = parts[0]
    last_name = " ".join(parts[1:])
    return (first_name, last_name)


def _derive_username(email: str, explicit_username: str | None) -> str:
    if explicit_username and explicit_username.strip():
        return explicit_username.strip().lower()
    return email.split("@")[0].strip().lower()


def _user_payload(user: dict, token: str) -> dict:
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "fullName": user["full_name"],
            "firstName": user.get("first_name") or "",
            "lastName": user.get("last_name") or "",
            "username": user["username"],
            "emailAddress": user["email"],
            "primaryEmailAddress": {
                "emailAddress": user["email"],
            },
            "imageUrl": user.get("image_url"),
            "createdAt": user["created_at"],
        },
    }


@router.post("/sign-up")
def sign_up(payload: AuthCredentials):
    email = payload.emailAddress.strip().lower()
    if "@" not in email:
        raise ValidationError("Please provide a valid email address.")

    existing_user = sqlite.get_user_by_email(email)
    if existing_user:
        raise ValidationError("An account with this email already exists.")

    username = _derive_username(email, payload.username)
    if sqlite.get_user_by_username(username):
        raise ValidationError("This username is already taken.")

    full_name = (payload.fullName or username).strip() or "DataLens User"
    first_name, last_name = _derive_name_parts(full_name)
    now_iso = datetime.now(timezone.utc).isoformat()

    user = {
        "id": str(uuid.uuid4()),
        "email": email,
        "username": username,
        "full_name": full_name,
        "first_name": first_name,
        "last_name": last_name,
        "password_hash": hash_password(payload.password),
        "image_url": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    sqlite.create_user(user)

    token = generate_token("dl")
    sqlite.create_auth_token(
        token=token,
        user_id=user["id"],
        created_at=now_iso,
        expires_at=build_expiry_iso(settings.AUTH_TOKEN_TTL_MINUTES),
    )

    return _user_payload(user, token)


@router.post("/sign-in")
def sign_in(payload: AuthCredentials):
    email = payload.emailAddress.strip().lower()
    user = sqlite.get_user_by_email(email)
    if not user:
        raise AuthenticationError("Invalid email or password.")

    if not verify_password(payload.password, user["password_hash"]):
        raise AuthenticationError("Invalid email or password.")

    now_iso = datetime.now(timezone.utc).isoformat()
    token = generate_token("dl")
    sqlite.create_auth_token(
        token=token,
        user_id=user["id"],
        created_at=now_iso,
        expires_at=build_expiry_iso(settings.AUTH_TOKEN_TTL_MINUTES),
    )

    return _user_payload(user, token)


@router.post("/sign-out")
def sign_out(payload: SignOutPayload | None = None, user=Depends(get_current_user)):
    if payload and payload.token:
        sqlite.revoke_auth_token(payload.token)
    sqlite.revoke_all_tokens_for_user(user["id"])
    return {"ok": True, "userId": user["id"]}
