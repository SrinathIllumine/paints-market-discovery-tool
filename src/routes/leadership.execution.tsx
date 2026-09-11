import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadershipLayout, LeadershipScopeFilter } from "@/components/leadership/LeadershipLayout";
import { getClusterEngagementRows } from "@/lib/dgPerformance";
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
  const rows = getClusterEngagementRows(geo).slice(0, 10);

  const onTrackCount = rows.filter((r) => r.onTrack).length;
  const behindCount = rows.length - onTrackCount;
  const behindHighPotentialCount = rows.filter(
    (r) => !r.onTrack && (r.quadrant === "HH" || r.quadrant === "HL"),
  ).length;
  const avgExecution = Math.round(rows.reduce((s, r) => s + r.pct, 0) / (rows.length || 1));

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
        <KpiTile label="Clusters Engaged" value={String(rows.length)} />
        <KpiTile label="On Track" value={String(onTrackCount)} tone="text-emerald-700" />
        <KpiTile label="Behind Plan" value={String(behindCount)} tone="text-critical" />
        <KpiTile label="Avg. Execution" value={`${avgExecution}%`} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Cluster execution status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-[6%] px-4 py-2">Sl. No</th>
                <th className="w-[24%] px-4 py-2">Cluster</th>
                <th className="w-[17%] px-4 py-2">Type</th>
                <th className="w-[14%] px-4 py-2 text-right">No of Engagement Plan</th>
                <th className="w-[14%] px-4 py-2 text-right">No of Executed Plans</th>
                <th className="w-[14%] px-4 py-2 text-right">Percentage Execution</th>
                <th className="w-[11%] px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.clusterId} className="border-t border-border">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link
                      to="/plan/$clusterId"
                      params={{ clusterId: r.clusterId }}
                      className="font-medium text-navy hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{QUADRANT_TYPE_LABEL[r.quadrant]}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.plans}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.executed}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.pct.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={cn(
                        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
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
          Insight: {behindCount} of the {rows.length} most-engaged clusters are behind plan
          {behindHighPotentialCount > 0 &&
            `, including ${behindHighPotentialCount} high potential ${behindHighPotentialCount === 1 ? "one" : "ones"}`}
          .
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
