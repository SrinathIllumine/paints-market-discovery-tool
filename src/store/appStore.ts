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
  phone: string;
  marketArea?: string;
  comments?: string;
  stakeholderTypeId?: string;
};

export type EventType = "Workshop" | "Audit" | "Awareness" | "Contractor Meet";
export type PlanEvent = {
  id: string;
  clusterId: string;
  type: EventType;
  topic?: string;
  date?: string;
  note?: string;
};

export type ReadinessAnswer = "Y" | "N" | "P" | null;
export type Readiness = {
  retailers: ReadinessAnswer;
  stock: ReadinessAnswer;
  painters: ReadinessAnswer;
};

export type Insight = {
  id: string;
  text: string;
  createdAt: number;
};

export type ClusterState = {
  jkShare: "H" | "M" | "L" | null;
  prospects: Prospect[];
  selectedProspectIds: string[];
  visited: boolean;
};

export type Pathways = { L1: boolean; L2: boolean; L3: boolean; L4: boolean };

export type ConnectApproach = "L1" | "L2" | "L3" | "L4";
export type TriState = "Y" | "N" | "DK";
export type ProspectAnswer = {
  approach: ConnectApproach | null;
  immediateNeed: TriState | null;
  usingJk: TriState | null;
};

type State = {
  clusters: Record<string, ClusterState>;
  stakeholders: Record<string, Stakeholder[]>;
  insights: Insight[];
  plan: {
    targetClusterIds: string[];
    events: PlanEvent[];
    readiness: Readiness;
    monthlyFocusIds: string[];
    valueProps: Record<string, string>;
    pathways: Record<string, Pathways>;
    prospectAnswers: Record<string, Record<string, ProspectAnswer>>;
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

  addInsight: (text: string) => void;
  removeInsight: (id: string) => void;

  toggleTargetCluster: (clusterId: string) => void;
  shortlistCluster: (clusterId: string) => void;
  addEvent: (e: Omit<PlanEvent, "id">) => void;
  removeEvent: (id: string) => void;
  setReadiness: (partial: Partial<Readiness>) => void;
  toggleMonthlyFocus: (clusterId: string) => void;
  setValueProp: (clusterId: string, text: string) => void;
  setPathway: (clusterId: string, key: keyof Pathways, value: boolean) => void;
  setProspectAnswer: (
    clusterId: string,
    prospectId: string,
    patch: Partial<ProspectAnswer>,
  ) => void;
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
});

export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      clusters: {},
      stakeholders: {},
      insights: [],
      plan: {
        targetClusterIds: [],
        events: [],
        readiness: emptyReadiness(),
        monthlyFocusIds: [],
        valueProps: {},
        pathways: {},
        prospectAnswers: {},
      },


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

      addInsight: (text) =>
        set((state) => ({
          insights: [
            ...state.insights,
            {
              id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              text,
              createdAt: Date.now(),
            },
          ],
        })),

      removeInsight: (id) =>
        set((state) => ({ insights: state.insights.filter((i) => i.id !== id) })),

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

      shortlistCluster: (clusterId) =>
        set((state) => {
          if (state.plan.targetClusterIds.includes(clusterId)) return state;
          return {
            plan: {
              ...state.plan,
              targetClusterIds: [...state.plan.targetClusterIds, clusterId],
            },
          };
        }),

      toggleMonthlyFocus: (clusterId) =>
        set((state) => {
          const has = state.plan.monthlyFocusIds.includes(clusterId);
          return {
            plan: {
              ...state.plan,
              monthlyFocusIds: has
                ? state.plan.monthlyFocusIds.filter((x) => x !== clusterId)
                : [...state.plan.monthlyFocusIds, clusterId],
            },
          };
        }),

      setValueProp: (clusterId, text) =>
        set((state) => ({
          plan: {
            ...state.plan,
            valueProps: { ...state.plan.valueProps, [clusterId]: text },
          },
        })),

      setPathway: (clusterId, key, value) =>
        set((state) => {
          const prev = state.plan.pathways[clusterId] ?? {
            L1: false,
            L2: false,
            L3: false,
            L4: false,
          };
          return {
            plan: {
              ...state.plan,
              pathways: {
                ...state.plan.pathways,
                [clusterId]: { ...prev, [key]: value },
              },
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

      setReadiness: (partial) =>
        set((state) => ({
          plan: {
            ...state.plan,
            readiness: { ...state.plan.readiness, ...partial },
          },
        })),
    }),
    { name: "sed.v5" },
  ),
);

export function getReadiness(state: State): Readiness {
  return state.plan.readiness;
}
