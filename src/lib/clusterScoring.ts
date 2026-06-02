// Cluster scoring — deterministic frontend lookups. All scores are 1–10 and
// the aggregate is the simple mean of the four sub-scores (25% each).

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

export type ClusterAssessment = {
  // Kept for back-compat (no longer driven by UI)
  accessAnswers: YesNo[];
  accessRank: AccessRank | null;
  competitiveAnswers: YesNo[];
  // New: brand presence H/M/L
  brandPresence?: Partial<Record<string, HML>>;
  // Editable overrides
  cycleMonths?: number;
  cycleEase?: HML;
  prospectCountOverride?: number;
  avgRevenueOverride?: number;
  revenueRating?: HML;
  completedAt: number;
};

/* ─────────────────────────────────────────── revenue profile */

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
  "mid-apartments":   { sqftBand: "40k – 1.5L sq.ft",  avgRevenuePerProspect: 18_00_000 },
  redevelopment:      { sqftBand: "50k – 2L sq.ft",    avgRevenuePerProspect: 22_00_000 },
  "gated-community":  { sqftBand: "1L – 5L sq.ft",     avgRevenuePerProspect: 45_00_000 },
  schools:            { sqftBand: "15k – 2L sq.ft",    avgRevenuePerProspect: 8_00_000 },
  colleges:           { sqftBand: "50k – 4L sq.ft",    avgRevenuePerProspect: 18_00_000 },
  hospitals:          { sqftBand: "25k – 1L sq.ft",    avgRevenuePerProspect: 12_00_000 },
  restaurants:        { sqftBand: "1k – 5k sq.ft",     avgRevenuePerProspect: 1_20_000 },
  hotels:             { sqftBand: "15k – 80k sq.ft",   avgRevenuePerProspect: 10_00_000 },
  midc:               { sqftBand: "30k – 5L sq.ft",    avgRevenuePerProspect: 40_00_000 },
  warehousing:        { sqftBand: "50k – 4L sq.ft",    avgRevenuePerProspect: 28_00_000 },
  "marriage-halls":   { sqftBand: "10k – 40k sq.ft",   avgRevenuePerProspect: 4_00_000 },
  "paying-guest":     { sqftBand: "2k – 8k sq.ft",     avgRevenuePerProspect: 80_000 },
  religious:          { sqftBand: "5k – 30k sq.ft",    avgRevenuePerProspect: 2_50_000 },
  "auto-showrooms":   { sqftBand: "5k – 15k sq.ft",    avgRevenuePerProspect: 3_50_000 },
  "petrol-pumps":     { sqftBand: "2k – 6k sq.ft",     avgRevenuePerProspect: 90_000 },
  "bus-stand-market": { sqftBand: "300 – 1.5k sq.ft",  avgRevenuePerProspect: 40_000 },
  "highway-dhabas":   { sqftBand: "2k – 6k sq.ft",     avgRevenuePerProspect: 70_000 },
  "clinics-nursing":  { sqftBand: "1k – 8k sq.ft",     avgRevenuePerProspect: 1_50_000 },
  jewellery:          { sqftBand: "1.5k – 6k sq.ft",   avgRevenuePerProspect: 3_00_000 },
  "textile-garment":  { sqftBand: "500 – 3k sq.ft",    avgRevenuePerProspect: 70_000 },
};

export function getRevenueProfile(clusterId: string): RevenueProfile {
  return REVENUE_PROFILE[clusterId] ?? { sqftBand: "Varies", avgRevenuePerProspect: 2_00_000 };
}

export function formatRupees(n: number): string {
  return RUPEE(n);
}

/* ─────────────────────────────────────────── ease of sale */

export type CycleProfile = {
  label: string;
  days: number;
  months: number;
  explanation: string;
};

