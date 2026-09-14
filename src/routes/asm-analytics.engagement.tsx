import { createFileRoute, Link } from "@tanstack/react-router";
import { AsmAreaFilter, AsmLayout } from "@/components/asm/AsmLayout";
import { QuadrantTypeBadge } from "@/components/leadership/LeadershipLayout";
import { getTerritoryClusterRows } from "@/lib/asmPerformance";
import { useAsmAreaIds } from "@/store/asmStore";

export const Route = createFileRoute("/asm-analytics/engagement")({
  head: () => ({
    meta: [
      { title: "Engagement Focus — ASM Analytics" },
      { name: "description", content: "Are my DGs focusing on high potential, high access clusters?" },
    ],
  }),
  component: AsmEngagementFocusPage,
});

function AsmEngagementFocusPage() {
  const areaIds = useAsmAreaIds();
  const rows = getTerritoryClusterRows(areaIds).slice(0, 10);
  const topRow = rows[0];

  return (
    <AsmLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Engagement Focus</h1>
          <p className="mt-1 text-sm text-muted-foreground">Are my DGs focusing on high potential, high access clusters?</p>
        </div>
        <AsmAreaFilter />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Clusters selected by my DGs this month</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Sl. No</th>
                <th className="px-4 py-2">Cluster</th>
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">% DGs</th>
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
                  <td className="px-4 py-2">
                    <QuadrantTypeBadge quadrant={r.quadrant} />
                  </td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.pctDgs}%</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">
                    No engagement plans logged this month.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {topRow && (
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Insight: {topRow.pctDgs}% of my DGs are focusing on {topRow.name}
            {" ("}
            {topRow.quadrant === "HH" || topRow.quadrant === "HL" ? "high potential" : "low potential"}
            {")"}.
          </p>
        )}
      </div>
    </AsmLayout>
  );
}
