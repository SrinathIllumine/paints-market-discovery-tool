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
  x: number; // access 0-100
  y: number; // potential 0-100
  highlighted: boolean;
};

// Stable small jitter per cluster id so overlapping points don't pile up.
function jitter(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  // -6..+6
  return ((Math.abs(h) % 1200) / 100) - 6;
}

export function QuadrantSnapshot({ highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const { highlighted, dim } = useMemo(() => {
    const hi: Point[] = [];
    const lo: Point[] = [];
    for (const c of CLUSTERS) {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      // access 1-10 → 5-95 plus jitter so points spread; potential same.
      const x = Math.max(2, Math.min(98, sc.access * 10 + jitter(c.id + "x")));
      const y = Math.max(2, Math.min(98, sc.revenue * 10 + jitter(c.id + "y")));
      const isHi = !highlightId || c.id === highlightId;
      const point: Point = { id: c.id, name: c.name, x, y, highlighted: isHi };
      if (isHi) hi.push(point);
      else lo.push(point);
    }
    return { highlighted: hi, dim: lo };
  }, [clusterStates, highlightId]);

  const renderLabel = (color: string, weight: number) => (props: any) => {
    const { x, y, payload } = props;
    if (typeof x !== "number" || typeof y !== "number") return null;
    return (
      <text
        x={x + 7}
        y={y + 3}
        fill={color}
        fontSize={10}
        fontWeight={weight}
        style={{ pointerEvents: "none" }}
      >
        {payload?.name}
      </text>
    );
  };

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 12, right: 18, bottom: 28, left: 28 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
          <ReferenceArea
            x1={50}
            x2={100}
            y1={50}
            y2={100}
            fill="hsl(0 84% 60%)"
            fillOpacity={0.1}
            stroke="none"
          />
          <ReferenceLine x={50} stroke="hsl(var(--border))" />
          <ReferenceLine y={50} stroke="hsl(var(--border))" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          >
            <Label
              value="Access →"
              position="bottom"
              offset={8}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}
            />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--border))" }}
          >
            <Label
              value="Potential →"
              angle={-90}
              position="left"
              offset={10}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}
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
          {dim.length > 0 && (
            <Scatter
              data={dim}
              fill="hsl(var(--muted-foreground))"
              fillOpacity={0.35}
              shape="circle"
              label={renderLabel("hsl(var(--muted-foreground) / 0.7)", 400) as any}
            />
          )}
          {highlighted.length > 0 && (
            <Scatter
              data={highlighted}
              fill="hsl(0 84% 55%)"
              shape="circle"
              label={renderLabel("hsl(0 84% 40%)", 700) as any}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
