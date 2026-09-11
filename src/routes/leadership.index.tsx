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
import { LeadershipLayout, LeadershipScopeFilter } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getAllClusterScoresForGeo, type QuadrantKey } from "@/lib/clusterGenerator";
import { useLeadershipGeo } from "@/store/leadershipStore";
import {
  CLUSTER_SHORT_NAME,
  QUADRANT_COLOR,
  QUADRANT_DESC,
  QUADRANT_TITLE,
  clampToQuadrantSide,
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

type Point = { id: string; name: string; access: number; potential: number; quadrant: QuadrantKey; labelDy: number };

// Greedy proximity-based collision avoidance: points that sit close together
// (in the shared 0-100 data space, which maps ~linearly to chart pixels) get
// staggered vertical label offsets instead of all defaulting to dy=0 and
// overlapping. Considers ALL 20 points together (not just same-quadrant
// ones), since labels can collide across the quadrant divider too.
function computeLabelOffsets(pts: Omit<Point, "labelDy">[]): number[] {
  const placed: { x: number; y: number; dy: number }[] = [];
  const order = pts.map((_, i) => i).sort((a, b) => pts[b].potential - pts[a].potential);
  const offsets = new Array(pts.length).fill(0);
  const candidates = [0, 18, -18, 36, -36, 54, -54, 72, -72];
  for (const i of order) {
    const p = pts[i];
    // x-threshold is wide because labels render to the RIGHT of their dot —
    // two dots don't need to be close together for their labels to collide,
    // just close enough that a ~16-data-unit-wide label from the left one
    // reaches into the right one's space.
    const nearbyDys = new Set(
      placed.filter((u) => Math.abs(u.x - p.access) < 26 && Math.abs(u.y - p.potential) < 10).map((u) => u.dy),
    );
    const dy = candidates.find((c) => !nearbyDys.has(c)) ?? 0;
    offsets[i] = dy;
    placed.push({ x: p.access, y: p.potential, dy });
  }
  return offsets;
}

// Custom label renderer: short name in a background pill, offset vertically
// per point via a precomputed `labelDy` (see computeLabelOffsets) so nearby
// dots' labels fan out instead of stacking on top of one another. Built as a
// factory closing over the exact array passed to a given Scatter's `data`,
// so the label's `index` reliably maps back to the right point.
function makeDotLabelRenderer(quadrantPoints: Point[]) {
  return function renderDotLabel(props: any) {
    const { x, y, value, index } = props;
    if (x === undefined || y === undefined || !value) return null;
    const dy = quadrantPoints[index]?.labelDy ?? 0;
    const text = value.length > 14 ? `${value.slice(0, 13)}…` : value;
    const width = Math.min(100, text.length * 5.6 + 12);
    const labelY = y + dy;
    return (
      <g>
        <rect
          x={x + 8}
          y={labelY - 7}
          width={width}
          height={14}
          rx={3}
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth={0.6}
        />
        <text x={x + 12} y={labelY + 3} fontSize={9.5} fontWeight={500} fill="var(--foreground)">
          {text}
        </text>
      </g>
    );
  };
}

function PriorityMatrixPage() {
  const geo = useLeadershipGeo();
  const allScores = getAllClusterScoresForGeo(geo);

  const grouped: Record<QuadrantKey, { id: string; name: string }[]> = { HH: [], HL: [], LH: [], LL: [] };
  const rawPoints: Omit<Point, "labelDy">[] = [];

  for (const c of CLUSTERS) {
    const scores = allScores.find((s) => s.clusterId === c.id)!;
    const key = scores.quadrant;
    const shortName = CLUSTER_SHORT_NAME[c.id] ?? c.name;
    grouped[key].push({ id: c.id, name: shortName });

    const isHighAccess = key === "HH" || key === "LH";
    const isHighPotential = key === "HH" || key === "HL";
    const baseAccess = Math.round(scores.accessRollupScore * 10);
    const basePotential = Math.round(scores.potentialScore * 10);
    const access = clampToQuadrantSide(baseAccess, jitter(c.id, "a", 14), isHighAccess);
    const potential = clampToQuadrantSide(basePotential, jitter(c.id, "p", 14), isHighPotential);

    rawPoints.push({ id: c.id, name: shortName, access, potential, quadrant: key });
  }

  const labelOffsets = computeLabelOffsets(rawPoints);
  const points: Point[] = rawPoints.map((p, i) => ({ ...p, labelDy: labelOffsets[i] }));

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Priority Matrix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {"\n"}
        </p>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-foreground">Potential vs Access</h2>
            <p className="text-xs text-muted-foreground">{"\n"}</p>
          </div>
          <LeadershipScopeFilter />
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
          {(Object.keys(QUADRANT_TITLE) as QuadrantKey[]).map((key) => (
            <span key={key} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: QUADRANT_COLOR[key] }} />
              {QUADRANT_TITLE[key]}
            </span>
          ))}
        </div>

        <div className="mt-3 h-[30rem]">
          <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 28, right: 150, bottom: 10, left: 0 }}>
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
                <ZAxis range={[100, 100]} />
                <ReferenceLine x={50} stroke="var(--border)" />
                <ReferenceLine y={50} stroke="var(--border)" />
                <Tooltip
                  cursor={{ strokeDasharray: "3 3" }}
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const p = payload[0].payload as Point;
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
                {(Object.keys(QUADRANT_TITLE) as QuadrantKey[]).map((key) => {
                  const quadrantPoints = points.filter((p) => p.quadrant === key);
                  return (
                    <Scatter key={key} name={QUADRANT_TITLE[key]} data={quadrantPoints} fill={QUADRANT_COLOR[key]}>
                      <LabelList dataKey="name" content={makeDotLabelRenderer(quadrantPoints)} />
                    </Scatter>
                  );
                })}
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
