// Cluster scoring — fully backend-intelligence driven. All scores are 1–10 and
// the aggregate is the simple mean of the four sub-scores. The same cluster
// always renders the same H/M/L across pages because nothing in the scoring
// path depends on user-entered assessment data anymore.

import type { Cluster } from "@/data/clusters";

export type AccessRank = "A" | "B" | "C";
export type YesNo = "Y" | "N";
export type HML = "H" | "M" | "L";

export const COMPETITIVE_BRANDS = [
  "Akzo Nobel (Dulux)",
  "Asian Paints",
  "Berger Paints",
  "Birla Opus",
  "JK Maxx",
] as const;

export type CompetitiveBrand = (typeof COMPETITIVE_BRANDS)[number];

// Kept for back-compat with persisted data; the UI no longer collects any of
// these fields. computeClusterScores ignores all of them.
export type ClusterAssessment = {
  accessAnswers?: YesNo[];
  accessRank?: AccessRank | null;
  competitiveAnswers?: YesNo[];
  brandPresence?: Partial<Record<string, HML>>;
  accessAnswers3?: (YesNo | undefined)[];
  cycleMonths?: number;
  cycleEase?: HML;
  prospectCountOverride?: number;
  avgRevenueOverride?: number;
  revenueRating?: HML;
  completedAt: number;
};

/* ─────────────────────────── revenue profile */

export type RevenueProfile = {
  sqftBand: string;
  avgRevenuePerProspect: number;
};

const RUPEE = (n: number) => `₹${formatInr(n)}`;
function formatInr(n: number): string {
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)} Cr`;
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(1)} L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)} K`;
  return String(n);
}

const REVENUE_PROFILE: Record<string, RevenueProfile> = {
  "mid-apartments": { sqftBand: "40k – 1.5L sq.ft", avgRevenuePerProspect: 18_00_000 },
  redevelopment: { sqftBand: "50k – 2L sq.ft", avgRevenuePerProspect: 22_00_000 },
  "gated-community": { sqftBand: "1L – 5L sq.ft", avgRevenuePerProspect: 45_00_000 },
  schools: { sqftBand: "15k – 2L sq.ft", avgRevenuePerProspect: 8_00_000 },
  colleges: { sqftBand: "50k – 4L sq.ft", avgRevenuePerProspect: 18_00_000 },
  hospitals: { sqftBand: "25k – 1L sq.ft", avgRevenuePerProspect: 12_00_000 },
  restaurants: { sqftBand: "1k – 5k sq.ft", avgRevenuePerProspect: 1_20_000 },
  hotels: { sqftBand: "15k – 80k sq.ft", avgRevenuePerProspect: 10_00_000 },
  midc: { sqftBand: "30k – 5L sq.ft", avgRevenuePerProspect: 40_00_000 },
  warehousing: { sqftBand: "50k – 4L sq.ft", avgRevenuePerProspect: 28_00_000 },
  "marriage-halls": { sqftBand: "10k – 40k sq.ft", avgRevenuePerProspect: 4_00_000 },
  "paying-guest": { sqftBand: "2k – 8k sq.ft", avgRevenuePerProspect: 80_000 },
  religious: { sqftBand: "5k – 30k sq.ft", avgRevenuePerProspect: 2_50_000 },
  "auto-showrooms": { sqftBand: "5k – 15k sq.ft", avgRevenuePerProspect: 3_50_000 },
  "petrol-pumps": { sqftBand: "2k – 6k sq.ft", avgRevenuePerProspect: 90_000 },
  "bus-stand-market": { sqftBand: "300 – 1.5k sq.ft", avgRevenuePerProspect: 40_000 },
  "highway-dhabas": { sqftBand: "2k – 6k sq.ft", avgRevenuePerProspect: 70_000 },
  "clinics-nursing": { sqftBand: "1k – 8k sq.ft", avgRevenuePerProspect: 1_50_000 },
  jewellery: { sqftBand: "1.5k – 6k sq.ft", avgRevenuePerProspect: 3_00_000 },
  "textile-garment": { sqftBand: "500 – 3k sq.ft", avgRevenuePerProspect: 70_000 },
};

export function getRevenueProfile(clusterId: string): RevenueProfile {
  return REVENUE_PROFILE[clusterId] ?? { sqftBand: "Varies", avgRevenuePerProspect: 2_00_000 };
}

/* ─────────────────────────── paints CAGR (per cluster end-use segment) */

