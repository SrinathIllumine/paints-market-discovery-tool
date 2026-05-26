import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { ClusterCard } from "@/components/app/ClusterCard";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/connects/")({
  head: () => ({
    meta: [
      { title: "Stakeholder Connects · Stage 2" },
      { name: "description", content: "Pick a cluster to plan your stakeholder outreach." },
    ],
  }),
  component: ConnectsHome,
});

function ConnectsHome() {
  const navigate = useNavigate();
  const stakeholders = useAppStore((s) => s.stakeholders);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 2 of 3 · Stakeholder Connects"
          title="Who will you connect with?"
          subtitle="Open any cluster to capture contacts and a personalised pitch."
        />
      }
    >
      <div className="space-y-3 px-5 py-5">
        {CLUSTERS.map((c) => {
          const count = stakeholders[c.id]?.length ?? 0;
          return (
            <ClusterCard
              key={c.id}
              cluster={c}
              onClick={() => navigate({ to: "/connects/$clusterId", params: { clusterId: c.id } })}
              rightSlot={
                <span className="text-[11px] font-medium text-navy">
                  {count} contact{count === 1 ? "" : "s"}
                </span>
              }
            />
          );
        })}
      </div>
    </AppShell>
  );
}
