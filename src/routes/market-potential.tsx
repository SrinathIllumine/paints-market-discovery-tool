import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { computeClusterScores, HML_LABEL, type HML } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-potential")({
  head: () => ({
    meta: [
      { title: "My Cluster Map" },
      { name: "description", content: "Snapshot and ranking of clusters." },
    ],
  }),
  component: ClusterMapPage,
});

type Row = {
  clusterId: string;
  name: string;
  scores: ReturnType<typeof computeClusterScores>;
};

// Reduce H/M/L to a 2-band axis for the 2x2 grid.
type Band = "H" | "L";
const bandOf = (h: HML): Band => (h === "H" ? "H" : "L");

const QUADRANTS: { potential: Band; access: Band; title: string; tone: string; recommended?: boolean }[] = [
  { potential: "H", access: "H", title: "High Potential · High Access", tone: "border-green-300 bg-green-50",   recommended: true },
  { potential: "H", access: "L", title: "High Potential · Lower Access", tone: "border-amber-300 bg-amber-50" },
  { potential: "L", access: "H", title: "Lower Potential · High Access", tone: "border-blue-300 bg-blue-50" },
  { potential: "L", access: "L", title: "Lower Potential · Lower Access", tone: "border-border bg-muted/40" },
];

function ClusterMapPage() {
  const clusterStates = useAppStore((s) => s.clusters);

  const rows: Row[] = useMemo(() => {
    return CLUSTERS.map((c) => {
      const prospectCount = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const scores = computeClusterScores(c, prospectCount);
      return { clusterId: c.id, name: c.name, scores };
    }).sort((a, b) => b.scores.aggregate - a.scores.aggregate);
  }, [clusterStates]);

  const buckets = useMemo(() => {
    const map = new Map<string, Row[]>();
    for (const q of QUADRANTS) map.set(`${q.potential}-${q.access}`, []);
    for (const r of rows) {
      const key = `${bandOf(r.scores.potentialHML)}-${bandOf(r.scores.accessRollupHML)}`;
      map.get(key)?.push(r);
    }
    return map;
  }, [rows]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="My Cluster Map"
          title="All clusters"
          subtitle="Snapshot and ranking driven by backend cluster intelligence."
          backTo="/map"
        />
      }
    >
      <div className="space-y-6 px-5 py-5">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-xl">Cluster Snapshot</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each cluster placed by Revenue Potential vs Cluster Access.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {QUADRANTS.map((q) => {
              const list = buckets.get(`${q.potential}-${q.access}`) ?? [];
              return (
                <div
                  key={q.title}
                  className={cn("flex min-h-[120px] flex-col rounded-xl border p-2.5", q.tone)}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-foreground/70 leading-tight">
                    {q.title}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {list.length === 0 && (
                      <span className="text-[10px] italic text-muted-foreground">—</span>
                    )}
                    {list.map((r) => (
                      <span
                        key={r.clusterId}
                        className="rounded-full border border-border bg-background/80 px-2 py-0.5 text-[10px] leading-snug text-foreground"
                      >
                        {r.name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="space-y-2">
          <h2 className="font-display text-xl px-1">Cluster Potential (ranked)</h2>
          {rows.map((r, i) => (
            <div key={r.clusterId} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Rank #{i + 1}
                  </p>
                  <p className="mt-0.5 font-display text-lg leading-tight">{r.name}</p>
                </div>
                <HMLBadge hml={r.scores.aggregateHML} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <HMLTile label="Revenue" hml={r.scores.revenueHML} />
                <HMLTile label="Competitive" hml={r.scores.competitiveHML} />
                <HMLTile label="Access" hml={r.scores.accessHML} />
                <HMLTile label="Ease of Sale" hml={r.scores.easeHML} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function HMLBadge({ hml }: { hml: HML }) {
  const cls =
    hml === "H" ? "bg-green-100 text-green-800"
    : hml === "M" ? "bg-orange-100 text-orange-800"
    : "bg-red-100 text-red-800";
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", cls)}>
      {HML_LABEL[hml]}
    </span>
  );
}

function HMLTile({ label, hml }: { label: string; hml: HML }) {
  const cls =
    hml === "H" ? "border-green-300 bg-green-50 text-green-800"
    : hml === "M" ? "border-orange-300 bg-orange-50 text-orange-800"
    : "border-red-300 bg-red-50 text-red-800";
  return (
    <div className={cn("rounded-xl border p-2 text-center", cls)}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-sm leading-tight">{HML_LABEL[hml]}</p>
    </div>
  );
}
