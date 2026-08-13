import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership/engagement")({
  head: () => ({
    meta: [
      { title: "Engagement Focus — Leadership Analytics" },
      { name: "description", content: "Where DGs are spending their time across clusters." },
    ],
  }),
  component: EngagementFocusPage,
});

type QuadrantKey = "HH" | "HL" | "LH" | "LL";
const QUADRANT_LABEL: Record<QuadrantKey, string> = {
  HH: "High Potential – High Access",
  HL: "High Potential – Low Access",
  LH: "Low Potential – High Access",
  LL: "Low Potential – Low Access",
};
const QUADRANT_BAR: Record<QuadrantKey, string> = {
  HH: "bg-emerald-500",
  HL: "bg-amber-500",
  LH: "bg-sky-500",
  LL: "bg-critical",
};

function EngagementFocusPage() {
  const rows = CLUSTERS.map((c) => {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const potential = intel.revenueHML === "H" || intel.competitiveHML === "H" ? "H" : "L";
    const access = intel.accessHML === "H" || intel.easeHML === "H" ? "H" : "L";
    const quadrant = `${potential}${access}` as QuadrantKey;
    // Focus weight proxy: how much ground-level activity (contractors + retailers) exists in the cluster.
    const weight = intel.contractorCount + intel.retailerCount;
    return { id: c.id, name: c.name, quadrant, weight };
  });

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0) || 1;
  const quadrantShare: Record<QuadrantKey, number> = { HH: 0, HL: 0, LH: 0, LL: 0 };
  for (const r of rows) quadrantShare[r.quadrant] += r.weight;

  const topRows = [...rows]
    .map((r) => ({ ...r, pctDGs: Math.round((r.weight / totalWeight) * 100) }))
    .sort((a, b) => b.pctDGs - a.pctDGs)
    .slice(0, 10);

  const lowPotentialShare = quadrantShare.LH + quadrantShare.LL;
  const lowPotentialPct = Math.round((lowPotentialShare / totalWeight) * 100);

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">DG Cluster Engagement Focus</h1>
        <p className="mt-1 text-sm text-muted-foreground">Where DG activity concentrates, relative to cluster priority.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold text-foreground">Share of DG activity by cluster type</h2>
        <div className="mt-3 space-y-2">
          {(Object.keys(QUADRANT_LABEL) as QuadrantKey[]).map((key) => {
            const pct = Math.round((quadrantShare[key] / totalWeight) * 100);
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="w-52 shrink-0 text-xs text-muted-foreground">{QUADRANT_LABEL[key]}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div className={cn("h-full rounded-full", QUADRANT_BAR[key])} style={{ width: `${pct}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{pct}%</span>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Insight: {lowPotentialPct}% of DG activity is concentrated in low-potential clusters — worth re-prioritising.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Top clusters by DG engagement</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">% of DG activity</th>
              </tr>
            </thead>
            <tbody>
              {topRows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    <Link
                      to="/plan/$clusterId"
                      params={{ clusterId: r.id }}
                      className="font-medium text-navy hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{QUADRANT_LABEL[r.quadrant]}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.pctDGs}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LeadershipLayout>
  );
}
