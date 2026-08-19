import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  CartesianGrid,
  LabelList,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import {
  CLUSTER_SHORT_NAME,
  QUADRANT_COLOR,
  QUADRANT_DESC,
  QUADRANT_TITLE,
  type QuadrantKey,
  getClusterQuadrant,
  jitter,
} from "@/lib/leadershipAnalytics";

export const Route = createFileRoute("/leadership/")({
  head: () => ({
    meta: [
      { title: "Priority Matrix — Leadership Analytics" },
      { name: "description", content: "Revenue potential plotted against DG access for every market cluster." },
    ],
  }),
  component: PriorityMatrixPage,
});

const QUADRANT_AREAS: Record<QuadrantKey, { x1: number; x2: number; y1: number; y2: number }> = {
  HH: { x1: 50, x2: 100, y1: 50, y2: 100 },
  HL: { x1: 0, x2: 50, y1: 50, y2: 100 },
  LH: { x1: 50, x2: 100, y1: 0, y2: 50 },
  LL: { x1: 0, x2: 50, y1: 0, y2: 50 },
};

// Custom label renderer: short name, clipped away from the right edge, with a
// faint background so overlapping text stays legible instead of thrashing.
function DotLabel({ x, y, value }: { x?: number; y?: number; value?: string }) {
  if (x === undefined || y === undefined || !value) return null;
  const width = Math.min(90, value.length * 5.2 + 6);
  return (
    <g>
      <rect x={x + 6} y={y - 7} width={width} height={13} rx={3} fill="var(--card)" opacity={0.75} />
      <text x={x + 9} y={y + 3} fontSize={9} fill="var(--foreground)">
        {value.length > 16 ? `${value.slice(0, 15)}…` : value}
      </text>
    </g>
  );
}

function PriorityMatrixPage() {
  const grouped: Record<QuadrantKey, { id: string; name: string }[]> = { HH: [], HL: [], LH: [], LL: [] };
  const points: { id: string; name: string; access: number; potential: number; quadrant: QuadrantKey }[] = [];

  for (const c of CLUSTERS) {
    const key = getClusterQuadrant(c.id, c.prospectCountEstimate);
    const shortName = CLUSTER_SHORT_NAME[c.id] ?? c.name;
    grouped[key].push({ id: c.id, name: shortName });

    const scores = computeClusterScores(c, c.prospectCountEstimate);
    const access = Math.min(98, Math.max(2, Math.round(scores.accessRollupScore * 10) + jitter(c.id, "a")));
    const potential = Math.min(98, Math.max(2, Math.round(scores.potentialScore * 10) + jitter(c.id, "p")));
    points.push({ id: c.id, name: shortName, access, potential, quadrant: key });
  }

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Priority Matrix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue potential plotted against DG access for every market cluster.
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <h2 className="font-display text-base font-bold text-foreground">Potential vs Access</h2>
        <p className="text-xs text-muted-foreground">Each dot is a market cluster.</p>
        <div className="mt-3 h-[34rem] overflow-x-auto overflow-y-hidden">
          <div className="h-full min-w-[900px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 90, bottom: 10, left: 0 }}>
                <CartesianGrid stroke="var(--border)" />
                {(Object.keys(QUADRANT_AREAS) as QuadrantKey[]).map((key) => (
                  <ReferenceArea
                    key={key}
                    x1={QUADRANT_AREAS[key].x1}
                    x2={QUADRANT_AREAS[key].x2}
                    y1={QUADRANT_AREAS[key].y1}
                    y2={QUADRANT_AREAS[key].y2}
                    fill={QUADRANT_COLOR[key]}
                    fillOpacity={0.08}
                    stroke="none"
                  />
                ))}
                <XAxis
                  type="number"
                  dataKey="access"
                  name="Access"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: "Access →", position: "insideBottomRight", offset: -5, fontSize: 12 }}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="potential"
                  name="Potential"
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                  label={{ value: "Potential →", angle: -90, position: "insideLeft", fontSize: 12 }}
                  tick={{ fontSize: 11 }}
                />
                <ZAxis range={[50, 50]} />
                <ReferenceLine x={50} stroke="var(--border)" />
                <ReferenceLine y={50} stroke="var(--border)" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as (typeof points)[number];
                    return (
                      <div className="rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-md">
                        <p className="font-semibold text-foreground">{p.name}</p>
                        <p className="text-muted-foreground">
                          Potential {p.potential} · Access {p.access}
                        </p>
                      </div>
                    );
                  }}
                />
                {(Object.keys(QUADRANT_TITLE) as QuadrantKey[]).map((key) => (
                  <Scatter
                    key={key}
                    name={QUADRANT_TITLE[key]}
                    data={points.filter((p) => p.quadrant === key)}
                    fill={QUADRANT_COLOR[key]}
                  >
                    <LabelList dataKey="name" content={<DotLabel />} />
                  </Scatter>
                ))}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(QUADRANT_TITLE) as QuadrantKey[]).map((key) => {
          const clusters = grouped[key];
          return (
            <div key={key} className="rounded-2xl border border-border bg-card p-4">
              <h2 className="font-display text-base font-bold text-foreground">{QUADRANT_TITLE[key]}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{QUADRANT_DESC[key]}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {clusters.map((c) => (
                  <span
                    key={c.id}
                    className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to="/leadership/clusters"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"
      >
        See cluster-wise market overview <ArrowRight className="h-4 w-4" />
      </Link>
    </LeadershipLayout>
  );
}
