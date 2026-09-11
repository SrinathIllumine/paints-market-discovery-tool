// Scope filter state for Leadership Analytics — kept separate from the
// DG-facing appStore (which has its own persisted-migration versioning) so
// the two apps' state don't get entangled.
import { create } from "zustand";
import { NATIONAL_ID, type GeoRef, isAreaSelectable, isStateSelectable } from "@/data/geography";

export const ALL_AREAS_ID = "all";

type LeadershipScopeState = {
  stateId: string; // NATIONAL_ID = national view; otherwise a STATES id
  areaId: string; // ALL_AREAS_ID = whole-state view; otherwise an AREAS id
  setState: (stateId: string) => void;
  setArea: (areaId: string) => void;
};

export const useLeadershipStore = create<LeadershipScopeState>((set) => ({
  stateId: NATIONAL_ID,
  areaId: ALL_AREAS_ID,
  setState: (stateId) =>
    set(() => {
      // Only actually switch to a locked state's data if it's selectable;
      // otherwise the control stays visually selectable-looking but we keep
      // rendering national data. (UI disables non-selectable options too.)
      if (stateId !== NATIONAL_ID && !isStateSelectable(stateId)) return {};
      return { stateId, areaId: ALL_AREAS_ID };
    }),
  setArea: (areaId) =>
    set(() => {
      if (areaId !== ALL_AREAS_ID && !isAreaSelectable(areaId)) return {};
      return { areaId };
    }),
}));

export function scopeToGeoRef(stateId: string, areaId: string): GeoRef {
  if (stateId === NATIONAL_ID) return { level: "national", id: NATIONAL_ID };
  if (areaId === ALL_AREAS_ID) return { level: "state", id: stateId };
  return { level: "area", id: areaId };
}

export function useLeadershipGeo(): GeoRef {
  const stateId = useLeadershipStore((s) => s.stateId);
  const areaId = useLeadershipStore((s) => s.areaId);
  return scopeToGeoRef(stateId, areaId);
}
