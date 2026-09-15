// Geography-aware cluster scoring for Leadership Analytics. Deterministic
// (seeded by cluster + geography, not by wall-clock/Math.random) so numbers
// are stable across reloads but genuinely differ between National /
// Maharashtra / Panvel — and between clusters — while deliberately keeping
// competitive strength and access uneven rather than uniformly strong.
import { CLUSTERS } from "@/data/clusters";
import {
  type GeoRef,
  NATIONAL_ID,
  PANVEL_ASM,
  getArea,
  getAsmTerritoryShareOfNational,
  getState,
} from "@/data/geography";
import { getClusterResearch } from "@/lib/clusterResearch";

/** Deterministic pseudo-random in [0, 1), seeded by an arbitrary string. */
export function seededRandom(seed: string): number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

const ALL_CLUSTER_IDS = CLUSTERS.map((c) => c.id);

/**
 * Which broad economic activity each cluster belongs to, for the geographic
 * density story below — several clusters can share a category (e.g. Schools
 * and Colleges are both "education"), since what varies by place is the
 * category's local intensity, not each cluster individually.
 */
type ClusterCategory =
  | "education"
  | "healthcare"
  | "hospitality"
  | "religious"
  | "residential-urban"
  | "industrial-logistics"
  | "migrant-hub"
  | "auto-retail"
  | "highway-transit"
  | "local-retail";

const CLUSTER_CATEGORY: Record<string, ClusterCategory> = {
  schools: "education",
  colleges: "education",
  hospitals: "healthcare",
  "clinics-nursing": "healthcare",
  restaurants: "hospitality",
  hotels: "hospitality",
  "marriage-halls": "hospitality",
  religious: "religious",
  "mid-apartments": "residential-urban",
  "gated-community": "residential-urban",
  redevelopment: "residential-urban",
  midc: "industrial-logistics",
  warehousing: "industrial-logistics",
  "paying-guest": "migrant-hub",
  "auto-showrooms": "auto-retail",
  "petrol-pumps": "highway-transit",
  "bus-stand-market": "highway-transit",
  "highway-dhabas": "highway-transit",
  jewellery: "local-retail",
  "textile-garment": "local-retail",
};

/**
 * How over/under-represented each category is in a given geography, relative
 * to the national average (1.0 = exactly average). This is what makes
 * different clusters top the Priority Matrix in different places — without
 * it, every geography scales all 20 clusters by the same single factor,
 * which can only shrink/grow the whole matrix, never reshuffle it, so the
 * quadrant membership barely changes when switching National/State/Area.
 * Each profile reflects a real, specific fact about that place, not a random
 * spread: Panvel's profile is a JNPT-port/logistics-and-redevelopment
 * boomtown; Pen is nationally known for Ganesh-idol-making (a religious/craft
 * cottage industry); Karjat is a weekend-getaway/second-home town; Khopoli
 * sits on the Mumbai-Pune highway gateway to the hill stations.
 */
const GEO_DENSITY_PROFILE: Record<string, Partial<Record<ClusterCategory, number>>> = {
  "state:maharashtra": {
    "industrial-logistics": 1.8,
    "residential-urban": 1.6,
    "auto-retail": 1.4,
    "highway-transit": 1.35,
    hospitality: 1.25,
    "migrant-hub": 1.3,
    "local-retail": 0.75,
    education: 0.22,
    healthcare: 0.85,
    religious: 0.4,
  },
  "area:panvel": {
    "industrial-logistics": 3.0,
    "residential-urban": 2.2,
    "highway-transit": 2.0,
    "migrant-hub": 1.7,
    "auto-retail": 0.7,
    hospitality: 0.75,
    "local-retail": 0.45,
    healthcare: 0.35,
    education: 0.1,
    religious: 0.25,
  },
  "area:khopoli": {
    "industrial-logistics": 2.4,
    "highway-transit": 2.2,
    hospitality: 1.8,
    "residential-urban": 0.75,
    "migrant-hub": 0.65,
    "local-retail": 0.45,
    education: 0.15,
    healthcare: 0.35,
    religious: 0.4,
    "auto-retail": 0.4,
  },
  "area:karjat": {
    religious: 2.2,
    hospitality: 2.0,
    "residential-urban": 1.6,
    "highway-transit": 0.85,
    "local-retail": 0.55,
    "migrant-hub": 0.5,
    "auto-retail": 0.35,
    "industrial-logistics": 0.25,
    education: 0.15,
    healthcare: 0.3,
  },
  "area:pen": {
    religious: 3.3,
    "local-retail": 1.9,
    hospitality: 0.7,
    "highway-transit": 0.55,
    "migrant-hub": 0.45,
    "industrial-logistics": 0.3,
    "residential-urban": 0.3,
    "auto-retail": 0.35,
    education: 0.15,
    healthcare: 0.3,
  },
};

