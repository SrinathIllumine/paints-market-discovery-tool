import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { BubbleCircle } from "@/components/app/BubbleCircle";
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
          subtitle="Tap a cluster bubble to capture contacts and a personalised pitch."
        />
      }
    >
      <div className="grid grid-cols-2 gap-5 px-5 py-6 sm:grid-cols-3">
        {CLUSTERS.map((c) => {
          const count = stakeholders[c.id]?.length ?? 0;
          return (
            <BubbleCircle
              key={c.id}
              cluster={c}
              onClick={() => navigate({ to: "/connects/$clusterId", params: { clusterId: c.id } })}
              badge={count > 0 ? `${count} contact${count === 1 ? "" : "s"}` : undefined}
            />
          );
        })}
      </div>
    </AppShell>
  );
}
