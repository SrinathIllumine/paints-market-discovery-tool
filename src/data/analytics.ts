export type QuadrantKey = "priority" | "opportunity" | "maintain" | "deprioritize";

export const QUADRANTS: Record<
  QuadrantKey,
  { key: QuadrantKey; label: string; short: string; meaning: string; tone: "good" | "info" | "warn" | "critical" }
> = {
  priority: {
    key: "priority",
    label: "High Potential · High Access",
    short: "Priority",
    meaning: "High revenue potential, strong DG access. Should be the focus.",
    tone: "good",
  },
  opportunity: {
    key: "opportunity",
    label: "High Potential · Low Access",
    short: "Opportunity",
    meaning: "High revenue potential, but DGs lack access — worth building.",
    tone: "info",
  },
  maintain: {
    key: "maintain",
    label: "Low Potential · High Access",
    short: "Maintain",
    meaning: "Easy to reach, limited upside — engage selectively.",
    tone: "warn",
  },
  deprioritize: {
    key: "deprioritize",
    label: "Low Potential · Low Access",
    short: "Deprioritize",
    meaning: "Low return, hard to penetrate — redirect effort elsewhere.",
    tone: "critical",
  },
};

export type AccessLevel = "High" | "Low";

export type ClusterRow = {
  cluster: string;
  quadrant: QuadrantKey;
  revenue: number | null; // ₹ Cr
  access: AccessLevel;
};

/** National cluster-wise market overview (₹ Cr) */
export const NATIONAL_CLUSTERS: ClusterRow[] = [
  { cluster: "Mid-Size Apartment Buildings / Residential Societies", quadrant: "priority", revenue: 22000, access: "High" },
  { cluster: "Gated Community Projects", quadrant: "priority", revenue: 10000, access: "High" },
  { cluster: "Redevelopment Housing Projects", quadrant: "opportunity", revenue: 8000, access: "Low" },
  { cluster: "Hospitals & Healthcare Buildings", quadrant: "opportunity", revenue: 5500, access: "Low" },
  { cluster: "Hotels / Resorts / Lodges", quadrant: "priority", revenue: 5000, access: "High" },
  { cluster: "Schools", quadrant: "priority", revenue: 4500, access: "High" },
  { cluster: "Restaurants / Cafés", quadrant: "priority", revenue: 4000, access: "High" },
  { cluster: "MIDC / Industrial Estate Clusters", quadrant: "opportunity", revenue: 3500, access: "Low" },
  { cluster: "Colleges & Universities", quadrant: "priority", revenue: 2800, access: "High" },
  { cluster: "Religious Cluster", quadrant: "opportunity", revenue: 2800, access: "Low" },
];

/** Navi Mumbai market-area figures (₹ Cr) */
export const NAVI_MUMBAI_CLUSTERS: ClusterRow[] = [
  { cluster: "Mid-Size Apartments", quadrant: "priority", revenue: 35, access: "High" },
  { cluster: "Gated Community Projects", quadrant: "opportunity", revenue: 28, access: "Low" },
  { cluster: "Redevelopment Housing Projects", quadrant: "opportunity", revenue: 24, access: "Low" },
  { cluster: "Hospitals & Healthcare Buildings", quadrant: "opportunity", revenue: 8, access: "Low" },
  { cluster: "Hotels / Resorts / Lodges", quadrant: "priority", revenue: 7, access: "High" },
  { cluster: "Restaurants / Cafés", quadrant: "priority", revenue: 8, access: "High" },
  { cluster: "Schools", quadrant: "priority", revenue: 5, access: "High" },
  { cluster: "MIDC / Industrial Estate Clusters", quadrant: "opportunity", revenue: 7, access: "Low" },
  { cluster: "Colleges & Universities", quadrant: "priority", revenue: 4, access: "High" },
  { cluster: "Religious Cluster", quadrant: "deprioritize", revenue: 2, access: "Low" },
];

/** Small clusters used only for matrix visual richness — no hard revenue figure. */
export const MINOR_CLUSTERS: { cluster: string; quadrant: QuadrantKey }[] = [
  { cluster: "Auto Showrooms", quadrant: "maintain" },
  { cluster: "Marriage Halls / Convention Centers", quadrant: "deprioritize" },
  { cluster: "Local Clinics", quadrant: "maintain" },
  { cluster: "Warehouses", quadrant: "opportunity" },
  { cluster: "PG Facilities", quadrant: "deprioritize" },
  { cluster: "Textile / Garment Units", quadrant: "opportunity" },
  { cluster: "Petrol Pumps", quadrant: "maintain" },
  { cluster: "Bus Stand Markets", quadrant: "deprioritize" },
  { cluster: "Highway Hotels", quadrant: "maintain" },
];

