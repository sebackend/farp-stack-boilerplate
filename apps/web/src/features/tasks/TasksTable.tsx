import type { TaskResponse, TaskStatus } from "@repo/shared";
import { useDeleteTaskMutation, useUpdateTaskMutation } from "./tasksApi";
import { StatusBadge, PriorityBadge } from "../../components/ui/StatusBadge";
import { useState } from "react";
import { ListFilter } from "lucide-react";

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  PENDING: "IN_PROGRESS",
  IN_PROGRESS: "DONE",
  DONE: "PENDING",
};

function formatDue(iso: string | null): { text: string; overdue: boolean } {
  if (!iso) return { text: "—", overdue: false };
  const date = new Date(iso);
  const text = date.toLocaleDateString("en-US", { day: "numeric", month: "short" });
  const overdue = date.getTime() < Date.now();
  return { text, overdue };
}

interface TasksTableProps {
  tasks: TaskResponse[];
  onEdit: (task: TaskResponse) => void;
  onCreate: () => void;
}

const COLS = "grid grid-cols-[1fr_110px_110px_130px_90px] items-center gap-3";

export default function TasksTable({ tasks, onEdit, onCreate }: TasksTableProps) {
  const [deleteTask, { isLoading: isDeleting }] = useDeleteTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deletingId, setDeletingId] = useState<TaskResponse["id"] | null>(null);

  const handleDelete = async (id: TaskResponse["id"]) => {
    if (!confirm("Delete this task?")) return;
    setDeletingId(id);
    try {
      await deleteTask(id).unwrap();
    } finally {
      setDeletingId(null);
    }
  };

  const handleQuickStatus = async (task: TaskResponse) => {
    await updateTask({ id: task.id, status: NEXT_STATUS[task.status] }).unwrap();
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="text-[15px] font-semibold text-card-foreground">Tasks</h3>
        <button
          onClick={onCreate}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-muted"
        >
          <ListFilter className="h-3.5 w-3.5" strokeWidth={1.75} />
          New task
        </button>
      </div>

      {/* Column heads */}
      <div className={`${COLS} bg-muted px-5 py-2.5`}>
        {["Task", "Priority", "Due", "Status", ""].map((h, i) => (
          <span
            key={i}
            className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground"
          >
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {tasks.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-16">
          <p className="text-sm text-muted-foreground">No tasks yet.</p>
          <button
            onClick={onCreate}
            className="text-sm font-medium text-primary hover:underline"
          >
            Create the first one
          </button>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto">
          {tasks.map((task) => {
            const due = formatDue(task.dueDate);
            return (
              <li
                key={task.id}
                className={`${COLS} border-b border-border px-5 py-3.5 last:border-b-0`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-card-foreground">
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="truncate text-xs text-muted-foreground">
                      {task.description}
                    </p>
                  )}
                </div>
                <div>
                  <PriorityBadge priority={task.priority} />
                </div>
                <span
                  className={`text-xs ${
                    due.overdue && task.status !== "DONE"
                      ? "font-medium text-error-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {due.text}
                </span>
                <div>
                  <StatusBadge status={task.status} onClick={() => handleQuickStatus(task)} />
                </div>
                <div className="flex items-center justify-end gap-1">
                  <button
                    onClick={() => onEdit(task)}
                    className="rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-card-foreground"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(task.id)}
                    disabled={isDeleting && deletingId === task.id}
                    className="rounded-md px-2 py-1 text-xs font-medium text-error-foreground transition hover:bg-error disabled:opacity-50"
                  >
                    {isDeleting && deletingId === task.id ? "…" : "Delete"}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
