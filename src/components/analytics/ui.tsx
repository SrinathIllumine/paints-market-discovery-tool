import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { QUADRANTS, QuadrantKey, AccessLevel } from "@/data/analytics";

const toneClass = {
  good: "bg-good/10 text-good border-good/25",
  info: "bg-info/10 text-info border-info/25",
  warn: "bg-warn/15 text-warn border-warn/30",
  critical: "bg-bad/10 text-bad border-bad/25",
} as const;

export function QuadrantBadge({ q, className }: { q: QuadrantKey; className?: string }) {
  const meta = QUADRANTS[q];
  return (
    <span
      title={meta.label}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        toneClass[meta.tone],
        className,
      )}
    >
      {meta.short}
    </span>
  );
}

export function AccessBadge({ level }: { level: AccessLevel }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        level === "High" ? toneClass.good : toneClass.warn,
      )}
    >
      {level} access
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const ok = status === "On Track";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        ok ? toneClass.good : toneClass.critical,
      )}
    >
      {status}
    </span>
  );
}

export function Kpi({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: "good" | "critical";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-3xl leading-none",
          accent === "good" && "text-good",
          accent === "critical" && "text-bad",
        )}
      >
        {value}
      </p>
      {sub && <p className="mt-1.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function Panel({
  title,
  desc,
  right,
  children,
  className,
}: {
  title?: string;
  desc?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5", className)}>
      {(title || right) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            {title && <h2 className="font-display text-xl leading-tight">{title}</h2>}
            {desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Insight({ text, tone = "warn" }: { text: string; tone?: "warn" | "critical" }) {
  return (
    <p
      className={cn(
        "rounded-xl border px-3 py-2.5 text-sm font-medium",
        tone === "warn" ? toneClass.warn : toneClass.critical,
      )}
    >
      {text}
    </p>
  );
}

export function Toggle<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-xl border border-border bg-muted/50 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
            value === o.value
              ? "bg-navy text-navy-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export const quadTint: Record<QuadrantKey, string> = {
  priority: "border-good/30 bg-good/5",
  opportunity: "border-info/30 bg-info/5",
  maintain: "border-warn/30 bg-warn/5",
  deprioritize: "border-bad/30 bg-bad/5",
};

export const quadDot: Record<QuadrantKey, string> = {
  priority: "bg-good",
  opportunity: "bg-info",
  maintain: "bg-warn",
  deprioritize: "bg-bad",
};
