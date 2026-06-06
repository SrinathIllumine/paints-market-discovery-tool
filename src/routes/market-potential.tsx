import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { QuadrantSnapshot } from "@/components/app/QuadrantSnapshot";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";
import { ChevronRight, Search } from "lucide-react";

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
  const [search, setSearch] = useState("");

  const scored = useMemo(() => {
    return CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      return { c, sc };
    }).sort((a, b) => {
      if (b.sc.potentialScore !== a.sc.potentialScore) return b.sc.potentialScore - a.sc.potentialScore;
      return b.sc.accessRollupScore - a.sc.accessRollupScore;
    });
  }, [clusterStates]);

  const recommendedIds = useMemo(() => {
    return new Set(
      scored
        .filter(({ sc }) => sc.potentialScore >= 5 && sc.accessRollupScore >= 5)
        .slice(0, 5)
        .map(({ c }) => c.id),
    );
  }, [scored]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return scored;
    return scored.filter(({ c }) => c.name.toLowerCase().includes(q));
  }, [scored, search]);

  const recommended = filtered.filter(({ c }) => recommendedIds.has(c.id));
  const others = filtered.filter(({ c }) => !recommendedIds.has(c.id));

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
              Recommended first, then others — sorted by potential and access.
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clusters…"
              className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm"
            />
          </div>

          {recommended.length > 0 && (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                Recommended for You
              </p>
              <div className="space-y-2">
                {recommended.map(({ c, sc }) => (
                  <ClusterRow
                    key={c.id}
                    name={c.name}
                    recommended
                    scores={sc}
                    onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
                  />
                ))}
              </div>
            </div>
          )}

          {others.length > 0 && (
            <div>
              <p className="mb-2 mt-4 text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                All Other Clusters
              </p>
              <div className="space-y-2">
                {others.map(({ c, sc }) => (
                  <ClusterRow
                    key={c.id}
                    name={c.name}
                    scores={sc}
                    onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
                  />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground">No clusters match "{search}".</p>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function ClusterRow({
  name, recommended, scores, onClick,
}: {
  name: string;
  recommended?: boolean;
  scores: { revenue: number; competitive: number; access: number; ease: number };
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{name}</p>
          {recommended && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-800">
              Recommended
            </span>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <ScoreSubCard label="Revenue" score={scores.revenue} />
          <ScoreSubCard label="Competitive" score={scores.competitive} />
          <ScoreSubCard label="Access" score={scores.access} />
          <ScoreSubCard label="Ease" score={scores.ease} />
        </div>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}

function ScoreSubCard({ label, score }: { label: string; score: number }) {
  const hi = score >= 6;
  const tone = hi ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50";
  const textTone = hi ? "text-green-800" : "text-red-800";
  return (
    <div className={cn("rounded-md border px-2 py-1.5", tone)}>
      <p className={cn("text-[9px] font-semibold uppercase tracking-wider", textTone)}>{label}</p>
      <p className={cn("text-xs font-bold", textTone)}>{score}/10</p>
    </div>
  );
}
