import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { BubbleCircle } from "@/components/app/BubbleCircle";
import { Button } from "@/components/ui/button";
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

const INITIAL = 6;

function ConnectsHome() {
  const navigate = useNavigate();
  const stakeholders = useAppStore((s) => s.stakeholders);
  const [visible, setVisible] = useState(INITIAL);
  const shown = CLUSTERS.slice(0, visible);
  const hasMore = visible < CLUSTERS.length;

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
      <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-5 py-6">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {shown.map((c) => {
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
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisible((v) => Math.min(v + INITIAL, CLUSTERS.length))}
            >
              Load more ({CLUSTERS.length - visible})
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
