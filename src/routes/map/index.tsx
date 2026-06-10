import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { BubbleCircle } from "@/components/app/BubbleCircle";
import { CLUSTERS } from "@/data/clusters";

import { ArrowRight, ChevronDown } from "lucide-react";

const SCROLL_HINT_KEY = "clusters:scrollHintDismissed";

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
  const [showHint, setShowHint] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(SCROLL_HINT_KEY)) return;
    setShowHint(true);
  }, []);

  const dismissHint = () => {
    setShowHint(false);
    try {
      sessionStorage.setItem(SCROLL_HINT_KEY, "1");
    } catch {}
  };


  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 1 of 4 · Analyze Market Potential"
          title="Clusters in Panvel"
          subtitle="Tap a bubble to open the cluster card and map its potential."
        />
      }
    >
      <div
        ref={scrollRef}
        onScroll={() => {
          if (showHint && (scrollRef.current?.scrollTop ?? 0) > 8) dismissHint();
        }}
        className="max-h-[calc(100vh-260px)] overflow-y-auto px-6 py-8"
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
