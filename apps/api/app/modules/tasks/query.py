from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Task
from app.modules.tasks.schemas import TaskResponse


async def find_all(db: AsyncSession, user_id: int) -> list[TaskResponse]:
    tasks = await db.scalars(
        select(Task)
        .where(Task.user_id == user_id)
        .order_by(Task.due_date.asc().nulls_last(), Task.created_at.desc())
    )
    return [TaskResponse.model_validate(task) for task in tasks]


async def find_by_id(db: AsyncSession, task_id: int, user_id: int) -> TaskResponse | None:
    task = await db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    return TaskResponse.model_validate(task) if task else None
