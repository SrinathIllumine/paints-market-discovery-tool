// Per-DG rollups for ASM Analytics. Reuses getClusterEngagement (each DG's
// own area is just another GeoRef) rather than duplicating any scoring
// logic. `PLANS_PER_DG` overrides the totalDgs baseline that formula
// normally derives from estimateAsmCount — that default is tuned for
// hundreds-of-DGs Leadership scopes, and would round every cluster's plan
// count down to 0 or 1 at a single DG's real scale (4 DGs total in this
// territory), so we supply a realistic "plans one DG logs across a period,
// spread over 20 clusters" pool instead.
import { PANVEL_CLUSTER_DGS, getArea } from "@/data/geography";
import type { QuadrantKey } from "@/lib/clusterGenerator";
import { type ClusterEngagementRow, getClusterEngagementRows } from "@/lib/dgPerformance";

const PLANS_PER_DG = 40;

export type DgSummaryRow = {
  dgId: string;
  dgName: string;
  areaName: string;
  totalPlans: number;
  totalExecuted: number;
  avgExecutionPct: number;
  onTrackCount: number;
  behindCount: number;
  topCluster: string;
  onTrack: boolean;
};

function getDgClusterRows(areaId: string): ClusterEngagementRow[] {
  return getClusterEngagementRows({ level: "area", id: areaId }, PLANS_PER_DG);
}

export function getDgSummaryRows(): DgSummaryRow[] {
  return PANVEL_CLUSTER_DGS.map((dg) => {
    const rows = getDgClusterRows(dg.areaId);
    const totalPlans = rows.reduce((s, r) => s + r.plans, 0);
    const totalExecuted = rows.reduce((s, r) => s + r.executed, 0);
    const avgExecutionPct = totalPlans > 0 ? Math.round((totalExecuted / totalPlans) * 10000) / 100 : 0;
    const onTrackCount = rows.filter((r) => r.onTrack).length;
    const behindCount = rows.length - onTrackCount;
    return {
      dgId: dg.id,
      dgName: dg.name,
      areaName: getArea(dg.areaId)?.name ?? dg.areaId,
      totalPlans,
      totalExecuted,
      avgExecutionPct,
      onTrackCount,
      behindCount,
      topCluster: rows[0]?.name ?? "-",
      onTrack: avgExecutionPct >= 40,
    };
  });
}

export type TerritoryClusterRow = {
  clusterId: string;
  name: string;
  quadrant: QuadrantKey;
  plans: number;
  executed: number;
  pct: number;
  onTrack: boolean;
};

/**
 * Territory-wide cluster table: the literal sum of all 4 DGs' own
 * per-cluster rows, so it can never disagree with the DG comparison table
 * shown above it on the same page.
 */
export function getTerritoryClusterRows(): TerritoryClusterRow[] {
  const byCluster = new Map<string, { name: string; quadrant: QuadrantKey; plans: number; executed: number }>();
  for (const dg of PANVEL_CLUSTER_DGS) {
    for (const r of getDgClusterRows(dg.areaId)) {
      const cur = byCluster.get(r.clusterId) ?? { name: r.name, quadrant: r.quadrant, plans: 0, executed: 0 };
      cur.plans += r.plans;
      cur.executed += r.executed;
      byCluster.set(r.clusterId, cur);
    }
  }
  return Array.from(byCluster.entries())
    .map(([clusterId, v]) => {
      const pct = v.plans > 0 ? Math.round((v.executed / v.plans) * 10000) / 100 : 0;
      return { clusterId, name: v.name, quadrant: v.quadrant, plans: v.plans, executed: v.executed, pct, onTrack: pct >= 40 };
    })
    .sort((a, b) => b.plans - a.plans);
}
