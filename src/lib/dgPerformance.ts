// DG- and ASM-level execution/engagement/penetration data for Leadership
// Analytics. Everything here is derived from the same geography-aware
// cluster scores in clusterGenerator.ts, so a cluster that looks
// high-potential-but-neglected on the Priority Matrix also shows up
// under-executed on Execution and slipping on Penetration — the numbers
// agree with each other instead of being independently randomized.
import { CLUSTERS } from "@/data/clusters";
import { DGS_PER_ASM, type GeoRef, estimateAsmCount } from "@/data/geography";
import { type QuadrantKey, getClusterScoresForGeo, seededRandom } from "@/lib/clusterGenerator";

export type ClusterEngagementRow = {
  clusterId: string;
  name: string;
  quadrant: QuadrantKey;
  plans: number;
  executed: number;
  pct: number; // percentage execution, 2 decimal places
  onTrack: boolean;
};

/**
 * Engagement-plan volume and execution rate per cluster, for the Strategy &
 * Execution table. These two numbers are DELIBERATELY driven by different
 * factors, not the same "attractiveness" score, so the table can actually
 * show clusters that are heavily planned but poorly executed:
 *  - `plans` scales with revenue-potential percentile — leadership pushes
 *    plan creation toward high-potential clusters regardless of how easy
 *    they are to close.
 *  - execution rate scales with ease-of-sale and is penalized for
 *    high-potential clusters — the same "DGs stall on high-potential,
 *    harder-to-close clusters" mechanism used throughout Leadership
 *    Analytics. Status is derived directly from the displayed percentage —
 *    never an independent random flag — so the table can't disagree with
 *    its own numbers.
 */
export function getClusterEngagement(clusterId: string, geo: GeoRef): ClusterEngagementRow {
  const cluster = CLUSTERS.find((c) => c.id === clusterId)!;
  const scores = getClusterScoresForGeo(clusterId, geo);
  const totalDgs = Math.max(1, estimateAsmCount(geo) * DGS_PER_ASM);

  const potentialWeight = scores.potentialScore / 10; // 0-1
  const planSeed = seededRandom(`${clusterId}|${geo.level}|${geo.id}|plans`);
  const planNoise = 0.75 + planSeed * 0.5; // 0.75-1.25
  const planShare = (0.05 + potentialWeight * 0.22) * planNoise;
  const plans = Math.max(1, Math.round(totalDgs * planShare));

  const seed = seededRandom(`${clusterId}|${geo.level}|${geo.id}|execrate`);
  const base = 25 + scores.ease * 6 - (scores.potentialScore >= 6 ? 20 : 0);
  const execRatePct = Math.max(10, Math.min(95, base + (seed - 0.5) * 16));
  const executed = Math.max(0, Math.min(plans, Math.round((plans * execRatePct) / 100)));
  const pct = plans > 0 ? Math.round((executed / plans) * 10000) / 100 : 0;
  const onTrack = pct >= 40;

  return { clusterId, name: cluster.name, quadrant: scores.quadrant, plans, executed, pct, onTrack };
}

/** All 20 clusters' engagement rows for a geography, ranked by plan volume (most-engaged first). */
export function getClusterEngagementRows(geo: GeoRef): ClusterEngagementRow[] {
  return CLUSTERS.map((c) => getClusterEngagement(c.id, geo)).sort((a, b) => b.plans - a.plans);
}

export type PenetrationRow = {
  clusterId: string;
  name: string;
  prospects: number;
  customers: number;
  pct: number;
  quadrant: QuadrantKey;
  mom: number;
};

/** Per-cluster penetration, consistent with the same competitive-strength score shown on the Priority Matrix. */
export function getPenetrationRows(geo: GeoRef): PenetrationRow[] {
  return CLUSTERS.map((c) => {
    const scores = getClusterScoresForGeo(c.id, geo);
    const pct = Math.max(1, Math.min(60, Math.round(scores.competitive * 6)));
    const customers = Math.round((scores.unitCount * pct) / 100);
    const seed = seededRandom(`${c.id}|${geo.level}|${geo.id}|mom`);
    const bias = scores.potentialScore >= 6 ? -6 : 2; // high-potential clusters slip more often
    const mom = Math.round(bias + (seed - 0.5) * 16);
    return { clusterId: c.id, name: c.name, prospects: scores.unitCount, customers, pct, quadrant: scores.quadrant, mom };
  });
}

const TREND_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May"];

/**
 * Jan-May trend for a cluster. April (the second-to-last point) is derived
 * directly from `currentPct` and `mom` — the same MoM figure shown as the
 * "(+X% / -X%)" badge next to "Current penetration" — so the line's last
 * segment always visually matches the displayed month-over-month change
 * instead of being generated from an unrelated random seed.
 */
export function buildPenetrationTrend(clusterId: string, geo: GeoRef, currentPct: number, mom: number) {
  const prevMonthPct = Math.max(0, Math.min(100, currentPct - mom));
  return TREND_MONTHS.map((month, i) => {
    if (i === TREND_MONTHS.length - 1) return { month, pct: currentPct };
    if (i === TREND_MONTHS.length - 2) return { month, pct: Math.round(prevMonthPct) };
    const seed = seededRandom(`${clusterId}|${geo.level}|${geo.id}|trend|${i}`);
    const factor = 0.7 + seed * 0.35; // Jan-Mar lead gently into April's (fixed) value
    return { month, pct: Math.max(0, Math.round(prevMonthPct * factor)) };
  });
}