/** Blended density factor for an "asm" territory — the weighted average of its component areas' profiles, so the ASM's own view can never disagree with what each of its DGs' own area views show. */
function getAsmDensityFactor(clusterId: string): number {
  const category = CLUSTER_CATEGORY[clusterId];
  if (!category) return 1;
  const factors = PANVEL_ASM.areaIds.map((areaId) => GEO_DENSITY_PROFILE[`area:${areaId}`]?.[category] ?? 1);
  return factors.reduce((sum, f) => sum + f, 0) / factors.length;
}

/** How over/under-represented this cluster's category is in this geography vs. the national average (1.0 = average; national itself is always 1.0, the reference point). */
function getGeoDensityFactor(clusterId: string, geo: GeoRef): number {
  const category = CLUSTER_CATEGORY[clusterId];
  if (!category) return 1;
  if (geo.level === "state" || geo.level === "area") {
    return GEO_DENSITY_PROFILE[`${geo.level}:${geo.id}`]?.[category] ?? 1;
  }
  if (geo.level === "asm") return getAsmDensityFactor(clusterId);
  return 1; // national — the reference point everything else is relative to
}

/** Total units of a cluster type present in the given geography. */
export function getUnitCount(clusterId: string, geo: GeoRef): number {
  const research = getClusterResearch(clusterId);
  let scaled = research.nationalUnitBaseline;

  if (geo.level === "state") {
    const state = getState(geo.id);
    scaled *= state?.shareOfNational ?? 0.05;
  } else if (geo.level === "area") {
    const area = getArea(geo.id);
    const state = getState(area?.stateId ?? "maharashtra");
    scaled *= (state?.shareOfNational ?? 0.094) * (area?.shareOfState ?? 0.02);
  } else if (geo.level === "asm") {
    scaled *= getAsmTerritoryShareOfNational(geo.id);
  }
  // geo.level === "national": use the baseline as-is.

  scaled *= getGeoDensityFactor(clusterId, geo);

  const variance = 0.85 + seededRandom(`${clusterId}|${geo.level}|${geo.id}|units`) * 0.3; // 0.85–1.15
  return Math.max(1, Math.round(scaled * variance));
}

/** Raw annual revenue potential (INR) for a cluster in a geography. */
export function getRevenueAnnual(clusterId: string, geo: GeoRef): number {
  const research = getClusterResearch(clusterId);
  const units = getUnitCount(clusterId, geo);
  return (units * research.avgRevenuePerUnit) / research.repaintCycleYears;
}

/** 0-10 score from percentile rank of this cluster's revenue potential among all 20, within this geography. */
export function getRevenuePotentialScore(clusterId: string, geo: GeoRef): number {
  const values = ALL_CLUSTER_IDS.map((id) => ({ id, val: getRevenueAnnual(id, geo) })).sort((a, b) => a.val - b.val);
  const idx = values.findIndex((v) => v.id === clusterId);
  if (idx < 0) return 5;
  const percentile = values.length > 1 ? idx / (values.length - 1) : 0.5;
  return Math.max(1, Math.round(percentile * 10 * 10) / 10);
}

/**
 * 0-10 competitive strength score. Deliberately uneven: structurally-weak
 * archetypes (OEM/PSU lock-in, specialty coatings) stay low everywhere;
 * even fragmented "opportunity" segments are weaker outside the home
 * territory (Panvel/Maharashtra), reflecting a mid-tier challenger brand
 * with patchy national presence rather than a market leader.
 */
