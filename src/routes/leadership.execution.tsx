import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadershipLayout, LeadershipScopeFilter } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getAllClusterScoresForGeo } from "@/lib/clusterGenerator";
import { getClusterOnTrack, getClusterTargetingShare, getDgExecutionRows, getFunnel } from "@/lib/dgPerformance";
import { QUADRANT_TYPE_LABEL } from "@/lib/leadershipAnalytics";
import { useLeadershipGeo } from "@/store/leadershipStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership/execution")({
  head: () => ({
    meta: [
      { title: "Strategy & Execution — Leadership Analytics" },
      { name: "description", content: "Is the plan on track across the team?" },
    ],
  }),
  component: ExecutionPage,
});

function ExecutionPage() {
  const geo = useLeadershipGeo();
  const allScores = getAllClusterScoresForGeo(geo);

  const rows = CLUSTERS.map((c) => {
    const scores = allScores.find((s) => s.clusterId === c.id)!;
    const targetShare = getClusterTargetingShare(c.id, geo);
    const onTrack = getClusterOnTrack(c.id, geo);
    return { id: c.id, name: c.name, quadrant: scores.quadrant, type: QUADRANT_TYPE_LABEL[scores.quadrant], targetShare, onTrack };
  })
    .sort((a, b) => b.targetShare - a.targetShare)
    .slice(0, 10);

  const onTrackCount = rows.filter((r) => r.onTrack).length;
  const behindCount = rows.length - onTrackCount;
  const behindHighPotentialCount = rows.filter(
    (r) => !r.onTrack && (r.quadrant === "HH" || r.quadrant === "HL"),
  ).length;

  const teamRows = getDgExecutionRows();
  const avgExecution = Math.round(teamRows.reduce((s, r) => s + r.executed, 0) / (teamRows.length || 1));
  const funnel = getFunnel(geo);

  return (
    <LeadershipLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Strategy & Execution Level</h1>
          <p className="mt-1 text-sm text-muted-foreground">Tracking whether the team's plan is converting into action.</p>
        </div>
        <LeadershipScopeFilter />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <KpiTile label="Clusters Targeted" value={String(rows.length)} />
        <KpiTile label="On Track" value={String(onTrackCount)} tone="text-emerald-700" />
        <KpiTile label="Behind Plan" value={String(behindCount)} tone="text-critical" />
        <KpiTile label="Avg. Execution" value={`${avgExecution}%`} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Cluster execution status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Sl. No</th>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">% of DGs Targeting</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link
                      to="/plan/$clusterId"
                      params={{ clusterId: r.id }}
                      className="font-medium text-navy hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{r.type}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.targetShare}%</td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                        r.onTrack ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {r.onTrack ? "On Track" : "Behind"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Insight: {behindCount} of the {rows.length} most targeted clusters are behind plan
          {behindHighPotentialCount > 0 &&
            `, including ${behindHighPotentialCount} high potential ${behindHighPotentialCount === 1 ? "one" : "ones"}`}
          .
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">DG-wise strategy & execution</h2>
          <p className="text-xs text-muted-foreground">Panvel ASM territory (Raigad)</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">DG</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2 text-right">Targeted</th>
                <th className="px-4 py-2 text-right">Right strategy</th>
                <th className="px-4 py-2 text-right">Executed</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {teamRows.map((r) => {
                const wrongStrategy = r.rightStrategy < r.targeted;
                return (
                  <tr key={r.dg} className="border-t border-border">
                    <td className="px-4 py-2 font-medium text-foreground">{r.dg}</td>
                    <td className="px-4 py-2 text-xs text-muted-foreground">{r.area}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.targeted}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.rightStrategy}</td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.executed}%</td>
                    <td className="px-4 py-2 text-right">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                          wrongStrategy ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800",
                        )}
                      >
                        {wrongStrategy ? "Wrong Strategy" : "On Track"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold text-foreground">Sales funnel</h2>
        <p className="text-xs text-muted-foreground">High Potential – High Access clusters</p>
        <div className="mt-3 space-y-2">
          {funnel.map((f) => (
            <div key={f.label} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-xs text-muted-foreground">{f.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-navy" style={{ width: `${f.pct}%` }} />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums">{f.pct}%</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Insight: Only {funnel[funnel.length - 1].pct}% of identified prospects convert — the biggest drop is between
          site visit and quotation.
        </p>
      </div>
    </LeadershipLayout>
  );
}

function KpiTile({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={cn("mt-1 font-display text-2xl font-bold", tone ?? "text-foreground")}>{value}</p>
    </div>
  );
}
