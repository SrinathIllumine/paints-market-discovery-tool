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
const COLOR_LABEL_DIM = "#6b7280";
const COLOR_QUADRANT_HI = "rgba(239,68,68,0.10)";

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

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

function QuadrantLabels({ xAxisMap, yAxisMap }: any) {
  const xAxis = Object.values(xAxisMap ?? {})[0] as any;
  const yAxis = Object.values(yAxisMap ?? {})[0] as any;
  if (!xAxis || !yAxis) return null;

  const left = xAxis.x;
  const right = xAxis.x + xAxis.width;
  const top = yAxis.y;
  const bottom = yAxis.y + yAxis.height;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;

  // Quadrant title labels
  const quadrants = [
    { cx: (left + midX) / 2, cy: top + 18, l1: "HIGH POTENTIAL", l2: "LOW ACCESS" },
    { cx: (midX + right) / 2, cy: top + 18, l1: "HIGH POTENTIAL", l2: "HIGH ACCESS" },
    { cx: (left + midX) / 2, cy: midY + 18, l1: "LOW POTENTIAL", l2: "LOW ACCESS" },
    { cx: (midX + right) / 2, cy: midY + 18, l1: "LOW POTENTIAL", l2: "HIGH ACCESS" },
  ];

  // Y below axis line (bottom of chart + small gap)
  const xLabelY = bottom + 18;
  // X label positions along x axis
  const xLow = left;
  const xHigh = right;

  // Y axis low/high — rotated, placed left of the axis line
  const yLabelX = left - 8;
  const yLow = bottom; // "Low" at bottom
  const yHigh = top; // "High" at top

  return (
    <>
      {/* Quadrant titles */}
      {quadrants.map(({ cx, cy, l1, l2 }) => (
        <text
          key={l1 + l2}
          x={cx}
          y={cy}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          fill={COLOR_LABEL_MUTED}
          style={{ pointerEvents: "none", letterSpacing: 0.5 }}
        >
          <tspan x={cx} dy={0}>
            {l1}
          </tspan>
          <tspan x={cx} dy={12}>
            {l2}
          </tspan>
        </text>
      ))}

      {/* X axis: Low (left) and High (right) below the axis */}
      <text
        x={xLow}
        y={xLabelY}
        textAnchor="start"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        style={{ pointerEvents: "none" }}
      >
        Low
      </text>
      <text
        x={xHigh}
        y={xLabelY}
        textAnchor="end"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        style={{ pointerEvents: "none" }}
      >
        High
      </text>

      {/* Y axis: Low (bottom) and High (top), rotated -90° anticlockwise */}
      <text
        x={yLabelX}
        y={yLow}
        textAnchor="start"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        transform={`rotate(-90, ${yLabelX}, ${yLow})`}
        style={{ pointerEvents: "none" }}
      >
        Low
      </text>
      <text
        x={yLabelX}
        y={yHigh}
        textAnchor="end"
        fontSize={10}
        fontWeight={600}
        fill={COLOR_LABEL_MUTED}
        transform={`rotate(-90, ${yLabelX}, ${yHigh})`}
        style={{ pointerEvents: "none" }}
      >
        High
      </text>
    </>
  );
}

export function QuadrantSnapshot({ highlightId }: { highlightId?: string }) {
  const clusterStates = useAppStore((s) => s.clusters);

  const { highlighted, dim } = useMemo(() => {
    const hi: Point[] = [];
    const lo: Point[] = [];
    for (const c of CLUSTERS) {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      const isHi = !highlightId || c.id === highlightId;
      const point: Point = { id: c.id, name: c.name, x, y, highlighted: isHi };
      if (isHi) hi.push(point);
      else lo.push(point);
    }
    return { highlighted: hi, dim: lo };
  }, [clusterStates, highlightId]);

  const renderLabel =
    (color: string, weight: number, onlyTopRight = false) =>
    (props: any) => {
      const { x, y, payload } = props;
      if (typeof x !== "number" || typeof y !== "number" || !payload) return null;
      if (onlyTopRight && !(payload.x >= 50 && payload.y >= 50)) return null;
      const lines = wrapName(payload.name, 14);
      return (
        <text
          x={x}
          y={y}
          fill={color}
          fontSize={10}
          fontWeight={weight}
          textAnchor="middle"
          style={{ pointerEvents: "none" }}
        >
          {lines.map((l, i) => (
            <tspan key={i} x={x} dy={i === 0 ? 14 : 11}>
              {l}
            </tspan>
          ))}
        </text>
      );
    };

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

          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0].payload as Point;
              return (
                <div
                  style={{
                    borderRadius: 6,
                    border: "0.5px solid rgba(0,0,0,0.1)",
                    background: "#ffffff",
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

          <Customized component={QuadrantLabels} />

          {dim.length > 0 && (
            <Scatter
              data={dim}
              fill={COLOR_DOT_DIM}
              fillOpacity={0.55}
              shape="circle"
              label={renderLabel(COLOR_LABEL_DIM, 600, true) as any}
            />
          )}

          {highlighted.length > 0 && (
            <Scatter
              data={highlighted}
              fill={COLOR_DOT_HI}
              shape="circle"
              label={renderLabel(COLOR_LABEL_HI, 700, false) as any}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
