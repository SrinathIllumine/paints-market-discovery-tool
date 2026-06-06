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

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

// Deterministic micro-jitter to break up identical-score overlaps without
// changing which quadrant a cluster sits in.
function jitter(seed: string, amp = 2): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const norm = ((Math.abs(h) % 1000) / 1000) * 2 - 1;
  return norm * amp;
}

function wrapName(name: string, maxChars = 16): string[] {
  const words = name.replace(/\s*\/\s*/g, " / ").split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
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
      // Direct mapping: score × 10 places each cluster precisely on the chart.
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
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
    // Place label BELOW the dot, like the reference chart.
    return (
      <text x={x} y={y} fill={color} fontSize={10} fontWeight={weight}
        textAnchor="middle" style={{ pointerEvents: "none" }}>
        {lines.map((l, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 14 : 11}>{l}</tspan>
        ))}
      </text>
    );
  };

  // Quadrant titles rendered on top of each quadrant region.
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
        <ScatterChart margin={{ top: 40, right: 28, bottom: 32, left: 32 }}>
          <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="2 4" strokeOpacity={0.9} />
          <ReferenceArea x1={50} x2={100} y1={50} y2={100}
            fill="hsl(0 84% 60%)" fillOpacity={0.10} stroke="none" />
          {/* Bold partition lines splitting the 4 quadrants */}
          <ReferenceLine x={50} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <ReferenceLine y={50} stroke="hsl(var(--foreground))" strokeWidth={2} />
          <XAxis type="number" dataKey="x" domain={[0, 100]} tick={false} tickLine={false}
            axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 1.5 }}>
            <Label value="Access →" position="bottom" offset={10}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600, letterSpacing: 1 }} />
          </XAxis>
          <YAxis type="number" dataKey="y" domain={[0, 100]} tick={false} tickLine={false}
            axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 1.5 }}>
            <Label value="Potential →" angle={-90} position="left" offset={14}
              style={{ fill: "hsl(var(--muted-foreground))", fontSize: 12, fontWeight: 600, letterSpacing: 1 }} />
          </YAxis>
          <ZAxis range={[80, 80]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0].payload as Point;
              return (
                <div className="rounded-md border border-border bg-popover px-2 py-1 text-[11px] shadow">
                  {p.name}
                </div>
              );
            }} />
          {/* Quadrant titles — placed near the top of each quadrant region */}
          {quadrantLabel(27, 55, "HIGH POTENTIAL", "LOW ACCESS")}
          {quadrantLabel(77, 55, "HIGH POTENTIAL", "HIGH ACCESS")}
          {quadrantLabel(27, 258, "LOW POTENTIAL", "LOW ACCESS")}
          {quadrantLabel(77, 258, "LOW POTENTIAL", "HIGH ACCESS")}
          {dim.length > 0 && (
            <Scatter data={dim} fill="hsl(0 0% 65%)" fillOpacity={0.55}
              shape="circle" label={renderLabel("hsl(var(--muted-foreground))", 500) as any} />
          )}
          {highlighted.length > 0 && (
            <Scatter data={highlighted} fill="hsl(0 84% 55%)" shape="circle"
              label={renderLabel("hsl(0 70% 30%)", 700) as any} />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
