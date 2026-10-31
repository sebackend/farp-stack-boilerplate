import os

# Test settings must be in place before any app module is imported.
TEST_DATABASE_URL = os.environ.get(
    "TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/taskmanager_test"
)
os.environ.update(
    APP_ENV="test",
    DATABASE_URL=TEST_DATABASE_URL,
    JWT_ACCESS_SECRET="test-access-secret-at-least-32-chars-long",
    JWT_REFRESH_SECRET="test-refresh-secret-at-least-32-chars-long",
    JWT_ACCESS_EXPIRES_IN="15m",
    JWT_REFRESH_EXPIRES_IN="7d",
    API_CORS_ORIGIN="http://localhost:5173",
)

from collections.abc import AsyncIterator  # noqa: E402

import asyncpg  # noqa: E402
import pytest  # noqa: E402
from httpx import ASGITransport, AsyncClient  # noqa: E402
from sqlalchemy.engine import make_url  # noqa: E402
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine  # noqa: E402

from app.core.config import settings  # noqa: E402
from app.core.security import create_token, hash_password  # noqa: E402
from app.db.models import Base, User  # noqa: E402
from app.db.session import get_db  # noqa: E402
from app.main import app  # noqa: E402

TEST_PASSWORD = "password123"


async def _ensure_database_exists(url: str) -> None:
    parsed = make_url(url)
    conn = await asyncpg.connect(
        user=parsed.username,
        password=parsed.password,
        host=parsed.host,
        port=parsed.port,
        database="postgres",
    )
    try:
        exists = await conn.fetchval(
            "SELECT 1 FROM pg_database WHERE datname = $1", parsed.database
        )
        if not exists:
            await conn.execute(f'CREATE DATABASE "{parsed.database}"')
    finally:
        await conn.close()


@pytest.fixture(scope="session")
async def engine() -> AsyncIterator[AsyncEngine]:
    await _ensure_database_exists(settings.DATABASE_URL)
    engine = create_async_engine(settings.DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db(engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    """A session wrapped in a transaction that is rolled back after each test."""
    async with engine.connect() as conn:
        trans = await conn.begin()
        session = AsyncSession(
            bind=conn, join_transaction_mode="create_savepoint", expire_on_commit=False
        )
        try:
            yield session
        finally:
            await session.close()
            await trans.rollback()


@pytest.fixture
async def client(db: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def override_get_db() -> AsyncIterator[AsyncSession]:
        yield db

    app.dependency_overrides[get_db] = override_get_db
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()


async def make_user(db: AsyncSession, email: str = "user@example.com") -> User:
    user = User(email=email, password_hash=hash_password(TEST_PASSWORD))
    db.add(user)
    await db.flush()
    await db.refresh(user)
    return user


def auth_headers(user: User) -> dict[str, str]:
    return {"Authorization": f"Bearer {create_token(user.id, user.email, 'access')}"}


@pytest.fixture
async def user(db: AsyncSession) -> User:
    return await make_user(db)
