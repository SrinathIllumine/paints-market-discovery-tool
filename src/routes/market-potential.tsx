import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { QuadrantSnapshot } from "@/components/app/QuadrantSnapshot";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
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

function ClusterMapPage() {
  const navigate = useNavigate();
  const clusterStates = useAppStore((s) => s.clusters);

  const scored = useMemo(() => {
    return CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      return { c, sc };
    }).sort((a, b) => {
      // Sort by potential desc, then access desc.
      if (b.sc.potentialScore !== a.sc.potentialScore) return b.sc.potentialScore - a.sc.potentialScore;
      return b.sc.accessRollupScore - a.sc.accessRollupScore;
    });
  }, [clusterStates]);

  // Top High-Potential · High-Access clusters get the Recommended tag.
  const recommendedIds = useMemo(() => {
    return new Set(
      scored
        .filter(({ sc }) => sc.potentialScore >= 5 && sc.accessRollupScore >= 5)
        .slice(0, 5)
        .map(({ c }) => c.id),
    );
  }, [scored]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="My Cluster Map"
          title="Analyze Market Potential"
          subtitle="Snapshot driven by backend cluster intelligence."
          backTo="/map"
        />
      }
    >
      <div className="space-y-8 px-6 py-8">
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
            <h2 className="font-display text-xl">All Clusters by Score</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Sorted by potential, then access. Tap a cluster to open its card.
            </p>
          </div>
          <div className="space-y-2">
            {scored.map(({ c, sc }) => (
              <button
                key={c.id}
                type="button"
                onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
                className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold">{c.name}</p>
                    {recommendedIds.has(c.id) && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-800">
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    <ScoreChip label="Revenue" score={sc.revenue} />
                    <ScoreChip label="Competitive" score={sc.competitive} />
                    <ScoreChip label="Access" score={sc.access} />
                    <ScoreChip label="Ease" score={sc.ease} />
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function ScoreChip({ label, score }: { label: string; score: number }) {
  const hi = score >= 6;
  const cls = hi ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        cls,
      )}
    >
      {label}: {score}/10
    </span>
  );
}
