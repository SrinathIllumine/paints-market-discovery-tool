// Structural, geography-invariant per-cluster facts. Revenue-per-unit,
// repaint cycle, and national unit counts are sourced from the calibrated
// research pass in `research/cluster-revenue-cycle-research.md` — a blended
// national average per cluster (weighted across small/mid/large segments),
// sanity-checked so no single cluster's national revenue potential exceeds
// ~4-5% of the ~₹80,000 Cr total Indian paints market. Ease-of-sale and
// competitive archetype are unchanged from the earlier lighter pass
// (`research/cluster-research-notes.md`) — this update only re-derives
// revenue/unit, cycle years, and unit counts. These do NOT change by
// area/state/national — only unit counts scale by geography, and access/
// competitive strength vary by geography (see clusterGenerator.ts).
//
// Every cluster prices EVERY potential paintable area within it, regardless
// of who actually pays for the job — a resident's own flat interior counts
// toward "Mid-Size Apartment Buildings" exactly like the society's shared
// lobby does, even though one is owner-funded and the other is society-
// funded. `mid-apartments` and `gated-community` are the two clusters where
// this matters in practice, since they're the only ones where a single
// physical cluster contains many separately-owned interior units alongside
// shared common areas — see `research/cluster-revenue-owner-neutral-recalc.md`
// for the full recalculation (and why the other 18 clusters, being single-
// operator premises, needed no change). Because of this, the 20-cluster sum
// is now a much larger, ~42% slice of the ₹80,000 Cr total market — the
// remaining majority is individual free-standing homes, which have no
// cluster of their own and stay genuinely outside this list.

export type CompetitiveArchetype =
  | "structurally-weak" // OEM/PSU lock-in or specialty-coating consolidation — hard for a challenger brand
  | "fragmented-opportunity" // low brand loyalty, price/relationship driven — open to a challenger
  | "mixed"; // contested by all major players, no structural advantage either way

export type ClusterResearch = {
  /** Blended national average revenue (INR) per unit over one full repainting cycle. */
  avgRevenuePerUnit: number;
  /**
   * Typical repainting cycle length, in years. Three clusters fix this at 1
   * (a no-op divide) because avgRevenuePerUnit is already an annual figure
   * rather than a one-cycle job value: Redevelopment's "unit count" is
   * already an annual flow of newly-completed projects, not a stock: while
   * mid-apartments and gated-community each blend TWO different cycles
   * (facade/common areas on a long cycle, every individually-owned interior
   * on a shorter one) into one pre-annualized number, since this type only
   * has room for a single cycle value.
   */
  repaintCycleYears: number;
  /** 0-10, higher = simpler/faster to close (fewer approval layers). */
  easeOfSaleScore: number;
  /** National unit count (India) — see research file for source/confidence per cluster. */
  nationalUnitBaseline: number;
  archetype: CompetitiveArchetype;
};

