import { cn } from "@/lib/utils";
import { QUADRANTS, QuadrantKey, ClusterRow, MINOR_CLUSTERS } from "@/data/analytics";
import { quadTint, quadDot } from "./ui";

type Item = { cluster: string; quadrant: QuadrantKey; revenue: number | null };

const ORDER: QuadrantKey[] = ["opportunity", "priority", "deprioritize", "maintain"];

export function PriorityMatrix({
  clusters,
  onSelect,
  selected,
  includeMinor = true,
  compact = false,
}: {
  clusters: ClusterRow[];
  onSelect?: (cluster: string) => void;
  selected?: string | null;
  includeMinor?: boolean;
  compact?: boolean;
}) {
  const items: Item[] = [
    ...clusters.map((c) => ({ cluster: c.cluster, quadrant: c.quadrant, revenue: c.revenue })),
    ...(includeMinor ? MINOR_CLUSTERS.map((m) => ({ ...m, revenue: null })) : []),
  ];
  const max = Math.max(...items.map((i) => i.revenue ?? 0), 1);

  return (
    <div>
      <div className="flex gap-2">
        <div className="flex w-5 shrink-0 items-center justify-center">
          <span className="rotate-180 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground [writing-mode:vertical-rl]">
            Revenue potential →
          </span>
        </div>
        <div className="grid flex-1 grid-cols-2 gap-2">
          {ORDER.map((q) => {
            const meta = QUADRANTS[q];
            const list = items
              .filter((i) => i.quadrant === q)
              .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0));
            return (
              <div
                key={q}
                className={cn(
                  "rounded-xl border p-2.5",
                  quadTint[q],
                  compact ? "min-h-[110px]" : "min-h-[170px]",
                )}
              >
                <div className="mb-2 flex items-center gap-1.5">
                  <span className={cn("h-2 w-2 rounded-full", quadDot[q])} />
                  <p className="text-[11px] font-bold uppercase tracking-wide">{meta.short}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {list.map((i) => {
                    const scale = i.revenue ? 0.55 + (i.revenue / max) * 0.45 : 0.5;
                    return (
                      <button
                        key={i.cluster}
                        onClick={() => onSelect?.(i.cluster)}
                        disabled={!onSelect}
                        title={i.cluster}
                        className={cn(
                          "max-w-full truncate rounded-full border border-border bg-card px-2 py-1 text-left font-medium text-foreground/85 shadow-sm transition",
                          onSelect && "hover:border-navy hover:text-navy",
                          selected === i.cluster && "border-navy ring-2 ring-navy/25",
                        )}
                        style={{ fontSize: `${Math.round(9 + scale * 3)}px` }}
                      >
                        {i.cluster}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="mt-2 pl-7 text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        DG access →
      </p>
    </div>
  );
}
