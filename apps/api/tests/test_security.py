from datetime import timedelta

import jwt
import pytest

from app.core.security import (
    create_token,
    decode_token,
    hash_password,
    parse_duration,
    verify_password,
)


@pytest.mark.parametrize(
    ("value", "expected"),
    [("30s", 30), ("15m", 900), ("2h", 7200), ("7d", 604800)],
)
def test_parse_duration_supports_all_units(value: str, expected: int) -> None:
    assert parse_duration(value) == timedelta(seconds=expected)


def test_parse_duration_rejects_invalid_values() -> None:
    with pytest.raises(ValueError, match="Invalid duration"):
        parse_duration("15 minutes")


def test_verify_password_matches_only_the_original_password() -> None:
    password_hash = hash_password("password123")

    assert verify_password(password_hash, "password123")
    assert not verify_password(password_hash, "wrong-password")
    assert not verify_password("not-a-hash", "password123")


def test_access_token_round_trip_keeps_claims() -> None:
    payload = decode_token(create_token(42, "user@example.com", "access"), "access")

    assert payload["sub"] == "42"
    assert payload["email"] == "user@example.com"
    assert payload["type"] == "access"


def test_decode_token_rejects_a_token_of_the_other_type() -> None:
    # Refresh tokens are signed with a different secret, so they never validate as access.
    refresh_token = create_token(1, "user@example.com", "refresh")

    with pytest.raises(jwt.InvalidTokenError):
        decode_token(refresh_token, "access")
