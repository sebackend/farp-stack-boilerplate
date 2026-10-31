import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskResponse } from "@repo/shared";
import TasksPage from "./TasksPage";

const getTasksQueryMock = vi.fn();
const deleteTaskMock = vi.fn();
const updateTaskMock = vi.fn();

const baseTask: TaskResponse = {
  id: 1,
  title: "Preparar release",
  description: "Validar entregables",
  status: "PENDING",
  priority: "MEDIUM",
  dueDate: null,
  userId: 1,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

// DashboardLayout pulls in the Sidebar (NavLink/Router); stub it to a passthrough
// so this test focuses on the page's own query/modal/table behavior.
vi.mock("../dashboard/DashboardLayout", () => ({
  default: ({
    title,
    subtitle,
    actions,
    children,
  }: {
    title: string;
    subtitle?: string;
    actions: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actions}
      {children}
    </div>
  ),
}));

vi.mock("./tasksApi", () => ({
  useGetTasksQuery: () => getTasksQueryMock(),
  useDeleteTaskMutation: () => [deleteTaskMock, { isLoading: false }],
  useUpdateTaskMutation: () => [updateTaskMock, { isLoading: false }],
}));

vi.mock("./TaskForm", () => ({
  default: ({ task, onClose }: { task?: { title: string }; onClose: () => void }) => (
    <div data-testid="task-form">
      <span>{task?.title ?? "New task"}</span>
      <button onClick={onClose}>Close form</button>
    </div>
  ),
}));

describe("TasksPage", () => {
  beforeEach(() => {
    getTasksQueryMock.mockReset();
    deleteTaskMock.mockReset();
    updateTaskMock.mockReset();
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  it("shows loading, error, and empty state", async () => {
    getTasksQueryMock
      .mockReturnValueOnce({ data: undefined, isLoading: true, isError: false })
      .mockReturnValueOnce({ data: undefined, isLoading: false, isError: true })
      .mockReturnValueOnce({ data: [], isLoading: false, isError: false });

    const { rerender } = render(<TasksPage />);
    expect(screen.getByText("Loading tasks…")).toBeInTheDocument();

    rerender(<TasksPage />);
    expect(
      screen.getByText("Error loading tasks. Try refreshing the page.")
    ).toBeInTheDocument();

    rerender(<TasksPage />);
    expect(screen.getByText("No tasks yet.")).toBeInTheDocument();
  });

  it("opens and closes the create modal from the empty state", async () => {
    const user = userEvent.setup();

    getTasksQueryMock.mockReturnValue({ data: [], isLoading: false, isError: false });

    render(<TasksPage />);

    await user.click(screen.getByRole("button", { name: "Create the first one" }));
    expect(screen.getByTestId("task-form")).toHaveTextContent("New task");

    await user.click(screen.getByRole("button", { name: "Close form" }));
    expect(screen.queryByTestId("task-form")).not.toBeInTheDocument();
  });

  it("renders tasks and runs quick status, edit, and delete", async () => {
    const user = userEvent.setup();
    const deleteUnwrap = vi.fn().mockResolvedValue(undefined);
    const updateUnwrap = vi.fn().mockResolvedValue({ ...baseTask, status: "IN_PROGRESS" });

    getTasksQueryMock.mockReturnValue({
      data: [baseTask],
      isLoading: false,
      isError: false,
    });
    deleteTaskMock.mockReturnValue({ unwrap: deleteUnwrap });
    updateTaskMock.mockReturnValue({ unwrap: updateUnwrap });

    render(<TasksPage />);

    expect(screen.getByText("1 task")).toBeInTheDocument();
    expect(screen.getByText("Preparar release")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /pending/i }));
    await waitFor(() => {
      expect(updateTaskMock).toHaveBeenCalledWith({
        id: 1,
        status: "IN_PROGRESS",
      });
    });

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByTestId("task-form")).toHaveTextContent("Preparar release");

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => {
      expect(deleteTaskMock).toHaveBeenCalledWith(1);
    });
  });
});
