import { CheckCircle2, Clock, PlusCircle, RefreshCw, type LucideIcon } from "lucide-react";

export interface ActivityItem {
  icon?: LucideIcon;
  text: string;
  time: string;
}

const DEFAULT_ITEMS: ActivityItem[] = [
  { icon: CheckCircle2, text: "Marked 'Ship v1.0' as done", time: "2m ago" },
  { icon: PlusCircle, text: "Created 'Draft release notes'", time: "18m ago" },
  { icon: RefreshCw, text: "Moved 'API audit' to In progress", time: "1h ago" },
  { icon: Clock, text: "Snoozed 'Update docs' to tomorrow", time: "3h ago" },
  { icon: CheckCircle2, text: "Completed 'Weekly planning'", time: "Yesterday" },
];

/** Live activity/event log (design's "Event Log"). Mocked by default. */
export default function ActivityFeed({
  title = "Activity",
  items = DEFAULT_ITEMS,
}: {
  title?: string;
  items?: ActivityItem[];
}) {
  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-4">
        <h3 className="text-[15px] font-semibold text-card-foreground">{title}</h3>
        <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-success-foreground" />
          Live
        </span>
      </div>
      <ul className="flex-1 px-[18px] py-2">
        {items.map((item, i) => {
          const Icon = item.icon ?? Clock;
          return (
            <li
              key={i}
              className={`flex items-start gap-3 py-3 ${
                i < items.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <span className="flex-1 text-sm text-card-foreground">{item.text}</span>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {item.time}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
