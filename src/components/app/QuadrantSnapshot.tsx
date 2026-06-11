import { useMemo, useState } from "react";
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

// ── Types ──────────────────────────────────────────────────────────────────────
type Point = { id: string; name: string; x: number; y: number; highlighted: boolean };

/** "single" = a specific cluster's detail page (one dot, locked state, compare CTA)
 *  "overview" = the "View my clusters" page (8 dots, no locked state, no compare CTA) */
export type QuadrantMode = "single" | "overview";

export interface QuadrantSnapshotProps {
  /** The cluster to spotlight. Required in "single" mode. */
  highlightId?: string;
  mode?: QuadrantMode;
  /**
   * Whether the user has completed the "Calculate cluster potential" step.
   * Only checked in "single" mode. Defaults to true so the overview is never blocked.
   */
  isPotentialCalculated?: boolean;
}

// ── Constants ──────────────────────────────────────────────────────────────────
const COLOR_AXIS = "#1a1a1a";
const COLOR_GRID = "rgba(0,0,0,0.08)";
const COLOR_LABEL_MUTED = "#9ca3af";
const COLOR_AXIS_LABEL = "#6b7280";
const COLOR_DOT_DIM = "#d1d5db";
const COLOR_DOT_HI = "#ef4444";
const COLOR_CLUSTER_LBL = "#6b7280";
const COLOR_QUADRANT_HI = "rgba(239,68,68,0.07)";

const REQUIRED_NAMES = ["schools", "mid-size apartment"];
const DOT_R = 7;
const PAD = 10;
const FONT_SIZE = 10;
const MAX_NAME_CHARS = 26;

// ── Helpers ────────────────────────────────────────────────────────────────────
function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function jitter(seed: string, amp = 2): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (((Math.abs(h) % 1000) / 1000) * 2 - 1) * amp;
}

function truncate(name: string, max = MAX_NAME_CHARS) {
  return name.length > max ? name.slice(0, max - 1) + "…" : name;
}

function isRequired(name: string) {
  return REQUIRED_NAMES.some((r) => name.toLowerCase().includes(r));
}

function pickEight(all: Point[], highlightId?: string): Point[] {
  const quadrant = (p: Point) => (p.y >= 50 ? 2 : 0) + (p.x >= 50 ? 1 : 0);
  const buckets: Point[][] = [[], [], [], []];
  for (const p of all) buckets[quadrant(p)].push(p);

  const chosen: Point[] = [];
  const ids = new Set<string>();

  if (highlightId) {
    const hi = all.find((p) => p.id === highlightId);
    if (hi && !ids.has(hi.id)) {
      chosen.push(hi);
      ids.add(hi.id);
    }
  }

  for (const p of all) {
    if (isRequired(p.name) && !ids.has(p.id)) {
      chosen.push(p);
      ids.add(p.id);
    }
  }

  for (let q = 0; q < 4; q++) {
    let need = 2 - chosen.filter((p) => quadrant(p) === q).length;
    for (const p of buckets[q]) {
      if (need <= 0) break;
      if (!ids.has(p.id)) {
        chosen.push(p);
        ids.add(p.id);
        need--;
      }
    }
  }

  return chosen;
}

function toPixel(v: number, dMin: number, dMax: number, pStart: number, pSize: number) {
  return pStart + ((v - dMin) / (dMax - dMin)) * pSize;
}

function computeLabelPos(
  cx: number,
  cy: number,
  midPx: number,
  midPy: number,
  pLeft: number,
  pRight: number,
  pTop: number,
  pBottom: number,
  angularNudge = 0,
): { lx: number; ly: number; anchor: "start" | "end" | "middle"; lineX2: number; lineY2: number } {
  const rad = (angularNudge * Math.PI) / 180;
  let vx = cx - midPx,
    vy = cy - midPy;
  if (angularNudge !== 0) {
    const cos = Math.cos(rad),
      sin = Math.sin(rad);
    [vx, vy] = [vx * cos - vy * sin, vx * sin + vy * cos];
  }
  const len = Math.sqrt(vx * vx + vy * vy) || 1;
  const nx = vx / len,
    ny = vy / len;

  const lineX2 = cx + nx * DOT_R;
  const lineY2 = cy + ny * DOT_R;
  let lx = cx + nx * (DOT_R + PAD);
  let ly = cy + ny * (DOT_R + PAD);

  const anchor: "start" | "end" | "middle" = nx > 0.2 ? "start" : nx < -0.2 ? "end" : "middle";

  const margin = 4;
  lx = clamp(lx, pLeft + margin, pRight - margin);
  ly = clamp(ly, pTop + FONT_SIZE, pBottom - margin);

  return { lx, ly, anchor, lineX2, lineY2 };
}

