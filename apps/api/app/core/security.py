import re
from datetime import UTC, datetime, timedelta
from typing import Any, Literal

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError

from app.core.config import settings

TokenType = Literal["access", "refresh"]

_password_hasher = PasswordHasher()
_DURATION_UNITS = {"s": 1, "m": 60, "h": 3600, "d": 86400}


# ─── Passwords ────────────────────────────────────────────────────────────────


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except (VerifyMismatchError, InvalidHashError):
        return False


# ─── JWT ──────────────────────────────────────────────────────────────────────


def parse_duration(value: str) -> timedelta:
    match = re.fullmatch(r"(\d+)([smhd])", value)
    if not match:
        raise ValueError(f"Invalid duration: {value}")
    amount, unit = match.groups()
    return timedelta(seconds=int(amount) * _DURATION_UNITS[unit])


def _secret_for(token_type: TokenType) -> str:
    return settings.JWT_ACCESS_SECRET if token_type == "access" else settings.JWT_REFRESH_SECRET


def create_token(user_id: int, email: str, token_type: TokenType) -> str:
    expires_in = (
        settings.JWT_ACCESS_EXPIRES_IN
        if token_type == "access"
        else settings.JWT_REFRESH_EXPIRES_IN
    )
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "email": email,
        "type": token_type,
        "iat": now,
        "exp": now + parse_duration(expires_in),
    }
    return jwt.encode(payload, _secret_for(token_type), algorithm="HS256")


def decode_token(token: str, token_type: TokenType) -> dict[str, Any]:
    """Decodes and validates a token. Raises jwt.InvalidTokenError on any failure."""
    payload: dict[str, Any] = jwt.decode(
        token,
        _secret_for(token_type),
        algorithms=["HS256"],
        options={"require": ["sub", "exp"]},
    )
    if payload.get("type") != token_type:
        raise jwt.InvalidTokenError("Invalid token type")
    return payload
