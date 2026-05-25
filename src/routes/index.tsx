import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { META_CLUSTERS, type Cluster, type MetaCluster, type Prospect } from "@/data/clusters";
import { Header } from "@/components/stage1/Header";
import { MetaClusterStep } from "@/components/stage1/MetaClusterStep";
import { ClusterStep } from "@/components/stage1/ClusterStep";
import { ProspectStep } from "@/components/stage1/ProspectStep";
import { SummaryStep } from "@/components/stage1/SummaryStep";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Identify Market Clusters — Systematic Engagement & Discovery" },
      {
        name: "description",
        content:
          "Stage 1: Demand Generators map relevant market clusters in their geography to build a Cluster Map.",
      },
    ],
  }),
  component: Stage1Flow,
});

type ProspectExt = Prospect & { clusterId: string; clusterName: string };

function Stage1Flow() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [customMeta, setCustomMeta] = useState<MetaCluster[]>([]);
  const [selectedMetaId, setSelectedMetaId] = useState<string | null>(null);

  // clusterId -> selected (multi)
  const [selectedClusterIds, setSelectedClusterIds] = useState<string[]>([]);
  // user-added clusters per meta
  const [customClusters, setCustomClusters] = useState<Record<string, Cluster[]>>({});
  // user-added prospects with cluster mapping
  const [customProspects, setCustomProspects] = useState<ProspectExt[]>([]);
  const [selectedProspectIds, setSelectedProspectIds] = useState<string[]>([]);

  const allMeta = useMemo(() => [...META_CLUSTERS, ...customMeta], [customMeta]);
  const meta = useMemo(
    () => allMeta.find((m) => m.id === selectedMetaId) ?? null,
    [allMeta, selectedMetaId],
  );

  const metaWithCustom: MetaCluster | null = useMemo(() => {
    if (!meta) return null;
    const extra = customClusters[meta.id] ?? [];
    return { ...meta, clusters: [...meta.clusters, ...extra] };
  }, [meta, customClusters]);

  const selectedClusters: Cluster[] = useMemo(() => {
    if (!metaWithCustom) return [];
    return metaWithCustom.clusters.filter((c) => selectedClusterIds.includes(c.id));
  }, [metaWithCustom, selectedClusterIds]);

  const allProspectsForSelected: ProspectExt[] = useMemo(() => {
    const base = selectedClusters.flatMap((c) =>
      c.prospects.map((p) => ({ ...p, clusterId: c.id, clusterName: c.name })),
    );
    const extra = customProspects.filter((p) =>
      selectedClusterIds.includes(p.clusterId),
    );
    return [...base, ...extra];
  }, [selectedClusters, customProspects, selectedClusterIds]);

  const selectedProspects = allProspectsForSelected.filter((p) =>
    selectedProspectIds.includes(p.id),
  );

  // Handlers
  const handleSelectMeta = (id: string) => {
    setSelectedMetaId(id);
    setSelectedClusterIds([]);
    setSelectedProspectIds([]);
    setStep(2);
  };

  const handleToggleCluster = (id: string) =>
    setSelectedClusterIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleAddMeta = (name: string) => {
    const id = `custom-meta-${Date.now()}`;
    setCustomMeta((prev) => [...prev, { id, name, short: name, clusters: [] }]);
  };

  const handleAddCluster = (name: string) => {
    if (!meta) return;
    const id = `custom-cluster-${Date.now()}`;
    setCustomClusters((prev) => ({
      ...prev,
      [meta.id]: [...(prev[meta.id] ?? []), { id, name, prospects: [] }],
    }));
    setSelectedClusterIds((prev) => [...prev, id]);
  };

  const handleAddProspect = (
    clusterId: string,
    data: { name: string; locality?: string },
  ) => {
    const cluster =
      metaWithCustom?.clusters.find((c) => c.id === clusterId) ??
      ({ id: clusterId, name: "Cluster" } as Cluster);
    const id = `custom-prospect-${Date.now()}`;
    const newP: ProspectExt = {
      id,
      name: data.name,
      locality: data.locality ?? "Panvel",
      x: 30 + Math.random() * 50,
      y: 30 + Math.random() * 40,
      clusterId,
      clusterName: cluster.name,
    };
    setCustomProspects((prev) => [...prev, newP]);
    setSelectedProspectIds((prev) => [...prev, id]);
  };

  const handleToggleProspect = (id: string) =>
    setSelectedProspectIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  return (
    <div className="min-h-screen">
      <Header step={step} />
      <main>
        {step === 1 && (
          <MetaClusterStep
            customMeta={customMeta}
            selectedId={selectedMetaId}
            onSelect={handleSelectMeta}
            onAdd={handleAddMeta}
          />
        )}
        {step === 2 && metaWithCustom && (
          <ClusterStep
            meta={metaWithCustom}
            selectedIds={selectedClusterIds}
            onToggle={handleToggleCluster}
            onAdd={handleAddCluster}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && metaWithCustom && (
          <ProspectStep
            clusters={selectedClusters}
            customProspects={customProspects.filter((p) =>
              selectedClusterIds.includes(p.clusterId),
            )}
            selectedIds={selectedProspectIds}
            onToggle={handleToggleProspect}
            onAdd={handleAddProspect}
            onBack={() => setStep(2)}
            onConfirm={() => setStep(4)}
          />
        )}
        {step === 4 && metaWithCustom && (
          <SummaryStep
            meta={metaWithCustom}
            clusters={selectedClusters}
            prospects={selectedProspects}
            onEdit={() => setStep(1)}
          />
        )}
      </main>
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
        Systematic Engagement & Discovery · Retail Sales & Distribution
      </footer>
    </div>
  );
}
