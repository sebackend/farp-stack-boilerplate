interface ProgressRingProps {
  /** 0–100. */
  value: number;
  size?: number;
  thickness?: number;
  label?: string;
  caption?: string;
}

/**
 * Donut/ring gauge (design's "Range & Weather" ring). Prop-driven — used on the
 * dashboard for the real task completion rate, reusable for any percentage.
 */
export default function ProgressRing({
  value,
  size = 72,
  thickness = 10,
  label,
  caption,
}: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value));
  const inner = size - thickness * 2;
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative shrink-0 rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(var(--primary) ${pct * 3.6}deg, var(--muted) 0deg)`,
        }}
        role="img"
        aria-label={`${pct}%${label ? ` ${label}` : ""}`}
      >
        <div
          className="absolute rounded-full bg-card"
          style={{ inset: thickness, width: inner, height: inner }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-sm font-bold text-card-foreground">{pct}%</span>
        </div>
      </div>
      {(label || caption) && (
        <div className="flex flex-col gap-0.5">
          {label && <span className="text-sm font-medium text-card-foreground">{label}</span>}
          {caption && <span className="text-xs text-muted-foreground">{caption}</span>}
        </div>
      )}
    </div>
  );
}
