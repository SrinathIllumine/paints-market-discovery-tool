// Cluster scoring "intelligence" — deterministic frontend lookups that simulate
// what a backend model would compute. All scores are on a 1–10 scale; the
// aggregate "Cluster Potential" is the simple mean of the four sub-scores
// (equal 25% weight each), per the spec.

import type { Cluster } from "@/data/clusters";

export type AccessRank = "A" | "B" | "C";

export type YesNo = "Y" | "N";

export type ClusterAssessment = {
  // Capability questions: ordered yes/no answers, aligned with getAccessQuestions().
  accessAnswers: YesNo[];
  accessRank: AccessRank | null;
  // Competitive yes/no answers, aligned with getCompetitiveQuestions().
  competitiveAnswers: YesNo[];
  completedAt: number;
};

/* ─────────────────────────────────────────── revenue profile */

export type RevenueProfile = {
  /** Average usable area for one prospect (e.g. "15k – 2L sq.ft"). */
  sqftBand: string;
  /** Average revenue (₹) per prospect on a typical paint cycle. */
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
  /** Short human label, e.g. "≈ 2 months". */
  label: string;
  /** Average cycle in days (used for scoring). */
  days: number;
  /** One-line explanation. */
  explanation: string;
};

const CYCLE: Record<string, CycleProfile> = {
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
  return CYCLE[clusterId] ?? { label: "Varies", days: 45, explanation: "Cycle depends on the specific prospect." };
}

/* ─────────────────────────────────────────── cluster-specific questions */

export function getAccessQuestions(clusterId: string): string[] {
  const map: Record<string, string[]> = {
    schools: [
      "Do you already have a connect with any school principals or trustees?",
      "Do you know contractors who regularly take up school repaint jobs?",
    ],
    colleges: [
      "Do you have a touchpoint with any campus admin or estate department?",
      "Do you know AMC contractors working on college campuses?",
    ],
    "mid-apartments": [
      "Do you have a touchpoint with society chairmen or secretaries?",
      "Do you know painting contractors active in mid-sized societies?",
    ],
    redevelopment: [
      "Do you have a connect with any redevelopment builders in the area?",
      "Do you know contractors handling redevelopment finishing work?",
    ],
    "gated-community": [
      "Do you have a connect with any RWA office-bearers or facility managers?",
      "Do you know contractors empanelled with gated townships?",
    ],
    midc: [
      "Do you have a touchpoint with any plant maintenance heads in the MIDC?",
      "Do you know industrial coating contractors active in Taloja?",
    ],
    warehousing: [
      "Do you have a connect with warehouse operators or 3PL companies?",
      "Do you know PEB / industrial painting contractors in the area?",
    ],
    hospitals: [
      "Do you have a touchpoint with any hospital admin or facility heads?",
      "Do you know contractors working on hospital interiors?",
    ],
    restaurants: [
      "Do you have a connect with restaurant owners or F&B fit-out designers?",
      "Do you know contractors who do quick-turnaround interior repaints?",
    ],
    hotels: [
      "Do you have a touchpoint with any hotel GM or maintenance head?",
      "Do you know contractors empanelled for hospitality refurbishments?",
    ],
    "marriage-halls": [
      "Do you have a connect with banquet owners or event-venue managers?",
      "Do you know contractors active in banquet repaint work?",
    ],
    "paying-guest": [
      "Do you have a touchpoint with any PG operator in the area?",
      "Do you know painters who service PG / hostel turnover work?",
    ],
    religious: [
      "Do you have a connect with temple / trust committee members?",
      "Do you know contractors who take up religious-building repaints?",
    ],
    "auto-showrooms": [
      "Do you have a touchpoint with dealer-principals of any showrooms?",
      "Do you know contractors empanelled for OEM brand-livery refreshes?",
    ],
    "petrol-pumps": [
      "Do you have a connect with petrol-pump dealers or OMC officials?",
      "Do you know contractors handling canopy / forecourt repaints?",
    ],
    "bus-stand-market": [
      "Do you have a connect with shop owners or the market association?",
      "Do you know local painters who do shopfront refreshes?",
    ],
    "highway-dhabas": [
      "Do you have a touchpoint with any highway dhaba or motel owners?",
      "Do you know painters who handle highway-property repaints?",
    ],
    "clinics-nursing": [
      "Do you have a touchpoint with any local clinic owners or doctors?",
      "Do you know contractors handling clinic / nursing-home interiors?",
    ],
    jewellery: [
      "Do you have a connect with jewellery showroom owners or AMC vendors?",
      "Do you know contractors empanelled for luxury retail interiors?",
    ],
    "textile-garment": [
      "Do you have a touchpoint with garment shop owners or the local market body?",
      "Do you know painters who do retail interior refreshes between seasons?",
    ],
  };
  return map[clusterId] ?? [
    "Do you already have any direct touchpoints in this cluster?",
    "Do you know contractors who service this cluster regularly?",
  ];
}

