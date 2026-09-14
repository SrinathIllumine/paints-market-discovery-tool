import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AsmAreaFilter, AsmLayout } from "@/components/asm/AsmLayout";
import { QuadrantTypeBadge } from "@/components/leadership/LeadershipLayout";
import { ASM_OVERALL_PENETRATION_PCT, buildAsmOverallPenetrationTrend } from "@/lib/asmPerformance";
import { buildPenetrationTrend, getPenetrationRows } from "@/lib/dgPerformance";
import { useAsmGeo } from "@/store/asmStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/asm-analytics/penetration")({
  head: () => ({
    meta: [
      { title: "Market Penetration — ASM Analytics" },
      { name: "description", content: "Is my territory's market penetration increasing?" },
    ],
  }),
  component: AsmPenetrationPage,
});

function AsmPenetrationPage() {
  const geo = useAsmGeo();
  const rows = getPenetrationRows(geo).sort((a, b) => b.prospects - a.prospects);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? rows.find((r) => r.clusterId === selectedId) : undefined;

  const totalProspects = rows.reduce((s, r) => s + r.prospects, 0);
  const totalCustomers = rows.reduce((s, r) => s + r.customers, 0);
  const overallPct = ASM_OVERALL_PENETRATION_PCT;

  const trend = selected
    ? buildPenetrationTrend(selected.clusterId, geo, selected.pct, selected.mom)
    : buildAsmOverallPenetrationTrend();
  const chartTitle = selected ? selected.name : "Overall Penetration";
  const chartPct = selected ? selected.pct : overallPct;
  const chartMom = selected ? selected.mom : trend[trend.length - 1].pct - trend[trend.length - 2].pct;

  const slippingNames = rows
    .filter((r) => r.mom < 0)
    .slice(0, 2)
    .map((r) => r.name);

  const toggleRow = (clusterId: string) => setSelectedId((cur) => (cur === clusterId ? null : clusterId));

  return (
    <AsmLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Market Penetration by Cluster</h1>
          <p className="mt-1 text-sm text-muted-foreground">Click any cluster row to see its month-on-month trend.</p>
        </div>
        <AsmAreaFilter />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile label="Total Prospects" value={totalProspects.toLocaleString("en-IN")} />
        <KpiTile label="Our Customers" value={totalCustomers.toLocaleString("en-IN")} />
        <KpiTile label="Overall Penetration" value={`${overallPct}%`} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-base font-bold text-foreground">{chartTitle}</h2>
          <span className="text-xs text-muted-foreground">Penetration trend, Jan–May 2026</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {selected
            ? "Showing the selected cluster's trend below."
            : "Aggregated across your territory — select a row below to drill into one."}
        </p>
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
          Current penetration <span className="font-semibold text-foreground">{chartPct}%</span>{" "}
          <span className={cn("font-semibold", chartMom >= 0 ? "text-emerald-700" : "text-critical")}>
            ({chartMom >= 0 ? "+" : ""}
            {chartMom}%)
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
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
                  key={r.clusterId}
                  onClick={() => toggleRow(r.clusterId)}
                  className={cn(
                    "cursor-pointer border-t border-border transition-colors hover:bg-muted/40",
                    selectedId === r.clusterId && "bg-navy/5",
                  )}
                >
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2">
                    <Link
                      to="/plan/$clusterId"
                      params={{ clusterId: r.clusterId }}
                      onClick={(e) => e.stopPropagation()}
                      className="font-medium text-navy hover:underline"
                    >
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.prospects.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{r.customers.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.pct}%</td>
                  <td className="px-4 py-2">
                    <QuadrantTypeBadge quadrant={r.quadrant} />
                  </td>
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
          Insight: High access – high potential clusters are gaining, while{" "}
          {slippingNames.length > 0 ? slippingNames.join(" and ").toLowerCase() : "some low-access clusters"} are
          slipping month on month.
        </p>
      </div>
    </AsmLayout>
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
