import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ClusterAssessment } from "@/lib/clusterScoring";
import type { ConnectStrategy, ContactEntry, StrategyAnswers } from "@/lib/strategyContent";

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

export type ConnectModel = "L1" | "L2" | "L3";
export type RoadmapStep = "value" | "connect" | "action";
export type RoadmapCompletion = Record<RoadmapStep, boolean>;

export type SalesStage = "prospects" | "contacted" | "decision" | "closure" | "ongoing";
export const SALES_STAGES: SalesStage[] = ["prospects", "contacted", "decision", "closure", "ongoing"];
export const SALES_STAGE_LABEL: Record<SalesStage, string> = {
  prospects: "Prospects",
  contacted: "Contacted",
  decision: "Solution Proposal",
  closure: "Sales Closure",
  ongoing: "Continuous Ongoing Relationship",
};

export type ProspectActivity = {
  contactsAccessed?: boolean;
  meetingsDone?: number;
  productDiscussion?: boolean;
  valuePropShared?: boolean;
  outcomes?: string[];
  notInterested?: boolean;
};

// Stable empty references so selectors don't return a new {} / [] per render.
export const EMPTY_PROSPECTS: Prospect[] = [];
export const EMPTY_ACTIVITY: ProspectActivity = {};
export const EMPTY_STAGE_MAP: Record<string, SalesStage> = {};

export type EventEstimate = { participants?: number; contractors?: number };
export type PastEventFeedback = { attended?: number; leads?: number; challenges?: string };

type State = {
  clusters: Record<string, ClusterState>;
  stakeholders: Record<string, Stakeholder[]>;
  insights: Insight[];
  plan: {
    targetClusterIds: string[];
    events: PlanEvent[];
    readiness: Readiness;
    monthlyFocusIds: string[];
    // legacy
    connectStrategyByCluster: Record<string, ConnectStrategy>;
    strategyAnswersByCluster: Record<string, StrategyAnswers>;
    // engagement plan
    valuePropositionByCluster: Record<string, string>;
    selectedStrategiesByCluster: Record<string, ConnectStrategy[]>;
    // per-strategy multi-select items (initiatives / event topics / channels)
    strategyItemsByCluster: Record<string, Partial<Record<ConnectStrategy, string[]>>>;
    // per-strategy contact tables (contractors / community)
    strategyContactsByCluster: Record<string, Partial<Record<ConnectStrategy, ContactEntry[]>>>;
    // selected actions (per strategy) for the action plan
    selectedActionsByCluster: Record<string, Partial<Record<ConnectStrategy, string[]>>>;
    // user-added custom actions
    customActionsByCluster: Record<string, Partial<Record<ConnectStrategy, string[]>>>;
    // estimates for each contribution event id (used in Stage 4 popup)
    eventEstimatesByCluster: Record<string, Record<string, EventEstimate>>;
    // past-roadmap feedback per cluster + event id
    pastEventFeedbackByCluster: Record<string, Record<string, PastEventFeedback>>;
    roadmapCompletion: RoadmapCompletion;
  };
  assessments: Record<string, ClusterAssessment>;
  sales: {
    prospectStages: Record<string, Record<string, SalesStage>>;
    prospectActivity: Record<string, ProspectActivity>;
    seededClusters: Record<string, boolean>;
  };
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
  setMonthlyFocus: (clusterId: string) => void;
  toggleMonthlyFocus: (clusterId: string) => void;

  setConnectStrategy: (clusterId: string, strategy: ConnectStrategy) => void;
  setStrategyAnswers: (clusterId: string, patch: Partial<StrategyAnswers>) => void;

  setValueProposition: (clusterId: string, vp: string) => void;
  toggleSelectedStrategy: (clusterId: string, strategy: ConnectStrategy) => void;
  toggleStrategyItem: (clusterId: string, strategy: ConnectStrategy, item: string) => void;
  setStrategyContacts: (clusterId: string, strategy: ConnectStrategy, contacts: ContactEntry[]) => void;
  toggleSelectedAction: (clusterId: string, strategy: ConnectStrategy, action: string) => void;
  addCustomAction: (clusterId: string, strategy: ConnectStrategy, text: string) => void;
  removeCustomAction: (clusterId: string, strategy: ConnectStrategy, text: string) => void;
  setEventEstimate: (clusterId: string, eventId: string, patch: Partial<EventEstimate>) => void;
  setPastEventFeedback: (clusterId: string, eventId: string, patch: Partial<PastEventFeedback>) => void;

  setRoadmapStep: (step: RoadmapStep, completed: boolean) => void;
  resetRoadmap: () => void;

  setAssessment: (clusterId: string, assessment: ClusterAssessment) => void;
  clearAssessment: (clusterId: string) => void;

  seedSalesStages: (clusterId: string, prospectIds: string[]) => void;
  setProspectStage: (clusterId: string, prospectId: string, stage: SalesStage) => void;
  recordProspectActivity: (prospectId: string, patch: Partial<ProspectActivity>) => void;
  addProspectOutcome: (prospectId: string, outcome: string) => void;
  markProspectNotInterested: (clusterId: string, prospectId: string) => void;
};

