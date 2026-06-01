import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClusterAssessment } from "@/lib/clusterScoring";
import type { ConnectStrategy, StrategyAnswers } from "@/lib/strategyContent";

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
  visited: boolean;
};

// Legacy types preserved for type-import compatibility (no longer used in UI).
export type ConnectModel = "L1" | "L2" | "L3";
export type RoadmapStep = "focus" | "connect" | "action";
export type RoadmapCompletion = Record<RoadmapStep, boolean>;

type State = {
  clusters: Record<string, ClusterState>;
  stakeholders: Record<string, Stakeholder[]>;
  insights: Insight[];
  plan: {
    targetClusterIds: string[];
    events: PlanEvent[];
    readiness: Readiness;
    monthlyFocusIds: string[];
    connectStrategyByCluster: Record<string, ConnectStrategy>;
    strategyAnswersByCluster: Record<string, StrategyAnswers>;
    roadmapCompletion: RoadmapCompletion;
  };
  assessments: Record<string, ClusterAssessment>;
};

type Actions = {
  ensureCluster: (clusterId: string) => void;
  markVisited: (clusterId: string) => void;
  setProspects: (clusterId: string, prospects: Prospect[]) => void;
  addProspect: (clusterId: string, p: Prospect) => void;

  addInsight: (text: string) => void;
  removeInsight: (id: string) => void;

  toggleTargetCluster: (clusterId: string) => void;
  shortlistCluster: (clusterId: string) => void;
  toggleMonthlyFocus: (clusterId: string) => void;
  setConnectStrategy: (clusterId: string, strategy: ConnectStrategy) => void;
  setStrategyAnswers: (clusterId: string, patch: Partial<StrategyAnswers>) => void;
  setRoadmapStep: (step: RoadmapStep, completed: boolean) => void;
  resetRoadmap: () => void;

  setAssessment: (clusterId: string, assessment: ClusterAssessment) => void;
  clearAssessment: (clusterId: string) => void;
};

const emptyCluster = (): ClusterState => ({
  jkShare: null,
  prospects: [],
  visited: false,
});

const emptyReadiness = (): Readiness => ({
  retailers: null,
  stock: null,
  painters: null,
});

const emptyRoadmap = (): RoadmapCompletion => ({
  focus: false,
  connect: false,
  action: false,
});

export const useAppStore = create<State & Actions>()(
  persist(
    (set) => ({
      clusters: {},
      stakeholders: {},
      insights: [],
      assessments: {},
      plan: {
        targetClusterIds: [],
        events: [],
        readiness: emptyReadiness(),
        monthlyFocusIds: [],
        connectStrategyByCluster: {},
        strategyAnswersByCluster: {},
        roadmapCompletion: emptyRoadmap(),
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

      setProspects: (clusterId, prospects) =>
        set((s) => {
          const prev = s.clusters[clusterId] ?? emptyCluster();
          return {
            clusters: { ...s.clusters, [clusterId]: { ...prev, prospects } },
          };
        }),

      addProspect: (clusterId, p) =>
        set((s) => {
          const prev = s.clusters[clusterId] ?? emptyCluster();
          return {
            clusters: {
              ...s.clusters,
              [clusterId]: { ...prev, prospects: [...prev.prospects, p] },
            },
          };
        }),

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

      setConnectStrategy: (clusterId, strategy) =>
        set((state) => ({
          plan: {
            ...state.plan,
            connectStrategyByCluster: {
              ...state.plan.connectStrategyByCluster,
              [clusterId]: strategy,
            },
            roadmapCompletion: { ...state.plan.roadmapCompletion, action: false },
          },
        })),

      setStrategyAnswers: (clusterId, patch) =>
        set((state) => {
          const prev = state.plan.strategyAnswersByCluster[clusterId] ?? {};
          return {
            plan: {
              ...state.plan,
              strategyAnswersByCluster: {
                ...state.plan.strategyAnswersByCluster,
                [clusterId]: { ...prev, ...patch },
              },
            },
          };
        }),

      setRoadmapStep: (step, completed) =>
        set((state) => ({
          plan: {
            ...state.plan,
            roadmapCompletion: {
              ...(state.plan.roadmapCompletion ?? emptyRoadmap()),
              [step]: completed,
            },
          },
        })),

      resetRoadmap: () =>
        set((state) => ({
          plan: { ...state.plan, roadmapCompletion: emptyRoadmap() },
        })),

      setAssessment: (clusterId, assessment) =>
        set((state) => ({
          assessments: { ...state.assessments, [clusterId]: assessment },
          plan: {
            ...state.plan,
            targetClusterIds: state.plan.targetClusterIds.includes(clusterId)
              ? state.plan.targetClusterIds
              : [...state.plan.targetClusterIds, clusterId],
          },
        })),

      clearAssessment: (clusterId) =>
        set((state) => {
          const next = { ...state.assessments };
          delete next[clusterId];
          return {
            assessments: next,
            plan: {
              ...state.plan,
              targetClusterIds: state.plan.targetClusterIds.filter((x) => x !== clusterId),
            },
          };
        }),
    }),
    { name: "sed.v6" },
  ),
);

export function getReadiness(state: State): Readiness {
  return state.plan.readiness;
}
