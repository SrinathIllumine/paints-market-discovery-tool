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
  Customized,
} from "recharts";
import { CLUSTERS } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import { useAppStore } from "@/store/appStore";

type Point = {
  id: string;
  name: string;
  x: number;
  y: number;
  highlighted: boolean;
};

const COLOR_AXIS = "#000000";
const COLOR_GRID = "rgba(0,0,0,0.12)";
const COLOR_LABEL_MUTED = "#6b7280";
const COLOR_DOT_DIM = "#a1a1aa";
const COLOR_DOT_HI = "#ef4444";
const COLOR_LABEL_HI = "#991b1b";
const COLOR_LABEL_DIM = "#52525b";
const COLOR_QUADRANT_HI = "rgba(239,68,68,0.10)";

// Cluster names that must always appear
const REQUIRED_NAMES = ["schools", "mid-size apartment"];

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function jitter(seed: string, amp = 2): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const norm = ((Math.abs(h) % 1000) / 1000) * 2 - 1;
  return norm * amp;
}

function wrapName(name: string, maxChars = 14): string[] {
  const words = name.replace(/\s*\/\s*/g, " / ").split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + " " + w).length <= maxChars) cur += " " + w;
    else {
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

function isRequired(name: string) {
  const n = name.toLowerCase();
  return REQUIRED_NAMES.some((r) => n.includes(r));
}

/** Pick exactly 2 points per quadrant, always keeping required clusters. */
function pickEight(allPoints: Point[]): Point[] {
  const quadrant = (p: Point) => {
    const qx = p.x >= 50 ? 1 : 0;
    const qy = p.y >= 50 ? 1 : 0;
    return qy * 2 + qx; // 0=BL 1=BR 2=TL 3=TR
  };

  const buckets: Point[][] = [[], [], [], []];
  for (const p of allPoints) buckets[quadrant(p)].push(p);

  const chosen: Point[] = [];
  const chosenIds = new Set<string>();

  // First pass: lock in required clusters
  for (const p of allPoints) {
    if (isRequired(p.name)) {
      chosen.push(p);
      chosenIds.add(p.id);
    }
  }

  // Second pass: fill each quadrant up to 2
  for (let q = 0; q < 4; q++) {
    const inQ = chosen.filter((p) => quadrant(p) === q);
    const remaining = buckets[q].filter((p) => !chosenIds.has(p.id));
    let need = 2 - inQ.length;
    for (const p of remaining) {
      if (need <= 0) break;
      chosen.push(p);
      chosenIds.add(p.id);
      need--;
    }
  }

  return chosen;
}

// ── Above-dot label renderer ──────────────────────────────────────────────────
function renderAboveLabel(color: string, weight: number) {
  return (props: any) => {
    const { x, y, payload } = props;
    if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
    const lines = wrapName(payload.name, 14);
    // Total height of label block (11px per line) so we lift the whole thing above the dot
    const lineHeight = 11;
    const totalH = lines.length * lineHeight;
    const dotRadius = 6;
    const gap = 4;
    const baseY = y - dotRadius - gap - totalH;

    return (
      <text
        x={x}
        y={baseY}
        fill={color}
        fontSize={9}
        fontWeight={weight}
        textAnchor="middle"
        style={{ pointerEvents: "none" }}
      >
        {lines.map((l, i) => (
          <tspan key={i} x={x} dy={i === 0 ? 0 : lineHeight}>
            {l}
          </tspan>
        ))}
      </text>
    );
  };
}

// ── Axis Low / High labels ────────────────────────────────────────────────────
function AxisLabels({ xAxisMap, yAxisMap }: any) {
  const xAxis = Object.values(xAxisMap ?? {})[0] as any;
  const yAxis = Object.values(yAxisMap ?? {})[0] as any;
  if (!xAxis || !yAxis) return null;

  const left = xAxis.x;
  const right = xAxis.x + xAxis.width;
  const top = yAxis.y;
  const bottom = yAxis.y + yAxis.height;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;

  const xLowCx = (left + midX) / 2;
  const xHighCx = (midX + right) / 2;
  const xLabelY = bottom + 16;

  const yLowCy = (midY + bottom) / 2;
  const yHighCy = (top + midY) / 2;
  const yLabelX = left - 6;

  return (
    <>
      <text
        x={xLowCx}
        y={xLabelY}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        style={{ pointerEvents: "none" }}
      >
        Low
      </text>
      <text
        x={xHighCx}
        y={xLabelY}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        style={{ pointerEvents: "none" }}
      >
        High
      </text>
      <text
        x={yLabelX}
        y={yLowCy}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        transform={`rotate(-90, ${yLabelX}, ${yLowCy})`}
        style={{ pointerEvents: "none" }}
      >
        Low
      </text>
      <text
        x={yLabelX}
        y={yHighCy}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        transform={`rotate(-90, ${yLabelX}, ${yHighCy})`}
        style={{ pointerEvents: "none" }}
      >
        High
      </text>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function QuadrantSnapshot({ highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const { highlighted, dim } = useMemo(() => {
    // Build all points
    const all: Point[] = CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      return { id: c.id, name: c.name, x, y, highlighted: !highlightId || c.id === highlightId };
    });

    // Limit to 8, 2 per quadrant
    const eight = pickEight(all);

    return {
      highlighted: eight.filter((p) => p.highlighted),
      dim: eight.filter((p) => !p.highlighted),
    };
  }, [clusterStates, highlightId]);

  return (
    <div className="h-[480px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 40, right: 28, bottom: 32, left: 8 }}>
          <CartesianGrid stroke={COLOR_GRID} strokeWidth={0.75} />

          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill={COLOR_QUADRANT_HI} stroke="none" />

          <ReferenceLine x={50} stroke={COLOR_AXIS} strokeWidth={2} />
          <ReferenceLine y={50} stroke={COLOR_AXIS} strokeWidth={2} />

          <XAxis
            type="number"
            dataKey="x"
            domain={[-5, 105]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: COLOR_AXIS, strokeWidth: 1.5 }}
          >
            <Label
              value="Access →"
              position="bottom"
              offset={10}
              fill={COLOR_LABEL_MUTED}
              fontSize={12}
              fontWeight={600}
            />
          </XAxis>

          <YAxis
            type="number"
            dataKey="y"
            domain={[-5, 105]}
            tick={false}
            tickLine={false}
            width={20}
            axisLine={{ stroke: COLOR_AXIS, strokeWidth: 1.5 }}
          >
            <Label
              value="Potential →"
              angle={-90}
              position="insideLeft"
              offset={10}
              fill={COLOR_LABEL_MUTED}
              fontSize={12}
              fontWeight={600}
            />
          </YAxis>

          <ZAxis range={[80, 80]} />

          {/* No tooltip needed — names always visible */}
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as Point;
              return (
                <div
                  style={{
                    borderRadius: 6,
                    border: "0.5px solid rgba(0,0,0,0.1)",
                    background: "#fff",
                    color: "#111827",
                    padding: "4px 8px",
                    fontSize: 11,
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                >
                  {p.name}
                </div>
              );
            }}
          />

          <Customized component={AxisLabels} />

          {dim.length > 0 && (
            <Scatter
              data={dim}
              fill={COLOR_DOT_DIM}
              fillOpacity={0.7}
              shape="circle"
              label={renderAboveLabel(COLOR_LABEL_DIM, 600) as any}
            />
          )}

          {highlighted.length > 0 && (
            <Scatter
              data={highlighted}
              fill={COLOR_DOT_HI}
              shape="circle"
              label={renderAboveLabel(COLOR_LABEL_HI, 700) as any}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
