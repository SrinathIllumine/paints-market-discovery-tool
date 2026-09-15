// Per-DG rollups for ASM Analytics, built around a real-world constraint: a
// DG can TARGET at most MAX_CLUSTERS_PER_DG_PER_MONTH cluster in a given
// month (not more) — but for that one targeted cluster, they can log
// several engagement plans (2-3) over the month, not just one. So the cap
// is on cluster count, not on the "No of Engagement Plan" number itself.
import { CLUSTERS } from "@/data/clusters";
import { type DgInfo, PANVEL_ASM, PANVEL_CLUSTER_DGS, getArea } from "@/data/geography";
import { type QuadrantKey, getClusterScoresForGeo, seededRandom } from "@/lib/clusterGenerator";

export const MAX_CLUSTERS_PER_DG_PER_MONTH = 1;
export const ALL_ASM_AREA_IDS = PANVEL_ASM.areaIds;

/**
 * Scripted plan/execution outcome for each DG's one targeted cluster this
 * month — a deliberate spread (one fully on track, two stalling mid-way,
 * one fully behind) for the ASM demo narrative, rather than letting the
 * seeded execution-rate formula land wherever it happens to. Which cluster
 * each DG targets is still picked by the real ease/access/competitive
 * ranking below — only the plan count and how many were executed are fixed.
 */
const DG_EXECUTION_OVERRIDE: Record<string, { plans: number; executed: number }> = {
  "dg-sunil": { plans: 2, executed: 2 }, // top performer — fully on track
  "dg-priya": { plans: 3, executed: 1 }, // middle — stalling, behind
  "dg-anand": { plans: 3, executed: 1 }, // middle — stalling, behind
  "dg-sonal": { plans: 2, executed: 0 }, // bottom — fully behind
};

export type DgClusterPlan = {
  clusterId: string;
  name: string;
  quadrant: QuadrantKey;
  plans: number; // 0 if this DG isn't targeting the cluster this month; 2-3 if it's their one targeted cluster
  executed: number;
};

/**
 * This DG's one targeted cluster this month (at most
 * MAX_CLUSTERS_PER_DG_PER_MONTH), with a 2-3 engagement-plan count logged
 * against it and how many of those were executed. The target is picked by
 * the same ease/access/competitive "attractiveness" used throughout the
 * app, so DGs still gravitate to easy wins — and a per-DG "diligence" seed
 * means some DGs aren't actively targeting anything this month at all,
 * which is its own small piece of the negative narrative.
 */
export function getDgMonthlyPlans(dg: DgInfo): DgClusterPlan[] {
  const geo = { level: "area" as const, id: dg.areaId };
  const scored = CLUSTERS.map((c) => {
    const scores = getClusterScoresForGeo(c.id, geo);
    const attractiveness = scores.ease * 0.5 + scores.access * 0.3 + scores.competitive * 0.2;
    const pickSeed = seededRandom(`${dg.id}|${c.id}|pick`);
    return { clusterId: c.id, name: c.name, quadrant: scores.quadrant, scores, rank: attractiveness + (pickSeed - 0.5) * 3 };
  }).sort((a, b) => b.rank - a.rank);

  const targetClusterId = scored[0].clusterId; // every DG has one active target this month

  const override = DG_EXECUTION_OVERRIDE[dg.id];

  return scored.map((s) => {
    if (s.clusterId !== targetClusterId) {
      return { clusterId: s.clusterId, name: s.name, quadrant: s.quadrant, plans: 0, executed: 0 };
    }

    if (override) {
      return { clusterId: s.clusterId, name: s.name, quadrant: s.quadrant, plans: override.plans, executed: override.executed };
    }

    const countSeed = seededRandom(`${dg.id}|${s.clusterId}|plancount`);
    const plans = countSeed < 0.5 ? 2 : 3; // 2-3 engagement plans logged for the one cluster they're targeting

    const base = 25 + s.scores.ease * 6 - (s.scores.potentialScore >= 6 ? 20 : 0);
    const execSeed = seededRandom(`${dg.id}|${s.clusterId}|execrate`);
    const execRatePct = Math.max(10, Math.min(95, base + (execSeed - 0.5) * 16));
    const executed = Math.max(0, Math.min(plans, Math.round((plans * execRatePct) / 100)));

    return { clusterId: s.clusterId, name: s.name, quadrant: s.quadrant, plans, executed };
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
  targetCluster: string;
  onTrack: boolean;
};

/** DG comparison rows, scoped to the given areas (defaults to the ASM's whole 4-DG territory). */
export function getDgSummaryRows(areaIds: string[] = ALL_ASM_AREA_IDS): DgSummaryRow[] {
  return dgsForAreaIds(areaIds).map((dg) => {
    const rows = getDgMonthlyPlans(dg).filter((p) => p.plans > 0);
    const totalPlans = rows.reduce((s, r) => s + r.plans, 0);
    const totalExecuted = rows.reduce((s, r) => s + r.executed, 0);
    const avgExecutionPct = totalPlans > 0 ? Math.round((totalExecuted / totalPlans) * 10000) / 100 : 0;
    return {
      dgId: dg.id,
      dgName: dg.name,
      areaName: getArea(dg.areaId)?.name ?? dg.areaId,
      totalPlans,
      totalExecuted,
      avgExecutionPct,
      targetCluster: rows[0]?.name ?? "-",
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
  pctDgs: number; // share of the scoped DGs who are targeting this cluster this month
  dgNames: string[]; // which DG(s) are targeting this cluster this month
};

/**
 * Cluster table scoped to the given areas — the literal sum of those DGs'
 * own monthly plans, so it can never disagree with the DG comparison table
 * shown alongside it. Only clusters at least one DG is targeting appear.
 */
export function getTerritoryClusterRows(areaIds: string[] = ALL_ASM_AREA_IDS): TerritoryClusterRow[] {
  const dgs = dgsForAreaIds(areaIds);
  const byCluster = new Map<
    string,
    { name: string; quadrant: QuadrantKey; plans: number; executed: number; dgNames: string[] }
  >();
  for (const dg of dgs) {
    for (const p of getDgMonthlyPlans(dg)) {
      if (p.plans === 0) continue;
      const cur = byCluster.get(p.clusterId) ?? { name: p.name, quadrant: p.quadrant, plans: 0, executed: 0, dgNames: [] };
      cur.plans += p.plans;
      cur.executed += p.executed;
      cur.dgNames.push(dg.name);
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
        pctDgs: Math.round((v.dgNames.length / totalDgs) * 100),
        dgNames: v.dgNames,
      };
    })
    .sort((a, b) => b.plans - a.plans);
}

/** The territory's "Overall Penetration" figure shown on the KPI tile. */
export const ASM_OVERALL_PENETRATION_PCT = 22;
