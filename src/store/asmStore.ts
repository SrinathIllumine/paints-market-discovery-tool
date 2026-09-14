// Scope filter for ASM Analytics: an ASM oversees 4 DGs, one per area, so
// they can drill from "my whole territory" down to any single DG's area.
// Unlike Leadership Analytics' filter, every option here is selectable —
// these are all the ASM's own, already-built-out areas, nothing locked.
import { create } from "zustand";
import { ASM_GEO, PANVEL_ASM, type GeoRef } from "@/data/geography";

export const ALL_ASM_AREAS_ID = "all";

type AsmScopeState = {
  areaId: string; // ALL_ASM_AREAS_ID = whole territory; otherwise one of PANVEL_ASM.areaIds
  setArea: (areaId: string) => void;
};

export const useAsmStore = create<AsmScopeState>((set) => ({
  areaId: ALL_ASM_AREAS_ID,
  setArea: (areaId) => set({ areaId }),
}));

export function useAsmGeo(): GeoRef {
  const areaId = useAsmStore((s) => s.areaId);
  return areaId === ALL_ASM_AREAS_ID ? ASM_GEO : { level: "area", id: areaId };
}

/** The area id(s) currently in scope, for functions that aggregate per-DG data (e.g. asmPerformance.ts). */
export function useAsmAreaIds(): string[] {
  const areaId = useAsmStore((s) => s.areaId);
  return areaId === ALL_ASM_AREAS_ID ? PANVEL_ASM.areaIds : [areaId];
}
