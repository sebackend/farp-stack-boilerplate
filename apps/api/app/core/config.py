from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# The monorepo keeps a single .env at the repository root (apps/api/app/core -> root).
# Inside the Docker image that path does not exist and settings come from the environment.
_parents = Path(__file__).resolve().parents
ROOT_ENV_FILE = _parents[4] / ".env" if len(_parents) > 4 else None


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=ROOT_ENV_FILE, extra="ignore")

    APP_ENV: Literal["development", "production", "test"] = "development"
    API_PORT: int = 3000
    API_CORS_ORIGIN: str = "http://localhost:5173"

    DATABASE_URL: str = Field(min_length=1)

    REDIS_URL: str = "redis://localhost:6379"

    JWT_ACCESS_SECRET: str = Field(min_length=32)
    JWT_REFRESH_SECRET: str = Field(min_length=32)
    JWT_ACCESS_EXPIRES_IN: str = "15m"
    JWT_REFRESH_EXPIRES_IN: str = "7d"

    @field_validator("DATABASE_URL")
    @classmethod
    def use_async_driver(cls, value: str) -> str:
        # Accept plain postgresql:// URLs and switch them to the asyncpg driver.
        for prefix in ("postgresql://", "postgres://"):
            if value.startswith(prefix):
                return "postgresql+asyncpg://" + value.removeprefix(prefix)
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
