import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { ClusterCard } from "@/components/app/ClusterCard";
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
          subtitle="Tap a cluster to see intelligence, prospects and contacts."
        />
      }
    >
      <div className="space-y-3 px-5 py-5">
        {CLUSTERS.map((c) => {
          const stkCount = stakeholders[c.id]?.length ?? 0;
          return (
            <ClusterCard
              key={c.id}
              cluster={c}
              onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
              rightSlot={
                stkCount > 0 ? (
                  <span className="text-[11px] font-medium text-navy">
                    {stkCount} stakeholder{stkCount === 1 ? "" : "s"} added
                  </span>
                ) : null
              }
            />
          );
        })}
      </div>
    </AppShell>
  );
}
