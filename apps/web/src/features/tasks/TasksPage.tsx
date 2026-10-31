import { useState } from "react";
import { Plus } from "lucide-react";
import type { TaskResponse } from "@repo/shared";
import { useGetTasksQuery } from "./tasksApi";
import TaskForm from "./TaskForm";
import TasksTable from "./TasksTable";
import DashboardLayout from "../dashboard/DashboardLayout";

export default function TasksPage() {
  const { data: tasks, isLoading, isError } = useGetTasksQuery();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | undefined>();

  const openCreate = () => {
    setEditingTask(undefined);
    setShowForm(true);
  };
  const openEdit = (task: TaskResponse) => {
    setEditingTask(task);
    setShowForm(true);
  };
  const closeForm = () => {
    setShowForm(false);
    setEditingTask(undefined);
  };

  const subtitle = tasks
    ? `${tasks.length} ${tasks.length === 1 ? "task" : "tasks"}`
    : undefined;

  const newTaskButton = (
    <button
      onClick={openCreate}
      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
    >
      <Plus className="h-4 w-4" strokeWidth={2.25} />
      New task
    </button>
  );

  return (
    <DashboardLayout title="My tasks" subtitle={subtitle} actions={newTaskButton}>
      {isLoading && (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading tasks…</div>
      )}

      {isError && (
        <div className="rounded-[var(--radius)] border border-error bg-error px-4 py-4 text-center text-sm text-error-foreground">
          Error loading tasks. Try refreshing the page.
        </div>
      )}

      {tasks && <TasksTable tasks={tasks} onEdit={openEdit} onCreate={openCreate} />}

      {showForm && <TaskForm task={editingTask} onClose={closeForm} />}
    </DashboardLayout>
  );
}
