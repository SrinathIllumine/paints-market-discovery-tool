import { createFileRoute, Link } from "@tanstack/react-router";
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
import { computeClusterScores, getClusterIntel } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership/")({
  head: () => ({
    meta: [
      { title: "Priority Matrix — Leadership Analytics" },
      { name: "description", content: "Potential vs access across all market clusters." },
    ],
  }),
  component: PriorityMatrixPage,
});

type QuadrantKey = "HH" | "HL" | "LH" | "LL";

const QUADRANTS: Record<QuadrantKey, { title: string; desc: string; tone: string; dot: string }> = {
  HH: {
    title: "High Potential – High Access",
    desc: "High revenue potential and strong DG access. Focus here first to gain market share.",
    tone: "border-emerald-200 bg-emerald-50",
    dot: "#10b981",
  },
  HL: {
    title: "High Potential – Low Access",
    desc: "High revenue potential but DGs lack strong connects. Building access unlocks future opportunity.",
    tone: "border-amber-200 bg-amber-50",
    dot: "#f59e0b",
  },
  LH: {
    title: "Low Potential – High Access",
    desc: "Easy to approach but limited revenue upside. Engage selectively to keep the pipeline active.",
    tone: "border-sky-200 bg-sky-50",
    dot: "#0ea5e9",
  },
  LL: {
    title: "Low Potential – Low Access",
    desc: "Low returns and hard to penetrate. Redirect DG effort to higher potential clusters.",
    tone: "border-muted bg-muted/40",
    dot: "#94a3b8",
  },
};

function PriorityMatrixPage() {
  const grouped: Record<QuadrantKey, { id: string; name: string }[]> = { HH: [], HL: [], LH: [], LL: [] };
  const points: { id: string; name: string; access: number; potential: number; quadrant: QuadrantKey }[] = [];

  for (const c of CLUSTERS) {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const potentialLabel = intel.revenueHML === "H" || intel.competitiveHML === "H" ? "H" : "L";
    const accessLabel = intel.accessHML === "H" || intel.easeHML === "H" ? "H" : "L";
    const key = `${potentialLabel}${accessLabel}` as QuadrantKey;
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
        <h1 className="font-display text-2xl font-bold text-foreground">Potential vs Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Each dot is a market cluster.</p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="h-80">
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
                contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                formatter={(value: number, key: string) => [value, key === "access" ? "Access" : "Potential"]}
                labelFormatter={() => ""}
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
              {(Object.keys(QUADRANTS) as QuadrantKey[]).map((key) => (
                <Scatter
                  key={key}
                  name={QUADRANTS[key].title}
                  data={points.filter((p) => p.quadrant === key)}
                  fill={QUADRANTS[key].dot}
                />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(QUADRANTS) as QuadrantKey[]).map((key) => {
          const q = QUADRANTS[key];
          const clusters = grouped[key];
          return (
            <div key={key} className={cn("rounded-2xl border p-4", q.tone)}>
              <h2 className="font-display text-base font-bold text-foreground">{q.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{q.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {clusters.map((c) => (
                  <Link
                    key={c.id}
                    to="/plan/$clusterId"
                    params={{ clusterId: c.id }}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:border-critical hover:text-critical"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </LeadershipLayout>
  );
}
