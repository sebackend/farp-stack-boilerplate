from typing import Any

from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import User
from tests.conftest import auth_headers, make_user


async def create_task(client: AsyncClient, user: User, **data: Any) -> dict[str, Any]:
    response = await client.post(
        "/api/v1/tasks", json={"title": "Task", **data}, headers=auth_headers(user)
    )
    assert response.status_code == 201, response.text
    body: dict[str, Any] = response.json()
    return body


async def test_tasks_require_authentication(client: AsyncClient) -> None:
    response = await client.get("/api/v1/tasks")

    assert response.status_code == 401


async def test_create_task_applies_defaults_and_camel_case(client: AsyncClient, user: User) -> None:
    task = await create_task(client, user, title="Write docs")

    assert isinstance(task["id"], int)
    assert task["title"] == "Write docs"
    assert task["description"] is None
    assert task["status"] == "PENDING"
    assert task["priority"] == "MEDIUM"
    assert task["dueDate"] is None
    assert task["userId"] == user.id
    assert {"createdAt", "updatedAt"} <= set(task)


async def test_create_task_validates_payload(client: AsyncClient, user: User) -> None:
    response = await client.post(
        "/api/v1/tasks",
        json={"title": "", "status": "UNKNOWN", "dueDate": "tomorrow"},
        headers=auth_headers(user),
    )

    assert response.status_code == 422
    assert set(response.json()["details"]) == {"title", "status", "dueDate"}


async def test_list_tasks_orders_by_due_date_with_nulls_last(
    client: AsyncClient, user: User
) -> None:
    await create_task(client, user, title="No due date")
    await create_task(client, user, title="Later", dueDate="2030-01-02T00:00:00Z")
    await create_task(client, user, title="Sooner", dueDate="2030-01-01T00:00:00Z")

    response = await client.get("/api/v1/tasks", headers=auth_headers(user))

    assert response.status_code == 200
    assert [task["title"] for task in response.json()] == ["Sooner", "Later", "No due date"]


async def test_users_only_see_their_own_tasks(
    client: AsyncClient, db: AsyncSession, user: User
) -> None:
    other = await make_user(db, "other@example.com")
    task = await create_task(client, other, title="Private")

    list_response = await client.get("/api/v1/tasks", headers=auth_headers(user))
    get_response = await client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers(user))
    patch_response = await client.patch(
        f"/api/v1/tasks/{task['id']}", json={"title": "Hacked"}, headers=auth_headers(user)
    )
    delete_response = await client.delete(f"/api/v1/tasks/{task['id']}", headers=auth_headers(user))

    assert list_response.json() == []
    assert get_response.status_code == 404
    assert get_response.json() == {"error": "Task not found", "statusCode": 404}
    assert patch_response.status_code == 404
    assert delete_response.status_code == 404


async def test_get_task_by_id(client: AsyncClient, user: User) -> None:
    task = await create_task(client, user, title="Find me")

    response = await client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers(user))

    assert response.status_code == 200
    assert response.json()["title"] == "Find me"


async def test_get_task_rejects_non_numeric_id(client: AsyncClient, user: User) -> None:
    response = await client.get("/api/v1/tasks/abc", headers=auth_headers(user))

    assert response.status_code == 422
    assert "id" in response.json()["details"]


async def test_update_task_only_changes_sent_fields(client: AsyncClient, user: User) -> None:
    task = await create_task(
        client,
        user,
        title="Original",
        description="Keep me",
        dueDate="2030-01-01T00:00:00Z",
    )

    response = await client.patch(
        f"/api/v1/tasks/{task['id']}",
        json={"status": "DONE", "dueDate": None},
        headers=auth_headers(user),
    )

    assert response.status_code == 200
    updated = response.json()
    assert updated["status"] == "DONE"
    assert updated["dueDate"] is None
    assert updated["title"] == "Original"
    assert updated["description"] == "Keep me"


async def test_update_task_rejects_null_title(client: AsyncClient, user: User) -> None:
    task = await create_task(client, user)

    response = await client.patch(
        f"/api/v1/tasks/{task['id']}", json={"title": None}, headers=auth_headers(user)
    )

    assert response.status_code == 422


async def test_delete_task(client: AsyncClient, user: User) -> None:
    task = await create_task(client, user)

    delete_response = await client.delete(f"/api/v1/tasks/{task['id']}", headers=auth_headers(user))
    get_response = await client.get(f"/api/v1/tasks/{task['id']}", headers=auth_headers(user))

    assert delete_response.status_code == 204
    assert delete_response.content == b""
    assert get_response.status_code == 404
