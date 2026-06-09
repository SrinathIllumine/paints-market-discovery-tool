import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  Label,
} from "recharts";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";

type Point = {
  id: string;
  name: string;
  x: number;
  y: number;
  showLabel: boolean;
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function jitter(seed: string, amp = 2): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const norm = ((Math.abs(h) % 1000) / 1000) * 2 - 1;
  return norm * amp;
}

export function QuadrantSnapshot({ highlightId: _highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const points = useMemo<Point[]>(() => {
    const scored = CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      return { id: c.id, name: c.name, x, y, potential: sc.potentialScore };
    });
    const topIds = new Set(
      [...scored].sort((a, b) => b.potential - a.potential).slice(0, 6).map((s) => s.id),
    );
    return scored.map((s) => ({
      id: s.id,
      name: s.name,
      x: s.x,
      y: s.y,
      showLabel: topIds.has(s.id),
    }));
  }, [clusterStates]);

  const renderBubble = (props: any) => {
    const { cx, cy, payload } = props;
    if (typeof cx !== "number" || typeof cy !== "number" || !payload) return <g />;
    const onRight = payload.x > 50;
    const label =
      payload.name.length > 20 ? payload.name.slice(0, 19) + "…" : payload.name;
    return (
      <g>
        <circle cx={cx} cy={cy} r={8} fill="hsl(var(--primary))" fillOpacity={0.85} />
        {payload.showLabel && (
          <text
            x={onRight ? cx - 12 : cx + 12}
            y={cy + 4}
            fontSize={10}
            textAnchor={onRight ? "end" : "start"}
            fill="hsl(var(--foreground))"
            style={{ pointerEvents: "none" }}
          >
            {label}
          </text>
        )}
      </g>
    );
  };

  const quadrantLabel = (cx: number, cy: number, line1: string, line2: string) => (
    <text
      x={`${cx}%`}
      y={cy}
      textAnchor="middle"
      fontSize={10}
      fontWeight={700}
      fill="hsl(var(--muted-foreground))"
      style={{ pointerEvents: "none", letterSpacing: 0.5 }}
    >
      <tspan x={`${cx}%`} dy={0}>{line1}</tspan>
      <tspan x={`${cx}%`} dy={12}>{line2}</tspan>
    </text>
  );

  return (
    <div className="h-[480px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 40, right: 40, bottom: 60, left: 60 }}>
          <CartesianGrid horizontal={false} vertical={false} />
          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill="#f1f5f9" fillOpacity={1} />
          <ReferenceLine x={50} stroke="#64748b" strokeWidth={1.5} />
          <ReferenceLine y={50} stroke="#64748b" strokeWidth={1.5} />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            allowDataOverflow
            ticks={[0, 25, 50, 75, 100]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "#94a3b8", strokeWidth: 1.5 }}
          >
            <Label
              value="Access →"
              position="bottom"
              offset={20}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            allowDataOverflow
            ticks={[0, 25, 50, 75, 100]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "#94a3b8", strokeWidth: 1.5 }}
          >
            <Label
              value="Potential →"
              angle={-90}
              position="left"
              offset={20}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600, letterSpacing: 1 }}
            />
          </YAxis>
          <ZAxis range={[80, 80]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0].payload as Point;
              return (
                <div className="rounded-md border border-border bg-popover px-2 py-1 text-[11px] shadow">
                  {p.name}
                </div>
              );
            }}
          />
          {quadrantLabel(27, 55, "HIGH POTENTIAL", "LOW ACCESS")}
          {quadrantLabel(77, 55, "HIGH POTENTIAL", "HIGH ACCESS")}
          {quadrantLabel(27, 258, "LOW POTENTIAL", "LOW ACCESS")}
          {quadrantLabel(77, 258, "LOW POTENTIAL", "HIGH ACCESS")}
          <Scatter data={points} shape={renderBubble} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
