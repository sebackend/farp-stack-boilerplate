import { useMemo, useState } from "react";
import { ListTodo, Loader2, CheckCircle2, AlertTriangle, Plus } from "lucide-react";
import type { TaskResponse } from "@repo/shared";
import { useGetTasksQuery } from "../tasks/tasksApi";
import TaskForm from "../tasks/TaskForm";
import TasksTable from "../tasks/TasksTable";
import DashboardLayout from "./DashboardLayout";
import StatCard from "../../components/ui/StatCard";
import FocusHero from "./widgets/FocusHero";
import ProgressRing from "./widgets/ProgressRing";
import StatusList from "./widgets/StatusList";
import ActivityFeed from "./widgets/ActivityFeed";

function computeStats(tasks: TaskResponse[]) {
  const total = tasks.length;
  const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length;
  const done = tasks.filter((t) => t.status === "DONE").length;
  const overdue = tasks.filter(
    (t) => t.status !== "DONE" && t.dueDate !== null && new Date(t.dueDate).getTime() < Date.now()
  ).length;
  const completion = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, inProgress, done, overdue, completion };
}

export default function DashboardPage() {
  const { data: tasks, isLoading, isError } = useGetTasksQuery();
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskResponse | undefined>();

  const stats = useMemo(() => computeStats(tasks ?? []), [tasks]);

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
    <DashboardLayout
      title="Dashboard"
      subtitle="Your tasks at a glance"
      actions={newTaskButton}
    >
      {isLoading && (
        <div className="py-16 text-center text-sm text-muted-foreground">Loading tasks…</div>
      )}

      {isError && (
        <div className="rounded-[var(--radius)] border border-error bg-error px-4 py-4 text-center text-sm text-error-foreground">
          Error loading tasks. Try refreshing the page.
        </div>
      )}

      {tasks && (
        <div className="flex flex-col gap-5">
          {/* Stat cards (derived from real tasks) */}
          <div className="flex flex-wrap gap-4">
            <StatCard label="Total tasks" value={stats.total} icon={ListTodo} />
            <StatCard label="In progress" value={stats.inProgress} icon={Loader2} />
            <StatCard
              label="Completed"
              value={stats.done}
              delta={`${stats.completion}% completion`}
              deltaTone="success"
              icon={CheckCircle2}
            />
            <StatCard
              label="Overdue"
              value={stats.overdue}
              delta={stats.overdue > 0 ? "Needs attention" : "All on track"}
              deltaTone={stats.overdue > 0 ? "error" : "success"}
              icon={AlertTriangle}
            />
          </div>

          {/* Two-column body */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
            {/* Left: focus hero + real tasks table */}
            <div className="flex min-w-0 flex-col gap-5">
              <FocusHero />
              <TasksTable tasks={tasks} onEdit={openEdit} onCreate={openCreate} />
            </div>

            {/* Right: mocked reusable widgets */}
            <div className="flex flex-col gap-5">
              <div className="rounded-[var(--radius)] border border-border bg-card">
                <div className="border-b border-border px-[18px] py-4">
                  <h3 className="text-[15px] font-semibold text-card-foreground">Completion</h3>
                </div>
                <div className="p-[18px]">
                  <ProgressRing
                    value={stats.completion}
                    label={`${stats.done} of ${stats.total} done`}
                    caption="Across all your tasks"
                  />
                </div>
              </div>
              <StatusList caption="Mock" />
              <ActivityFeed />
            </div>
          </div>
        </div>
      )}

      {showForm && <TaskForm task={editingTask} onClose={closeForm} />}
    </DashboardLayout>
  );
}
