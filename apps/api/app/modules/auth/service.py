import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError, UnauthorizedError
from app.core.security import create_token, decode_token, verify_password
from app.db.models import User
from app.modules.auth.schemas import AccessToken, LoginInput, Tokens, UserResponse


async def login(db: AsyncSession, data: LoginInput) -> Tokens:
    user = await db.scalar(select(User).where(User.email == data.email))
    if user is None or not verify_password(user.password_hash, data.password):
        raise UnauthorizedError("Invalid credentials")

    return Tokens(
        access_token=create_token(user.id, user.email, "access"),
        refresh_token=create_token(user.id, user.email, "refresh"),
    )


def refresh(refresh_token: str) -> AccessToken:
    try:
        payload = decode_token(refresh_token, "refresh")
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError) as exc:
        raise UnauthorizedError("Invalid or expired refresh token") from exc

    return AccessToken(access_token=create_token(user_id, str(payload.get("email", "")), "access"))


async def me(db: AsyncSession, user_id: int) -> UserResponse:
    user = await db.get(User, user_id)
    if user is None:
        raise NotFoundError("User")
    return UserResponse.model_validate(user)
