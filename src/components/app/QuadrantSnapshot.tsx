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

// Deterministic jitter so overlapping clusters spread out a bit but stay stable.
function jitter(seed: string, amp = 7): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const norm = ((Math.abs(h) % 1000) / 1000) * 2 - 1; // -1..1
  return norm * amp;
}

function wrapName(name: string, maxChars = 16): string[] {
  const words = name.replace(/\s*\/\s*/g, " / ").split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
    } else if ((cur + " " + w).length <= maxChars) {
      cur += " " + w;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > 3) {
    const tail = lines.slice(2).join(" ");
    return [lines[0], lines[1], tail.length > maxChars + 2 ? tail.slice(0, maxChars) + "…" : tail];
  }
  return lines;
}

export function QuadrantSnapshot({ highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const { highlighted, dim } = useMemo(() => {
    const hi: Point[] = [];
    const lo: Point[] = [];
    for (const c of CLUSTERS) {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      // Use rollup averages → 5 distinct anchor positions (3,4.5,6,7.5,9) → *10 → 30..90
      const potential = (sc.revenue + sc.competitive) / 2;
      const access = (sc.access + sc.ease) / 2;
      const x = Math.max(4, Math.min(96, access * 10 + jitter(c.id + "x")));
      const y = Math.max(4, Math.min(96, potential * 10 + jitter(c.id + "y")));
      const isHi = !highlightId || c.id === highlightId;
      const point: Point = { id: c.id, name: c.name, x, y, highlighted: isHi };
      if (isHi) hi.push(point);
      else lo.push(point);
    }
    return { highlighted: hi, dim: lo };
  }, [clusterStates, highlightId]);

  const renderLabel = (color: string, weight: number) => (props: any) => {
    const { x, y, payload } = props;
    if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
    const lines = wrapName(payload.name);
    const placeRight = payload.x < 78;
    const dx = placeRight ? 9 : -9;
    const anchor = placeRight ? "start" : "end";
    const startDy = -((lines.length - 1) * 11) / 2 + 3;
    return (
      <text
        x={x + dx}
        y={y}
        fill={color}
        fontSize={9.5}
        fontWeight={weight}
        textAnchor={anchor}
        style={{ pointerEvents: "none" }}
      >
        {lines.map((l, i) => (
          <tspan key={i} x={x + dx} dy={i === 0 ? startDy : 11}>
            {l}
          </tspan>
        ))}
      </text>
    );
  };

  return (
    <div className="h-[420px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 28, bottom: 32, left: 32 }}>
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
              offset={10}
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
              offset={14}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600, letterSpacing: 1 }}
            />
          </YAxis>
          <ZAxis range={[70, 70]} />
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
              label={renderLabel("hsl(var(--muted-foreground) / 0.75)", 400) as any}
            />
          )}
          {highlighted.length > 0 && (
            <Scatter
              data={highlighted}
              fill="hsl(0 84% 55%)"
              shape="circle"
              label={renderLabel("hsl(0 84% 35%)", 700) as any}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
