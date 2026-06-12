import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { BubbleCircle } from "@/components/app/BubbleCircle";
import { Tour } from "@/components/app/Tour";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";

import { ArrowRight, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/map/")({
  head: () => ({
    meta: [
      { title: "Map Market Potential" },
      {
        name: "description",
        content: "Browse clusters relevant to Panvel and map their potential.",
      },
    ],
  }),
  component: ClusterPotentialScreen,
});

function ClusterPotentialScreen() {
  const navigate = useNavigate();
  const [showHint, setShowHint] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const assessments = useAppStore((s) => s.assessments);
  // const mappedCount = Object.keys(assessments).length;
  const totalClusters = CLUSTERS.length;

  const dismissHint = () => setShowHint(false);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="STAGE 1 OF 3 · MAP MARKET POTENTIAL"
          title="Map Market Potential"
          subtitle="Tap a bubble to open the cluster card and map its potential."
        />
      }
    >
      <div
        ref={scrollRef}
        onScroll={() => {
          if (showHint && (scrollRef.current?.scrollTop ?? 0) > 8) {
            dismissHint();
          }
        }}
        className="px-6 py-8"
      >
        {showHint && (
          <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-muted-foreground animate-pulse">
            <ChevronDown className="h-3.5 w-3.5" />
            Scroll down
            <ChevronDown className="h-3.5 w-3.5" />
          </div>
        )}

        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Panvel · {totalClusters} clusters</span>
          <Link
            to="/market-potential"
            data-tour="map-view-button"
            className="inline-flex h-7 items-center justify-center gap-1 rounded-md bg-critical/20 px-3 text-[11px] font-semibold text-critical shadow-sm"
          >
            View my Cluster Map
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div data-tour="map-clusters" className="grid grid-cols-2 gap-5 sm:grid-cols-3">
          {CLUSTERS.map((c) => (
            <BubbleCircle
              key={c.id}
              cluster={c}
              badge={assessments[c.id] ? "Mapped" : undefined}
              onClick={() =>
                navigate({
                  to: "/map/$clusterId",
                  params: { clusterId: c.id },
                })
              }
            />
          ))}
        </div>
      </div>

      {/*
      <Tour
        tourKey="map-v1"
        steps={[
          {
            selector: '[data-tour="map-view-button"]',
            title: "View your Cluster Map",
            body: "Once you've mapped a few clusters, open this map to compare them side by side across revenue, competition, access and ease of sale.",
          },
          {
            selector: '[data-tour="map-clusters"]',
            title: "Your clusters",
            body: "Each bubble is a cluster type in your area. Tap one to identify prospects and score its potential.",
          },
        ]}
      />
      */}
    </AppShell>
  );
}