export function getCompetitiveStrengthScore(clusterId: string, geo: GeoRef): number {
  const research = getClusterResearch(clusterId);
  const baseShare =
    research.archetype === "structurally-weak" ? 0.12 : research.archetype === "fragmented-opportunity" ? 0.3 : 0.2;

  const homeTurfFactor =
    geo.level === "area" && geo.id === "panvel"
      ? 1.15
      : geo.level === "asm"
        ? 1.1
        : geo.level === "state" && geo.id === "maharashtra"
          ? 1.0
          : geo.level === "national"
            ? 0.75
            : 0.6;

  const variance = 0.8 + seededRandom(`${clusterId}|${geo.level}|${geo.id}|comp`) * 0.4; // 0.8–1.2
  const share = Math.min(0.6, baseShare * homeTurfFactor * variance);
  return Math.max(1, Math.min(10, Math.round(share * 18 * 10) / 10));
}

/** 0-10 ease-of-sale score — structural, does not vary by geography. */
export function getEaseOfSaleScore(clusterId: string): number {
  return getClusterResearch(clusterId).easeOfSaleScore;
}

/**
 * 0-10 access score (an aggregate across many DGs in this geography, so a
 * continuous value — not snapped to the single-DG 0/3.3/6.7/10 tiers used in
 * the Market Discovery System's own 3-question form). Deliberately and
 * strongly anti-correlated with revenue potential: high-potential clusters
 * are the ones DGs most often lack real access to — that's the "neglected
 * opportunity" half of the narrative — with modest seeded noise so it isn't
 * mechanically uniform within a potential band.
 */
export function getAccessScore(clusterId: string, geo: GeoRef): number {
  const potential = getRevenuePotentialScore(clusterId, geo);
  const seed = seededRandom(`${clusterId}|${geo.level}|${geo.id}|access`);
  const raw = (10 - potential) * 0.7 + (seed - 0.5) * 6;
  return Math.round(Math.max(0, Math.min(10, raw)) * 10) / 10;
}

export type HML = "H" | "M" | "L";
export function scoreToHML(score: number): HML {
  return score >= 6 ? "H" : "L";
}
export function scoreToHMLRollup(score: number): HML {
  if (score >= 7) return "H";
  if (score >= 4) return "M";
  return "L";
}

export type QuadrantKey = "HH" | "HL" | "LH" | "LL";

export type GeoClusterScores = {
  clusterId: string;
  geo: GeoRef;
  unitCount: number;
  revenueAnnual: number;
  revenue: number; // potential score, 0-10
  competitive: number;
  access: number;
  ease: number;
  potentialScore: number; // = revenue (Revenue Potential score, 0-10)
  accessRollupScore: number; // avg(competitive, access, ease)
  quadrant: QuadrantKey;
};

/** Full 4-score bundle for one cluster in one geography — the core building block for every Leadership page. */
export function getClusterScoresForGeo(clusterId: string, geo: GeoRef): GeoClusterScores {
  const revenue = getRevenuePotentialScore(clusterId, geo);
  const competitive = getCompetitiveStrengthScore(clusterId, geo);
  const access = getAccessScore(clusterId, geo);
  const ease = getEaseOfSaleScore(clusterId);

  const potentialScore = revenue;
  const accessRollupScore = Number(((competitive + access + ease) / 3).toFixed(1));

  const potentialHigh = scoreToHML(revenue) === "H";
  const accessHigh = scoreToHML(competitive) === "H" || scoreToHML(access) === "H" || scoreToHML(ease) === "H";
  const quadrant: QuadrantKey = `${potentialHigh ? "H" : "L"}${accessHigh ? "H" : "L"}` as QuadrantKey;

  return {
    clusterId,
    geo,
    unitCount: getUnitCount(clusterId, geo),
    revenueAnnual: getRevenueAnnual(clusterId, geo),
    revenue,
    competitive,
    access,
    ease,
    potentialScore,
    accessRollupScore,
    quadrant,
  };
}

/** All 20 clusters scored for a geography, in cluster-definition order. */
export function getAllClusterScoresForGeo(geo: GeoRef): GeoClusterScores[] {
  return ALL_CLUSTER_IDS.map((id) => getClusterScoresForGeo(id, geo));
}

export const NATIONAL_GEO: GeoRef = { level: "national", id: NATIONAL_ID };