export function getCompetitiveQuestions(clusterId: string): string[] {
  const map: Record<string, string[]> = {
    schools: [
      "Are most of the leading schools in this area already JK customers?",
      "Do you have a school-specific product story that beats competitors?",
      "Have you closed any school orders in this area in the last 12 months?",
    ],
    midc: [
      "Do you have a clear product advantage for industrial coatings here?",
      "Are the larger plants in this MIDC pocket already JK customers?",
      "Have we historically been the preferred brand for industrial repaints here?",
    ],
    "mid-apartments": [
      "Have we closed orders in the larger societies in this area recently?",
      "Do you have a society-friendly product story that wins on durability?",
      "Are JK painters / contractors the most active in this society pocket?",
    ],
    "gated-community": [
      "Are any premium townships in this belt already JK customers?",
      "Do you have a premium-finish story that suits gated communities?",
      "Have we been recommended by any builder or facility manager here?",
    ],
    redevelopment: [
      "Do you have a redevelopment-builder relationship in this area?",
      "Have we executed any redevelopment handover paint jobs recently?",
      "Is JK seen as the preferred premium brand for handover finishes here?",
    ],
    hospitals: [
      "Do you have a hygienic / antimicrobial story tailored for hospitals?",
      "Are any major hospitals in the area already JK customers?",
      "Have you won AMC paint work in any healthcare facility recently?",
    ],
    warehousing: [
      "Are the larger logistics parks in this area already JK customers?",
      "Do you have a clear edge on durable industrial coatings here?",
      "Have we recently executed any large warehouse repaints in the area?",
    ],
  };
  return map[clusterId] ?? [
    "Is this a cluster where we have clear product advantages?",
    "Have we traditionally been a leader in this cluster?",
    "Are most of the top prospects in this cluster already our customers?",
  ];
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

export function scoreCompetitive(yes: number, total: number): number {
  if (total === 0) return 0;
  const r = yes / total;
  if (r >= 0.85) return 10;
  if (r >= 0.6) return 8;
  if (r >= 0.4) return 6;
  if (r >= 0.2) return 4;
  return 2;
}

export function scoreEaseOfSale(clusterId: string): number {
  const days = getCycle(clusterId).days;
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
  /** Mean of the four sub-scores, 1 dp. */
  aggregate: number;
};

export function computeClusterScores(
  cluster: Cluster,
  prospectCount: number,
  assessment: ClusterAssessment,
): ClusterScores {
  const profile = getRevenueProfile(cluster.id);
  void prospectCount;
  const revenue = scoreRevenue(profile.avgRevenuePerProspect);
  const access = scoreAccess(assessment.accessRank);
  const compYes = assessment.competitiveAnswers.filter((a) => a === "Y").length;
  const competitive = scoreCompetitive(compYes, assessment.competitiveAnswers.length);
  const ease = scoreEaseOfSale(cluster.id);
  const aggregate = Number(((revenue + access + competitive + ease) / 4).toFixed(1));
  return { revenue, access, competitive, ease, aggregate };
}
