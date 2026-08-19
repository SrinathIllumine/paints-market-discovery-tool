import { CLUSTERS, type Cluster } from "@/data/clusters";
import { getClusterIntel, getRevenueProfile } from "@/lib/clusterScoring";

export type QuadrantKey = "HH" | "HL" | "LH" | "LL";

export const QUADRANT_TITLE: Record<QuadrantKey, string> = {
  HH: "High Potential – High Access",
  HL: "High Potential – Low Access",
  LH: "Low Potential – High Access",
  LL: "Low Potential – Low Access",
};

// Reference app's table "Type" column reverses the word order (Access first).
export const QUADRANT_TYPE_LABEL: Record<QuadrantKey, string> = {
  HH: "High Access – High Potential",
  HL: "Low Access – High Potential",
  LH: "High Access – Low Potential",
  LL: "Low Access – Low Potential",
};

export const QUADRANT_DESC: Record<QuadrantKey, string> = {
  HH: "High revenue potential and strong DG access. Focus here first to gain market share.",
  HL: "High revenue potential but DGs lack strong connects. Building access unlocks future opportunity.",
  LH: "Easy to approach but limited revenue upside. Engage selectively to keep the pipeline active.",
  LL: "Low returns and hard to penetrate. Redirect DG effort to higher potential clusters.",
};

export const QUADRANT_COLOR: Record<QuadrantKey, string> = {
  HH: "#10b981",
  HL: "#f59e0b",
  LH: "#0ea5e9",
  LL: "#94a3b8",
};

// Short display names for dense contexts (matrix dot labels, quadrant chip lists).
export const CLUSTER_SHORT_NAME: Record<string, string> = {
  "mid-apartments": "Mid-Size Apts",
  redevelopment: "Redevelopment Hsg",
  "gated-community": "Gated Communities",
  schools: "Schools",
  colleges: "Colleges & Universities",
  hospitals: "Hospitals",
  restaurants: "Restaurants/Cafés",
  hotels: "Hotels/Resorts",
  midc: "MIDC/Industrial",
  warehousing: "Warehouses",
  "marriage-halls": "Marriage Halls",
  "paying-guest": "PG Facilities",
  religious: "Religious",
  "auto-showrooms": "Auto Showrooms",
  "petrol-pumps": "Petrol Pumps",
  "bus-stand-market": "Bus Stand Mkts",
  "highway-dhabas": "Highway Hotels",
  "clinics-nursing": "Local Clinics",
  jewellery: "Jewellery",
  "textile-garment": "Textile/Garment",
};

export function getClusterQuadrant(clusterId: string, prospectCountEstimate: number): QuadrantKey {
  const intel = getClusterIntel(clusterId, prospectCountEstimate);
  const potential = intel.revenueHML === "H" || intel.competitiveHML === "H" ? "H" : "L";
  const access = intel.accessHML === "H" || intel.easeHML === "H" ? "H" : "L";
  return `${potential}${access}` as QuadrantKey;
}

export function getClusterRevenuePotential(cluster: Cluster): number {
  return cluster.prospectCountEstimate * getRevenueProfile(cluster.id).avgRevenuePerProspect;
}

export type RankedCluster = {
  id: string;
  name: string;
  quadrant: QuadrantKey;
  revenuePotential: number;
  access: "High" | "Low";
};

export function getClustersRankedByRevenue(): RankedCluster[] {
  return CLUSTERS.map((c) => {
    const quadrant = getClusterQuadrant(c.id, c.prospectCountEstimate);
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const access = intel.accessHML === "H" || intel.easeHML === "H" ? "High" : "Low";
    return {
      id: c.id,
      name: c.name,
      quadrant,
      revenuePotential: getClusterRevenuePotential(c),
      access,
    };
  }).sort((a, b) => b.revenuePotential - a.revenuePotential);
}

export function formatCr(rupees: number): string {
  return `₹${Math.round(rupees / 1_00_00_000).toLocaleString("en-IN")} Cr`;
}

export function hashSeed(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 97;
  return h;
}

// Small deterministic offset so clusters with identical underlying scores
// don't render as fully overlapping dots/labels on the matrix scatter chart.
export function jitter(id: string, salt: string, spread = 6): number {
  const h = hashSeed(id + salt);
  return (h % (spread * 2 + 1)) - spread;
}

// Nudge a jittered value by `delta`, but never let it cross the 50-mark that
// separates quadrants (clusters must stay in the quadrant their HML score put
// them in).
export function clampToQuadrantSide(value: number, delta: number, isHigh: boolean): number {
  const next = value + delta;
  if (isHigh) return Math.min(97, Math.max(53, next));
  return Math.min(47, Math.max(3, next));
}

const ASM_POOL = [
  { name: "Rajesh Patil", area: "Pune" },
  { name: "Prakash Iyer", area: "Nashik" },
  { name: "Suresh Nair", area: "Nagpur" },
  { name: "Anita Sharma", area: "Thane" },
  { name: "Amit Joshi", area: "Solapur" },
  { name: "Kavita Mehta", area: "Nashik Rural" },
  { name: "Nitin More", area: "Satara" },
  { name: "Vikram Desai", area: "Navi Mumbai" },
  { name: "Ravi Deshmukh", area: "Pune Rural" },
  { name: "Pooja Kulkarni", area: "Ahmednagar" },
  { name: "Sneha Patil", area: "Raigad" },
  { name: "Sandeep Nair", area: "Osmanabad" },
];

export function getAsmsForQuadrant(quadrant: QuadrantKey): { name: string; area: string; dgCount: number }[] {
  const seed = hashSeed(quadrant);
  const count = 5 + (seed % 4);
  return ASM_POOL.slice(0, count).map((asm, i) => ({
    ...asm,
    dgCount: Math.max(1, 5 - i - (seed % 2)),
  }));
}
