import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BubbleTile } from "@/components/app/BubbleTile";
import { FAB } from "@/components/app/FAB";
import { NameSheet } from "@/components/app/NameSheet";
import { BottomNav } from "@/components/app/BottomNav";
import { META_CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/stage-1/$metaId")({
  validateSearch: (s: Record<string, unknown>) => ({
    addCluster: s.addCluster === 1 || s.addCluster === "1" ? 1 : undefined,
  }),
  component: ClusterListScreen,
});

function ClusterListScreen() {
  const { metaId } = Route.useParams();
  const { addCluster: openAddSearch } = Route.useSearch();
  const navigate = useNavigate();

  const customMeta = useAppStore((s) => s.customMeta);
  const customClusters = useAppStore((s) => s.customClusters);
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const addCluster = useAppStore((s) => s.addCluster);

  const meta = useMemo(
    () =>
      META_CLUSTERS.find((m) => m.id === metaId) ??
      customMeta.find((m) => m.id === metaId),
    [metaId, customMeta],
  );

  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (openAddSearch) setSheetOpen(true);
  }, [openAddSearch]);

  if (!meta) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Meta-cluster not found.</div>
      </AppShell>
    );
  }

  const extras = customClusters[meta.id] ?? [];
  // Smart filter: recommended + adjacent + any custom + any with a saved map
  const list = [...meta.clusters, ...extras].filter(
    (c) => c.recommended || c.adjacent || clusterMaps[c.id] || c.id.startsWith("custom-"),
  );

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 1 · Clusters"
          title={meta.name}
          subtitle="Tap a cluster to build its map"
          backTo="/stage-1"
        />
      }
    >
      <div className="space-y-3 px-5 py-5">
        <div className="space-y-2.5">
          {list.map((c) => {
            const saved = !!clusterMaps[c.id];
            return (
              <BubbleTile
                key={c.id}
                title={c.name}
                recommended={c.recommended}
                adjacent={c.adjacent}
                trailing={
                  saved ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-critical/10 px-2 py-1 text-[10px] font-semibold uppercase text-critical">
                      <CheckCircle2 className="h-3 w-3" /> Mapped
                    </span>
                  ) : undefined
                }
                onClick={() =>
                  navigate({
                    to: "/stage-1/$metaId/$clusterId",
                    params: { metaId: meta.id, clusterId: c.id },
                  })
                }
              />
            );
          })}
          {list.length === 0 && (
            <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No clusters yet. Tap "Add Cluster" to create one.
            </p>
          )}
        </div>
      </div>

      <FAB onClick={() => setSheetOpen(true)} label="Add cluster">
        Add Cluster
      </FAB>

      <NameSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title={`Add a cluster to ${meta.name}`}
        placeholder="e.g. Coastal Townships"
        onSubmit={(name) => {
          const id = addCluster(meta.id, name);
          navigate({
            to: "/stage-1/$metaId/$clusterId",
            params: { metaId: meta.id, clusterId: id },
          });
        }}
      />
    </AppShell>
  );
}
