import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { BubbleCircle } from "@/components/app/BubbleCircle";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { ArrowRight } from "lucide-react";

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
  const shortlistedIds = useAppStore((s) => s.plan.targetClusterIds);

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
        {shortlistedIds.length > 0 && (
          <Link
            to="/market-potential"
            className="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-critical text-base font-semibold text-critical-foreground shadow-lg shadow-critical/20"
          >
            View my Market Map ({shortlistedIds.length})
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {CLUSTERS.map((c) => {
            const stkCount = stakeholders[c.id]?.length ?? 0;
            const shortlisted = shortlistedIds.includes(c.id);
            return (
              <BubbleCircle
                key={c.id}
                cluster={c}
                onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
                badge={
                  shortlisted
                    ? "Shortlisted"
                    : stkCount > 0
                      ? `${stkCount} contact${stkCount === 1 ? "" : "s"}`
                      : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
