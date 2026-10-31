import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import TaskForm from "./TaskForm";

const createTaskMock = vi.fn();
const updateTaskMock = vi.fn();

vi.mock("./tasksApi", () => ({
  useCreateTaskMutation: () => [createTaskMock, { isLoading: false }],
  useUpdateTaskMutation: () => [updateTaskMock, { isLoading: false }],
}));

describe("TaskForm", () => {
  beforeEach(() => {
    createTaskMock.mockReset();
    updateTaskMock.mockReset();
  });

  it("shows an error when the title is empty", async () => {
    const user = userEvent.setup();

    render(<TaskForm onClose={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Create" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(createTaskMock).not.toHaveBeenCalled();
  });

  it("creates a task with trimmed values and closes the modal", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const unwrap = vi.fn().mockResolvedValue({ id: 1 });

    createTaskMock.mockReturnValue({ unwrap });

    render(<TaskForm onClose={onClose} />);

    await user.type(screen.getByPlaceholderText("Task name"), "  New task  ");
    await user.type(screen.getByPlaceholderText("Optional description..."), "  Review PR  ");
    await user.click(screen.getByRole("button", { name: "Create" }));

    await waitFor(() => {
      expect(createTaskMock).toHaveBeenCalledWith({
        title: "New task",
        description: "Review PR",
        status: "PENDING",
        priority: "MEDIUM",
        dueDate: null,
      });
    });

    expect(unwrap).toHaveBeenCalled();
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
