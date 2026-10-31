from httpx import AsyncClient

from app.core.security import create_token, decode_token
from app.db.models import User
from tests.conftest import TEST_PASSWORD, auth_headers


async def test_health_returns_ok(client: AsyncClient) -> None:
    response = await client.get("/health")

    assert response.status_code == 200
    assert response.json()["status"] == "ok"


async def test_login_returns_access_and_refresh_tokens(client: AsyncClient, user: User) -> None:
    response = await client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": TEST_PASSWORD}
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"accessToken", "refreshToken"}
    assert decode_token(body["accessToken"], "access")["sub"] == str(user.id)
    assert decode_token(body["refreshToken"], "refresh")["sub"] == str(user.id)


async def test_login_rejects_wrong_password(client: AsyncClient, user: User) -> None:
    response = await client.post(
        "/api/v1/auth/login", json={"email": user.email, "password": "wrong-password"}
    )

    assert response.status_code == 401
    assert response.json() == {"error": "Invalid credentials", "statusCode": 401}


async def test_login_rejects_unknown_email(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login", json={"email": "nobody@example.com", "password": TEST_PASSWORD}
    )

    assert response.status_code == 401


async def test_login_validates_payload(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login", json={"email": "not-an-email", "password": "123"}
    )

    assert response.status_code == 422
    body = response.json()
    assert body["error"] == "Validation error"
    assert body["statusCode"] == 422
    assert set(body["details"]) == {"email", "password"}


async def test_refresh_issues_a_new_access_token(client: AsyncClient, user: User) -> None:
    refresh_token = create_token(user.id, user.email, "refresh")

    response = await client.post("/api/v1/auth/refresh", json={"refreshToken": refresh_token})

    assert response.status_code == 200
    assert decode_token(response.json()["accessToken"], "access")["sub"] == str(user.id)


async def test_refresh_rejects_an_access_token(client: AsyncClient, user: User) -> None:
    access_token = create_token(user.id, user.email, "access")

    response = await client.post("/api/v1/auth/refresh", json={"refreshToken": access_token})

    assert response.status_code == 401
    assert response.json()["error"] == "Invalid or expired refresh token"


async def test_me_returns_the_current_user(client: AsyncClient, user: User) -> None:
    response = await client.get("/api/v1/auth/me", headers=auth_headers(user))

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == user.id
    assert body["email"] == user.email
    assert "createdAt" in body
    assert "passwordHash" not in body


async def test_me_requires_a_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"error": "Token not provided", "statusCode": 401}


async def test_me_rejects_an_invalid_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer nope"})

    assert response.status_code == 401
    assert response.json()["error"] == "Invalid or expired token"


async def test_logout_requires_auth_and_confirms(client: AsyncClient, user: User) -> None:
    assert (await client.post("/api/v1/auth/logout")).status_code == 401

    response = await client.post("/api/v1/auth/logout", headers=auth_headers(user))

    assert response.status_code == 200
    assert response.json() == {"message": "Session closed successfully"}


async def test_unknown_route_returns_404_error_shape(client: AsyncClient) -> None:
    response = await client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    assert response.json() == {"error": "Route not found", "statusCode": 404}
