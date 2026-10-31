import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  icon?: LucideIcon;
  /** Tone of the delta text. Defaults to muted. */
  deltaTone?: "success" | "warning" | "error" | "muted";
}

const DELTA_TONE: Record<NonNullable<StatCardProps["deltaTone"]>, string> = {
  success: "text-success-foreground",
  warning: "text-warning-foreground",
  error: "text-error-foreground",
  muted: "text-muted-foreground",
};

/** Metric card mirroring component/StatCard from the design. */
export default function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  deltaTone = "muted",
}: StatCardProps) {
  return (
    <div className="flex flex-1 flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-[18px]">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />}
      </div>
      <span className="font-mono text-3xl font-bold text-card-foreground">{value}</span>
      {delta && <span className={`text-xs ${DELTA_TONE[deltaTone]}`}>{delta}</span>}
    </div>
  );
}
