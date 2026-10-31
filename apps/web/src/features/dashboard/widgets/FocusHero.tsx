import { Flag } from "lucide-react";

interface FocusHeroProps {
  label?: string;
  title?: string;
  meta?: string;
  /** Countdown-style segments, e.g. { DAYS: "02", HRS: "04" }. Mocked by default. */
  segments?: Record<string, string>;
}

/**
 * Genericized version of the design's "Next Launch" countdown hero.
 * Prop-driven with mock defaults so it can later be wired to a real
 * "next due task" / focus timer.
 */
export default function FocusHero({
  label = "NEXT UP",
  title = "Prepare the quarterly review",
  meta = "Due in 2 days · High priority",
  segments = { DAYS: "02", HRS: "04", MIN: "12", SEC: "38" },
}: FocusHeroProps) {
  return (
    <div className="overflow-hidden rounded-[var(--radius)] border border-border bg-sidebar-primary">
      <div className="flex items-center justify-between px-6 pt-5">
        <span className="font-mono text-[10px] uppercase tracking-widest text-sidebar-primary-foreground/60">
          {label}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 px-2.5 py-1 text-xs font-medium text-primary">
          <Flag className="h-3 w-3" strokeWidth={2} />
          Focus
        </span>
      </div>
      <div className="px-6 pb-2 pt-3">
        <h3 className="text-xl font-semibold text-sidebar-primary-foreground">{title}</h3>
        <p className="mt-1 text-xs text-sidebar-primary-foreground/60">{meta}</p>
      </div>
      <div className="flex items-center gap-3 px-6 py-5">
        {Object.entries(segments).map(([unit, val], i) => (
          <div key={unit} className="flex items-center gap-3">
            {i > 0 && <span className="font-mono text-3xl text-white/25">:</span>}
            <div className="flex flex-col items-center gap-1 rounded-lg bg-white/10 px-3.5 py-2.5">
              <span className="font-mono text-2xl font-bold text-sidebar-primary-foreground">
                {val}
              </span>
              <span className="font-mono text-[9px] tracking-widest text-sidebar-primary-foreground/50">
                {unit}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