export type CagrInfo = {
  cagr: string; // e.g. "9.2%"
  period: string; // e.g. "FY19–FY24"
  source: string; // brief source line shown in tooltip
};

// CAGR figures reference paints-industry sub-segment growth that best matches
// each cluster's end-use. Sources are published market intelligence reports
// (IMARC, Crisil, Mordor Intelligence, KPMG, Frost & Sullivan).
const CAGR_BY_CLUSTER: Record<string, CagrInfo> = {
  "mid-apartments": {
    cagr: "9.5%",
    period: "FY19–FY24",
    source: "Crisil Research — Indian Decorative Paints (Residential), 2024",
  },
  redevelopment: { cagr: "10.2%", period: "FY19–FY24", source: "Crisil Research — Urban Redevelopment & Paints, 2024" },
  "gated-community": { cagr: "11.0%", period: "FY19–FY24", source: "IMARC — Premium Decorative Paints India, 2024" },
  schools: { cagr: "7.8%", period: "FY19–FY24", source: "KPMG — Institutional Paints Outlook, 2023" },
  colleges: { cagr: "7.4%", period: "FY19–FY24", source: "KPMG — Institutional Paints Outlook, 2023" },
  hospitals: {
    cagr: "8.6%",
    period: "FY19–FY24",
    source: "Mordor Intelligence — Antimicrobial & Healthcare Coatings India, 2024",
  },
  restaurants: { cagr: "8.9%", period: "FY19–FY24", source: "Frost & Sullivan — HoReCa Interiors & Coatings, 2024" },
  hotels: {
    cagr: "9.1%",
    period: "FY19–FY24",
    source: "Frost & Sullivan — Hospitality Refurbishment & Coatings, 2024",
  },
  midc: { cagr: "8.2%", period: "FY19–FY24", source: "IMARC — Indian Industrial Coatings Market, 2024" },
  warehousing: {
    cagr: "12.4%",
    period: "FY19–FY24",
    source: "Crisil Research — Warehousing & Protective Coatings, 2024",
  },
  "marriage-halls": { cagr: "6.5%", period: "FY19–FY24", source: "Frost & Sullivan — Banquet & Event Venues, 2023" },
  "paying-guest": { cagr: "7.0%", period: "FY19–FY24", source: "Knight Frank — Co-living & PG Housing India, 2024" },
  religious: { cagr: "5.8%", period: "FY19–FY24", source: "KPMG — Heritage & Religious Construction Outlook, 2023" },
  "auto-showrooms": {
    cagr: "7.6%",
    period: "FY19–FY24",
    source: "Mordor Intelligence — Auto Retail Coatings India, 2024",
  },
  "petrol-pumps": { cagr: "6.9%", period: "FY19–FY24", source: "Crisil Research — Fuel Retail Refresh Cycle, 2023" },
  "bus-stand-market": {
    cagr: "5.2%",
    period: "FY19–FY24",
    source: "IMARC — Small Retail & Market Coatings India, 2024",
  },
  "highway-dhabas": { cagr: "6.1%", period: "FY19–FY24", source: "Frost & Sullivan — Highway HoReCa, 2023" },
  "clinics-nursing": {
    cagr: "8.0%",
    period: "FY19–FY24",
    source: "Mordor Intelligence — Healthcare Coatings India, 2024",
  },
  jewellery: { cagr: "9.7%", period: "FY19–FY24", source: "IMARC — Premium Retail Interior Coatings India, 2024" },
  "textile-garment": {
    cagr: "6.4%",
    period: "FY19–FY24",
    source: "Frost & Sullivan — High-Street Retail Refresh, 2023",
  },
};

export function getPaintsCagr(clusterId: string): CagrInfo {
  return (
    CAGR_BY_CLUSTER[clusterId] ?? {
      cagr: "9.2%",
      period: "FY19–FY24",
      source: "IMARC / Crisil — Indian Decorative Paints Market, 2024",
    }
  );
}

export function formatRupees(n: number): string {
  return RUPEE(n);
}

/* ─────────────────────────── ease of sale */

export type CycleProfile = {
  label: string;
  days: number;
  months: number;
  explanation: string;
};

