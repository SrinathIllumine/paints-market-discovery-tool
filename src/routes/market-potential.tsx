import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS, getCluster } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { Info } from "lucide-react";
import { computeClusterScores } from "@/lib/clusterScoring";

export const Route = createFileRoute("/market-potential")({
  head: () => ({
    meta: [
      { title: "My Cluster Map" },
      { name: "description", content: "Snapshot and ranking of your mapped clusters." },
    ],
  }),
  component: ClusterMapPage,
});

type Row = {
  clusterId: string;
  name: string;
  scores: ReturnType<typeof computeClusterScores>;
  // axes for the snapshot
  potential: number; // y-axis (avg of revenue + competitive)
  access: number; // x-axis (avg of access + ease)
};

function ClusterMapPage() {
  const assessments = useAppStore((s) => s.assessments);
  const clusterStates = useAppStore((s) => s.clusters);

  const rows: Row[] = useMemo(() => {
    return Object.entries(assessments)
      .map(([clusterId, assessment]) => {
        const cluster = getCluster(clusterId);
        if (!cluster) return null;
        const prospectCount = clusterStates[clusterId]?.prospects.length ?? cluster.prospectCountEstimate;
        const scores = computeClusterScores(cluster, prospectCount, assessment);
        return {
          clusterId,
          name: cluster.name,
          scores,
          potential: (scores.revenue + scores.competitive) / 2,
          access: (scores.access + scores.ease) / 2,
        } satisfies Row;
      })
      .filter((r): r is Row => Boolean(r))
      .sort((a, b) => b.scores.aggregate - a.scores.aggregate);
  }, [assessments, clusterStates]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="My Cluster Map"
          title="Your mapped clusters"
          subtitle="Snapshot and ranking based on the potential you've saved."
          backTo="/map"
        />
      }
    >
      <div className="space-y-6 px-5 py-5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Map a cluster from the Cluster Potential page to see it here.
          </div>
        ) : (
          <>
            {rows.length < 2 && (
              <div className="flex items-start gap-2 rounded-2xl border border-amber-300/60 bg-amber-50 p-3 text-sm text-amber-900">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Map the potential for more clusters to rank them for comparison.</span>
              </div>
            )}

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="font-display text-xl">Cluster Snapshot</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Access (connect into community + ease of sale) vs Potential (revenue + competitive strength).
              </p>
              <SnapshotMatrix rows={rows} />
            </section>

            <section className="space-y-2">
              <h2 className="font-display text-xl px-1">Cluster Potential (ranked)</h2>
              {rows.map((r, i) => (
                <div key={r.clusterId} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Rank #{i + 1}
                      </p>
                      <p className="mt-0.5 font-display text-lg leading-tight">{r.name}</p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${scorePillClass(r.scores.aggregate)}`}>
                      {r.scores.aggregate} / 10
                    </span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    <ScoreTile label="Revenue" value={r.scores.revenue} />
                    <ScoreTile label="Access" value={r.scores.access} />
                    <ScoreTile label="Competitive" value={r.scores.competitive} />
                    <ScoreTile label="Ease of sale" value={r.scores.ease} />
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function scoreColorClass(value: number): string {
  if (value > 7) return "border-green-300 bg-green-50 text-green-800";
  if (value >= 5) return "border-orange-300 bg-orange-50 text-orange-800";
  return "border-red-300 bg-red-50 text-red-800";
}

function scorePillClass(value: number): string {
  if (value > 7) return "bg-green-100 text-green-800";
  if (value >= 5) return "bg-orange-100 text-orange-800";
  return "bg-red-100 text-red-800";
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  return (
    <div className={`rounded-xl border p-2 text-center ${scoreColorClass(value)}`}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-base leading-tight">{value}/10</p>
    </div>
  );
}

function SnapshotMatrix({ rows }: { rows: Row[] }) {
  // 2x2 SVG matrix. x = access (0-10), y = potential (0-10).
  const W = 320;
  const H = 320;
  const pad = 40;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;

  const xFor = (v: number) => pad + (v / 10) * innerW;
  const yFor = (v: number) => H - pad - (v / 10) * innerH;

  return (
    <div className="mt-3 overflow-x-auto text-foreground">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-sm">
        {/* quadrant backgrounds */}
        <rect x={pad} y={pad} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.35} />
        <rect x={pad + innerW / 2} y={pad} width={innerW / 2} height={innerH / 2} fill="var(--critical)" fillOpacity={0.12} />
        <rect x={pad} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.15} />
        <rect x={pad + innerW / 2} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.55} />

        {/* axes */}
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" strokeOpacity="0.4" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" strokeOpacity="0.4" />
        {/* mid lines */}
        <line x1={pad + innerW / 2} y1={pad} x2={pad + innerW / 2} y2={H - pad} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />
        <line x1={pad} y1={pad + innerH / 2} x2={W - pad} y2={pad + innerH / 2} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />

        {/* quadrant labels */}
        <text x={pad + 6} y={pad + 14} fontSize="9" fill="currentColor" opacity="0.6">Low access · High potential</text>
        <text x={W - pad - 6} y={pad + 14} fontSize="9" fill="currentColor" opacity="0.7" textAnchor="end">High access · High potential</text>
        <text x={pad + 6} y={H - pad - 6} fontSize="9" fill="currentColor" opacity="0.5">Low access · Low potential</text>
        <text x={W - pad - 6} y={H - pad - 6} fontSize="9" fill="currentColor" opacity="0.6" textAnchor="end">High access · Low potential</text>

        {/* axis titles */}
        <text x={W / 2} y={H - 8} fontSize="10" fill="currentColor" textAnchor="middle">Access →</text>
        <text x={12} y={H / 2} fontSize="10" fill="currentColor" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>Potential →</text>

        {/* points */}
        {rows.map((r) => (
          <g key={r.clusterId}>
            <circle cx={xFor(r.access)} cy={yFor(r.potential)} r={6} fill="var(--critical)" stroke="var(--background)" strokeWidth={1.5} />
            <text x={xFor(r.access) + 9} y={yFor(r.potential) + 3} fontSize="9" fill="currentColor">
              {shortLabel(r.name)}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

function shortLabel(name: string) {
  return name.length > 22 ? name.slice(0, 21) + "…" : name;
}

void CLUSTERS;
