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

export interface QuadrantSnapshotProps {
  highlightId?: string;
  mode: "single" | "all";
  isStageComplete?: boolean;
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

/**
 * Derive a user's real access score (0–10) from their saved Y/N answers.
 * Returns undefined if they haven't answered all 3 questions yet,
 * so the caller can fall back to the hardcoded seed value.
 */
function resolveUserAccessScore(accessAnswers3?: (string | undefined)[]): number | undefined {
  if (!accessAnswers3 || accessAnswers3.length !== 3) return undefined;
  if (accessAnswers3.some((v) => v === undefined)) return undefined;
  const yesCount = accessAnswers3.filter((v) => v === "Y").length;
  return Math.round(yesCount * 3.33 * 10) / 10;
}

/** Always returns exactly 8 points, guaranteed to include highlightId. */
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
  lx = clamp(lx, pLeft + 4, pRight - 4);
  ly = clamp(ly, pTop + FONT_SIZE, pBottom - 4);
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

// ── Chart sub-components ───────────────────────────────────────────────────────

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
  const pRight = pLeft + pWidth,
    pBottom = pTop + pHeight;

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

  return (
    <>
      {all.map((p: Point) => {
        const cx = px(p.x),
          cy = py(p.y);
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
        const label = truncate(p.name);
        return (
          <g key={p.id}>
            <line
              x1={lineX2}
              y1={lineY2}
              x2={lx}
              y2={ly}
              stroke={COLOR_LABEL_MUTED}
              strokeWidth={0.75}
              strokeOpacity={p.highlighted ? 0.6 : 0.3}
              strokeDasharray="2 2"
            />
            <circle cx={cx} cy={cy} r={DOT_R} fill={dotFill} />
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
            >
              {label}
            </text>
          </g>
        );
      })}
    </>
  );
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

// ── Locked overlay ─────────────────────────────────────────────────────────────

function LockedOverlay() {
  return (
    <div
      style={{ backdropFilter: "blur(3px)" }}
      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3
                 bg-white/75 rounded-xl"
    >
      <div className="w-11 h-11 rounded-full bg-gray-100 flex items-center justify-center">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <p className="text-sm font-medium text-gray-700 text-center max-w-[220px] leading-snug">
        Complete the previous step to view the cluster snapshot
      </p>
      <p className="text-xs text-gray-400 text-center max-w-[180px] leading-snug">
        Finish calculating cluster potential first
      </p>
    </div>
  );
}

// ── Compare button ─────────────────────────────────────────────────────────────

function CompareButton({ isComparing, onToggle }: { isComparing: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={[
        "absolute top-3 right-3 z-10",
        "inline-flex items-center gap-1.5 px-3 py-1.5",
        "rounded-full text-xs font-medium border transition-all duration-150",
        isComparing
          ? "bg-red-50 border-red-200 text-red-600 hover:bg-red-100"
          : "bg-white border-gray-200 text-gray-600 shadow-sm hover:bg-gray-50 hover:border-gray-300",
      ].join(" ")}
    >
      {isComparing ? (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          Exit compare
        </>
      ) : (
        <>
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="6" cy="6" r="2.5" />
            <circle cx="18" cy="6" r="2.5" />
            <circle cx="6" cy="18" r="2.5" />
            <circle cx="18" cy="18" r="2.5" />
          </svg>
          Compare with others
        </>
      )}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function QuadrantSnapshot({ highlightId, mode, isStageComplete = true }: QuadrantSnapshotProps) {
  const clusterStates = useAppStore((s) => s.clusters);
  // ← NEW: read persisted assessments so we can use real user access scores
  const assessments = useAppStore((s) => s.assessments);
  const [isComparing, setIsComparing] = useState(false);

  // Build scored positions for every cluster.
  // For each cluster, if the user has answered all 3 access questions
  // (accessAnswers3 is fully populated) we use their real score on the X axis.
  // Otherwise we fall back to the hardcoded SCORE_SEED value.
  const allPoints = useMemo<Point[]>(() => {
    return CLUSTERS.map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const assessment = assessments[c.id];

      // Derive real access score from saved Y/N answers, or undefined to use seed
      const userAccessScore = resolveUserAccessScore(assessment?.accessAnswers3);

      const sc = computeClusterScores(c, pc, assessment, userAccessScore);
      const x = clamp(sc.accessRollupScore * 10 + jitter(c.id + "x", 2.5), 4, 96);
      const y = clamp(sc.potentialScore * 10 + jitter(c.id + "y", 2.5), 4, 96);
      return { id: c.id, name: c.name, x, y, highlighted: false };
    });
  }, [clusterStates, assessments]);

  const { highlighted, dim, isInTopRight } = useMemo(() => {
    // ── mode="single" ─────────────────────────────────────────────────────────
    if (mode === "single") {
      const target = highlightId ? allPoints.find((p) => p.id === highlightId) : null;
      if (!target) return { highlighted: [], dim: [], isInTopRight: false };

      const inTopRight = target.x >= 50 && target.y >= 50;

      if (isComparing) {
        const eight = pickEight(allPoints, highlightId);
        return {
          highlighted: eight.filter((p) => p.id === highlightId).map((p) => ({ ...p, highlighted: true })),
          dim: eight.filter((p) => p.id !== highlightId).map((p) => ({ ...p, highlighted: false })),
          isInTopRight: inTopRight,
        };
      }

      return {
        highlighted: [{ ...target, highlighted: true }],
        dim: [],
        isInTopRight: inTopRight,
      };
    }

    // ── mode="all" ────────────────────────────────────────────────────────────
    const eight = pickEight(allPoints, highlightId);
    const withHighlight = eight.map((p) => ({
      ...p,
      highlighted: !highlightId || p.id === highlightId,
    }));
    return {
      highlighted: withHighlight.filter((p) => p.highlighted),
      dim: withHighlight.filter((p) => !p.highlighted),
      isInTopRight: false,
    };
  }, [allPoints, highlightId, mode, isComparing]);

  const showCompareButton = mode === "single" && isStageComplete && isInTopRight;

  return (
    <div className="relative h-[520px] w-full">
      {mode === "single" && !isStageComplete && <LockedOverlay />}

      {showCompareButton && <CompareButton isComparing={isComparing} onToggle={() => setIsComparing((v) => !v)} />}

      <div className={mode === "single" && !isStageComplete ? "opacity-20 pointer-events-none select-none" : undefined}>
        <ResponsiveContainer width="100%" height={520}>
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

      {isComparing && (
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2
                        text-[11px] text-gray-400 bg-white/90 px-3 py-1
                        rounded-full border border-gray-100 whitespace-nowrap pointer-events-none"
        >
          Showing this cluster against 7 others
        </div>
      )}
    </div>
  );
}
