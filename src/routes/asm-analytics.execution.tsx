import { createFileRoute, Link } from "@tanstack/react-router";
import { AsmAreaFilter, AsmLayout } from "@/components/asm/AsmLayout";
import { MAX_CLUSTERS_PER_DG_PER_MONTH, getDgSummaryRows } from "@/lib/asmPerformance";
import { useAsmAreaIds, useAsmScopeLabel } from "@/store/asmStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/asm-analytics/execution")({
  head: () => ({
    meta: [
      { title: "Strategy & Execution — ASM Analytics" },
      { name: "description", content: "Are we engaging enough with the markets and executing our strategies?" },
    ],
  }),
  component: AsmExecutionPage,
});

function AsmExecutionPage() {
  const areaIds = useAsmAreaIds();
  const scopeLabel = useAsmScopeLabel();
  const dgRows = getDgSummaryRows(areaIds);

  const onTrackDgs = dgRows.filter((d) => d.onTrack).length;
  const behindDgs = dgRows.length - onTrackDgs;
  const avgExecution =
    dgRows.length > 0 ? Math.round(dgRows.reduce((s, d) => s + d.avgExecutionPct, 0) / dgRows.length) : 0;

  return (
    <AsmLayout>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Strategy & Execution Level: {scopeLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tracking whether my DGs' plans are converting into action. Max {MAX_CLUSTERS_PER_DG_PER_MONTH} active
            {MAX_CLUSTERS_PER_DG_PER_MONTH === 1 ? " cluster" : " clusters"} per DG per month.
          </p>
        </div>
        <AsmAreaFilter />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <KpiTile label="DGs" value={String(dgRows.length)} />
        <KpiTile label="On Track" value={String(onTrackDgs)} tone="text-emerald-700" />
        <KpiTile label="Behind Plan" value={String(behindDgs)} tone="text-critical" />
        <KpiTile label="Avg. Execution" value={`${avgExecution}%`} />
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-4 py-3">
          <h2 className="font-display text-base font-bold text-foreground">DG Performance</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-left text-sm">
            <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="w-[18%] px-4 py-2">DG</th>
                <th className="w-[14%] px-4 py-2">Area</th>
                <th className="w-[13%] px-4 py-2 text-right">Plans</th>
                <th className="w-[13%] px-4 py-2 text-right">Executed</th>
                <th className="w-[14%] px-4 py-2 text-right">Execution %</th>
                <th className="w-[17%] px-4 py-2">Target Cluster</th>
                <th className="w-[11%] px-4 py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {dgRows.map((d) => (
                <tr key={d.dgId} className="border-t border-border">
                  <td className="px-4 py-2 font-medium text-foreground">
                    {d.targetClusterId ? (
                      <Link
                        to="/asm-analytics/plan/$clusterId"
                        params={{ clusterId: d.targetClusterId }}
                        className="text-navy hover:underline"
                      >
                        {d.dgName}
                      </Link>
                    ) : (
                      d.dgName
                    )}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{d.areaName}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{d.totalPlans}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{d.totalExecuted}</td>
                  <td className="px-4 py-2 text-right tabular-nums">{d.avgExecutionPct.toFixed(2)}%</td>
                  <td className="px-4 py-2 text-xs text-muted-foreground">{d.targetCluster}</td>
                  <td className="px-4 py-2 text-right">
                    <span
                      className={cn(
                        "inline-block whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold",
                        d.onTrack ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800",
                      )}
                    >
                      {d.onTrack ? "On Track" : "Behind"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AsmLayout>
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
