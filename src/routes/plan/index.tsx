import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";
import { Check } from "lucide-react";

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

  const plannedIds = new Set(focusIds);

  const mappedIds = new Set(
    Object.keys(clusterStates).filter((id) => {
      const s = clusterStates[id];
      return s && s.prospects.length > 0;
    }),
  );

  const toplan = scored.filter(({ c }) => mappedIds.has(c.id) && !plannedIds.has(c.id));
  const planned = scored.filter(({ c }) => mappedIds.has(c.id) && plannedIds.has(c.id));

  // ✅ Marks as planned AND navigates — triggered only by the Generate button
  const handleGenerate = (clusterId: string) => {
    setMonthlyFocus(clusterId);
    navigate({ to: "/plan/$clusterId", params: { clusterId } });
  };

  const handleView = (clusterId: string) => {
    navigate({ to: "/plan/$clusterId", params: { clusterId } });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="STAGE 2 OF 3 · MY ENGAGEMENT PLAN"
          title="Select your Cluster for the Month"
          subtitle="June 2026"
        />
      }
    >
      <div className="space-y-6 px-4 py-6">
        {/* ── Create plan section ── */}
        {toplan.length > 0 && (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              Create market engagement plan
            </p>
            <div className="space-y-2">
              {toplan.map(({ c }) => (
                <div key={c.id} className="flex w-full flex-col gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate} prospects
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleGenerate(c.id)}
                    className="w-full rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-navy-foreground transition-opacity hover:opacity-90"
                  >
                    Generate Monthly Cluster Engagement Plan
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Already planned section ── */}
        {planned.length > 0 && (
          <section className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/50">
              View engagement plan — already planned
            </p>
            <div className="space-y-2">
              {planned.map(({ c }) => (
                <div
                  key={c.id}
                  className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-card p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{c.name}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Last planned · {new Date().toLocaleString("default", { month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleView(c.id)}
                      className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100"
                    >
                      View
                    </button>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Check className="h-4 w-4 text-green-700" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Empty state ── */}
        {toplan.length === 0 && planned.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No clusters mapped yet. Complete Stage 1 to start planning.
          </p>
        )}
      </div>
    </AppShell>
  );
}
