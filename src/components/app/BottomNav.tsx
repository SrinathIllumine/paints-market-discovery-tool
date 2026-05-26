import { Link, useRouterState } from "@tanstack/react-router";
import { Lock, Map, ListChecks } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const unlocked = Object.keys(clusterMaps).length > 0;
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isStage1 = path.startsWith("/stage-1");
  const isStage2 = path.startsWith("/stage-2");

  return (
    <nav className="sticky bottom-0 z-30 grid grid-cols-2 border-t border-border bg-card/95 backdrop-blur md:rounded-b-3xl">
      <Link
        to="/stage-1"
        className={cn(
          "flex flex-col items-center gap-1 py-3 text-[11px] font-medium",
          isStage1 ? "text-navy" : "text-muted-foreground",
        )}
      >
        <Map className="h-5 w-5" />
        Identify Clusters
      </Link>
      {unlocked ? (
        <Link
          to="/stage-2"
          className={cn(
            "flex flex-col items-center gap-1 py-3 text-[11px] font-medium",
            isStage2 ? "text-navy" : "text-muted-foreground",
          )}
        >
          <ListChecks className="h-5 w-5" />
          Shortlist Clusters
        </Link>
      ) : (
        <div className="flex flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground/60">
          <Lock className="h-5 w-5" />
          Shortlist Clusters
        </div>
      )}
    </nav>
  );
}