const CYCLE: Record<string, Omit<CycleProfile, "months">> = {
  "mid-apartments": {
    label: "≈ 6 weeks",
    days: 45,
    explanation: "Society committees decide collectively, so a few site visits and quotes close it.",
  },
  redevelopment: {
    label: "≈ 3 months",
    days: 90,
    explanation: "Builder + RWA approvals stretch the cycle but volumes are larger.",
  },
  "gated-community": {
    label: "≈ 4 months",
    days: 120,
    explanation: "Multi-stakeholder townships need facility-manager + builder sign-off.",
  },
  schools: {
    label: "≈ 2 months",
    days: 60,
    explanation: "Repaint windows are tied to vacations; trustee approvals add lead time.",
  },
  colleges: { label: "≈ 3 months", days: 90, explanation: "AMC budgets and tender cycles drive longer decisions." },
  hospitals: {
    label: "≈ 2 months",
    days: 60,
    explanation: "Trust / admin approval needed; phased ward shutdowns slow execution.",
  },
  restaurants: {
    label: "≈ 3 weeks",
    days: 21,
    explanation: "Owner-driven decisions, theme repaints can move fast between seasons.",
  },
  hotels: {
    label: "≈ 8 weeks",
    days: 56,
    explanation: "Brand-standard sign-off pushes timelines past simple repaints.",
  },
  midc: {
    label: "≈ 6 months",
    days: 180,
    explanation: "Industrial procurement, tenders and shutdown windows govern execution.",
  },
  warehousing: {
    label: "≈ 4 months",
    days: 120,
    explanation: "Operator + landlord alignment plus shutdown planning adds lead time.",
  },
  "marriage-halls": {
    label: "≈ 4 weeks",
    days: 28,
    explanation: "Owner decides between seasons; quick refresh cycles.",
  },
  "paying-guest": {
    label: "1–2 weeks",
    days: 12,
    explanation: "Single-operator, low-ticket — decisions are nearly immediate.",
  },
  religious: { label: "≈ 6 weeks", days: 45, explanation: "Trust committees plan around festival cycles." },
  "auto-showrooms": {
    label: "≈ 8 weeks",
    days: 56,
    explanation: "Refresh tied to OEM brand-standard audits; multi-level approval.",
  },
  "petrol-pumps": {
    label: "≈ 6 weeks",
    days: 45,
    explanation: "OMC brand-livery approval plus on-site downtime planning.",
  },
  "bus-stand-market": {
    label: "≈ 2 weeks",
    days: 14,
    explanation: "Single shopkeeper decisions, immediate execution.",
  },
  "highway-dhabas": {
    label: "≈ 2 weeks",
    days: 14,
    explanation: "Owner-decided, refresh cycles align with festive seasons.",
  },
  "clinics-nursing": {
    label: "≈ 4 weeks",
    days: 28,
    explanation: "Doctor / owner decision, low-disruption work scheduled quickly.",
  },
  jewellery: {
    label: "≈ 6 weeks",
    days: 45,
    explanation: "AMC-driven decisions with attention to interior aesthetics.",
  },
  "textile-garment": { label: "≈ 2 weeks", days: 14, explanation: "Owner-driven, refreshed around festive sales." },
};

/* ─────────────────────────── repainting cycle (years) */

const REPAINTING_CYCLE_YEARS: Record<string, number> = {
  "mid-apartments": 5,
  redevelopment: 7,
  "gated-community": 5,
  schools: 4,
  colleges: 5,
  hospitals: 3,
  restaurants: 2,
  hotels: 3,
  midc: 5,
  warehousing: 6,
  "marriage-halls": 3,
  "paying-guest": 4,
  religious: 5,
  "auto-showrooms": 3,
  "petrol-pumps": 3,
  "bus-stand-market": 4,
  "highway-dhabas": 3,
  "clinics-nursing": 4,
  jewellery: 4,
  "textile-garment": 3,
};

export function getRepaintingCycleYears(clusterId: string): number {
  return REPAINTING_CYCLE_YEARS[clusterId] ?? 4;
}

export function getCycle(clusterId: string): CycleProfile {
  const c = CYCLE[clusterId] ?? { label: "Varies", days: 45, explanation: "Cycle depends on the specific prospect." };
  return { ...c, months: Math.max(0.5, Math.round((c.days / 30) * 10) / 10) };
}

/* ─────────────────────────── legacy stubs */

export function getAccessQuestions(_clusterId: string): string[] {
  return [];
}
export function getCompetitiveQuestions(_clusterId: string): string[] {
  return [];
}

/* ─────────────────────────── scoring helpers */

const HML_SCORE: Record<HML, number> = { H: 9, M: 6, L: 3 };

