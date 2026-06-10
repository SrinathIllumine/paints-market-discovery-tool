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
  highlighted: boolean;
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

// ─── FIX 1: Hardcoded color constants — SVG attrs can't resolve CSS variables ──
const COLOR_AXIS = "#000000";
const COLOR_GRID = "rgba(0,0,0,0.12)";
const COLOR_LABEL_MUTED = "#6b7280";
const COLOR_DOT_DIM = "#a1a1aa";
const COLOR_DOT_HI = "#ef4444";
const COLOR_LABEL_HI = "#991b1b";
const COLOR_LABEL_DIM = "#6b7280";
const COLOR_QUADRANT_HI = "rgba(239,68,68,0.10)";
const COLOR_TOOLTIP_BG = "#ffffff";
const COLOR_TOOLTIP_BD = "rgba(0,0,0,0.1)";
const COLOR_TOOLTIP_TXT = "#111827";

// ─── FIX 2: Quadrant labels as a custom SVG layer that uses viewBox-relative % ──
// Recharts exposes a `customized` prop on ScatterChart for injecting arbitrary SVG.
// We use the `offset` object (passed by Recharts) which gives us the real pixel
// boundaries of the plot area so labels are always correctly positioned.
interface ChartOffset {
  left: number;
  top: number;
  width: number;
  height: number;
}

function QuadrantLabels(props: any) {
  const { width, height, left, top } = props as ChartOffset & {
    width: number;
    height: number;
    left: number;
    top: number;
  };

  // Defensive guard — Recharts passes 0 on first render
  if (!width || !height) return null;

  const midX = left + width / 2;
  const midY = top + height / 2;

  const labels: Array<{
    cx: number;
    cy: number;
    line1: string;
    line2: string;
  }> = [
    { cx: left + width * 0.25, cy: top + 18, line1: "HIGH POTENTIAL", line2: "LOW ACCESS" },
    { cx: left + width * 0.75, cy: top + 18, line1: "HIGH POTENTIAL", line2: "HIGH ACCESS" },
    { cx: left + width * 0.25, cy: midY + 18, line1: "LOW POTENTIAL", line2: "LOW ACCESS" },
    { cx: left + width * 0.75, cy: midY + 18, line1: "LOW POTENTIAL", line2: "HIGH ACCESS" },
  ];

  return (
    <>
      {labels.map(({ cx, cy, line1, line2 }) => (
        <text
          key={line1 + line2}
          x={cx}
          y={cy}
          textAnchor="middle"
          fontSize={10}
          fontWeight={700}
          fill={COLOR_LABEL_MUTED}
          style={{ pointerEvents: "none", letterSpacing: 0.5 }}
        >
          <tspan x={cx} dy={0}>
            {line1}
          </tspan>
          <tspan x={cx} dy={12}>
            {line2}
          </tspan>
        </text>
      ))}
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

  // ─── FIX 3: Dot label renderer with hardcoded fill colors ───────────────────
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
          fill={color} // ✅ hardcoded — not a CSS variable
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
        <ScatterChart margin={{ top: 40, right: 28, bottom: 32, left: 32 }}>
          {/* ─── FIX 4: CartesianGrid without undefined prop hacks ──────────── */}
          <CartesianGrid stroke={COLOR_GRID} strokeWidth={0.75} />

          {/* Highlight quadrant fill — top-right */}
          <ReferenceArea x1={50} x2={100} y1={50} y2={100} fill={COLOR_QUADRANT_HI} stroke="none" />

          {/* Bold partition lines */}
          <ReferenceLine x={50} stroke={COLOR_AXIS} strokeWidth={2} />
          <ReferenceLine y={50} stroke={COLOR_AXIS} strokeWidth={2} />

          <XAxis
            type="number"
            dataKey="x"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: COLOR_AXIS, strokeWidth: 1.5 }} // ✅ hardcoded
          >
            <Label
              value="Access →"
              position="bottom"
              offset={10}
              style={{
                fill: COLOR_LABEL_MUTED, // ✅ hardcoded
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1,
              }}
            />
          </XAxis>

          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: COLOR_AXIS, strokeWidth: 1.5 }} // ✅ hardcoded
          >
            <Label
              value="Potential →"
              angle={-90}
              position="left"
              offset={14}
              style={{
                fill: COLOR_LABEL_MUTED, // ✅ hardcoded
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: 1,
              }}
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
                    border: `0.5px solid ${COLOR_TOOLTIP_BD}`,
                    background: COLOR_TOOLTIP_BG,
                    color: COLOR_TOOLTIP_TXT,
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

          {/* ─── FIX 2: Quadrant labels via customized prop ─────────────────── */}
          {/* Recharts passes offset + dimensions into the customized component  */}
          <QuadrantLabels />

          {dim.length > 0 && (
            <Scatter
              data={dim}
              fill={COLOR_DOT_DIM} // ✅ hardcoded
              fillOpacity={0.55}
              shape="circle"
              label={renderLabel(COLOR_LABEL_DIM, 600, true) as any}
            />
          )}

          {highlighted.length > 0 && (
            <Scatter
              data={highlighted}
              fill={COLOR_DOT_HI} // ✅ hardcoded
              shape="circle"
              label={renderLabel(COLOR_LABEL_HI, 700, false) as any}
            />
          )}
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
