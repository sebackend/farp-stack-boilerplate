from fastapi import APIRouter

from app.api.deps import AuthUser, DbSession
from app.modules.auth import service
from app.modules.auth.schemas import (
    AccessToken,
    LoginInput,
    MessageResponse,
    RefreshInput,
    Tokens,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login")
async def login(data: LoginInput, db: DbSession) -> Tokens:
    return await service.login(db, data)


@router.post("/refresh")
async def refresh(data: RefreshInput) -> AccessToken:
    return service.refresh(data.refresh_token)


@router.post("/logout")
async def logout(_user: AuthUser) -> MessageResponse:
    # Stateless JWT: the client removes tokens locally.
    # If a blacklist is added later, invalidate the refresh token in the DB here.
    return MessageResponse(message="Session closed successfully")


@router.get("/me")
async def me(user: AuthUser, db: DbSession) -> UserResponse:
    return await service.me(db, user.id)
