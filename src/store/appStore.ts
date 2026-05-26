import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Prospect = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
  locality?: string;
  source: "places" | "manual";
};

export type Stakeholder = {
  id: string;
  name: string;
  prospect: string;
  phone: string;
};

export type EventType = "Workshop" | "Audit" | "Awareness" | "Contractor Meet";
export type PlanEvent = {
  id: string;
  clusterId: string;
  type: EventType;
  date?: string;
  note?: string;
};

export type ReadinessAnswer = "Y" | "N" | "P" | null;
export type Readiness = {
  retailers: ReadinessAnswer;
  stock: ReadinessAnswer;
  painters: ReadinessAnswer;
  trained: ReadinessAnswer;
};

export type ClusterState = {
  jkShare: "H" | "M" | "L" | null;
  prospects: Prospect[];
  selectedProspectIds: string[];
  visited: boolean;
};

type State = {
  clusters: Record<string, ClusterState>;
  stakeholders: Record<string, Stakeholder[]>;
  plan: {
    targetClusterIds: string[];
    events: PlanEvent[];
    readiness: Record<string, Readiness>;
  };
};

type Actions = {
  ensureCluster: (clusterId: string) => void;
  markVisited: (clusterId: string) => void;
  setJkShare: (clusterId: string, share: "H" | "M" | "L") => void;
  setProspects: (clusterId: string, prospects: Prospect[]) => void;
  addProspect: (clusterId: string, p: Prospect) => void;
  toggleProspectSelected: (clusterId: string, prospectId: string) => void;

  addStakeholder: (clusterId: string, s: Omit<Stakeholder, "id">) => void;
  removeStakeholder: (clusterId: string, id: string) => void;

  toggleTargetCluster: (clusterId: string) => void;
  addEvent: (e: Omit<PlanEvent, "id">) => void;
  removeEvent: (id: string) => void;
  setReadiness: (clusterId: string, partial: Partial<Readiness>) => void;
};

const emptyCluster = (): ClusterState => ({
  jkShare: null,
  prospects: [],
  selectedProspectIds: [],
  visited: false,
});

const emptyReadiness = (): Readiness => ({
  retailers: null,
  stock: null,
  painters: null,
  trained: null,
});

export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      clusters: {},
      stakeholders: {},
      plan: { targetClusterIds: [], events: [], readiness: {} },

      ensureCluster: (clusterId) =>
        set((s) =>
          s.clusters[clusterId]
            ? s
            : { clusters: { ...s.clusters, [clusterId]: emptyCluster() } },
        ),

      markVisited: (clusterId) =>
        set((s) => ({
          clusters: {
            ...s.clusters,
            [clusterId]: { ...(s.clusters[clusterId] ?? emptyCluster()), visited: true },
          },
        })),

      setJkShare: (clusterId, share) =>
        set((s) => ({
          clusters: {
            ...s.clusters,
            [clusterId]: { ...(s.clusters[clusterId] ?? emptyCluster()), jkShare: share },
          },
        })),

      setProspects: (clusterId, prospects) =>
        set((s) => {
          const prev = s.clusters[clusterId] ?? emptyCluster();
          return {
            clusters: {
              ...s.clusters,
              [clusterId]: {
                ...prev,
                prospects,
                selectedProspectIds: prospects.map((p) => p.id),
              },
            },
          };
        }),

      addProspect: (clusterId, p) =>
        set((s) => {
          const prev = s.clusters[clusterId] ?? emptyCluster();
          return {
            clusters: {
              ...s.clusters,
              [clusterId]: {
                ...prev,
                prospects: [...prev.prospects, p],
                selectedProspectIds: [...prev.selectedProspectIds, p.id],
              },
            },
          };
        }),

      toggleProspectSelected: (clusterId, prospectId) =>
        set((s) => {
          const prev = s.clusters[clusterId] ?? emptyCluster();
          const has = prev.selectedProspectIds.includes(prospectId);
          return {
            clusters: {
              ...s.clusters,
              [clusterId]: {
                ...prev,
                selectedProspectIds: has
                  ? prev.selectedProspectIds.filter((x) => x !== prospectId)
                  : [...prev.selectedProspectIds, prospectId],
              },
            },
          };
        }),

      addStakeholder: (clusterId, s) =>
        set((state) => ({
          stakeholders: {
            ...state.stakeholders,
            [clusterId]: [
              ...(state.stakeholders[clusterId] ?? []),
              { ...s, id: `stk-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
            ],
          },
        })),

      removeStakeholder: (clusterId, id) =>
        set((state) => ({
          stakeholders: {
            ...state.stakeholders,
            [clusterId]: (state.stakeholders[clusterId] ?? []).filter((x) => x.id !== id),
          },
        })),

      toggleTargetCluster: (clusterId) =>
        set((state) => {
          const has = state.plan.targetClusterIds.includes(clusterId);
          return {
            plan: {
              ...state.plan,
              targetClusterIds: has
                ? state.plan.targetClusterIds.filter((x) => x !== clusterId)
                : [...state.plan.targetClusterIds, clusterId],
            },
          };
        }),

      addEvent: (e) =>
        set((state) => ({
          plan: {
            ...state.plan,
            events: [
              ...state.plan.events,
              { ...e, id: `ev-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` },
            ],
          },
        })),

      removeEvent: (id) =>
        set((state) => ({
          plan: { ...state.plan, events: state.plan.events.filter((e) => e.id !== id) },
        })),

      setReadiness: (clusterId, partial) =>
        set((state) => ({
          plan: {
            ...state.plan,
            readiness: {
              ...state.plan.readiness,
              [clusterId]: { ...emptyReadiness(), ...(state.plan.readiness[clusterId] ?? {}), ...partial },
            },
          },
        })),
    }),
    { name: "sed.v2" },
  ),
);

export function getReadiness(state: State, clusterId: string): Readiness {
  return state.plan.readiness[clusterId] ?? emptyReadiness();
}