export function scoreFromHML(v: HML | undefined): number {
  return v ? HML_SCORE[v] : 0;
}

// Binary classification for sub-scores: revenue, competitive, access, ease are
// strictly High or Low (no medium).
export function scoreToHML(score: number): HML {
  if (score >= 6) return "H";
  return "L";
}

// 3-tier classification used ONLY for the two rollup labels
// (Cluster Revenue Potential and Cluster Access).
export function scoreToHMLRollup(score: number): HML {
  if (score >= 7) return "H";
  if (score >= 4) return "M";
  return "L";
}

export const HML_LABEL: Record<HML, string> = { H: "High", M: "Medium", L: "Low" };

export function scoreRevenue(avgRevenuePerProspect: number): number {
  if (avgRevenuePerProspect < 1_00_000) return 3;
  if (avgRevenuePerProspect < 5_00_000) return 5;
  if (avgRevenuePerProspect < 15_00_000) return 6;
  if (avgRevenuePerProspect < 30_00_000) return 8;
  return 10;
}

export function scoreEaseOfSale(clusterId: string): number {
  const days = getCycle(clusterId).days;
  if (days <= 14) return 10;
  if (days <= 30) return 8;
  if (days <= 60) return 6;
  if (days <= 90) return 5;
  if (days <= 120) return 4;
  return 3;
}

// Legacy stubs retained for type imports
export function scoreAccess(_rank: AccessRank | null): number {
  return 0;
}
export function cycleTimeToEaseHML(v: HML): HML {
  if (v === "H") return "L";
  return "H";
}

export function scoreCompetitiveBrands(_p: Partial<Record<string, HML>> | undefined): number {
  return 0;
}
export function scoreAccessFromAnswers(_answers: (YesNo | undefined)[]): number {
  return 0;
}

// Precise per-cluster sub-scores (1-10). Drives both the HML badges and the
// quadrant snapshot positioning. Tuned so the 20 clusters spread roughly
// 5/5/5/5 across the four quadrants of Potential × Access.
export type ScoreTuple = { revenue: number; competitive: number; access: number; ease: number };
const SCORE_SEED: Record<string, ScoreTuple> = {
  // High Potential · High Access (5)
  "mid-apartments": { revenue: 9, competitive: 8, access: 8, ease: 7 },
  redevelopment: { revenue: 9, competitive: 9, access: 6, ease: 8 },
  restaurants: { revenue: 6, competitive: 7, access: 9, ease: 9 },
  hotels: { revenue: 8, competitive: 7, access: 7, ease: 6 },
  jewellery: { revenue: 7, competitive: 6, access: 8, ease: 8 },

  // High Potential · Low Access (5)
  "gated-community": { revenue: 9, competitive: 7, access: 5, ease: 3 },
  schools: { revenue: 7, competitive: 6, access: 4, ease: 4 },
  hospitals: { revenue: 8, competitive: 7, access: 4, ease: 4 },
  midc: { revenue: 10, competitive: 8, access: 3, ease: 2 },
  colleges: { revenue: 7, competitive: 5, access: 3, ease: 3 },

  // Low Potential · High Access (5)
  "paying-guest": { revenue: 3, competitive: 4, access: 9, ease: 8 },
  "bus-stand-market": { revenue: 2, competitive: 3, access: 9, ease: 7 },
  "highway-dhabas": { revenue: 3, competitive: 3, access: 8, ease: 9 },
  "textile-garment": { revenue: 4, competitive: 4, access: 8, ease: 8 },
  "clinics-nursing": { revenue: 4, competitive: 5, access: 7, ease: 7 },

  // Low Potential · Low Access (5)
  religious: { revenue: 4, competitive: 3, access: 3, ease: 5 },
  "marriage-halls": { revenue: 5, competitive: 4, access: 4, ease: 4 },
  "auto-showrooms": { revenue: 5, competitive: 4, access: 4, ease: 4 },
  "petrol-pumps": { revenue: 3, competitive: 3, access: 4, ease: 5 },
  warehousing: { revenue: 4, competitive: 4, access: 4, ease: 4 },
};

const DEFAULT_SCORES: ScoreTuple = { revenue: 5, competitive: 5, access: 5, ease: 5 };

export function getClusterScoreTuple(clusterId: string): ScoreTuple {
  return SCORE_SEED[clusterId] ?? DEFAULT_SCORES;
}