function assignNudges(points: Point[], midX: number, midY: number): Map<string, number> {
  const angles = points
    .map((p) => ({ id: p.id, angle: Math.atan2(p.y - midY, p.x - midX) }))
    .sort((a, b) => a.angle - b.angle);

  const nudges = new Map<string, number>();
  for (let i = 0; i < angles.length; i++) {
    const prev = angles[(i - 1 + angles.length) % angles.length];
    const next = angles[(i + 1) % angles.length];
    const diffPrev = Math.abs(angles[i].angle - prev.angle);
    const diffNext = Math.abs(angles[i].angle - next.angle);
    if (diffPrev < 0.26) nudges.set(angles[i].id, 12);
    else if (diffNext < 0.26) nudges.set(angles[i].id, -12);
    else nudges.set(angles[i].id, 0);
  }
  return nudges;
}

// ── Sub-components ─────────────────────────────────────────────────────────────
function DotsAndLabels({ xAxisMap, yAxisMap, highlighted, dim }: any) {
  const xAxis = Object.values(xAxisMap ?? {})[0] as any;
  const yAxis = Object.values(yAxisMap ?? {})[0] as any;
  if (!xAxis || !yAxis) return null;

  const xMin = -5,
    xMax = 105,
    yMin = -5,
    yMax = 105;
  const pLeft = xAxis.x,
    pWidth = xAxis.width;
  const pTop = yAxis.y,
    pHeight = yAxis.height;
  const pRight = pLeft + pWidth;
  const pBottom = pTop + pHeight;

  const px = (v: number) => toPixel(v, xMin, xMax, pLeft, pWidth);
  const py = (v: number) => toPixel(v, yMin, yMax, pTop + pHeight, -pHeight);
  const midPx = px(50),
    midPy = py(50);

  const all = [...dim, ...highlighted];
  const nudges = assignNudges(
    all.map((p: Point) => ({ ...p, x: px(p.x), y: py(p.y) }) as any),
    midPx,
    midPy,
  );

  const renderPoint = (p: Point) => {
    const cx = px(p.x),
      cy = py(p.y);
    const label = truncate(p.name);
    const dotFill = p.highlighted ? COLOR_DOT_HI : COLOR_DOT_DIM;
    const nudge = nudges.get(p.id) ?? 0;

    const { lx, ly, anchor, lineX2, lineY2 } = computeLabelPos(
      cx,
      cy,
      midPx,
      midPy,
      pLeft,
      pRight,
      pTop,
      pBottom,
      nudge,
    );

    return (
      <g key={p.id}>
        <line
          x1={lineX2}
          y1={lineY2}
          x2={lx}
          y2={ly}
          stroke={COLOR_LABEL_MUTED}
          strokeWidth={0.75}
          strokeOpacity={p.highlighted ? 0.5 : 0.25}
          strokeDasharray="2 2"
        />
        <circle cx={cx} cy={cy} r={DOT_R} fill={dotFill} opacity={p.highlighted ? 1 : 0.45} />
        <text
          x={lx}
          y={ly}
          textAnchor={anchor}
          fontSize={FONT_SIZE}
          fontWeight={500}
          stroke="white"
          strokeWidth={3}
          strokeLinejoin="round"
          paintOrder="stroke"
          style={{ pointerEvents: "none", userSelect: "none" }}
          opacity={p.highlighted ? 1 : 0.5}
        >
          {label}
        </text>
        <text
          x={lx}
          y={ly}
          textAnchor={anchor}
          fontSize={FONT_SIZE}
          fontWeight={500}
          fill={p.highlighted ? "#374151" : COLOR_CLUSTER_LBL}
          style={{ pointerEvents: "none", userSelect: "none" }}
          opacity={p.highlighted ? 1 : 0.5}
        >
          {label}
        </text>
      </g>
    );
  };

  return <>{all.map(renderPoint)}</>;
}

