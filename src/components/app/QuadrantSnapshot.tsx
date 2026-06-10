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

type Point = { id: string; name: string; x: number; y: number; highlighted: boolean };

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

// ── pickEight: always include highlightId cluster even if outside default 8 ───
function pickEight(all: Point[], highlightId?: string): Point[] {
  const quadrant = (p: Point) => (p.y >= 50 ? 2 : 0) + (p.x >= 50 ? 1 : 0);
  const buckets: Point[][] = [[], [], [], []];
  for (const p of all) buckets[quadrant(p)].push(p);

  const chosen: Point[] = [];
  const ids = new Set<string>();

  // 1. Always include the highlighted cluster first (even if not in default 8)
  if (highlightId) {
    const hi = all.find((p) => p.id === highlightId);
    if (hi && !ids.has(hi.id)) {
      chosen.push(hi);
      ids.add(hi.id);
    }
  }

  // 2. Always include required clusters
  for (const p of all) {
    if (isRequired(p.name) && !ids.has(p.id)) {
      chosen.push(p);
      ids.add(p.id);
    }
  }

  // 3. Fill each quadrant up to 2
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
  let vx = cx - midPx;
  let vy = cy - midPy;
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

// ── Dots + labels ──────────────────────────────────────────────────────────────
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
    const cx = px(p.x);
    const cy = py(p.y);
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
          strokeOpacity={0.5}
          strokeDasharray="2 2"
        />
        <circle cx={cx} cy={cy} r={DOT_R} fill={dotFill} />
        {/* White halo for legibility */}
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
          fill={COLOR_CLUSTER_LBL}
          style={{ pointerEvents: "none", userSelect: "none" }}
        >
          {label}
        </text>
      </g>
    );
  };

  return <>{all.map(renderPoint)}</>;
}

// ── Axis Low / High labels ─────────────────────────────────────────────────────
function AxisLabels({ xAxisMap, yAxisMap }: any) {
  const xAxis = Object.values(xAxisMap ?? {})[0] as any;
  const yAxis = Object.values(yAxisMap ?? {})[0] as any;
  if (!xAxis || !yAxis) return null;

  const left = xAxis.x,
    right = xAxis.x + xAxis.width;
  const top = yAxis.y,
    bottom = yAxis.y + yAxis.height;
  const midX = (left + right) / 2;
  const midY = (top + bottom) / 2;

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

// ── Main ───────────────────────────────────────────────────────────────────────
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

    // Pass highlightId so that cluster is always included even outside default 8
    const eight = pickEight(all, highlightId);

    return {
      highlighted: eight.filter((p) => p.highlighted),
      dim: eight.filter((p) => !p.highlighted),
    };
  }, [clusterStates, highlightId]);

  return (
    <div className="h-[520px] w-full">
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
