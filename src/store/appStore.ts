import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Cluster, MetaCluster } from "@/data/clusters";

export type Prospect = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  placeId?: string;
  locality?: string;
  source: "places" | "manual";
};

export type ClusterMap = {
  metaId: string;
  metaName: string;
  clusterId: string;
  clusterName: string;
  prospects: Prospect[];
  selectedProspectIds: string[];
  createdAt: number;
  updatedAt: number;
};

export type Score = {
  potential: {
    size: "S" | "M" | "L" | null;
    demand: "L" | "M" | "H" | null;
    aov: "L" | "M" | "H" | null;
  };
  access: {
    directConnections: number;
    referralPotential: number;
  };
  service: {
    retailersAvailable: boolean | null;
    productAvailable: boolean | null;
  };
  shortlisted: boolean;
};

type State = {
  customMeta: MetaCluster[];
  customClusters: Record<string, Cluster[]>; // metaId -> clusters
  clusterMaps: Record<string, ClusterMap>; // clusterId -> map
  scores: Record<string, Score>; // clusterId -> score
};

type Actions = {
  addMeta: (name: string) => string;
  addCluster: (metaId: string, name: string) => string;
  upsertClusterMap: (map: ClusterMap) => void;
  setProspects: (clusterId: string, prospects: Prospect[]) => void;
  addProspect: (clusterId: string, prospect: Prospect) => void;
  toggleProspectSelected: (clusterId: string, prospectId: string) => void;
  setScore: (clusterId: string, partial: Partial<Score>) => void;
  toggleShortlist: (clusterId: string) => void;
};

const emptyScore = (): Score => ({
  potential: { size: null, demand: null, aov: null },
  access: { directConnections: 0, referralPotential: 0 },
  service: { retailersAvailable: null, productAvailable: null },
  shortlisted: false,
});

export const useAppStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      customMeta: [],
      customClusters: {},
      clusterMaps: {},
      scores: {},

      addMeta: (name) => {
        const id = `custom-meta-${Date.now()}`;
        set((s) => ({
          customMeta: [
            ...s.customMeta,
            { id, name, short: name, clusters: [], recommended: false },
          ],
        }));
        return id;
      },

      addCluster: (metaId, name) => {
        const id = `custom-cluster-${Date.now()}`;
        set((s) => ({
          customClusters: {
            ...s.customClusters,
            [metaId]: [...(s.customClusters[metaId] ?? []), { id, name }],
          },
        }));
        return id;
      },

      upsertClusterMap: (map) =>
        set((s) => ({ clusterMaps: { ...s.clusterMaps, [map.clusterId]: map } })),

      setProspects: (clusterId, prospects) =>
        set((s) => {
          const existing = s.clusterMaps[clusterId];
          if (!existing) return s;
          return {
            clusterMaps: {
              ...s.clusterMaps,
              [clusterId]: {
                ...existing,
                prospects,
                selectedProspectIds: prospects.map((p) => p.id),
                updatedAt: Date.now(),
              },
            },
          };
        }),

      addProspect: (clusterId, prospect) =>
        set((s) => {
          const existing = s.clusterMaps[clusterId];
          if (!existing) return s;
          return {
            clusterMaps: {
              ...s.clusterMaps,
              [clusterId]: {
                ...existing,
                prospects: [...existing.prospects, prospect],
                selectedProspectIds: [...existing.selectedProspectIds, prospect.id],
                updatedAt: Date.now(),
              },
            },
          };
        }),

      toggleProspectSelected: (clusterId, prospectId) =>
        set((s) => {
          const existing = s.clusterMaps[clusterId];
          if (!existing) return s;
          const has = existing.selectedProspectIds.includes(prospectId);
          return {
            clusterMaps: {
              ...s.clusterMaps,
              [clusterId]: {
                ...existing,
                selectedProspectIds: has
                  ? existing.selectedProspectIds.filter((x) => x !== prospectId)
                  : [...existing.selectedProspectIds, prospectId],
                updatedAt: Date.now(),
              },
            },
          };
        }),

      setScore: (clusterId, partial) =>
        set((s) => {
          const prev = s.scores[clusterId] ?? emptyScore();
          return {
            scores: {
              ...s.scores,
              [clusterId]: {
                ...prev,
                ...partial,
                potential: { ...prev.potential, ...(partial.potential ?? {}) },
                access: { ...prev.access, ...(partial.access ?? {}) },
                service: { ...prev.service, ...(partial.service ?? {}) },
              },
            },
          };
        }),

      toggleShortlist: (clusterId) =>
        set((s) => {
          const prev = s.scores[clusterId] ?? emptyScore();
          return {
            scores: {
              ...s.scores,
              [clusterId]: { ...prev, shortlisted: !prev.shortlisted },
            },
          };
        }),
    }),
    { name: "sed.v1" },
  ),
);
