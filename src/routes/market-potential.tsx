import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { QuadrantSnapshot } from "@/components/app/QuadrantSnapshot";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores, type HML } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/market-potential")({
  head: () => ({
    meta: [
      { title: "My Cluster Map" },
      { name: "description", content: "Snapshot of clusters by potential and access." },
    ],
  }),
  component: ClusterMapPage,
});

const BUCKETS: { potential: HML; access: HML; label: string; accent: string }[] = [
  { potential: "H", access: "H", label: "High Potential · High Access", accent: "border-green-300 bg-green-50" },
  { potential: "H", access: "L", label: "High Potential · Low Access", accent: "border-amber-300 bg-amber-50" },
  { potential: "L", access: "H", label: "Low Potential · High Access", accent: "border-sky-300 bg-sky-50" },
  { potential: "L", access: "L", label: "Low Potential · Low Access", accent: "border-border bg-muted/30" },
];

function ClusterMapPage() {
  const navigate = useNavigate();
  const clusterStates = useAppStore((s) => s.clusters);

  const scored = useMemo(() => {
    return CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      return { c, sc };
    }).sort((a, b) => b.sc.aggregate - a.sc.aggregate);
  }, [clusterStates]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="My Cluster Map"
          title="All clusters"
          subtitle="Snapshot driven by backend cluster intelligence."
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
          <div className="mt-3">
            <QuadrantSnapshot />
          </div>
        </section>

        <section className="space-y-3">
          <div>
            <h2 className="font-display text-xl">Cluster Potential by Bucket</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sorted by overall score · grouped by potential × access.
            </p>
          </div>
          {BUCKETS.map((b) => {
            const items = scored.filter(
              ({ sc }) => sc.potentialHML === b.potential && sc.accessRollupHML === b.access,
            );
            if (items.length === 0) return null;
            return (
              <div key={b.label} className={cn("rounded-2xl border p-3 shadow-sm", b.accent)}>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                    {b.label}
                  </p>
                  <span className="text-[10px] text-muted-foreground">({items.length})</span>
                </div>
                <div className="space-y-1.5">
                  {items.map(({ c, sc }) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
                      className="group flex w-full items-center justify-between gap-3 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium">{c.name}</p>
                          <Chip label="Overall" hml={sc.aggregateHML} bold />
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <Chip label="Revenue" hml={sc.revenueHML} />
                          <Chip label="Competitive" hml={sc.competitiveHML} />
                          <Chip label="Access" hml={sc.accessHML} />
                          <Chip label="Ease" hml={sc.easeHML} />
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}

function Chip({ label, hml, bold }: { label: string; hml: HML; bold?: boolean }) {
  const cls = hml === "H" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider",
        cls,
        bold ? "font-bold" : "font-semibold",
      )}
    >
      {label}: {hml === "H" ? "High" : "Low"}
    </span>
  );
}