export type Asm = {
  name: string;
  area: string;
  clustersMapped: number;
  revenue: number;
  access: AccessLevel;
  contractors?: number;
  touchpoints?: number;
  drillable?: boolean;
};

export const ASMS: Asm[] = [
  { name: "Vikram Desai", area: "Navi Mumbai", clustersMapped: 16, revenue: 45.3, access: "High", contractors: 60, touchpoints: 92, drillable: true },
  { name: "Sunita Rao", area: "Mumbai", clustersMapped: 14, revenue: 58.5, access: "High", contractors: 49, touchpoints: 78 },
  { name: "Prakash Iyer", area: "Nashik", clustersMapped: 11, revenue: 27.4, access: "High", contractors: 37, touchpoints: 57 },
  { name: "Meena Kulkarni", area: "Aurangabad", clustersMapped: 12, revenue: 32.2, access: "High", contractors: 50, touchpoints: 78 },
  { name: "Ravi Deshmukh", area: "Pune Rural", clustersMapped: 19, revenue: 17.8, access: "High" },
  { name: "Sneha Patil", area: "Raigad", clustersMapped: 18, revenue: 16.4, access: "Low" },
  { name: "Nitin More", area: "Satara", clustersMapped: 16, revenue: 15.9, access: "High" },
  { name: "Pooja Kulkarni", area: "Ahmednagar", clustersMapped: 19, revenue: 15.2, access: "High" },
  { name: "Sandeep Nair", area: "Osmanabad", clustersMapped: 18, revenue: 14.7, access: "Low" },
  { name: "Rohit Shah", area: "Latur", clustersMapped: 17, revenue: 13.8, access: "Low" },
  { name: "Priya Joshi", area: "Ratnagiri", clustersMapped: 18, revenue: 13.1, access: "High" },
  { name: "Anil Desai", area: "Nandurbar", clustersMapped: 17, revenue: 12.6, access: "Low" },
  { name: "Kavya Sharma", area: "Wardha", clustersMapped: 16, revenue: 11.9, access: "High" },
  { name: "Mahesh Patil", area: "Beed", clustersMapped: 17, revenue: 11.2, access: "Low" },
];

export type Dg = {
  name: string;
  area: string;
  clustersMapped: number;
  revenue: number;
  access: AccessLevel;
  targeted: number;
  rightStrategy: number;
  executed: number;
  status: "On Track" | "Wrong Strategy";
  drillable?: boolean;
};

export const DGS_VIKRAM: Dg[] = [
  { name: "Rajesh Kumar", area: "Panvel", clustersMapped: 10, revenue: 18.4, access: "High", targeted: 3, rightStrategy: 3, executed: 64, status: "On Track", drillable: true },
  { name: "Priya Mehta", area: "Khopoli", clustersMapped: 12, revenue: 11.2, access: "High", targeted: 2, rightStrategy: 2, executed: 44, status: "On Track" },
  { name: "Anand Joshi", area: "Karjat", clustersMapped: 9, revenue: 9.6, access: "Low", targeted: 2, rightStrategy: 1, executed: 50, status: "Wrong Strategy" },
  { name: "Sonal Patkar", area: "Pen", clustersMapped: 15, revenue: 6.1, access: "High", targeted: 1, rightStrategy: 0, executed: 50, status: "Wrong Strategy" },
];

export const DG_RAJESH_CLUSTERS = [
  { cluster: "Housing Societies", prospects: 57, revenue: 6.8, contractors: 10, touchpoints: 16, quadrant: "priority" as QuadrantKey },
  { cluster: "Industrial Buildings", prospects: 35, revenue: 4.9, contractors: 7, touchpoints: 11, quadrant: "opportunity" as QuadrantKey },
  { cluster: "Petrol Pumps", prospects: 37, revenue: 3.1, contractors: 4, touchpoints: 6, quadrant: "maintain" as QuadrantKey },
  { cluster: "Schools", prospects: 55, revenue: 2.2, contractors: 2, touchpoints: 3, quadrant: "maintain" as QuadrantKey },
  { cluster: "Religious Building", prospects: 25, revenue: 1.4, contractors: 1, touchpoints: 2, quadrant: "deprioritize" as QuadrantKey },
];

