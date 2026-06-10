import { useMemo } from "react";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
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

// Curated 8-cluster shortlist: 2 per quadrant. Schools is pinned (HP/LA).
const SHORTLIST_IDS = new Set<string>([
  // HP-HA (top-right): high potential, high access
  "mid-apartments",
  "redevelopment",
  // HP-LA (top-left): high potential, low access
  "schools",
  "midc",
  // LP-HA (bottom-right): low potential, high access
  "restaurants",
  "petrol-pumps",
  // LP-LA (bottom-left): low potential, low access
  "highway-dhabas",
  "religious",
]);

export function QuadrantSnapshot({ highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const { highlighted, dim } = useMemo(() => {
    const hi: Point[] = [];
    const lo: Point[] = [];
    for (const c of CLUSTERS) {
      const inShortlist = SHORTLIST_IDS.has(c.id);
      const isHi = highlightId === c.id;
      // Render only shortlisted clusters, plus the highlighted one if it's
      // not already in the shortlist (individual cluster view).
      if (!inShortlist && !isHi) continue;

      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      const point: Point = { id: c.id, name: c.name, x, y, highlighted: isHi };
      if (highlightId ? isHi : true) {
        // overview mode: everything in shortlist is "highlighted" (dark dots)
        // individual mode: only the matching cluster is highlighted
        if (!highlightId || isHi) hi.push(point);
        else lo.push(point);
      } else {
        lo.push(point);
      }
    }
    return { highlighted: hi, dim: lo };
  }, [clusterStates, highlightId]);

  const renderLabel = (color: string, weight: number) => (props: any) => {
    const { x, y, payload } = props;
    if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
    const lines = wrapName(payload.name, 14);
    return (
      <text x={x} y={y} fill={color} fontSize={10} fontWeight={weight}
        textAnchor="middle" style={{ pointerEvents: "none" }}>
        {lines.map((l, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 14 : 11}>{l}</tspan>
        ))}
      </text>
    );
  };

  return (
    <div className="h-[480px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 24, right: 40, bottom: 48, left: 48 }}>
          <CartesianGrid
            stroke="hsl(var(--foreground))"
            strokeOpacity={0.12}
            strokeWidth={1}
          />
          {/* Quadrant partition lines */}
          <ReferenceLine x={50} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.6} />
          <ReferenceLine y={50} stroke="hsl(var(--foreground))" strokeWidth={1.5} strokeOpacity={0.6} />

          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            ticks={[0, 100]}
            tickFormatter={(v) => (v === 0 ? "Low" : v === 100 ? "High" : "")}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 1.5 }}
          >
            <Label value="Access →" position="bottom" offset={20}
              style={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 700, letterSpacing: 1 }} />
          </XAxis>
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            ticks={[0, 100]}
            tickFormatter={(v) => (v === 0 ? "Low" : v === 100 ? "High" : "")}
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11, fontWeight: 600 }}
            tickLine={false}
            axisLine={{ stroke: "hsl(var(--foreground))", strokeWidth: 1.5 }}
          >
            <Label value="Potential →" angle={-90} position="left" offset={24}
              style={{ fill: "hsl(var(--foreground))", fontSize: 12, fontWeight: 700, letterSpacing: 1 }} />
          </YAxis>
          <ZAxis range={[90, 90]} />
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
          {dim.length > 0 && (
            <Scatter data={dim} fill="hsl(0 0% 65%)" fillOpacity={0.55}
              shape="circle" label={renderLabel("hsl(var(--muted-foreground))", 600) as any} />
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
