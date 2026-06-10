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

function pickEight(all: Point[]): Point[] {
  const quadrant = (p: Point) => (p.y >= 50 ? 2 : 0) + (p.x >= 50 ? 1 : 0);
  const buckets: Point[][] = [[], [], [], []];
  for (const p of all) buckets[quadrant(p)].push(p);

  const chosen: Point[] = [];
  const chosenIds = new Set<string>();

  for (const p of all) {
    if (isRequired(p.name)) {
      chosen.push(p);
      chosenIds.add(p.id);
    }
  }

  for (let q = 0; q < 4; q++) {
    const already = chosen.filter((p) => quadrant(p) === q).length;
    let need = 2 - already;
    for (const p of buckets[q]) {
      if (need <= 0) break;
      if (!chosenIds.has(p.id)) {
        chosen.push(p);
        chosenIds.add(p.id);
        need--;
      }
    }
  }
  return chosen;
}

// ── Converts data value → pixel using axis scale ──────────────────────────────
function toPixel(value: number, axisMin: number, axisMax: number, pixelStart: number, pixelSize: number) {
  return pixelStart + ((value - axisMin) / (axisMax - axisMin)) * pixelSize;
}

// ── All dots + labels rendered as one Customized SVG layer ────────────────────
function DotsAndLabels({ xAxisMap, yAxisMap, highlighted, dim }: any) {
  const xAxis = Object.values(xAxisMap ?? {})[0] as any;
  const yAxis = Object.values(yAxisMap ?? {})[0] as any;
  if (!xAxis || !yAxis) return null;

  const xMin = -5,
    xMax = 105;
  const yMin = -5,
    yMax = 105;
  const pxLeft = xAxis.x;
  const pxWidth = xAxis.width;
  const pxTop = yAxis.y;
  const pxHeight = yAxis.height;

  const px = (v: number) => toPixel(v, xMin, xMax, pxLeft, pxWidth);
  // Y axis is inverted in SVG: higher data value = smaller pixel y
  const py = (v: number) => toPixel(v, yMin, yMax, pxTop + pxHeight, -pxHeight);

  const DOT_R = 6;
  const LINE_H = 11;
  const GAP = 5;

  const renderPoint = (p: Point) => {
    const cx = px(p.x);
    const cy = py(p.y);
    const lines = wrapName(p.name, 14);
    const totalH = lines.length * LINE_H;
    const labelBaseY = cy - DOT_R - GAP - totalH;
    const fill = p.highlighted ? COLOR_DOT_HI : COLOR_DOT_DIM;
    const textColor = p.highlighted ? COLOR_LABEL_HI : COLOR_LABEL_DIM;

    return (
      <g key={p.id}>
        {/* Always-visible label above the dot */}
        <text
          x={cx}
          y={labelBaseY}
          textAnchor="middle"
          fontSize={9}
          fontWeight={p.highlighted ? 700 : 600}
          fill={textColor}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {lines.map((l, i) => (
            <tspan key={i} x={cx} dy={i === 0 ? 0 : LINE_H}>
              {l}
            </tspan>
          ))}
        </text>
        {/* Dot */}
        <circle cx={cx} cy={cy} r={DOT_R} fill={fill} fillOpacity={p.highlighted ? 1 : 0.7} />
      </g>
    );
  };

  return (
    <>
      {dim.map(renderPoint)}
      {highlighted.map(renderPoint)}
    </>
  );
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
      <text x={xLowCx} y={xLabelY} textAnchor="middle" fontSize={10} fontWeight={600} fill={COLOR_LABEL_MUTED}>
        Low
      </text>
      <text x={xHighCx} y={xLabelY} textAnchor="middle" fontSize={10} fontWeight={600} fill={COLOR_LABEL_MUTED}>
        High
      </text>
      <text
        x={yLabelX}
        y={yLowCy}
        textAnchor="middle"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        transform={`rotate(-90,${yLabelX},${yLowCy})`}
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
        transform={`rotate(-90,${yLabelX},${yHighCy})`}
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
    const all: Point[] = CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      return { id: c.id, name: c.name, x, y, highlighted: !highlightId || c.id === highlightId };
    });
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

          <ZAxis range={[1, 1]} />

          <Tooltip content={() => null} />

          {/* Invisible scatter series just to satisfy Recharts internals */}
          <Scatter data={[...dim, ...highlighted]} fillOpacity={0} shape={() => <g />} />

          {/* All real rendering happens here — dots + labels always visible */}
          <Customized component={(props: any) => <DotsAndLabels {...props} highlighted={highlighted} dim={dim} />} />

          <Customized component={AxisLabels} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
