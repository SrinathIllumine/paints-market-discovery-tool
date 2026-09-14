// Per-DG rollups for ASM Analytics, built around a hard real-world
// constraint: a DG can carry an active engagement plan for at most
// MAX_PLANS_PER_DG_PER_MONTH clusters in a given month. Everything here is
// a plan/no-plan and executed/not-executed decision per cluster per DG —
// not an arbitrary large count — so the numbers stay believable at the
// scale of a real 4-DG team instead of exaggerating.
import { CLUSTERS } from "@/data/clusters";
import { type DgInfo, PANVEL_ASM, PANVEL_CLUSTER_DGS, getArea } from "@/data/geography";
import { type QuadrantKey, getClusterScoresForGeo, seededRandom } from "@/lib/clusterGenerator";

export const MAX_PLANS_PER_DG_PER_MONTH = 1;
export const ALL_ASM_AREA_IDS = PANVEL_ASM.areaIds;

export type DgClusterPlan = {
  clusterId: string;
  name: string;
  quadrant: QuadrantKey;
  planned: boolean;
  executed: boolean;
};

/**
 * Which clusters (at most MAX_PLANS_PER_DG_PER_MONTH) this DG has an active
 * engagement plan for this month, and whether each was executed. Candidate
 * clusters are ranked by the same ease/access/competitive "attractiveness"
 * used throughout the app, so DGs still gravitate to easy wins — but a
 * per-DG "diligence" seed means not every DG uses their monthly allocation
 * (some plan nothing at all), which is its own small piece of the negative
 * narrative rather than everyone maxing out uniformly.
 */
export function getDgMonthlyPlans(dg: DgInfo): DgClusterPlan[] {
  const geo = { level: "area" as const, id: dg.areaId };
  const scored = CLUSTERS.map((c) => {
    const scores = getClusterScoresForGeo(c.id, geo);
    const attractiveness = scores.ease * 0.5 + scores.access * 0.3 + scores.competitive * 0.2;
    const pickSeed = seededRandom(`${dg.id}|${c.id}|pick`);
    return { clusterId: c.id, name: c.name, quadrant: scores.quadrant, scores, rank: attractiveness + (pickSeed - 0.5) * 3 };
  }).sort((a, b) => b.rank - a.rank);

  const diligenceSeed = seededRandom(`${dg.id}|diligence`);
  const capThisMonth = diligenceSeed < 0.15 ? 0 : MAX_PLANS_PER_DG_PER_MONTH;
  const chosen = new Set(scored.slice(0, capThisMonth).map((s) => s.clusterId));

  return scored.map((s) => {
    const planned = chosen.has(s.clusterId);
    let executed = false;
    if (planned) {
      const base = 25 + s.scores.ease * 6 - (s.scores.potentialScore >= 6 ? 20 : 0);
      const execSeed = seededRandom(`${dg.id}|${s.clusterId}|execrate`);
      const execRatePct = Math.max(10, Math.min(95, base + (execSeed - 0.5) * 16));
      const roll = seededRandom(`${dg.id}|${s.clusterId}|roll`) * 100;
      executed = roll < execRatePct;
    }
    return { clusterId: s.clusterId, name: s.name, quadrant: s.quadrant, planned, executed };
  });
}

function dgsForAreaIds(areaIds: string[]): DgInfo[] {
  return PANVEL_CLUSTER_DGS.filter((dg) => areaIds.includes(dg.areaId));
}

export type DgSummaryRow = {
  dgId: string;
  dgName: string;
  areaName: string;
  totalPlans: number;
  totalExecuted: number;
  avgExecutionPct: number;
  topCluster: string;
  onTrack: boolean;
};

/** DG comparison rows, scoped to the given areas (defaults to the ASM's whole 4-DG territory). */
export function getDgSummaryRows(areaIds: string[] = ALL_ASM_AREA_IDS): DgSummaryRow[] {
  return dgsForAreaIds(areaIds).map((dg) => {
    const plans = getDgMonthlyPlans(dg).filter((p) => p.planned);
    const totalPlans = plans.length;
    const totalExecuted = plans.filter((p) => p.executed).length;
    const avgExecutionPct = totalPlans > 0 ? Math.round((totalExecuted / totalPlans) * 10000) / 100 : 0;
    return {
      dgId: dg.id,
      dgName: dg.name,
      areaName: getArea(dg.areaId)?.name ?? dg.areaId,
      totalPlans,
      totalExecuted,
      avgExecutionPct,
      topCluster: plans[0]?.name ?? "-",
      onTrack: totalPlans > 0 && avgExecutionPct >= 40,
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
  pctDgs: number; // share of the scoped DGs who planned this cluster this month
};

/**
 * Cluster table scoped to the given areas — the literal sum of those DGs'
 * own monthly plans, so it can never disagree with the DG comparison table
 * shown alongside it. Only clusters with at least one plan appear (a
 * cluster nobody planned isn't part of "what are we engaging on").
 */
export function getTerritoryClusterRows(areaIds: string[] = ALL_ASM_AREA_IDS): TerritoryClusterRow[] {
  const dgs = dgsForAreaIds(areaIds);
  const byCluster = new Map<string, { name: string; quadrant: QuadrantKey; plans: number; executed: number }>();
  for (const dg of dgs) {
    for (const p of getDgMonthlyPlans(dg)) {
      if (!p.planned) continue;
      const cur = byCluster.get(p.clusterId) ?? { name: p.name, quadrant: p.quadrant, plans: 0, executed: 0 };
      cur.plans += 1;
      if (p.executed) cur.executed += 1;
      byCluster.set(p.clusterId, cur);
    }
  }
  const totalDgs = dgs.length || 1;
  return Array.from(byCluster.entries())
    .map(([clusterId, v]) => {
      const pct = v.plans > 0 ? Math.round((v.executed / v.plans) * 10000) / 100 : 0;
      return {
        clusterId,
        name: v.name,
        quadrant: v.quadrant,
        plans: v.plans,
        executed: v.executed,
        pct,
        onTrack: pct >= 40,
        pctDgs: Math.round((v.plans / totalDgs) * 100),
      };
    })
    .sort((a, b) => b.plans - a.plans);
}
