import { useMemo } from "react";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores, type HML } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

type Band = "H" | "L";
const bandOf = (h: HML): Band => (h === "H" ? "H" : "L");

const QUADRANTS: { potential: Band; access: Band; title: string; tone: string }[] = [
  { potential: "H", access: "L", title: "High Potential · Lower Access",  tone: "border-amber-300 bg-amber-50" },
  { potential: "H", access: "H", title: "High Potential · High Access",   tone: "border-green-300 bg-green-50" },
  { potential: "L", access: "L", title: "Lower Potential · Lower Access", tone: "border-border bg-muted/40" },
  { potential: "L", access: "H", title: "Lower Potential · High Access",  tone: "border-blue-300 bg-blue-50" },
];

export function QuadrantSnapshot({ highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const buckets = useMemo(() => {
    const map = new Map<string, { id: string; name: string }[]>();
    for (const q of QUADRANTS) map.set(`${q.potential}-${q.access}`, []);
    for (const c of CLUSTERS) {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const key = `${bandOf(sc.potentialHML)}-${bandOf(sc.accessRollupHML)}`;
      map.get(key)?.push({ id: c.id, name: c.name });
    }
    return map;
  }, [clusterStates]);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-[16px_1fr] gap-2">
        <div className="flex items-center justify-center">
          <span className="rotate-180 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground [writing-mode:vertical-rl]">
            Potential →
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {QUADRANTS.map((q) => {
            const list = buckets.get(`${q.potential}-${q.access}`) ?? [];
            return (
              <div
                key={q.title}
                className={cn("flex min-h-[140px] flex-col rounded-xl border p-2.5", q.tone)}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider leading-tight text-foreground/70">
                  {q.title}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {list.length === 0 && (
                    <span className="text-[10px] italic text-muted-foreground">—</span>
                  )}
                  {list.map((r) => {
                    const me = r.id === highlightId;
                    return (
                      <span
                        key={r.id}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] leading-snug",
                          me
                            ? "border-critical bg-critical text-critical-foreground font-semibold shadow-sm"
                            : "border-border bg-background/80 text-foreground",
                        )}
                      >
                        {r.name}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <p className="pl-5 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Access →
      </p>
    </div>
  );
}