export const ENGAGEMENT_MIX: { quadrant: QuadrantKey; pct: number }[] = [
  { quadrant: "priority", pct: 10 },
  { quadrant: "opportunity", pct: 30 },
  { quadrant: "maintain", pct: 35 },
  { quadrant: "deprioritize", pct: 25 },
];

export const ENGAGEMENT_INSIGHT =
  "More than 25% of DGs are targeting Low Potential and Low Access clusters.";

export const ROSTER_A = [
  { name: "Sunita Rao", area: "Mumbai", dgs: 4 },
  { name: "Meena Kulkarni", area: "Aurangabad", dgs: 4 },
  { name: "Deepa Kulkarni", area: "Kolhapur", dgs: 4 },
  { name: "Sandeep Nair", area: "Osmanabad", dgs: 3 },
  { name: "Mahesh Patil", area: "Beed", dgs: 3 },
  { name: "Anil Desai", area: "Nandurbar", dgs: 2 },
  { name: "Rohit Shah", area: "Latur", dgs: 2 },
  { name: "Kavya Sharma", area: "Wardha", dgs: 2 },
  { name: "Sneha Patil", area: "Raigad", dgs: 1 },
  { name: "Priya Joshi", area: "Ratnagiri", dgs: 1 },
];

export const ROSTER_B = [
  { name: "Vikram Desai", area: "Navi Mumbai", dgs: 4 },
  { name: "Rajesh Patil", area: "Pune", dgs: 3 },
  { name: "Anita Sharma", area: "Thane", dgs: 2 },
  { name: "Prakash Iyer", area: "Nashik", dgs: 2 },
  { name: "Nitin More", area: "Satara", dgs: 2 },
  { name: "Pooja Kulkarni", area: "Ahmednagar", dgs: 2 },
  { name: "Ravi Deshmukh", area: "Pune Rural", dgs: 2 },
  { name: "Amit Joshi", area: "Solapur", dgs: 1 },
  { name: "Suresh Nair", area: "Nagpur", dgs: 1 },
  { name: "Kavita Mehta", area: "Nashik Rural", dgs: 1 },
];

export type StrategyRow = {
  cluster: string;
  quadrant: QuadrantKey;
  pct: number;
  status: "On Track" | "Behind";
};

export const STRATEGY_ROWS: StrategyRow[] = [
  { cluster: "Marriage Halls / Convention Centers", quadrant: "deprioritize", pct: 22, status: "On Track" },
  { cluster: "Redevelopment Housing Projects", quadrant: "priority", pct: 19, status: "On Track" },
  { cluster: "MIDC / Industrial Estate Clusters", quadrant: "opportunity", pct: 16, status: "On Track" },
  { cluster: "Schools", quadrant: "priority", pct: 15, status: "Behind" },
  { cluster: "Gated Community Projects", quadrant: "priority", pct: 14, status: "On Track" },
  { cluster: "Hospitals & Healthcare Buildings", quadrant: "opportunity", pct: 13, status: "Behind" },
  { cluster: "Hotels / Resorts / Lodges", quadrant: "priority", pct: 12, status: "On Track" },
  { cluster: "Religious Cluster", quadrant: "maintain", pct: 11, status: "Behind" },
  { cluster: "Petrol Pumps", quadrant: "maintain", pct: 11, status: "On Track" },
  { cluster: "Mid-Size Apartment / Residential Societies", quadrant: "priority", pct: 10, status: "Behind" },
];

export const STRATEGY_INSIGHT =
  "22% of the DGs are focusing on Low Access – Low Potential clusters. Need to re-prioritize.";

export type PenetrationRow = {
  cluster: string;
  prospects: number;
  customers: number;
  penetration: number;
  quadrant: QuadrantKey;
  change: number;
};