const CYCLE: Record<string, Omit<CycleProfile, "months">> = {
  "mid-apartments":   { label: "≈ 6 weeks",  days: 45,  explanation: "Society committees decide collectively, so a few site visits and quotes close it." },
  redevelopment:      { label: "≈ 3 months", days: 90,  explanation: "Builder + RWA approvals stretch the cycle but volumes are larger." },
  "gated-community":  { label: "≈ 4 months", days: 120, explanation: "Multi-stakeholder townships need facility-manager + builder sign-off." },
  schools:            { label: "≈ 2 months", days: 60,  explanation: "Repaint windows are tied to vacations; trustee approvals add lead time." },
  colleges:           { label: "≈ 3 months", days: 90,  explanation: "AMC budgets and tender cycles drive longer decisions." },
  hospitals:          { label: "≈ 2 months", days: 60,  explanation: "Trust / admin approval needed; phased ward shutdowns slow execution." },
  restaurants:        { label: "≈ 3 weeks",  days: 21,  explanation: "Owner-driven decisions, theme repaints can move fast between seasons." },
  hotels:             { label: "≈ 8 weeks",  days: 56,  explanation: "Brand-standard sign-off pushes timelines past simple repaints." },
  midc:               { label: "≈ 6 months", days: 180, explanation: "Industrial procurement, tenders and shutdown windows govern execution." },
  warehousing:        { label: "≈ 4 months", days: 120, explanation: "Operator + landlord alignment plus shutdown planning adds lead time." },
  "marriage-halls":   { label: "≈ 4 weeks",  days: 28,  explanation: "Owner decides between seasons; quick refresh cycles." },
  "paying-guest":     { label: "1–2 weeks",  days: 12,  explanation: "Single-operator, low-ticket — decisions are nearly immediate." },
  religious:          { label: "≈ 6 weeks",  days: 45,  explanation: "Trust committees plan around festival cycles." },
  "auto-showrooms":   { label: "≈ 8 weeks",  days: 56,  explanation: "Refresh tied to OEM brand-standard audits; multi-level approval." },
  "petrol-pumps":     { label: "≈ 6 weeks",  days: 45,  explanation: "OMC brand-livery approval plus on-site downtime planning." },
  "bus-stand-market": { label: "≈ 2 weeks",  days: 14,  explanation: "Single shopkeeper decisions, immediate execution." },
  "highway-dhabas":   { label: "≈ 2 weeks",  days: 14,  explanation: "Owner-decided, refresh cycles align with festive seasons." },
  "clinics-nursing":  { label: "≈ 4 weeks",  days: 28,  explanation: "Doctor / owner decision, low-disruption work scheduled quickly." },
  jewellery:          { label: "≈ 6 weeks",  days: 45,  explanation: "AMC-driven decisions with attention to interior aesthetics." },
  "textile-garment":  { label: "≈ 2 weeks",  days: 14,  explanation: "Owner-driven, refreshed around festive sales." },
};

export function getCycle(clusterId: string): CycleProfile {
  const c = CYCLE[clusterId] ?? { label: "Varies", days: 45, explanation: "Cycle depends on the specific prospect." };
  return { ...c, months: Math.max(0.5, Math.round((c.days / 30) * 10) / 10) };
}

/* ─────────────────────────────────────────── legacy capability questions (kept for back-compat with stored data) */

export function getAccessQuestions(_clusterId: string): string[] {
  return [];
}
export function getCompetitiveQuestions(_clusterId: string): string[] {
  return [];
}

/* ─────────────────────────────────────────── scoring */

export function scoreRevenue(avgRevenuePerProspect: number): number {
  if (avgRevenuePerProspect < 1_00_000) return 2;
  if (avgRevenuePerProspect < 5_00_000) return 4;
  if (avgRevenuePerProspect < 15_00_000) return 6;
  if (avgRevenuePerProspect < 30_00_000) return 8;
  return 10;
}

export function scoreAccess(rank: AccessRank | null): number {
  if (rank === "A") return 10;
  if (rank === "B") return 7;
  if (rank === "C") return 3;
  return 0;
}

const HML_SCORE: Record<HML, number> = { H: 10, M: 6, L: 2 };

export function scoreFromHML(v: HML | undefined): number {
  return v ? HML_SCORE[v] : 0;
}

export function cycleTimeToEaseHML(v: HML): HML {
  if (v === "H") return "L";
  if (v === "L") return "H";
  return "M";
}

