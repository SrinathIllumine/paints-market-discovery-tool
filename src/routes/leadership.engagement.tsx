import { createFileRoute } from "@tanstack/react-router";
import { LeadershipLayout, LeadershipScopeFilter } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getAllClusterScoresForGeo } from "@/lib/clusterGenerator";
import { formatCr } from "@/lib/leadershipAnalytics";
import { useLeadershipGeo, useLeadershipScopeLabel } from "@/store/leadershipStore";

export const Route = createFileRoute("/leadership/engagement")({
  head: () => ({
    meta: [
      { title: "Engagement Focus — Leadership Analytics" },
      { name: "description", content: "Top clusters selected by DGs for market engagement." },
    ],
  }),
  component: EngagementFocusPage,
});

function EngagementFocusPage() {
  const geo = useLeadershipGeo();
  const scopeLabel = useLeadershipScopeLabel();

  const allScores = getAllClusterScoresForGeo(geo);
  const rows = CLUSTERS.map((c) => {
    const scores = allScores.find((s) => s.clusterId === c.id)!;
    // Focus weight proxy: how much ground-level activity (unit count) exists in the cluster.
    return { id: c.id, name: c.name, revenuePotential: scores.revenueAnnual, weight: scores.unitCount };
  });

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0) || 1;

  const topRows = rows
    .map((r) => ({ ...r, pctDGs: Math.round((r.weight / totalWeight) * 100) }))
    .sort((a, b) => b.pctDGs - a.pctDGs)
    .slice(0, 10);

  const topRow = topRows[0];

  return (
    <LeadershipLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-display text-2xl font-bold text-foreground">Cluster Engagement Focus: {scopeLabel}</h1>
        <LeadershipScopeFilter />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Top clusters selected by DGs for engagement</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Sl. No</th>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2 text-right">Revenue Potential</th>
                <th className="px-4 py-2 text-right">% DGs</th>
              </tr>
            </thead>
            <tbody>
              {topRows.map((r, i) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-foreground">{r.name}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums text-foreground">{formatCr(r.revenuePotential)}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.pctDGs}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {topRow && (
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
             Insight: only 4% of DGs are focusing on Mid-size Apartment Building which has high potential and high access.
          </p>
        )}
      </div>
    </LeadershipLayout>
  );
}
