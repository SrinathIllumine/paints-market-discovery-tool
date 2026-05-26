import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BubbleTile } from "@/components/app/BubbleTile";
import { BottomNav } from "@/components/app/BottomNav";
import { useAppStore } from "@/store/appStore";
import { META_CLUSTERS } from "@/data/clusters";
import { Lock, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/stage-2/")({
  head: () => ({
    meta: [
      { title: "Stage 2 · Shortlist Clusters" },
      {
        name: "description",
        content:
          "Score and shortlist the most attractive clusters based on potential, access, and service capacity.",
      },
    ],
  }),
  component: Stage2Index,
});

function Stage2Index() {
  const navigate = useNavigate();
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const customMeta = useAppStore((s) => s.customMeta);

  const metas = useMemo(() => {
    const metaIds = new Set(Object.values(clusterMaps).map((m) => m.metaId));
    const all = [...META_CLUSTERS, ...customMeta];
    return all.filter((m) => metaIds.has(m.id));
  }, [clusterMaps, customMeta]);

  if (metas.length === 0) {
    return (
      <AppShell
        bottom={<BottomNav />}
        header={
          <StageHeader
            eyebrow="Stage 2 of 5"
            title="Shortlist Clusters"
            subtitle="Locked"
          />
        }
      >
        <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
          <div className="rounded-full bg-muted p-5">
            <Lock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h2 className="mt-5 font-display text-2xl">Save a Cluster Map first</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Stage 2 unlocks once you've saved at least one Cluster Map in Stage 1.
          </p>
          <Button
            className="mt-6 bg-critical text-critical-foreground hover:bg-critical/90"
            onClick={() => navigate({ to: "/stage-1" })}
          >
            Go to Stage 1
          </Button>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 2 of 5 · Shortlist"
          title="Score your clusters"
          subtitle="Only meta-clusters with saved maps appear here"
        />
      }
    >
      <div className="space-y-3 px-5 py-5">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => navigate({ to: "/stage-2/shortlist" })}
        >
          <span className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" /> View Final Shortlist
          </span>
        </Button>
        <div className="space-y-2.5 pt-2">
          {metas.map((m) => {
            const count = Object.values(clusterMaps).filter((cm) => cm.metaId === m.id).length;
            return (
              <BubbleTile
                key={m.id}
                title={m.name}
                subtitle={`${count} cluster${count > 1 ? "s" : ""} mapped`}
                recommended={m.recommended}
                onClick={() => navigate({ to: "/stage-2/$metaId", params: { metaId: m.id } })}
              />
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