export const CLUSTER_RESEARCH: Record<string, ClusterResearch> = {
  "mid-apartments": {
    // Blended ANNUAL revenue per building (facade/common-area amortized over
    // its 6-yr cycle PLUS every flat's own interior amortized over its own
    // 4-yr cycle) — repaintCycleYears is 1 so this annual figure passes
    // through getRevenueAnnual() unchanged. See recalc doc for derivation.
    avgRevenuePerUnit: 313_958,
    repaintCycleYears: 1, // already-annualized blend of two different cycles — see comment above
    easeOfSaleScore: 7,
    nationalUnitBaseline: 250_000,
    archetype: "mixed",
  },
  redevelopment: {
    avgRevenuePerUnit: 1_674_000,
    repaintCycleYears: 1, // annual flow of completions, not a stock — see type comment above
    easeOfSaleScore: 3,
    nationalUnitBaseline: 15_000,
    archetype: "structurally-weak",
  },
  "gated-community": {
    // Same owner-neutral blend as mid-apartments: every villa/flat's own
    // interior, plus the township's shared common areas, annualized into one
    // per-township figure. See recalc doc for derivation.
    avgRevenuePerUnit: 14_169_583,
    repaintCycleYears: 1, // already-annualized blend of two different cycles — see comment above
    easeOfSaleScore: 5,
    nationalUnitBaseline: 6_000,
    archetype: "structurally-weak",
  },
  schools: {
    avgRevenuePerUnit: 112_500,
    repaintCycleYears: 5,
    easeOfSaleScore: 6,
    nationalUnitBaseline: 1_470_000,
    archetype: "fragmented-opportunity",
  },
  colleges: {
    avgRevenuePerUnit: 893_000,
    repaintCycleYears: 5,
    easeOfSaleScore: 5,
    nationalUnitBaseline: 48_246,
    archetype: "fragmented-opportunity",
  },
  hospitals: {
    avgRevenuePerUnit: 1_060_500,
    repaintCycleYears: 3,
    easeOfSaleScore: 4,
    nationalUnitBaseline: 70_000,
    archetype: "structurally-weak",
  },
  restaurants: {
    avgRevenuePerUnit: 30_315,
    repaintCycleYears: 3,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 500_000,
    archetype: "fragmented-opportunity",
  },
  hotels: {
    avgRevenuePerUnit: 402_450,
    repaintCycleYears: 3,
    easeOfSaleScore: 6,
    nationalUnitBaseline: 50_000,
    archetype: "mixed",
  },
  midc: {
    avgRevenuePerUnit: 535_000,
    repaintCycleYears: 6,
    easeOfSaleScore: 2,
    nationalUnitBaseline: 250_000,
    archetype: "structurally-weak",
  },
  warehousing: {
    avgRevenuePerUnit: 665_000,
    repaintCycleYears: 7,
    easeOfSaleScore: 4,
    nationalUnitBaseline: 50_000,
    archetype: "fragmented-opportunity",
  },
  "marriage-halls": {
    avgRevenuePerUnit: 244_800,
    repaintCycleYears: 4,
    easeOfSaleScore: 8,
    nationalUnitBaseline: 40_000,
    archetype: "fragmented-opportunity",
  },
  "paying-guest": {
    avgRevenuePerUnit: 39_400,
    repaintCycleYears: 4,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 385_000,
    archetype: "fragmented-opportunity",
  },
  religious: {
    avgRevenuePerUnit: 59_500,
    repaintCycleYears: 5,
    easeOfSaleScore: 3,
    nationalUnitBaseline: 1_000_000,
    archetype: "mixed",
  },
  "auto-showrooms": {
    avgRevenuePerUnit: 137_400,
    repaintCycleYears: 3,
    easeOfSaleScore: 4,
    nationalUnitBaseline: 90_000,
    archetype: "structurally-weak",
  },
  "petrol-pumps": {
    avgRevenuePerUnit: 62_750,
    repaintCycleYears: 3,
    easeOfSaleScore: 2,
    nationalUnitBaseline: 103_000,
    archetype: "structurally-weak",
  },
  "bus-stand-market": {
    avgRevenuePerUnit: 2_432,
    repaintCycleYears: 4,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 150_000,
    archetype: "fragmented-opportunity",
  },
  "highway-dhabas": {
    avgRevenuePerUnit: 21_700,
    repaintCycleYears: 3,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 70_000,
    archetype: "fragmented-opportunity",
  },
  "clinics-nursing": {
    avgRevenuePerUnit: 59_600,
    repaintCycleYears: 3,
    easeOfSaleScore: 8,
    nationalUnitBaseline: 500_000,
    archetype: "fragmented-opportunity",
  },
  jewellery: {
    avgRevenuePerUnit: 33_325,
    repaintCycleYears: 4,
    easeOfSaleScore: 5,
    nationalUnitBaseline: 400_000,
    archetype: "mixed",
  },
  "textile-garment": {
    avgRevenuePerUnit: 20_460,
    repaintCycleYears: 4,
    easeOfSaleScore: 9,
    nationalUnitBaseline: 320_000,
    archetype: "fragmented-opportunity",
  },
};

export function getClusterResearch(clusterId: string): ClusterResearch {
  return (
    CLUSTER_RESEARCH[clusterId] ?? {
      avgRevenuePerUnit: 50_000,
      repaintCycleYears: 4,
      easeOfSaleScore: 5,
      nationalUnitBaseline: 100_000,
      archetype: "mixed",
    }
  );
}