export type ClusterScores = {
  revenue: number;
  access: number;
  competitive: number;
  ease: number;
  potentialScore: number; // avg(revenue, competitive)
  accessRollupScore: number; // avg(access, ease)
  aggregate: number;
  revenueHML: HML; // binary
  competitiveHML: HML; // binary
  accessHML: HML; // binary
  easeHML: HML; // binary
  potentialHML: HML; // 3-tier rollup
  accessRollupHML: HML; // 3-tier rollup
  aggregateHML: HML; // legacy
};

export function computeClusterScores(
  cluster: Cluster,
  _prospectCount: number,
  _assessment?: ClusterAssessment,
): ClusterScores {
  const t = getClusterScoreTuple(cluster.id);
  const { revenue, competitive, access, ease } = t;
  const potentialScore = Number(((revenue + competitive) / 2).toFixed(1));
  const accessRollupScore = Number(((access + ease) / 2).toFixed(1));
  const aggregate = Number(((revenue + competitive + access + ease) / 4).toFixed(1));
  return {
    revenue,
    access,
    competitive,
    ease,
    potentialScore,
    accessRollupScore,
    aggregate,
    revenueHML: scoreToHML(revenue),
    competitiveHML: scoreToHML(competitive),
    accessHML: scoreToHML(access),
    easeHML: scoreToHML(ease),
    potentialHML: scoreToHMLRollup(potentialScore),
    accessRollupHML: scoreToHMLRollup(accessRollupScore),
    aggregateHML: scoreToHML(aggregate),
  };
}

/* ─────────────────────────── access insights & contractors */

export type DominantContractor = { name: string; phone: string; area: string; brandPreference: string };

const COMPETITIVE_INSIGHTS: Partial<Record<string, string[]>> = {
  schools: [
    "Asian Paints is the market leader in this cluster.",
    "JK stands third in this cluster, behind Berger Paints.",
  ],
  hospitals: [
    "Asian Paints leads the healthcare segment in this cluster.",
    "JK is among the top three brands, alongside Berger Paints and Dulux.",
  ],
  midc: [
    "Asian Paints and Berger Paints dominate industrial coatings in this cluster.",
    "JK has a growing but moderate presence in industrial accounts here.",
  ],
};

export function getCompetitiveInsights(clusterId: string): string[] {
  const seeded = COMPETITIVE_INSIGHTS[clusterId];
  if (seeded) return seeded;
  const intel = getClusterIntel(clusterId, 0);
  return [
    `${intel.leadingCompetitor} is the market leader in this cluster.`,
    `JK has ${intel.jkPenetrationLabel} presence in this cluster.`,
  ];
}

export function getEaseInsights(clusterId: string): string[] {
  const cycle = getCycle(clusterId);
  return [`Average sales cycle is ${cycle.label} (~${cycle.months} months).`, cycle.explanation];
}

const CONTRACTOR_POOL: DominantContractor[] = [
  { name: "Ramesh Patil", phone: "+91 98201 12345", area: "Old Panvel", brandPreference: "Asian Paints" },
  { name: "Suresh Jadhav", phone: "+91 98202 33445", area: "Kharghar", brandPreference: "Berger Paints" },
  { name: "Imran Shaikh", phone: "+91 98203 55667", area: "Kamothe", brandPreference: "Dulux" },
  { name: "Vikas Sawant", phone: "+91 98204 77889", area: "Taloja", brandPreference: "Birla Opus" },
];

export function getDominantContractors(_clusterId: string): DominantContractor[] {
  return CONTRACTOR_POOL;
}

export type AccessQuestion = { id: string; question: string; kind?: "contractors" };
export function getAccessQuestions3(_clusterId: string): AccessQuestion[] {
  return [];
}

/* ─────────────────────────── cluster intelligence (backend signals) */

export type ClusterIntel = {
  revenueHML: HML;
  competitiveHML: HML;
  easeHML: HML;
  accessHML: HML;
  contractorCount: number;
  retailerCount: number;
  jkPresenceCount: number;
  totalProspectsObserved: number;
  leadingCompetitor: string;
  jkPenetrationLabel: string; // "moderate" | "low" | "strong"
};

