import type { TaskStatus, TaskPriority } from "@repo/shared";

export const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-muted text-muted-foreground" },
  IN_PROGRESS: { label: "In progress", className: "bg-info text-info-foreground" },
  DONE: { label: "Done", className: "bg-success text-success-foreground" },
};

export const PRIORITY_CONFIG: Record<TaskPriority, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-muted text-muted-foreground" },
  MEDIUM: { label: "Medium", className: "bg-warning text-warning-foreground" },
  HIGH: { label: "High", className: "bg-error text-error-foreground" },
};

const BASE =
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none";

export function StatusBadge({
  status,
  onClick,
}: {
  status: TaskStatus;
  onClick?: () => void;
}) {
  const cfg = STATUS_CONFIG[status];
  const dot =
    status === "DONE"
      ? "bg-success-foreground"
      : status === "IN_PROGRESS"
        ? "bg-info-foreground"
        : "bg-muted-foreground";
  const className = `${BASE} ${cfg.className}${
    onClick ? " cursor-pointer transition hover:opacity-80" : ""
  }`;

  const content = (
    <>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {cfg.label}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} title="Change status" className={className}>
        {content}
      </button>
    );
  }
  return <span className={className}>{content}</span>;
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  const cfg = PRIORITY_CONFIG[priority];
  return <span className={`${BASE} ${cfg.className}`}>{cfg.label}</span>;
}
