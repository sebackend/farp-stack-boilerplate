from datetime import datetime
from typing import Annotated, Self

from pydantic import AwareDatetime, Field, model_validator
from pydantic.json_schema import SkipJsonSchema

from app.db.models import TaskPriority, TaskStatus
from app.schemas import CamelModel


class CreateTaskInput(CamelModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus = TaskStatus.PENDING
    priority: TaskPriority = TaskPriority.MEDIUM
    due_date: AwareDatetime | None = None


class UpdateTaskInput(CamelModel):
    """Partial update: only fields present in the request body are applied."""

    # SkipJsonSchema keeps None as the "not sent" default without advertising null as valid.
    title: Annotated[str, Field(min_length=1, max_length=200)] | SkipJsonSchema[None] = None
    description: str | None = Field(default=None, max_length=2000)
    status: TaskStatus | SkipJsonSchema[None] = None
    priority: TaskPriority | SkipJsonSchema[None] = None
    due_date: AwareDatetime | None = None

    @model_validator(mode="after")
    def reject_null_for_required_columns(self) -> Self:
        for field in ("title", "status", "priority"):
            if field in self.model_fields_set and getattr(self, field) is None:
                raise ValueError(f"{field} cannot be null")
        return self


class TaskResponse(CamelModel):
    id: int
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None
    user_id: int
    created_at: datetime
    updated_at: datetime
