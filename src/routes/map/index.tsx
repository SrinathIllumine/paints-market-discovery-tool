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
  const mappedCount = Object.keys(assessments).length;
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

        <Link
          to="/market-potential"
          data-tour="map-view-button"
          className="mb-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-critical text-base font-semibold text-critical-foreground shadow-lg shadow-critical/20"
        >
          View my Cluster Map
          <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="mt-6 mb-6 rounded-2xl border border-border bg-card px-4 py-3 text-center shadow-sm">
          <p className="mt-0.5 font-display text-base">
            {/*<span className="font-bold text-critical">Area: Panvel</span>*/}
            <span className="text-muted-foreground"> Total Number of Clusters in Panvel: {totalClusters}</span>
          </p>
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