function AxisLabels({ xAxisMap, yAxisMap }: any) {
  const xAxis = Object.values(xAxisMap ?? {})[0] as any;
  const yAxis = Object.values(yAxisMap ?? {})[0] as any;
  if (!xAxis || !yAxis) return null;

  const left = xAxis.x,
    right = xAxis.x + xAxis.width;
  const top = yAxis.y,
    bottom = yAxis.y + yAxis.height;
  const midX = (left + right) / 2,
    midY = (top + bottom) / 2;

  const props = { fontSize: 10, fontWeight: 600, fill: COLOR_LABEL_MUTED } as const;

  return (
    <>
      <text {...props} x={(left + midX) / 2} y={bottom + 16} textAnchor="middle">
        Low
      </text>
      <text {...props} x={(midX + right) / 2} y={bottom + 16} textAnchor="middle">
        High
      </text>
      <text
        {...props}
        x={left - 6}
        y={(midY + bottom) / 2}
        textAnchor="middle"
        transform={`rotate(-90,${left - 6},${(midY + bottom) / 2})`}
      >
        Low
      </text>
      <text
        {...props}
        x={left - 6}
        y={(top + midY) / 2}
        textAnchor="middle"
        transform={`rotate(-90,${left - 6},${(top + midY) / 2})`}
      >
        High
      </text>
    </>
  );
}

// ── Locked overlay (incomplete potential step) ─────────────────────────────────
function LockedState() {
  return (
    <div className="h-[520px] w-full flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
      {/* Lock icon */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm border border-gray-200">
        <svg
          className="h-5 w-5 text-gray-400"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <div className="text-center">
        <p className="text-sm font-semibold text-gray-700">Cluster snapshot locked</p>
        <p className="mt-1 max-w-[260px] text-xs leading-relaxed text-gray-400">
          Complete the <span className="font-medium text-gray-500">Calculate cluster potential</span> step to unlock the
          snapshot for this cluster.
        </p>
      </div>

      {/* Step indicator strip */}
      <div className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-gray-100">
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500">
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
            <path
              d="M10 3L5 8.5 2 5.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </span>
        <span className="text-xs text-gray-400">Map cluster</span>
        <span className="text-gray-200">›</span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full border-2 border-dashed border-amber-400 bg-amber-50">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        </span>
        <span className="text-xs font-medium text-amber-600">Calculate potential</span>
        <span className="text-gray-200">›</span>
        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-gray-100">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        </span>
        <span className="text-xs text-gray-300">View snapshot</span>
      </div>
    </div>
  );
}

// ── Compare CTA overlay (top-right cluster in single mode) ─────────────────────
function CompareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        absolute top-3 right-3 z-10
        flex items-center gap-1.5 rounded-lg
        bg-white px-3 py-1.5 text-xs font-medium text-gray-600
        shadow-sm border border-gray-200
        hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800
        transition-all duration-150
      "
    >
      <svg className="h-3.5 w-3.5 text-red-400" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="4" cy="4" r="2.5" fill="#fca5a5" />
        <circle cx="12" cy="4" r="2.5" fill="#d1d5db" />
        <circle cx="4" cy="12" r="2.5" fill="#d1d5db" />
        <circle cx="12" cy="12" r="2.5" fill="#d1d5db" />
      </svg>
      Compare with others
    </button>
  );
}

function ExitCompareButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="
        absolute top-3 right-3 z-10
        flex items-center gap-1.5 rounded-lg
        bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600
        shadow-sm border border-red-100
        hover:bg-red-100 hover:border-red-200
        transition-all duration-150
      "
    >
      <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      Exit compare
    </button>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export function QuadrantSnapshot({
  highlightId,
  mode = "overview",
  isPotentialCalculated = true,
}: QuadrantSnapshotProps) {
  const [compareMode, setCompareMode] = useState(false);
  const clusterStates = useAppStore((s) => s.clusters);

  // ── Build points ─────────────────────────────────────────────────────────────
  const allPoints = useMemo<Point[]>(() => {
    return CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      return { id: c.id, name: c.name, x, y, highlighted: !highlightId || c.id === highlightId };
    });
  }, [clusterStates, highlightId]);

  // ── Is the highlighted cluster in the top-right quadrant? ────────────────────
  const isTopRight = useMemo(() => {
    if (!highlightId || mode !== "single") return false;
    const p = allPoints.find((pt) => pt.id === highlightId);
    return !!p && p.x >= 50 && p.y >= 50;
  }, [allPoints, highlightId, mode]);

  // ── Select which points to render ────────────────────────────────────────────
  const { highlighted, dim } = useMemo(() => {
    if (mode === "single" && !compareMode) {
      // Only the single cluster
      const solo = allPoints.find((p) => p.id === highlightId);
      return {
        highlighted: solo ? [{ ...solo, highlighted: true }] : [],
        dim: [] as Point[],
      };
    }

    // overview OR compare mode: show 8 clusters
    // In compare mode, only the highlighted one stays red; all others are dim
    const eight = pickEight(
      compareMode ? allPoints.map((p) => ({ ...p, highlighted: p.id === highlightId })) : allPoints,
      highlightId,
    );

    return {
      highlighted: eight.filter((p) => p.highlighted),
      dim: eight.filter((p) => !p.highlighted),
    };
  }, [allPoints, highlightId, mode, compareMode]);

  // ── Guard: locked state ───────────────────────────────────────────────────────
  if (mode === "single" && !isPotentialCalculated) {
    return <LockedState />;
  }

  // ── Chart ─────────────────────────────────────────────────────────────────────
  return (
    <div className="relative h-[520px] w-full">
      {/* Compare / Exit-compare button */}
      {mode === "single" && isTopRight && !compareMode && <CompareButton onClick={() => setCompareMode(true)} />}
      {mode === "single" && compareMode && <ExitCompareButton onClick={() => setCompareMode(false)} />}

      {/* Compare-mode header */}
      {compareMode && (
        <div className="absolute top-3 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-gray-500 shadow-sm border border-gray-100">
            Showing <span className="font-semibold text-gray-700">your cluster</span> vs 7 others
          </span>
        </div>
      )}

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 48, right: 48, bottom: 36, left: 8 }}>
          <CartesianGrid stroke={COLOR_GRID} strokeWidth={0.75} />

          <ReferenceArea x1={50} x2={105} y1={50} y2={105} fill={COLOR_QUADRANT_HI} stroke="none" />
          <ReferenceLine x={50} stroke={COLOR_AXIS} strokeWidth={1.5} strokeOpacity={0.3} />
          <ReferenceLine y={50} stroke={COLOR_AXIS} strokeWidth={1.5} strokeOpacity={0.3} />

          <XAxis
            type="number"
            dataKey="x"
            domain={[-5, 105]}
            tick={false}
            tickLine={false}
            axisLine={{ stroke: COLOR_AXIS, strokeWidth: 1.5, strokeOpacity: 0.4 }}
          >
            <Label
              value="Access →"
              position="bottom"
              offset={12}
              fill={COLOR_AXIS_LABEL}
              fontSize={11}
              fontWeight={600}
            />
          </XAxis>

          <YAxis
            type="number"
            dataKey="y"
            domain={[-5, 105]}
            tick={false}
            tickLine={false}
            width={40}
            axisLine={{ stroke: COLOR_AXIS, strokeWidth: 1.5, strokeOpacity: 0.4 }}
          >
            <Label
              value="Potential →"
              angle={-90}
              position="insideLeft"
              offset={10}
              fill={COLOR_AXIS_LABEL}
              fontSize={11}
              fontWeight={600}
            />
          </YAxis>

          <ZAxis range={[1, 1]} />
          <Tooltip content={() => null} />
          <Scatter data={[...dim, ...highlighted]} fillOpacity={0} shape={() => <g />} />

          <Customized component={(props: any) => <DotsAndLabels {...props} highlighted={highlighted} dim={dim} />} />
          <Customized component={AxisLabels} />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
