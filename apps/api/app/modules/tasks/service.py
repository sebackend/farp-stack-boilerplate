from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import NotFoundError
from app.db.models import Task
from app.modules.tasks.schemas import CreateTaskInput, TaskResponse, UpdateTaskInput


async def _get_owned(db: AsyncSession, task_id: int, user_id: int) -> Task:
    task = await db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if task is None:
        raise NotFoundError("Task")
    return task


async def create(db: AsyncSession, user_id: int, data: CreateTaskInput) -> TaskResponse:
    task = Task(**data.model_dump(), user_id=user_id)
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return TaskResponse.model_validate(task)


async def update(
    db: AsyncSession, task_id: int, user_id: int, data: UpdateTaskInput
) -> TaskResponse:
    task = await _get_owned(db, task_id, user_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await db.commit()
    await db.refresh(task)
    return TaskResponse.model_validate(task)


async def delete(db: AsyncSession, task_id: int, user_id: int) -> None:
    task = await _get_owned(db, task_id, user_id)
    await db.delete(task)
    await db.commit()
