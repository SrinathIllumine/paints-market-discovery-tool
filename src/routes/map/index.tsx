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
      { title: "Cluster Potential" },
      { name: "description", content: "Browse clusters relevant to Panvel and map their potential." },
    ],
  }),
  component: ClusterPotentialScreen,
});

function ClusterPotentialScreen() {
  const navigate = useNavigate();

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 1 of 4 · Market Potential"
          title="Clusters in Panvel"
          subtitle="Tap a bubble to open the cluster card and map its potential."
        />
      }
    >
      <div className="max-h-[calc(100vh-260px)] overflow-y-auto px-5 py-6">
        <Link
          to="/market-potential"
          className="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-critical text-base font-semibold text-critical-foreground shadow-lg shadow-critical/20"
        >
          View my Cluster Map
          <ArrowRight className="h-4 w-4" />
        </Link>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {CLUSTERS.map((c) => (
            <BubbleCircle
              key={c.id}
              cluster={c}
              onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: c.id } })}
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
