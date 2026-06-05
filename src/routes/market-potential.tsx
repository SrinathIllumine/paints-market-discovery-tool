import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { computeClusterScores, HML_LABEL, type HML } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/market-potential")({
  head: () => ({
    meta: [
      { title: "My Cluster Map" },
      { name: "description", content: "Snapshot and ranking of clusters." },
    ],
  }),
  component: ClusterMapPage,
});

type Row = {
  clusterId: string;
  name: string;
  scores: ReturnType<typeof computeClusterScores>;
  potential: number;
  access: number;
  visited: boolean;
};

function ClusterMapPage() {
  const clusterStates = useAppStore((s) => s.clusters);

  const rows: Row[] = useMemo(() => {
    return CLUSTERS.map((c) => {
      const prospectCount = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const scores = computeClusterScores(c, prospectCount);
      return {
        clusterId: c.id,
        name: c.name,
        scores,
        potential: Number(((scores.revenue + scores.competitive) / 2).toFixed(1)),
        access: Number(((scores.access + scores.ease) / 2).toFixed(1)),
        visited: Boolean(clusterStates[c.id]?.visited),
      } satisfies Row;
    }).sort((a, b) => b.scores.aggregate - a.scores.aggregate);
  }, [clusterStates]);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="My Cluster Map"
          title="All clusters"
          subtitle="Snapshot and ranking driven by backend cluster intelligence."
          backTo="/map"
        />
      }
    >
      <div className="space-y-6 px-5 py-5">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-xl">Cluster Snapshot</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Cluster Access (access + ease of sale) vs Revenue Potential (revenue + competitive).
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
                <HMLBadge hml={r.scores.aggregateHML} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <HMLTile label="Revenue" hml={r.scores.revenueHML} />
                <HMLTile label="Competitive" hml={r.scores.competitiveHML} />
                <HMLTile label="Access" hml={r.scores.accessHML} />
                <HMLTile label="Ease of Sale" hml={r.scores.easeHML} />
              </div>
            </div>
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function HMLBadge({ hml }: { hml: HML }) {
  const cls =
    hml === "H" ? "bg-green-100 text-green-800"
    : hml === "M" ? "bg-orange-100 text-orange-800"
    : "bg-red-100 text-red-800";
  return (
    <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider", cls)}>
      {HML_LABEL[hml]}
    </span>
  );
}

function HMLTile({ label, hml }: { label: string; hml: HML }) {
  const cls =
    hml === "H" ? "border-green-300 bg-green-50 text-green-800"
    : hml === "M" ? "border-orange-300 bg-orange-50 text-orange-800"
    : "border-red-300 bg-red-50 text-red-800";
  return (
    <div className={cn("rounded-xl border p-2 text-center", cls)}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-sm leading-tight">{HML_LABEL[hml]}</p>
    </div>
  );
}

function SnapshotMatrix({ rows }: { rows: Row[] }) {
  const W = 340, H = 340, pad = 40;
  const innerW = W - pad * 2, innerH = H - pad * 2;
  const xFor = (v: number) => pad + (v / 10) * innerW;
  const yFor = (v: number) => H - pad - (v / 10) * innerH;

  return (
    <div className="mt-3 overflow-x-auto text-foreground">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-md">
        <rect x={pad} y={pad} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.35} />
        <rect x={pad + innerW / 2} y={pad} width={innerW / 2} height={innerH / 2} fill="var(--critical)" fillOpacity={0.12} />
        <rect x={pad} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.15} />
        <rect x={pad + innerW / 2} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.55} />

        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" strokeOpacity="0.4" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" strokeOpacity="0.4" />
        <line x1={pad + innerW / 2} y1={pad} x2={pad + innerW / 2} y2={H - pad} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />
        <line x1={pad} y1={pad + innerH / 2} x2={W - pad} y2={pad + innerH / 2} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />

        <text x={W / 2} y={H - 8} fontSize="10" fill="currentColor" textAnchor="middle">Access →</text>
        <text x={12} y={H / 2} fontSize="10" fill="currentColor" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>Potential →</text>

        {rows.map((r) => (
          <g key={r.clusterId}>
            <circle
              cx={xFor(r.access)}
              cy={yFor(r.potential)}
              r={r.visited ? 6 : 4}
              fill={r.visited ? "var(--critical)" : "currentColor"}
              fillOpacity={r.visited ? 1 : 0.55}
              stroke="var(--background)"
              strokeWidth={1.5}
            />
          </g>
        ))}
      </svg>
    </div>
  );
}
