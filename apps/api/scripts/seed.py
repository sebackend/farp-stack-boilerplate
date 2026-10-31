import asyncio
from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select

from app.core.security import hash_password
from app.db.models import Task, TaskPriority, TaskStatus, User
from app.db.session import SessionLocal, engine

ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "password123"


async def main() -> None:
    print("🌱 Running seed...")

    async with SessionLocal() as db:
        # Create sample user
        admin = await db.scalar(select(User).where(User.email == ADMIN_EMAIL))
        if admin is None:
            admin = User(email=ADMIN_EMAIL, password_hash=hash_password(ADMIN_PASSWORD))
            db.add(admin)
            await db.flush()
        print(f"✅ User ready: {admin.email} (id: {admin.id})")

        # Create sample tasks only once, so re-running the seed does not duplicate them.
        task_count = await db.scalar(select(func.count()).where(Task.user_id == admin.id))
        if not task_count:
            now = datetime.now(UTC)
            db.add_all(
                [
                    Task(
                        title="Set up the development environment",
                        description="Install dependencies and configure environment variables",
                        status=TaskStatus.DONE,
                        priority=TaskPriority.MEDIUM,
                        due_date=now - timedelta(days=3),
                        user_id=admin.id,
                    ),
                    Task(
                        title="Implement JWT authentication",
                        description="Login with argon2 + PyJWT",
                        status=TaskStatus.IN_PROGRESS,
                        priority=TaskPriority.HIGH,
                        due_date=now + timedelta(days=2),
                        user_id=admin.id,
                    ),
                    Task(
                        title="Write integration tests",
                        description="Cover auth and task endpoints with pytest + httpx",
                        status=TaskStatus.PENDING,
                        priority=TaskPriority.LOW,
                        due_date=now + timedelta(days=7),
                        user_id=admin.id,
                    ),
                ]
            )
            print("✅ Sample tasks created")

        await db.commit()

    await engine.dispose()

    print()
    print("─────────────────────────────────────────")
    print("Sample credentials:")
    print(f"  Email:    {ADMIN_EMAIL}")
    print(f"  Password: {ADMIN_PASSWORD}")
    print("─────────────────────────────────────────")


if __name__ == "__main__":
    asyncio.run(main())
