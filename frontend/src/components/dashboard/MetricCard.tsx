import { type ReactNode } from "react";

type Status = "normal" | "moderate" | "high";

const statusStyles: Record<Status, { label: string; dot: string; pill: string }> = {
  normal: {
    label: "Normal",
    dot: "bg-[var(--success)]",
    pill: "bg-[oklch(0.95_0.05_155)] text-[var(--success-foreground)]",
  },
  moderate: {
    label: "Moderate",
    dot: "bg-[var(--warning)]",
    pill: "bg-[oklch(0.96_0.06_85)] text-[var(--warning-foreground)]",
  },
  high: {
    label: "High",
    dot: "bg-[var(--danger)]",
    pill: "bg-[oklch(0.95_0.06_25)] text-[var(--danger-foreground)]",
  },
};

interface MetricCardProps {
  label: string;
  value: string;
  unit?: string;
  status: Status;
  icon: ReactNode;
  gradientClass: string;
  hint?: string;
}

export function MetricCard({
  label,
  value,
  unit,
  status,
  icon,
  gradientClass,
  hint,
}: MetricCardProps) {
  const s = statusStyles[status];
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-glow">
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full opacity-20 blur-2xl ${gradientClass}`}
      />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-semibold tracking-tight text-foreground tabular-nums">
              {value}
            </span>
            {unit && (
              <span className="text-base font-medium text-muted-foreground">{unit}</span>
            )}
          </div>
          {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
        </div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-card ${gradientClass}`}
        >
          {icon}
        </div>
      </div>
      <div className="relative mt-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${s.pill}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>
    </div>
  );
}
