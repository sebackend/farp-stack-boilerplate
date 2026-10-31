export type ListTone = "success" | "warning" | "error" | "muted";

export interface StatusListItem {
  name: string;
  detail?: string;
  status: string;
  tone?: ListTone;
}

const TONE_DOT: Record<ListTone, string> = {
  success: "bg-success-foreground",
  warning: "bg-warning-foreground",
  error: "bg-error-foreground",
  muted: "bg-muted-foreground",
};

const DEFAULT_ITEMS: StatusListItem[] = [
  { name: "Design", detail: "3 tasks", status: "On track", tone: "success" },
  { name: "Engineering", detail: "8 tasks", status: "At risk", tone: "warning" },
  { name: "Marketing", detail: "2 tasks", status: "Blocked", tone: "error" },
  { name: "Research", detail: "1 task", status: "Idle", tone: "muted" },
];

/** Grouped status rows (design's "Pad Status"). Mocked by default. */
export default function StatusList({
  title = "Projects",
  caption,
  items = DEFAULT_ITEMS,
}: {
  title?: string;
  caption?: string;
  items?: StatusListItem[];
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-[18px] py-4">
        <h3 className="text-[15px] font-semibold text-card-foreground">{title}</h3>
        {caption && (
          <span className="font-mono text-[11px] text-muted-foreground">{caption}</span>
        )}
      </div>
      <ul>
        {items.map((item, i) => (
          <li
            key={item.name}
            className={`flex items-center gap-2.5 px-[18px] py-3 ${
              i < items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <span className={`h-2 w-2 shrink-0 rounded-full ${TONE_DOT[item.tone ?? "muted"]}`} />
            <span className="flex-1 text-sm text-card-foreground">{item.name}</span>
            {item.detail && (
              <span className="text-xs text-muted-foreground">{item.detail}</span>
            )}
            <span className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              {item.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