export const PENETRATION_ROWS: PenetrationRow[] = [
  { cluster: "Redevelopment Housing Projects", prospects: 4200, customers: 1260, penetration: 30, quadrant: "priority", change: 6 },
  { cluster: "Schools", prospects: 1850, customers: 592, penetration: 32, quadrant: "priority", change: 5 },
  { cluster: "Gated Community Projects", prospects: 2100, customers: 798, penetration: 38, quadrant: "priority", change: 4 },
  { cluster: "Hotels / Resorts / Lodges", prospects: 1640, customers: 492, penetration: 30, quadrant: "priority", change: -3 },
  { cluster: "MIDC / Industrial Estate Clusters", prospects: 1980, customers: 436, penetration: 22, quadrant: "opportunity", change: 2 },
  { cluster: "Hospitals & Healthcare Buildings", prospects: 1420, customers: 284, penetration: 20, quadrant: "opportunity", change: 2 },
  { cluster: "Religious Cluster", prospects: 2800, customers: 1064, penetration: 38, quadrant: "maintain", change: 1 },
  { cluster: "Petrol Pumps", prospects: 1560, customers: 312, penetration: 20, quadrant: "maintain", change: -2 },
  { cluster: "Marriage Halls / Convention Centers", prospects: 980, customers: 147, penetration: 15, quadrant: "deprioritize", change: -1 },
  { cluster: "Mid-Size Apartment / Residential Societies", prospects: 3200, customers: 960, penetration: 30, quadrant: "priority", change: 3 },
];

export const MONTHS = ["Jan'26", "Feb'26", "March'26", "April'26", "May'26"];

/** Only Redevelopment Housing Projects has a genuinely sourced monthly trend. */
export const SOURCED_TREND = [24.7, 25.8, 26.5, 29.5, 30];

/** Illustrative 5-month trend ending at the cluster's reported penetration. */
export function trendFor(row: PenetrationRow): { month: string; value: number }[] {
  if (row.cluster === "Redevelopment Housing Projects") {
    return MONTHS.map((month, i) => ({ month, value: SOURCED_TREND[i] }));
  }
  const end = row.penetration;
  const start = end - row.change * 1.6;
  const steps = MONTHS.length - 1;
  return MONTHS.map((month, i) => {
    const linear = start + ((end - start) * i) / steps;
    const wobble = i === 0 || i === steps ? 0 : (i % 2 === 0 ? 0.4 : -0.5);
    return { month, value: Math.round((linear + wobble) * 10) / 10 };
  });
}

/** National average penetration over the last 5 months (illustrative aggregate). */
export const NATIONAL_PENETRATION_TREND = MONTHS.map((month, i) => ({
  month,
  value: [24.9, 25.7, 26.4, 27.6, 28.5][i],
}));

export const TOTAL_REVENUE_POTENTIAL = NATIONAL_CLUSTERS.reduce((s, c) => s + (c.revenue ?? 0), 0);

export const AVG_PENETRATION =
  Math.round(
    (PENETRATION_ROWS.reduce((s, r) => s + r.penetration, 0) / PENETRATION_ROWS.length) * 10,
  ) / 10;

export const LOW_PRIORITY_DG_PCT =
  ENGAGEMENT_MIX.find((m) => m.quadrant === "deprioritize")!.pct;

export const TOTAL_CLUSTERS_MAPPED = ASMS.reduce((s, a) => s + a.clustersMapped, 0);

export const MOM_PENETRATION_CHANGE =
  Math.round(
    (NATIONAL_PENETRATION_TREND[4].value - NATIONAL_PENETRATION_TREND[3].value) * 10,
  ) / 10;

export const FUNNEL_BY_CLUSTER = [
  { cluster: "Redevelopment Housing Projects", prospects: 4200, engaged: 2310, customers: 1260 },
  { cluster: "Mid-Size Apartment / Residential Societies", prospects: 3200, engaged: 1760, customers: 960 },
  { cluster: "Religious Cluster", prospects: 2800, engaged: 1596, customers: 1064 },
  { cluster: "Gated Community Projects", prospects: 2100, engaged: 1281, customers: 798 },
  { cluster: "MIDC / Industrial Estate Clusters", prospects: 1980, engaged: 891, customers: 436 },
  { cluster: "Schools", prospects: 1850, engaged: 1054, customers: 592 },
];

export const FUNNEL_BY_DG: {
  name: string;
  area: string;
  mapped?: number;
  touchpoints?: number;
  contractors?: number;
  synced: boolean;
}[] = [
  { name: "Rajesh Kumar", area: "Panvel", mapped: 209, touchpoints: 38, contractors: 24, synced: true },
  { name: "Priya Mehta", area: "Khopoli", synced: false },
  { name: "Anand Joshi", area: "Karjat", synced: false },
  { name: "Sonal Patkar", area: "Pen", synced: false },
];

export function quadrantChartColor(q: QuadrantKey) {
  return {
    priority: "var(--chart-good)",
    opportunity: "var(--chart-info)",
    maintain: "var(--chart-warn)",
    deprioritize: "var(--chart-critical)",
  }[q];
}
