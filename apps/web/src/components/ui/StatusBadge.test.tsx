import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StatusBadge, PriorityBadge } from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders the label for a status", () => {
    render(<StatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("In progress")).toBeInTheDocument();
  });

  it("renders as a button and fires onClick when interactive", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<StatusBadge status="DONE" onClick={onClick} />);

    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders a non-interactive span without onClick", () => {
    render(<StatusBadge status="PENDING" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });
});

describe("PriorityBadge", () => {
  it("renders the priority label", () => {
    render(<PriorityBadge priority="HIGH" />);
    expect(screen.getByText("High")).toBeInTheDocument();
  });
});