/** Brand-presence competitive score.
 * - For competitors (non-JK): Low presence = strong for JK → L=10, M=6, H=2.
 * - For JK Maxx: High presence = strong for JK → H=10, M=6, L=2.
 * Returns 0 if nothing rated.
 */
export function scoreCompetitiveBrands(presence: Partial<Record<string, HML>> | undefined): number {
  if (!presence) return 0;
  const vals: number[] = [];
  for (const brand of COMPETITIVE_BRANDS) {
    const v = presence[brand];
    if (!v) continue;
    if (brand === "JK Maxx") vals.push(HML_SCORE[v]);
    else vals.push(({ L: 10, M: 6, H: 2 } as const)[v]);
  }
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export function scoreEaseOfSale(clusterId: string, cycleMonthsOverride?: number): number {
  const days = cycleMonthsOverride !== undefined ? cycleMonthsOverride * 30 : getCycle(clusterId).days;
  if (days <= 14) return 10;
  if (days <= 30) return 8;
  if (days <= 60) return 6;
  if (days <= 90) return 5;
  if (days <= 120) return 3;
  return 2;
}

export type ClusterScores = {
  revenue: number;
  access: number;
  competitive: number;
  ease: number;
  aggregate: number;
};

export function computeClusterScores(
  cluster: Cluster,
  prospectCount: number,
  assessment: ClusterAssessment,
): ClusterScores {
  const profile = getRevenueProfile(cluster.id);
  void prospectCount;
  const avg = assessment.avgRevenueOverride ?? profile.avgRevenuePerProspect;
  const revenue = assessment.revenueRating ? scoreFromHML(assessment.revenueRating) : scoreRevenue(avg);
  const access = scoreAccess(assessment.accessRank);
  const competitive = scoreCompetitiveBrands(assessment.brandPresence);
  const ease = assessment.cycleEase ? scoreFromHML(cycleTimeToEaseHML(assessment.cycleEase)) : scoreEaseOfSale(cluster.id, assessment.cycleMonths);
  const aggregate = Number(((revenue + access + competitive + ease) / 4).toFixed(1));
  return { revenue, access, competitive, ease, aggregate };
}

/** Convert a numeric 0–10 score to H/M/L. */
export function scoreToHML(score: number): HML {
  if (score >= 7) return "H";
  if (score >= 4) return "M";
  return "L";
}

export const HML_LABEL: Record<HML, string> = { H: "High", M: "Medium", L: "Low" };

/* ─────────────────────────────────────────── cluster intelligence (backend signals) */

export type ClusterIntel = {
  revenueHML: HML;
  competitiveHML: HML;
  easeHML: HML;
  contractorCount: number;
  jkPresenceCount: number;
  totalProspectsObserved: number;
  leadingCompetitor: string;
  jkPenetrationLabel: string; // e.g. "moderate", "low", "strong"
};

const INTEL: Partial<Record<string, ClusterIntel>> = {
  schools: {
    revenueHML: "H",
    competitiveHML: "M",
    easeHML: "M",
    contractorCount: 6,
    jkPresenceCount: 6,
    totalProspectsObserved: 60,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  },
};

export function getClusterIntel(clusterId: string, fallbackProspectCount: number): ClusterIntel {
  const seeded = INTEL[clusterId];
  if (seeded) return seeded;
  // Derive a reasonable default from existing scoring tables
  const profile = getRevenueProfile(clusterId);
  const revenueHML = scoreToHML(scoreRevenue(profile.avgRevenuePerProspect));
  const easeHML = scoreToHML(scoreEaseOfSale(clusterId));
  const jk = Math.max(2, Math.round(fallbackProspectCount * 0.1));
  return {
    revenueHML,
    competitiveHML: "M",
    easeHML,
    contractorCount: Math.max(3, Math.round(fallbackProspectCount * 0.12)),
    jkPresenceCount: jk,
    totalProspectsObserved: fallbackProspectCount,
    leadingCompetitor: "Asian Paints",
    jkPenetrationLabel: "moderate",
  };
}
