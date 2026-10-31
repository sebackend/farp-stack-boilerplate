from typing import Annotated

from fastapi import APIRouter, Path, status

from app.api.deps import AuthUser, DbSession
from app.core.errors import NotFoundError
from app.modules.tasks import query, service
from app.modules.tasks.schemas import CreateTaskInput, TaskResponse, UpdateTaskInput

# All task routes require authentication through the AuthUser dependency.
router = APIRouter(prefix="/tasks", tags=["tasks"])

TaskId = Annotated[int, Path(gt=0)]


@router.get("")
async def list_tasks(user: AuthUser, db: DbSession) -> list[TaskResponse]:
    return await query.find_all(db, user.id)


@router.get("/{id}")
async def get_task(id: TaskId, user: AuthUser, db: DbSession) -> TaskResponse:
    task = await query.find_by_id(db, id, user.id)
    if task is None:
        raise NotFoundError("Task")
    return task


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_task(data: CreateTaskInput, user: AuthUser, db: DbSession) -> TaskResponse:
    return await service.create(db, user.id, data)


@router.patch("/{id}")
async def update_task(
    id: TaskId, data: UpdateTaskInput, user: AuthUser, db: DbSession
) -> TaskResponse:
    return await service.update(db, id, user.id, data)


@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(id: TaskId, user: AuthUser, db: DbSession) -> None:
    await service.delete(db, id, user.id)
