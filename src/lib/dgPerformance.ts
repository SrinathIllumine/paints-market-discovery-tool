// DG- and ASM-level execution/engagement/penetration data for Leadership
// Analytics. Everything here is derived from the same geography-aware
// cluster scores in clusterGenerator.ts, so a cluster that looks
// high-potential-but-neglected on the Priority Matrix also shows up
// under-targeted on Execution and slipping on Penetration — the numbers
// agree with each other instead of being independently randomized.
import { CLUSTERS } from "@/data/clusters";
import {
  type DgInfo,
  type GeoRef,
  PANVEL_ASM,
  PANVEL_CLUSTER_DGS,
  estimateAsmCount,
  getArea,
  getState,
} from "@/data/geography";
import {
  type GeoClusterScores,
  type QuadrantKey,
  getAllClusterScoresForGeo,
  getClusterScoresForGeo,
  seededRandom,
} from "@/lib/clusterGenerator";

function geoForDg(dg: DgInfo): GeoRef {
  return { level: "area", id: dg.areaId };
}

export type DgClusterFocus = {
  clusterId: string;
  scores: GeoClusterScores;
  targeted: boolean;
  rightStrategy: boolean;
  executionPct: number;
};

/**
 * What one DG is (and isn't) targeting. DGs gravitate to easy, accessible,
 * already-competitive clusters (`attractiveness`) — because access is
 * generated anti-correlated with revenue potential, this mechanically
 * produces the "DGs chase easy wins, ignore high-potential clusters" story
 * rather than that story being hand-scripted per cluster.
 */
export function getDgClusterFocus(dg: DgInfo): DgClusterFocus[] {
  const geo = geoForDg(dg);
  return CLUSTERS.map((c) => {
    const scores = getClusterScoresForGeo(c.id, geo);
    const seedBase = `${dg.id}|${c.id}`;
    const attractiveness = scores.ease * 0.5 + scores.access * 0.3 + scores.competitive * 0.2;
    const noise = seededRandom(`${seedBase}|targeted`) * 3;
    const targeted = attractiveness + noise >= 9;
    const rightStrategy =
      targeted && seededRandom(`${seedBase}|strategy`) > (scores.potentialScore >= 6 ? 0.55 : 0.2);
    const rawExec = 30 + seededRandom(`${seedBase}|exec`) * 55 - (scores.potentialScore >= 6 ? 15 : 0);
    const executionPct = targeted ? Math.max(0, Math.min(100, Math.round(rawExec))) : 0;
    return { clusterId: c.id, scores, targeted, rightStrategy, executionPct };
  });
}

export type DgExecutionRow = { dg: string; area: string; targeted: number; rightStrategy: number; executed: number };

/** Panvel-ASM DG-comparison table (Sunil Kumar + 3 sibling-area DGs). */
export function getDgExecutionRows(): DgExecutionRow[] {
  return PANVEL_CLUSTER_DGS.map((dg) => {
    const focus = getDgClusterFocus(dg).filter((f) => f.targeted);
    const targeted = focus.length;
    const rightStrategy = focus.filter((f) => f.rightStrategy).length;
    const executed = targeted > 0 ? Math.round(focus.reduce((s, f) => s + f.executionPct, 0) / targeted) : 0;
    return { dg: dg.name, area: getArea(dg.areaId)?.name ?? dg.areaId, targeted, rightStrategy, executed };
  });
}

/**
 * Share of DGs who have this cluster among their targeted clusters, for a
 * given geography scope. Independent per cluster — a DG can (and typically
 * does) target several clusters at once, so these figures are not a
 * partition and don't need to sum to 100% across clusters.
 */
export function getClusterTargetingShare(clusterId: string, geo: GeoRef): number {
  const scores = getClusterScoresForGeo(clusterId, geo);
  const attractiveness = scores.ease * 0.5 + scores.access * 0.3 + scores.competitive * 0.2; // 0-10
  const noise = (seededRandom(`${clusterId}|${geo.level}|${geo.id}|targetshare`) - 0.5) * 24; // ±12
  const pct = attractiveness * 7 + noise; // roughly spans 3-85
  return Math.max(3, Math.min(85, Math.round(pct * 10) / 10));
}

