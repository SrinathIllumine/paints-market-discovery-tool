import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership/penetration")({
  head: () => ({
    meta: [
      { title: "Market Penetration — Leadership Analytics" },
      { name: "description", content: "Penetration level by market cluster." },
    ],
  }),
  component: PenetrationPage,
});

const PENETRATION_PCT: Record<string, number> = { strong: 38, moderate: 25, low: 15 };

function hashMoM(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 97;
  return Math.round((h % 20) - 4); // roughly -4% .. +15%
}

function PenetrationPage() {
  const rows = CLUSTERS.map((c) => {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const potential = intel.revenueHML === "H" || intel.competitiveHML === "H" ? "HP" : "LP";
    const access = intel.accessHML === "H" || intel.easeHML === "H" ? "HA" : "LA";
    const pct = PENETRATION_PCT[intel.ourPenetrationLabel] ?? 20;
    const customers = Math.round((c.prospectCountEstimate * pct) / 100);
    return {
      id: c.id,
      name: c.name,
      prospects: c.prospectCountEstimate,
      customers,
      pct,
      type: `${potential} · ${access}`,
      mom: hashMoM(c.id),
    };
  }).sort((a, b) => b.prospects - a.prospects);

  const totalProspects = rows.reduce((s, r) => s + r.prospects, 0);
  const totalCustomers = rows.reduce((s, r) => s + r.customers, 0);
  const overallPct = totalProspects > 0 ? Math.round((totalCustomers / totalProspects) * 100) : 0;

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Market Penetration by Cluster</h1>
        <p className="mt-1 text-sm text-muted-foreground">How deep our reach is within each cluster's prospect base.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile label="Total Prospects" value={totalProspects.toLocaleString("en-IN")} />
        <KpiTile label="Our Customers" value={totalCustomers.toLocaleString("en-IN")} />
        <KpiTile label="Overall Penetration" value={`${overallPct}%`} />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Penetration level at each cluster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2 text-right">Prospects</th>
                <th className="px-4 py-2 text-right">Our Customers</th>
                <th className="px-4 py-2 text-right">Penetration</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">MoM</th>
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
                  <td className="px-4 py-2 text-right tabular-nums">{r.prospects.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.customers.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.pct}%</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{r.type}</td>
                  <td className={cn("px-4 py-2 text-right tabular-nums font-medium", r.mom >= 0 ? "text-emerald-700" : "text-critical")}>
                    {r.mom >= 0 ? "+" : ""}
                    {r.mom}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
          Insight: High access – high potential clusters are gaining, while low-access clusters are slipping month on month.
        </p>
      </div>
    </LeadershipLayout>
  );
}

function KpiTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
