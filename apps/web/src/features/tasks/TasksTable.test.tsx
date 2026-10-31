import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskResponse } from "@repo/shared";
import TasksTable from "./TasksTable";

const deleteTaskMock = vi.fn();
const updateTaskMock = vi.fn();

vi.mock("./tasksApi", () => ({
  useDeleteTaskMutation: () => [deleteTaskMock, { isLoading: false }],
  useUpdateTaskMutation: () => [updateTaskMock, { isLoading: false }],
}));

function makeTask(overrides: Partial<TaskResponse> = {}): TaskResponse {
  return {
    id: 1,
    title: "Write the docs",
    description: "Cover the API",
    status: "PENDING",
    priority: "HIGH",
    dueDate: null,
    userId: 1,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("TasksTable", () => {
  beforeEach(() => {
    deleteTaskMock.mockReset();
    updateTaskMock.mockReset();
  });

  it("renders task title, priority and status", () => {
    render(
      <TasksTable tasks={[makeTask()]} onEdit={vi.fn()} onCreate={vi.fn()} />
    );

    expect(screen.getByText("Write the docs")).toBeInTheDocument();
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pending/i })).toBeInTheDocument();
  });

  it("shows the empty state and triggers onCreate", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<TasksTable tasks={[]} onEdit={vi.fn()} onCreate={onCreate} />);

    await user.click(screen.getByRole("button", { name: "Create the first one" }));
    expect(onCreate).toHaveBeenCalledOnce();
  });

  it("cycles status when the status badge is clicked", async () => {
    const user = userEvent.setup();
    updateTaskMock.mockReturnValue({ unwrap: vi.fn().mockResolvedValue({}) });

    render(<TasksTable tasks={[makeTask()]} onEdit={vi.fn()} onCreate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: /pending/i }));
    await waitFor(() => {
      expect(updateTaskMock).toHaveBeenCalledWith({ id: 1, status: "IN_PROGRESS" });
    });
  });

  it("deletes a task after confirmation", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "confirm").mockReturnValue(true);
    deleteTaskMock.mockReturnValue({ unwrap: vi.fn().mockResolvedValue(undefined) });

    render(<TasksTable tasks={[makeTask()]} onEdit={vi.fn()} onCreate={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteTaskMock).toHaveBeenCalledWith(1);
    });
  });
});
