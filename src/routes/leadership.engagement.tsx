import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { X } from "lucide-react";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
import {
  QUADRANT_COLOR,
  QUADRANT_TITLE,
  QUADRANT_TYPE_LABEL,
  type QuadrantKey,
  getAsmsForQuadrant,
  getClusterQuadrant,
} from "@/lib/leadershipAnalytics";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership/engagement")({
  head: () => ({
    meta: [
      { title: "Engagement Focus — Leadership Analytics" },
      { name: "description", content: "Types of clusters selected by DGs for market engagement." },
    ],
  }),
  component: EngagementFocusPage,
});

function EngagementFocusPage() {
  const [selectedQuadrant, setSelectedQuadrant] = useState<QuadrantKey | null>(null);

  const rows = CLUSTERS.map((c) => {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const quadrant = getClusterQuadrant(c.id, c.prospectCountEstimate);
    // Focus weight proxy: how much ground-level activity (contractors + retailers) exists in the cluster.
    const weight = intel.contractorCount + intel.retailerCount;
    return { id: c.id, name: c.name, quadrant, weight };
  });

  const totalWeight = rows.reduce((s, r) => s + r.weight, 0) || 1;
  const quadrantShare: Record<QuadrantKey, number> = { HH: 0, HL: 0, LH: 0, LL: 0 };
  for (const r of rows) quadrantShare[r.quadrant] += r.weight;

  const topRows = [...rows]
    .map((r) => ({ ...r, pctDGs: Math.round((r.weight / totalWeight) * 100) }))
    .sort((a, b) => b.pctDGs - a.pctDGs)
    .slice(0, 10);

  const lowLowPct = Math.round((quadrantShare.LL / totalWeight) * 100);
  const topRow = topRows[0];

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Cluster Engagement Focus</h1>
        <p className="mt-1 text-sm text-muted-foreground">Types of clusters selected by DGs for market engagement.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold text-foreground">Share of DGs by cluster type</h2>
        <p className="text-xs text-muted-foreground">Click a segment to see the ASMs behind it.</p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {(Object.keys(QUADRANT_TITLE) as QuadrantKey[]).map((key) => {
            const pct = Math.round((quadrantShare[key] / totalWeight) * 100);
            const active = selectedQuadrant === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedQuadrant(active ? null : key)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 text-left transition-colors",
                  active ? "border-navy bg-navy/5" : "border-border hover:bg-muted/40",
                )}
              >
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: QUADRANT_COLOR[key] }} />
                <span className="min-w-0 flex-1 text-xs font-medium text-foreground">{QUADRANT_TITLE[key]}</span>
                <span className="text-sm font-bold tabular-nums text-foreground">{pct}%</span>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Insight: More than {lowLowPct}% of DGs are targeting low potential, low access clusters.
        </p>

        {selectedQuadrant && (
          <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-sm font-bold text-foreground">
                ASMs targeting {QUADRANT_TITLE[selectedQuadrant]}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedQuadrant(null)}
                aria-label="Close"
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-1.5">ASM Name</th>
                  <th className="py-1.5">Market Area</th>
                  <th className="py-1.5 text-right">No. of DGs</th>
                </tr>
              </thead>
              <tbody>
                {getAsmsForQuadrant(selectedQuadrant).map((asm) => (
                  <tr key={asm.name} className="border-t border-border/60">
                    <td className="py-1.5 font-medium text-foreground">{asm.name}</td>
                    <td className="py-1.5 text-xs text-muted-foreground">{asm.area}</td>
                    <td className="py-1.5 text-right tabular-nums">{asm.dgCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
                <th className="px-4 py-2">Type</th>
                <th className="px-4 py-2 text-right">% DGs</th>
              </tr>
            </thead>
            <tbody>
              {topRows.map((r, i) => (
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
                  <td className="px-4 py-2 text-xs text-muted-foreground">{QUADRANT_TYPE_LABEL[r.quadrant]}</td>
                  <td className="px-4 py-2 text-right font-semibold tabular-nums">{r.pctDGs}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {topRow && (
          <p className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Insight: {topRow.pctDGs}% of DGs are focusing on {QUADRANT_TYPE_LABEL[topRow.quadrant].toLowerCase()}{" "}
            clusters. Needs re-prioritising.
          </p>
        )}
      </div>
    </LeadershipLayout>
  );
}
