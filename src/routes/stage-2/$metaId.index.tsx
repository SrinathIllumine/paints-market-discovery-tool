import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BubbleCircle, BubbleScroller } from "@/components/app/BubbleCircle";
import { BottomNav } from "@/components/app/BottomNav";
import { ScoreChip } from "@/components/app/ScoreChip";
import { useAppStore } from "@/store/appStore";
import { META_CLUSTERS } from "@/data/clusters";
import { computeScore } from "@/lib/scoring";

export const Route = createFileRoute("/stage-2/$metaId/")({
  component: Stage2MetaScreen,
});

function Stage2MetaScreen() {
  const { metaId } = Route.useParams();
  const navigate = useNavigate();
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const customMeta = useAppStore((s) => s.customMeta);
  const scores = useAppStore((s) => s.scores);

  const meta = useMemo(
    () =>
      META_CLUSTERS.find((m) => m.id === metaId) ??
      customMeta.find((m) => m.id === metaId),
    [metaId, customMeta],
  );

  const mappedClusters = useMemo(
    () => Object.values(clusterMaps).filter((cm) => cm.metaId === metaId),
    [clusterMaps, metaId],
  );

  if (!meta) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 2 · Clusters"
          title={meta.name}
          subtitle="Score each cluster to build the shortlist"
          backTo="/stage-2"
        />
      }
    >
      <div className="px-5 py-5">
        <BubbleScroller>
          {mappedClusters.map((cm) => {
            const s = scores[cm.clusterId];
            const total = s ? computeScore(s).total : null;
            return (
              <BubbleCircle
                key={cm.clusterId}
                title={cm.clusterName}
                subtitle={`${cm.prospects.length} prospects · ${cm.selectedProspectIds.length} on map`}
                trailing={
                  total !== null ? (
                    <ScoreChip total={total} />
                  ) : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      Score
                    </span>
                  )
                }
                onClick={() =>
                  navigate({
                    to: "/stage-2/$metaId/$clusterId",
                    params: { metaId: meta.id, clusterId: cm.clusterId },
                  })
                }
              />
            );
          })}
        </BubbleScroller>
      </div>
    </AppShell>
  );
}