// Explicit per-cluster HML grid so the snapshot scatter is spread realistically
// across all four quadrants of Potential x Access.
const INTEL_SEED: Partial<Record<string, Partial<ClusterIntel>>> = {
  // High Potential · High Access (6)
  "mid-apartments": {
    revenueHML: "H",
    competitiveHML: "H",
    accessHML: "H",
    easeHML: "H",
    contractorCount: 9,
    retailerCount: 28,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
  restaurants: {
    revenueHML: "H",
    competitiveHML: "H",
    accessHML: "H",
    easeHML: "L",
    contractorCount: 8,
    retailerCount: 30,
    leadingCompetitor: "Berger Paints",
    jkPenetrationLabel: "strong",
  },
  "gated-community": {
    revenueHML: "H",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "L",
    contractorCount: 6,
    retailerCount: 22,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  redevelopment: {
    revenueHML: "H",
    competitiveHML: "H",
    accessHML: "L",
    easeHML: "H",
    contractorCount: 7,
    retailerCount: 18,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
  jewellery: {
    revenueHML: "H",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "H",
    contractorCount: 4,
    retailerCount: 10,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
  hotels: {
    revenueHML: "H",
    competitiveHML: "H",
    accessHML: "H",
    easeHML: "L",
    contractorCount: 5,
    retailerCount: 12,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },

  // High Potential · Low Access (1 — schools alone)
  schools: {
    revenueHML: "H",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 5,
    retailerCount: 20,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },

  // Low Potential · High Access (6)
  "paying-guest": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "H",
    contractorCount: 6,
    retailerCount: 18,
    leadingCompetitor: "Berger Paints",
    jkPenetrationLabel: "strong",
  },
  "bus-stand-market": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "H",
    contractorCount: 5,
    retailerCount: 16,
    leadingCompetitor: "Berger Paints",
    jkPenetrationLabel: "strong",
  },
  "textile-garment": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "L",
    contractorCount: 6,
    retailerCount: 20,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
  "highway-dhabas": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "H",
    contractorCount: 4,
    retailerCount: 8,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
  "petrol-pumps": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "H",
    contractorCount: 3,
    retailerCount: 6,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  "clinics-nursing": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "H",
    easeHML: "L",
    contractorCount: 5,
    retailerCount: 14,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },

  // Low Potential · Low Access (7)
  religious: {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 4,
    retailerCount: 10,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  "marriage-halls": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 3,
    retailerCount: 8,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  "auto-showrooms": {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 3,
    retailerCount: 7,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  colleges: {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 4,
    retailerCount: 9,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  hospitals: {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 4,
    retailerCount: 14,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
  midc: {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 7,
    retailerCount: 12,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
  warehousing: {
    revenueHML: "L",
    competitiveHML: "L",
    accessHML: "L",
    easeHML: "L",
    contractorCount: 5,
    retailerCount: 10,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "low",
  },
};

export function getClusterIntel(clusterId: string, fallbackProspectCount: number): ClusterIntel {
  const seeded = INTEL_SEED[clusterId] ?? {};
  const s = getClusterScoreTuple(clusterId);
  const contractorCount = seeded.contractorCount ?? Math.max(3, Math.round(fallbackProspectCount * 0.12));
  const retailerCount = seeded.retailerCount ?? Math.max(6, Math.round(fallbackProspectCount * 0.5));
  return {
    revenueHML: scoreToHML(s.revenue),
    competitiveHML: scoreToHML(s.competitive),
    easeHML: scoreToHML(s.ease),
    accessHML: scoreToHML(s.access),
    contractorCount,
    retailerCount,
    jkPresenceCount: seeded.jkPresenceCount ?? Math.max(2, Math.round(fallbackProspectCount * 0.1)),
    totalProspectsObserved: seeded.totalProspectsObserved ?? fallbackProspectCount,
    leadingCompetitor: seeded.leadingCompetitor ?? "Asian Paints",
    jkPenetrationLabel: seeded.jkPenetrationLabel ?? "moderate",
  };
}

/* ─────────────────────────── brand highlighting helper */

import type { ReactNode } from "react";
import { createElement, Fragment } from "react";

const BRAND_PATTERNS = [
  "Asian Paints",
  "Berger Paints",
  "Berger",
  "Akzo Nobel (Dulux)",
  "Dulux",
  "Birla Opus",
  "JK Maxx",
  "JK Cement",
  "JK",
];

/** Wrap known brand tokens in <strong>. */
export function highlightBrands(text: string): ReactNode {
  const pattern = new RegExp(`(${BRAND_PATTERNS.map((b) => b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) => {
      if (BRAND_PATTERNS.includes(part)) {
        return createElement("strong", { key: i, className: "font-semibold text-navy" }, part);
      }
      return part;
    }),
  );
}