/** Whether a cluster's plan is on track, deliberately weighted so high-potential clusters fall behind more often. */
export function getClusterOnTrack(clusterId: string, geo: GeoRef): boolean {
  const scores = getClusterScoresForGeo(clusterId, geo);
  const seed = seededRandom(`${clusterId}|${geo.level}|${geo.id}|ontrack`);
  const threshold = scores.potentialScore >= 6 ? 0.7 : 0.35;
  return seed >= threshold;
}

const FUNNEL_LABELS = ["Prospects Identified", "Contacted", "Site Visit / Demo", "Quotation Shared", "Converted"];
export type FunnelStage = { label: string; pct: number };

/** Sales funnel shaped by how weak our competitive strength is in the best-fit (HH) clusters. */
export function getFunnel(geo: GeoRef): FunnelStage[] {
  const hh = getAllClusterScoresForGeo(geo).filter((s) => s.quadrant === "HH");
  const avgCompetitive = hh.length > 0 ? hh.reduce((sum, c) => sum + c.competitive, 0) / hh.length : 5;
  const seed = seededRandom(`${geo.level}|${geo.id}|funnel`);
  const conversionFactor = 0.5 + (avgCompetitive / 10) * 0.5 + seed * 0.1;
  const base = [100, 60, 32, 16, 8];
  return FUNNEL_LABELS.map((label, i) => ({
    label,
    pct: i === 0 ? base[0] : Math.round(base[i] * conversionFactor),
  }));
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

const ASM_NAME_POOL = [
  "Prakash Iyer",
  "Suresh Nair",
  "Anita Sharma",
  "Amit Joshi",
  "Kavita Mehta",
  "Nitin More",
  "Ravi Deshmukh",
  "Pooja Kulkarni",
  "Sneha Patil",
  "Sandeep Nair",
  "Manoj Kale",
  "Deepa Rane",
];

export type AsmQuadrantRow = { name: string; area: string; dgCount: number };

/** ASMs (and how many of their DGs) are targeting a given quadrant, at the current geography scope. */
export function getAsmsForQuadrant(quadrant: QuadrantKey, geo: GeoRef): AsmQuadrantRow[] {
  if (geo.level === "area" && geo.id === "panvel") {
    const dgCount = PANVEL_CLUSTER_DGS.filter((dg) =>
      getDgClusterFocus(dg).some((f) => f.targeted && f.scores.quadrant === quadrant),
    ).length;
    return dgCount > 0 ? [{ name: PANVEL_ASM.name, area: "Panvel (Raigad ASM territory)", dgCount }] : [];
  }

  const totalAsms = Math.max(1, estimateAsmCount(geo));
  const seedBase = `${quadrant}|${geo.level}|${geo.id}`;
  const count = Math.max(3, Math.min(ASM_NAME_POOL.length, Math.round(totalAsms * (0.15 + seededRandom(seedBase) * 0.15))));
  const areaLabel = geo.level === "national" ? "Multiple states" : (getState(geo.id)?.name ?? geo.id);

  const rows: AsmQuadrantRow[] = [];
  for (let i = 0; i < count; i++) {
    const name = ASM_NAME_POOL[i % ASM_NAME_POOL.length];
    const dgCount = 1 + Math.round(seededRandom(`${seedBase}|${i}`) * 4);
    rows.push({ name, area: areaLabel, dgCount });
  }
  return rows;
}

/** Ground-level "weight" (unit count) per quadrant — proxy for share of DG attention, for the engagement pie chart. */
export function getQuadrantWeight(geo: GeoRef): Record<QuadrantKey, number> {
  const weight: Record<QuadrantKey, number> = { HH: 0, HL: 0, LH: 0, LL: 0 };
  for (const s of getAllClusterScoresForGeo(geo)) weight[s.quadrant] += s.unitCount;
  return weight;
}
