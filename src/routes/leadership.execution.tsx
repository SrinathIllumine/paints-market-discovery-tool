import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
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

function hashPct(id: string, min: number, max: number): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 97;
  return min + (h % (max - min + 1));
}

const TEAM_ROWS = [
  { dg: "Sunil Kumar", area: "Panvel", targeted: 3, rightStrategy: 3, executed: 64 },
  { dg: "Priya Nair", area: "Kharghar", targeted: 2, rightStrategy: 2, executed: 44 },
  { dg: "Anil Deshmukh", area: "Kamothe", targeted: 2, rightStrategy: 1, executed: 50 },
  { dg: "Meera Kulkarni", area: "Taloja", targeted: 1, rightStrategy: 0, executed: 50 },
];

const FUNNEL = [
  { label: "Prospects Identified", pct: 100 },
  { label: "Contacted", pct: 62 },
  { label: "Site Visit / Demo", pct: 34 },
  { label: "Quotation Shared", pct: 18 },
  { label: "Converted", pct: 10 },
];

function ExecutionPage() {
  const rows = CLUSTERS.map((c) => {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const potential = intel.revenueHML === "H" || intel.competitiveHML === "H" ? "HP" : "LP";
    const access = intel.accessHML === "H" || intel.easeHML === "H" ? "HA" : "LA";
    const targetShare = hashPct(c.id, 8, 22);
    const onTrack = hashPct(c.id, 0, 99) >= 30;
    return { id: c.id, name: c.name, type: `${potential} · ${access}`, targetShare, onTrack };
  })
    .sort((a, b) => b.targetShare - a.targetShare)
    .slice(0, 10);

  const onTrackCount = rows.filter((r) => r.onTrack).length;
  const behindCount = rows.length - onTrackCount;
  const avgExecution = Math.round(TEAM_ROWS.reduce((s, r) => s + r.executed, 0) / TEAM_ROWS.length);

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Strategy & Execution Level</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tracking whether the team's plan is converting into action.</p>
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
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">% of DGs targeting</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
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
          Insight: {behindCount} of the {rows.length} most targeted clusters are behind plan.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">DG-wise strategy & execution</h2>
          <p className="text-xs text-muted-foreground">Panvel market area</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">DG</th>
                <th className="px-4 py-2">Area</th>
                <th className="px-4 py-2 text-right">Targeted</th>
                <th className="px-4 py-2 text-right">Right Strategy</th>
                <th className="px-4 py-2 text-right">Executed</th>
                <th className="px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {TEAM_ROWS.map((r) => {
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
          {FUNNEL.map((f) => (
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
          Insight: Only {FUNNEL[FUNNEL.length - 1].pct}% of identified prospects convert — the biggest drop is between
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
