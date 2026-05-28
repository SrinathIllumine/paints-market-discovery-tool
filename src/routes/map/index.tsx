import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { BubbleCircle } from "@/components/app/BubbleCircle";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/map/")({
  head: () => ({
    meta: [
      { title: "Market Map · Stage 1" },
      { name: "description", content: "Browse clusters relevant to Panvel and open each one for details." },
    ],
  }),
  component: MarketMapScreen,
});

function MarketMapScreen() {
  const navigate = useNavigate();
  const stakeholders = useAppStore((s) => s.stakeholders);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 1 of 3 · Market Map"
          title="Clusters in Panvel"
          subtitle="Tap a bubble to open the cluster card."
        />
      }
    >
      <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-5 py-6">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {CLUSTERS.map((c) => {
            const stkCount = stakeholders[c.id]?.length ?? 0;
            return (
              <BubbleCircle
                key={c.id}
                cluster={c}
                onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
                badge={stkCount > 0 ? `${stkCount} contact${stkCount === 1 ? "" : "s"}` : undefined}
              />
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
