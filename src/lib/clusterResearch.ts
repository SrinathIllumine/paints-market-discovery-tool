// Structural, geography-invariant per-cluster facts, synthesized from the
// light research pass in `research/cluster-research-notes.md`. These do NOT
// change by area/state/national — only unit counts, access and competitive
// strength vary by geography (see clusterGenerator.ts).

export type CompetitiveArchetype =
  | "structurally-weak" // OEM/PSU lock-in or specialty-coating consolidation — hard for a challenger brand
  | "fragmented-opportunity" // low brand loyalty, price/relationship driven — open to a challenger
  | "mixed"; // contested by all major players, no structural advantage either way

export type ClusterResearch = {
  /** Average revenue (INR) per unit over one full repainting cycle. */
  avgRevenuePerUnit: number;
  /** Typical repainting cycle length, in years. */
  repaintCycleYears: number;
  /** 0-10, higher = simpler/faster to close (fewer approval layers). */
  easeOfSaleScore: number;
  /** Order-of-magnitude estimate of total units nationally (India). */
  nationalUnitBaseline: number;
  archetype: CompetitiveArchetype;
};

export const CLUSTER_RESEARCH: Record<string, ClusterResearch> = {
  "mid-apartments": {
    avgRevenuePerUnit: 15_00_000,
    repaintCycleYears: 5,
    easeOfSaleScore: 7,
    nationalUnitBaseline: 600_000,
    archetype: "mixed",
  },
  redevelopment: {
    avgRevenuePerUnit: 28_00_000,
    repaintCycleYears: 6,
    easeOfSaleScore: 3,
    nationalUnitBaseline: 50_000,
    archetype: "structurally-weak",
  },
  "gated-community": {
    avgRevenuePerUnit: 60_00_000,
    repaintCycleYears: 6,
    easeOfSaleScore: 5,
    nationalUnitBaseline: 40_000,
    archetype: "structurally-weak",
  },
  schools: {
    avgRevenuePerUnit: 8_00_000,
    repaintCycleYears: 4,
    easeOfSaleScore: 6,
    nationalUnitBaseline: 1_470_000,
    archetype: "fragmented-opportunity",
  },
  colleges: {
    avgRevenuePerUnit: 20_00_000,
    repaintCycleYears: 5,
    easeOfSaleScore: 5,
    nationalUnitBaseline: 45_000,
    archetype: "fragmented-opportunity",
  },
  hospitals: {
    avgRevenuePerUnit: 20_00_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 4,
    nationalUnitBaseline: 70_000,
    archetype: "structurally-weak",
  },
  restaurants: {
    avgRevenuePerUnit: 3_50_000,
    repaintCycleYears: 2,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 500_000,
    archetype: "fragmented-opportunity",
  },
  hotels: {
    avgRevenuePerUnit: 15_00_000,
    repaintCycleYears: 4,
    easeOfSaleScore: 6,
    nationalUnitBaseline: 80_000,
    archetype: "mixed",
  },
  midc: {
    avgRevenuePerUnit: 42_00_000,
    repaintCycleYears: 6,
    easeOfSaleScore: 2,
    nationalUnitBaseline: 30_000,
    archetype: "structurally-weak",
  },
  warehousing: {
    avgRevenuePerUnit: 22_00_000,
    repaintCycleYears: 5,
    easeOfSaleScore: 4,
    nationalUnitBaseline: 60_000,
    archetype: "fragmented-opportunity",
  },
  "marriage-halls": {
    avgRevenuePerUnit: 10_00_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 8,
    nationalUnitBaseline: 80_000,
    archetype: "fragmented-opportunity",
  },
  "paying-guest": {
    avgRevenuePerUnit: 3_00_000,
    repaintCycleYears: 4,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 200_000,
    archetype: "fragmented-opportunity",
  },
  religious: {
    avgRevenuePerUnit: 5_00_000,
    repaintCycleYears: 5,
    easeOfSaleScore: 3,
    nationalUnitBaseline: 1_000_000,
    archetype: "mixed",
  },
  "auto-showrooms": {
    avgRevenuePerUnit: 10_00_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 4,
    nationalUnitBaseline: 15_000,
    archetype: "structurally-weak",
  },
  "petrol-pumps": {
    avgRevenuePerUnit: 4_00_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 2,
    nationalUnitBaseline: 100_266,
    archetype: "structurally-weak",
  },
  "bus-stand-market": {
    avgRevenuePerUnit: 1_00_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 2_000_000,
    archetype: "fragmented-opportunity",
  },
  "highway-dhabas": {
    avgRevenuePerUnit: 2_00_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 50_000,
    archetype: "fragmented-opportunity",
  },
  "clinics-nursing": {
    avgRevenuePerUnit: 4_50_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 8,
    nationalUnitBaseline: 150_000,
    archetype: "fragmented-opportunity",
  },
  jewellery: {
    avgRevenuePerUnit: 9_00_000,
    repaintCycleYears: 5,
    easeOfSaleScore: 5,
    nationalUnitBaseline: 30_000,
    archetype: "mixed",
  },
  "textile-garment": {
    avgRevenuePerUnit: 1_75_000,
    repaintCycleYears: 3,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 500_000,
    archetype: "fragmented-opportunity",
  },
};

export function getClusterResearch(clusterId: string): ClusterResearch {
  return (
    CLUSTER_RESEARCH[clusterId] ?? {
      avgRevenuePerUnit: 2_00_000,
      repaintCycleYears: 4,
      easeOfSaleScore: 5,
      nationalUnitBaseline: 100_000,
      archetype: "mixed",
    }
  );
}
