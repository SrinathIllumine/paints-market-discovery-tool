import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { ScoreChip } from "@/components/app/ScoreChip";
import { useAppStore } from "@/store/appStore";
import { computeScore } from "@/lib/scoring";
import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

export const Route = createFileRoute("/stage-2/shortlist")({
  head: () => ({
    meta: [
      { title: "Final Shortlist — Stage 2" },
      { name: "description", content: "Your highest-scoring clusters, ranked." },
    ],
  }),
  component: ShortlistScreen,
});

function ShortlistScreen() {
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const scores = useAppStore((s) => s.scores);
  const toggleShortlist = useAppStore((s) => s.toggleShortlist);
  const navigate = useNavigate();

  const rows = useMemo(() => {
    return Object.values(clusterMaps)
      .map((cm) => {
        const s = scores[cm.clusterId];
        const total = s ? computeScore(s).total : 0;
        return {
          clusterId: cm.clusterId,
          clusterName: cm.clusterName,
          metaId: cm.metaId,
          metaName: cm.metaName,
          total,
          scored: !!s,
          shortlisted: !!s?.shortlisted,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [clusterMaps, scores]);

  const shortlistedCount = rows.filter((r) => r.shortlisted).length;

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 2 · Final"
          title="Cluster shortlist"
          subtitle={`${shortlistedCount} shortlisted · ${rows.length} scored`}
          backTo="/stage-2"
        />
      }
    >
      <div className="space-y-2 px-5 py-5">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Score a cluster to see your shortlist.
          </p>
        )}
        {rows.map((r) => (
          <div
            key={r.clusterId}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
          >
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/stage-2/$metaId/$clusterId",
                  params: { metaId: r.metaId, clusterId: r.clusterId },
                })
              }
              className="min-w-0 flex-1 text-left"
            >
              <p className="truncate text-sm font-semibold text-foreground">{r.clusterName}</p>
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {r.metaName}
              </p>
            </button>
            <ScoreChip total={r.total} />
            <button
              type="button"
              onClick={() => toggleShortlist(r.clusterId)}
              disabled={!r.scored}
              aria-label="Toggle shortlist"
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-full border transition-colors",
                r.shortlisted
                  ? "border-critical bg-critical text-critical-foreground"
                  : "border-border bg-card text-muted-foreground hover:bg-muted",
                !r.scored && "opacity-40",
              )}
            >
              <Star className={cn("h-4 w-4", r.shortlisted && "fill-current")} />
            </button>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
