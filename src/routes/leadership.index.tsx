import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import {
  CartesianGrid,
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
  QUADRANT_COLOR,
  QUADRANT_DESC,
  QUADRANT_TITLE,
  type QuadrantKey,
  getClusterQuadrant,
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

function PriorityMatrixPage() {
  const grouped: Record<QuadrantKey, { id: string; name: string }[]> = { HH: [], HL: [], LH: [], LL: [] };
  const points: { id: string; name: string; access: number; potential: number; quadrant: QuadrantKey }[] = [];

  for (const c of CLUSTERS) {
    const key = getClusterQuadrant(c.id, c.prospectCountEstimate);
    grouped[key].push({ id: c.id, name: c.name });

    const scores = computeClusterScores(c, c.prospectCountEstimate);
    points.push({
      id: c.id,
      name: c.name,
      access: Math.round(scores.accessRollupScore * 10),
      potential: Math.round(scores.potentialScore * 10),
      quadrant: key,
    });
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
        <div className="mt-3 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
              <CartesianGrid stroke="var(--border)" />
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
              <ZAxis range={[80, 80]} />
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
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
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
