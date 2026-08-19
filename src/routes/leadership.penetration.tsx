import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
import { QUADRANT_TYPE_LABEL, getClusterQuadrant, hashSeed } from "@/lib/leadershipAnalytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership/penetration")({
  head: () => ({
    meta: [
      { title: "Market Penetration by Cluster — Leadership Analytics" },
      { name: "description", content: "Is our market penetration increasing?" },
    ],
  }),
  component: PenetrationPage,
});

const PENETRATION_PCT: Record<string, number> = { strong: 38, moderate: 25, low: 15 };
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May"];

function hashMoM(id: string): number {
  const h = hashSeed(id);
  return Math.round((h % 20) - 4); // roughly -4% .. +15%
}

function buildTrend(id: string, currentPct: number) {
  const h = hashSeed(id);
  return MONTHS.map((m, i) => {
    if (i === MONTHS.length - 1) return { month: m, pct: currentPct };
    const factor = 0.55 + ((h + i * 11) % 40) / 100;
    return { month: m, pct: Math.max(0, Math.round(currentPct * factor)) };
  });
}

function PenetrationPage() {
  const rows = CLUSTERS.map((c) => {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const quadrant = getClusterQuadrant(c.id, c.prospectCountEstimate);
    const pct = PENETRATION_PCT[intel.ourPenetrationLabel] ?? 20;
    const customers = Math.round((c.prospectCountEstimate * pct) / 100);
    return {
      id: c.id,
      name: c.name,
      prospects: c.prospectCountEstimate,
      customers,
      pct,
      type: QUADRANT_TYPE_LABEL[quadrant],
      mom: hashMoM(c.id),
    };
  }).sort((a, b) => b.prospects - a.prospects);

  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");
  const selected = rows.find((r) => r.id === selectedId) ?? rows[0];
  const trend = selected ? buildTrend(selected.id, selected.pct) : [];

  const totalProspects = rows.reduce((s, r) => s + r.prospects, 0);
  const totalCustomers = rows.reduce((s, r) => s + r.customers, 0);
  const overallPct = totalProspects > 0 ? Math.round((totalCustomers / totalProspects) * 100) : 0;

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Market Penetration by Cluster</h1>
        <p className="mt-1 text-sm text-muted-foreground">Click any cluster row to see its month-on-month trend.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile label="Total Prospects" value={totalProspects.toLocaleString("en-IN")} />
        <KpiTile label="Our Customers" value={totalCustomers.toLocaleString("en-IN")} />
        <KpiTile label="Overall Penetration" value={`${overallPct}%`} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Penetration level at each cluster</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Sl. No</th>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2 text-right">Prospects</th>
                <th className="px-4 py-2 text-right">Our Customers</th>
                <th className="px-4 py-2 text-right">Penetration</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">MoM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={cn(
                    "cursor-pointer border-t border-border transition-colors hover:bg-muted/40",
                    selectedId === r.id && "bg-navy/5",
                  )}
                >
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link
                      to="/plan/$clusterId"
                      params={{ clusterId: r.id }}
                      onClick={(e) => e.stopPropagation()}
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

      {selected && (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-base font-bold text-foreground">{selected.name}</h2>
          <p className="text-xs text-muted-foreground">Penetration trend, Jan–May 2026</p>
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, "dataMax + 15"]}
                  tickFormatter={(v) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: number) => [`${v}%`, "Penetration"]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                />
                <Line type="monotone" dataKey="pct" stroke="var(--navy)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Current penetration <span className="font-semibold text-foreground">{selected.pct}%</span>{" "}
            <span className={cn("font-semibold", selected.mom >= 0 ? "text-emerald-700" : "text-critical")}>
              ({selected.mom >= 0 ? "+" : ""}
              {selected.mom}%)
            </span>
          </p>
        </div>
      )}
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
