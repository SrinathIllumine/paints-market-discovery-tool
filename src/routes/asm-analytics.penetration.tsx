import { createFileRoute } from "@tanstack/react-router";
import { AsmAreaFilter, AsmLayout } from "@/components/asm/AsmLayout";
import { QuadrantTypeBadge } from "@/components/leadership/LeadershipLayout";
import { ASM_OVERALL_PENETRATION_PCT } from "@/lib/asmPerformance";
import { getPenetrationRows } from "@/lib/dgPerformance";
import { useAsmGeo, useAsmScopeLabel } from "@/store/asmStore";
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
  const scopeLabel = useAsmScopeLabel();
  const rows = getPenetrationRows(geo).sort((a, b) => b.prospects - a.prospects);

  const totalProspects = rows.reduce((s, r) => s + r.prospects, 0);
  const totalCustomers = rows.reduce((s, r) => s + r.customers, 0);
  const overallPct = ASM_OVERALL_PENETRATION_PCT;

  const slippingNames = rows
    .filter((r) => r.mom < 0)
    .slice(0, 2)
    .map((r) => r.name);

  return (
    <AsmLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Market Penetration by Cluster: {scopeLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">How deep we've penetrated each cluster this month.</p>
        </div>
        <AsmAreaFilter />
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
                <tr key={r.clusterId} className="border-t border-border">
                  <td className="px-4 py-2 tabular-nums text-muted-foreground">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-foreground">{r.name}</td>
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