const emptyCluster = (): ClusterState => ({ jkShare: null, prospects: [], visited: false });
const emptyReadiness = (): Readiness => ({ retailers: null, stock: null, painters: null });
const emptyRoadmap = (): RoadmapCompletion => ({ value: false, connect: false, action: false });

function distributeStages(prospectIds: string[]): Record<string, SalesStage> {
  const n = prospectIds.length;
  if (n === 0) return {};
  const ratios = [0.4, 0.25, 0.18, 0.12, 0.05];
  const counts = ratios.map((r) => Math.max(0, Math.round(r * n)));
  const diff = n - counts.reduce((a, b) => a + b, 0);
  counts[0] += diff;
  const out: Record<string, SalesStage> = {};
  const stages: SalesStage[] = ["prospects", "contacted", "decision", "closure", "ongoing"];
  let idx = 0;
  for (let s = 0; s < stages.length; s++) {
    for (let i = 0; i < counts[s] && idx < n; i++, idx++) out[prospectIds[idx]] = stages[s];
  }
  return out;
}

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
        valuePropositionByCluster: {},
        selectedStrategiesByCluster: {},
        strategyItemsByCluster: {},
        strategyContactsByCluster: {},
        selectedActionsByCluster: {},
        customActionsByCluster: {},
        eventEstimatesByCluster: {},
        pastEventFeedbackByCluster: {},
        roadmapCompletion: emptyRoadmap(),
      },
      sales: { prospectStages: {}, prospectActivity: {}, seededClusters: {} },

      ensureCluster: (clusterId) =>
        set((s) =>
          s.clusters[clusterId] ? s : { clusters: { ...s.clusters, [clusterId]: emptyCluster() } },
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
          return { clusters: { ...s.clusters, [clusterId]: { ...prev, prospects } } };
        }),

      addProspect: (clusterId, p) =>
        set((s) => {
          const prev = s.clusters[clusterId] ?? emptyCluster();
          return { clusters: { ...s.clusters, [clusterId]: { ...prev, prospects: [...prev.prospects, p] } } };
        }),

      addInsight: (text) =>
        set((state) => ({
          insights: [
            ...state.insights,
            { id: `ins-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, createdAt: Date.now() },
          ],
        })),
      removeInsight: (id) => set((state) => ({ insights: state.insights.filter((i) => i.id !== id) })),

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
            plan: { ...state.plan, targetClusterIds: [...state.plan.targetClusterIds, clusterId] },
          };
        }),

      setMonthlyFocus: (clusterId) =>
        set((state) => ({
          plan: { ...state.plan, monthlyFocusIds: [clusterId], roadmapCompletion: emptyRoadmap() },
        })),

      toggleMonthlyFocus: (clusterId) =>
        set((state) => ({
          plan: {
            ...state.plan,
            monthlyFocusIds: state.plan.monthlyFocusIds.includes(clusterId) ? [] : [clusterId],
            roadmapCompletion: emptyRoadmap(),
          },
        })),

      setConnectStrategy: (clusterId, strategy) =>
        set((state) => ({
          plan: {
            ...state.plan,
            connectStrategyByCluster: { ...state.plan.connectStrategyByCluster, [clusterId]: strategy },
          },
        })),

      setStrategyAnswers: (clusterId, patch) =>
        set((state) => {
          const prev = state.plan.strategyAnswersByCluster[clusterId] ?? {};
          return {
            plan: {
              ...state.plan,
              strategyAnswersByCluster: { ...state.plan.strategyAnswersByCluster, [clusterId]: { ...prev, ...patch } },
            },
          };
        }),

      setValueProposition: (clusterId, vp) =>
        set((state) => ({
          plan: {
            ...state.plan,
            valuePropositionByCluster: { ...state.plan.valuePropositionByCluster, [clusterId]: vp },
          },
        })),

      toggleSelectedStrategy: (clusterId, strategy) =>
        set((state) => {
          const prev = state.plan.selectedStrategiesByCluster[clusterId] ?? [];
          const has = prev.includes(strategy);
          const next: ConnectStrategy[] = has
            ? prev.filter((s) => s !== strategy)
            : [...prev, strategy];
          return {
            plan: {
              ...state.plan,
              selectedStrategiesByCluster: { ...state.plan.selectedStrategiesByCluster, [clusterId]: next },
            },
          };
        }),

      toggleStrategyItem: (clusterId, strategy, item) =>
        set((state) => {
          const cm = state.plan.strategyItemsByCluster[clusterId] ?? {};
          const prev = cm[strategy] ?? [];
          const next = prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item];
          return {
            plan: {
              ...state.plan,
              strategyItemsByCluster: {
                ...state.plan.strategyItemsByCluster,
                [clusterId]: { ...cm, [strategy]: next },
              },
            },
          };
        }),

      setStrategyContacts: (clusterId, strategy, contacts) =>
        set((state) => {
          const cm = state.plan.strategyContactsByCluster[clusterId] ?? {};
          return {
            plan: {
              ...state.plan,
              strategyContactsByCluster: {
                ...state.plan.strategyContactsByCluster,
                [clusterId]: { ...cm, [strategy]: contacts },
              },
            },
          };
        }),

      toggleSelectedAction: (clusterId, strategy, action) =>
        set((state) => {
          const cm = state.plan.selectedActionsByCluster[clusterId] ?? {};
          const prev = cm[strategy] ?? [];
          const next = prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action];
          return {
            plan: {
              ...state.plan,
              selectedActionsByCluster: {
                ...state.plan.selectedActionsByCluster,
                [clusterId]: { ...cm, [strategy]: next },
              },
            },
          };
        }),

      addCustomAction: (clusterId, strategy, text) =>
        set((state) => {
          const cm = state.plan.customActionsByCluster[clusterId] ?? {};
          const prev = cm[strategy] ?? [];
          if (prev.includes(text)) return state;
          return {
            plan: {
              ...state.plan,
              customActionsByCluster: {
                ...state.plan.customActionsByCluster,
                [clusterId]: { ...cm, [strategy]: [...prev, text] },
              },
            },
          };
        }),

      removeCustomAction: (clusterId, strategy, text) =>
        set((state) => {
          const cm = state.plan.customActionsByCluster[clusterId] ?? {};
          const prev = cm[strategy] ?? [];
          return {
            plan: {
              ...state.plan,
              customActionsByCluster: {
                ...state.plan.customActionsByCluster,
                [clusterId]: { ...cm, [strategy]: prev.filter((a) => a !== text) },
              },
            },
          };
        }),

      setRoadmapStep: (step, completed) =>
        set((state) => ({
          plan: {
            ...state.plan,
            roadmapCompletion: { ...(state.plan.roadmapCompletion ?? emptyRoadmap()), [step]: completed },
          },
        })),

      resetRoadmap: () => set((state) => ({ plan: { ...state.plan, roadmapCompletion: emptyRoadmap() } })),

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

      seedSalesStages: (clusterId, prospectIds) =>
        set((state) => {
          if (state.sales.seededClusters[clusterId]) return state;
          const mapping = distributeStages(prospectIds);
          return {
            sales: {
              ...state.sales,
              prospectStages: {
                ...state.sales.prospectStages,
                [clusterId]: { ...(state.sales.prospectStages[clusterId] ?? {}), ...mapping },
              },
              seededClusters: { ...state.sales.seededClusters, [clusterId]: true },
            },
          };
        }),

      setProspectStage: (clusterId, prospectId, stage) =>
        set((state) => ({
          sales: {
            ...state.sales,
            prospectStages: {
              ...state.sales.prospectStages,
              [clusterId]: { ...(state.sales.prospectStages[clusterId] ?? {}), [prospectId]: stage },
            },
          },
        })),

      recordProspectActivity: (prospectId, patch) =>
        set((state) => {
          const prev = state.sales.prospectActivity[prospectId] ?? {};
          return {
            sales: {
              ...state.sales,
              prospectActivity: { ...state.sales.prospectActivity, [prospectId]: { ...prev, ...patch } },
            },
          };
        }),

      addProspectOutcome: (prospectId, outcome) =>
        set((state) => {
          const prev = state.sales.prospectActivity[prospectId] ?? {};
          const outcomes = [...(prev.outcomes ?? []), outcome];
          return {
            sales: {
              ...state.sales,
              prospectActivity: { ...state.sales.prospectActivity, [prospectId]: { ...prev, outcomes } },
            },
          };
        }),

      markProspectNotInterested: (clusterId, prospectId) =>
        set((state) => {
          const prev = state.sales.prospectActivity[prospectId] ?? {};
          const stageMap = { ...(state.sales.prospectStages[clusterId] ?? {}) };
          stageMap[prospectId] = "prospects";
          return {
            sales: {
              ...state.sales,
              prospectStages: {
                ...state.sales.prospectStages,
                [clusterId]: stageMap,
              },
              prospectActivity: {
                ...state.sales.prospectActivity,
                [prospectId]: { ...prev, notInterested: false },
              },
            },
          };
        }),
    }),
    { name: "sed.v8" },
  ),
);

export function getReadiness(state: State): Readiness {
  return state.plan.readiness;
}
