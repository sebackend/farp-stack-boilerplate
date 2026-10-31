import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { TaskResponse } from "@repo/shared";
import DashboardPage from "./DashboardPage";

const useGetTasksQueryMock = vi.fn();

vi.mock("../tasks/tasksApi", () => ({
  useGetTasksQuery: () => useGetTasksQueryMock(),
}));

// Keep the test focused on stat derivation: stub the shell + heavy children.
vi.mock("./DashboardLayout", () => ({
  default: ({ actions, children }: { actions: React.ReactNode; children: React.ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
}));
vi.mock("../tasks/TasksTable", () => ({ default: () => <div>TasksTable</div> }));
vi.mock("../tasks/TaskForm", () => ({ default: () => <div>TaskForm</div> }));
vi.mock("./widgets/FocusHero", () => ({ default: () => <div>FocusHero</div> }));
vi.mock("./widgets/ProgressRing", () => ({
  default: ({ value }: { value: number }) => <div>ring:{value}</div>,
}));
vi.mock("./widgets/StatusList", () => ({ default: () => <div>StatusList</div> }));
vi.mock("./widgets/ActivityFeed", () => ({ default: () => <div>ActivityFeed</div> }));

const past = "2020-01-01T00:00:00.000Z";
const tasks: TaskResponse[] = [
  { id: 1, title: "a", description: null, status: "DONE", priority: "LOW", dueDate: null, userId: 1, createdAt: past, updatedAt: past },
  { id: 2, title: "b", description: null, status: "IN_PROGRESS", priority: "HIGH", dueDate: past, userId: 1, createdAt: past, updatedAt: past },
  { id: 3, title: "c", description: null, status: "PENDING", priority: "MEDIUM", dueDate: null, userId: 1, createdAt: past, updatedAt: past },
];

describe("DashboardPage", () => {
  it("derives stats from the task list", () => {
    useGetTasksQueryMock.mockReturnValue({ data: tasks, isLoading: false, isError: false });

    render(<DashboardPage />);

    // done=1 of total=3 => 33% completion, 1 overdue (task 2 is past + not done)
    expect(screen.getByText("33% completion")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.getByText("ring:33")).toBeInTheDocument();
  });

  it("shows a loading state", () => {
    useGetTasksQueryMock.mockReturnValue({ data: undefined, isLoading: true, isError: false });
    render(<DashboardPage />);
    expect(screen.getByText("Loading tasks…")).toBeInTheDocument();
  });
});
