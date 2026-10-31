from datetime import datetime

from pydantic import EmailStr, Field

from app.schemas import CamelModel


class LoginInput(CamelModel):
    email: EmailStr
    password: str = Field(min_length=6)


class RefreshInput(CamelModel):
    refresh_token: str = Field(min_length=1)


class Tokens(CamelModel):
    access_token: str
    refresh_token: str


class AccessToken(CamelModel):
    access_token: str


class MessageResponse(CamelModel):
    message: str


class UserResponse(CamelModel):
    id: int
    email: str
    created_at: datetime
