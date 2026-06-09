import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/plan/")({
  head: () => ({
    meta: [
      { title: "Monthly Cluster Engagement Plan" },
      { name: "description", content: "Plan your monthly engagement across clusters." },
    ],
  }),
  component: PlanScreen,
});

function PlanScreen() {
  const navigate = useNavigate();
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);
  const clusterStates = useAppStore((s) => s.clusters);
  const [picked, setPicked] = useState<string | null>(focusIds[0] ?? null);
  const [search, setSearch] = useState("");
  const [recOpen, setRecOpen] = useState(true);
  const [othersOpen, setOthersOpen] = useState(false);

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

  const handleContinue = () => {
    if (!picked) return;
    setMonthlyFocus(picked);
    navigate({ to: "/plan/$clusterId", params: { clusterId: picked } });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 2 of 4"
          title="Pick your Cluster for the Month"
          subtitle="June 2026"
        />
      }
    >
      <div className="space-y-6 px-6 py-8">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clusters…"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />

        {recommended.length > 0 && (
          <section className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setRecOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                Recommended for You ({recommended.length})
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", !recOpen && "-rotate-90")} />
            </button>
            {recOpen && (
              <div className="space-y-2 border-t border-border p-2">
                {recommended.map(({ c, sc }) => (
                  <ClusterRow
                    key={c.id}
                    name={c.name}
                    active={picked === c.id}
                    recommended
                    scores={sc}
                    onClick={() => setPicked(c.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {others.length > 0 && (
          <section className="rounded-xl border border-border bg-card">
            <button
              type="button"
              onClick={() => setOthersOpen((v) => !v)}
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
                All Other Clusters ({others.length})
              </span>
              <ChevronDown className={cn("h-4 w-4 transition-transform", !othersOpen && "-rotate-90")} />
            </button>
            {othersOpen && (
              <div className="space-y-2 border-t border-border p-2">
                {others.map(({ c, sc }) => (
                  <ClusterRow
                    key={c.id}
                    name={c.name}
                    active={picked === c.id}
                    scores={sc}
                    onClick={() => setPicked(c.id)}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground">No clusters match "{search}".</p>
        )}

        <Button
          onClick={handleContinue}
          disabled={!picked}
          className={cn(
            "h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90",
            !picked && "opacity-60",
          )}
        >
          Continue to Planning <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </AppShell>
  );
}

function ClusterRow({
  name, active, recommended, scores, onClick,
}: {
  name: string;
  active: boolean;
  recommended?: boolean;
  scores: { revenue: number; competitive: number; access: number; ease: number };
  onClick: () => void;
}) {
  const navigate = useNavigate();
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);
  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
        active ? "border-critical bg-critical/5" : "border-border bg-card hover:bg-muted/40",
      )}
    >
      <button type="button" onClick={onClick} className="min-w-0 flex-1 text-left">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold">{name}</p>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1">
          <ScoreChip label="Revenue" score={scores.revenue} />
          <ScoreChip label="Competitive" score={scores.competitive} />
          <ScoreChip label="Access" score={scores.access} />
          <ScoreChip label="Ease" score={scores.ease} />
        </div>
      </button>
      {active && (
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            // Find cluster id via name lookup is fragile; use onClick already set id.
            // We rely on the parent having set picked; navigate using name->id map.
            const cluster = CLUSTERS.find((c) => c.name === name);
            if (cluster) {
              setMonthlyFocus(cluster.id);
              navigate({ to: "/plan/$clusterId", params: { clusterId: cluster.id } });
            }
          }}
          className="shrink-0 gap-1 bg-navy text-navy-foreground hover:bg-navy/90"
        >
          Plan <ChevronRight className="h-4 w-4" />
        </Button>
      )}
      <div className={cn(
        "h-5 w-5 shrink-0 rounded-full border-2",
        active ? "border-critical bg-critical" : "border-border",
      )} />
    </div>
  );
}

function ScoreChip({ label, score }: { label: string; score: number }) {
  const hi = score >= 6;
  const cls = hi ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800";
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cls)}>
      {label}: {score}/10
    </span>
  );
}
