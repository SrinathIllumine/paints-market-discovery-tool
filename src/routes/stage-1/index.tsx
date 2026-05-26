import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BubbleCircle, BubbleScroller } from "@/components/app/BubbleCircle";
import { TriggerCard } from "@/components/app/TriggerCard";
import { FAB } from "@/components/app/FAB";
import { NameSheet } from "@/components/app/NameSheet";
import { BottomNav } from "@/components/app/BottomNav";
import { META_CLUSTERS, TRIGGERS_META } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/stage-1/")({
  head: () => ({
    meta: [
      { title: "Stage 1 · Identify Market Clusters" },
      {
        name: "description",
        content:
          "Pick the meta-clusters most relevant to Panvel and build your cluster map.",
      },
    ],
  }),
  component: MetaClustersScreen,
});

function MetaClustersScreen() {
  const navigate = useNavigate();
  const customMeta = useAppStore((s) => s.customMeta);
  const addMeta = useAppStore((s) => s.addMeta);
  const [sheetOpen, setSheetOpen] = useState(false);

  const list = useMemo(() => {
    // Smart filter: recommended + adjacent only, plus any user-added.
    const filtered = META_CLUSTERS.filter((m) => m.recommended || m.adjacent);
    // Recommended first, then adjacent
    filtered.sort(
      (a, b) => Number(!!b.recommended) - Number(!!a.recommended),
    );
    return [...filtered, ...customMeta];
  }, [customMeta]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 1 of 5 · Identify"
          title="Welcome Sunil Kumar"
          subtitle="Let's map clusters in Panvel, Mumbai"
        />
      }
    >
      <div className="space-y-3 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Meta-clusters relevant to your area
        </p>
        <BubbleScroller>
          {list.map((m) => (
            <BubbleCircle
              key={m.id}
              title={m.name}
              subtitle={`${m.clusters.length} clusters`}
              recommended={m.recommended}
              adjacent={m.adjacent}
              onClick={() => navigate({ to: "/stage-1/$metaId", params: { metaId: m.id } })}
            />
          ))}
        </BubbleScroller>


        <div className="space-y-2 pt-4">
          {TRIGGERS_META.map((t) => (
            <TriggerCard key={t} text={t} />
          ))}
        </div>
      </div>

      <FAB onClick={() => setSheetOpen(true)} label="Add meta-cluster">
        Add Meta-Cluster
      </FAB>

      <NameSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        title="Add a meta-cluster"
        placeholder="e.g. Coastal Redevelopment"
        onSubmit={(name) => {
          const id = addMeta(name);
          navigate({ to: "/stage-1/$metaId", params: { metaId: id }, search: { addCluster: 1 } as never });
        }}
      />
    </AppShell>
  );
}
