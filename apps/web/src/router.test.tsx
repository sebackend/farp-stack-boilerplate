import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AppRouter from "./router";

vi.mock("./features/auth/LoginPage", () => ({
  default: () => <div>Login Page</div>,
}));

vi.mock("./features/tasks/TasksPage", () => ({
  default: () => <div>Tasks Page</div>,
}));

vi.mock("./features/dashboard/DashboardPage", () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock("./components/RequireAuth", () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AppRouter", () => {
  beforeEach(() => {
    window.history.pushState({}, "", "/");
  });

  it("redirects / to /dashboard", async () => {
    render(<AppRouter />);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });

  it("renders the login route", async () => {
    window.history.pushState({}, "", "/login");

    render(<AppRouter />);

    expect(await screen.findByText("Login Page")).toBeInTheDocument();
  });

  it("renders the tasks route", async () => {
    window.history.pushState({}, "", "/tasks");

    render(<AppRouter />);

    expect(await screen.findByText("Tasks Page")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.pathname).toBe("/tasks");
    });
  });

  it("redirects unknown routes to the root and ends on /dashboard", async () => {
    window.history.pushState({}, "", "/unknown");

    render(<AppRouter />);

    expect(await screen.findByText("Dashboard Page")).toBeInTheDocument();
    await waitFor(() => {
      expect(window.location.pathname).toBe("/dashboard");
    });
  });
});
