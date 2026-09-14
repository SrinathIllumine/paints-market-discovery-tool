// Geography scaffold for Leadership Analytics. Only Maharashtra (state) and
// Panvel (area) are interactive today — everything else is shown but locked,
// so the filters read like a real national rollout without requiring full
// research for every state/area yet.

export type GeoLevel = "national" | "state" | "area" | "asm";

export type GeoRef = { level: GeoLevel; id: string };

export const NATIONAL_ID = "india";
export const NATIONAL: GeoRef = { level: "national", id: NATIONAL_ID };

export type StateInfo = {
  id: string;
  name: string;
  selectable: boolean;
  /** Rough share of national population/urban-economic activity, used to scale cluster unit counts. */
  shareOfNational: number;
};

// Shown states are illustrative of the 28-state national footprint (~400 DGs);
// only Maharashtra is wired up with real interactivity for now.
export const STATES: StateInfo[] = [
  { id: "maharashtra", name: "Maharashtra", selectable: true, shareOfNational: 0.094 },
  { id: "gujarat", name: "Gujarat", selectable: false, shareOfNational: 0.05 },
  { id: "karnataka", name: "Karnataka", selectable: false, shareOfNational: 0.05 },
  { id: "tamil-nadu", name: "Tamil Nadu", selectable: false, shareOfNational: 0.057 },
  { id: "uttar-pradesh", name: "Uttar Pradesh", selectable: false, shareOfNational: 0.166 },
  { id: "rajasthan", name: "Rajasthan", selectable: false, shareOfNational: 0.057 },
  { id: "west-bengal", name: "West Bengal", selectable: false, shareOfNational: 0.071 },
];

export function getState(stateId: string): StateInfo | undefined {
  return STATES.find((s) => s.id === stateId);
}

export function isStateSelectable(stateId: string): boolean {
  return getState(stateId)?.selectable ?? false;
}

export type AreaInfo = {
  id: string;
  name: string;
  stateId: string;
  selectable: boolean;
  /** Share of the state's population/economic activity this area represents. */
  shareOfState: number;
};

// 10 Maharashtra sales areas; only Panvel is interactive. Panvel + 3 siblings
// (Khopoli, Karjat, Pen) form one ASM's territory (see PANVEL_ASM below) so
// DG-comparison tables have real contrast; the remaining 6 areas exist only
// to make state-level rollups add up to something realistic.
export const MAHARASHTRA_AREAS: AreaInfo[] = [
  { id: "panvel", name: "Panvel", stateId: "maharashtra", selectable: true, shareOfState: 0.018 },
  { id: "khopoli", name: "Khopoli", stateId: "maharashtra", selectable: false, shareOfState: 0.012 },
  { id: "karjat", name: "Karjat", stateId: "maharashtra", selectable: false, shareOfState: 0.01 },
  { id: "pen", name: "Pen", stateId: "maharashtra", selectable: false, shareOfState: 0.009 },
  { id: "alibag", name: "Alibag", stateId: "maharashtra", selectable: false, shareOfState: 0.011 },
  { id: "uran", name: "Uran", stateId: "maharashtra", selectable: false, shareOfState: 0.008 },
  { id: "kalyan", name: "Kalyan", stateId: "maharashtra", selectable: false, shareOfState: 0.16 },
  { id: "thane-rural", name: "Thane Rural", stateId: "maharashtra", selectable: false, shareOfState: 0.09 },
  { id: "pune-rural", name: "Pune Rural", stateId: "maharashtra", selectable: false, shareOfState: 0.22 },
  { id: "nashik-rural", name: "Nashik Rural", stateId: "maharashtra", selectable: false, shareOfState: 0.12 },
];

export function getAreasForState(stateId: string): AreaInfo[] {
  return MAHARASHTRA_AREAS.filter((a) => a.stateId === stateId);
}

export function getArea(areaId: string): AreaInfo | undefined {
  return MAHARASHTRA_AREAS.find((a) => a.id === areaId);
}

export function isAreaSelectable(areaId: string): boolean {
  return getArea(areaId)?.selectable ?? false;
}

export type AsmInfo = { id: string; name: string; areaIds: string[] };
export type DgInfo = { id: string; name: string; areaId: string; asmId: string };

// The only named ASM/DG roster in the system — Panvel's ASM, covering Panvel
// plus the 3 sibling areas. Sunil Kumar is Panvel's DG (matches the Market
// Discovery System persona used elsewhere in the app).
export const PANVEL_ASM: AsmInfo = {
  id: "asm-raigad",
  name: "Vikram Desai",
  areaIds: ["panvel", "khopoli", "karjat", "pen"],
};

export const PANVEL_CLUSTER_DGS: DgInfo[] = [
  { id: "dg-sunil", name: "Sunil Kumar", areaId: "panvel", asmId: "asm-raigad" },
  { id: "dg-priya", name: "Priya Mehta", areaId: "khopoli", asmId: "asm-raigad" },
  { id: "dg-anand", name: "Anand Joshi", areaId: "karjat", asmId: "asm-raigad" },
  { id: "dg-sonal", name: "Sonal Patkar", areaId: "pen", asmId: "asm-raigad" },
];

export function getDgForArea(areaId: string): DgInfo | undefined {
  return PANVEL_CLUSTER_DGS.find((d) => d.areaId === areaId);
}

/** GeoRef for Panvel's ASM territory (Panvel + Khopoli + Karjat + Pen combined) — used by ASM Analytics. */
export const ASM_GEO: GeoRef = { level: "asm", id: PANVEL_ASM.id };

/** Combined national-population-share weight of an ASM's whole territory (sum of its areas' shares), for unit-count scaling. */
export function getAsmTerritoryShareOfNational(asmId: string): number {
  const asm = asmId === PANVEL_ASM.id ? PANVEL_ASM : undefined;
  if (!asm) return 0.05;
  const state = getState("maharashtra");
  const combinedShareOfState = asm.areaIds.reduce((sum, id) => sum + (getArea(id)?.shareOfState ?? 0), 0);
  return (state?.shareOfNational ?? 0.094) * combinedShareOfState;
}

// Approximate ASM/DG density used to scale "how many ASMs" a wider geography
// (state / national) implies, for engagement-page rollups where we don't
// have a fully named national roster. ~1 ASM per 5 DGs, ~400 DGs nationally.
export const NATIONAL_DG_COUNT = 400;
export const DGS_PER_ASM = 5;

export function estimateAsmCount(geo: GeoRef): number {
  if (geo.level === "national") return Math.round(NATIONAL_DG_COUNT / DGS_PER_ASM);
  if (geo.level === "state") {
    const s = getState(geo.id);
    const dgs = Math.max(DGS_PER_ASM, Math.round(NATIONAL_DG_COUNT * (s?.shareOfNational ?? 0.05)));
    return Math.max(1, Math.round(dgs / DGS_PER_ASM));
  }
  // area level: Panvel's own ASM territory has exactly 4 DGs under 1 ASM.
  return 1;
}
