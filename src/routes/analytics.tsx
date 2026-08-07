import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronRight,
  LayoutDashboard,
  Grid2x2,
  Table2,
  Users,
  PieChart as PieIcon,
  Target,
  TrendingUp,
  Filter,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  QUADRANTS,
  QuadrantKey,
  NATIONAL_CLUSTERS,
  NAVI_MUMBAI_CLUSTERS,
  ASMS,
  DGS_VIKRAM,
  DG_RAJESH_CLUSTERS,
  ENGAGEMENT_MIX,
  ENGAGEMENT_INSIGHT,
  ROSTER_A,
  ROSTER_B,
  STRATEGY_ROWS,
  STRATEGY_INSIGHT,
  PENETRATION_ROWS,
  PenetrationRow,
  trendFor,
  TOTAL_REVENUE_POTENTIAL,
  AVG_PENETRATION,
  LOW_PRIORITY_DG_PCT,
  TOTAL_CLUSTERS_MAPPED,
  FUNNEL_BY_CLUSTER,
  FUNNEL_BY_DG,
} from "@/data/analytics";
import {
  AccessBadge,
  Insight,
  Kpi,
  Panel,
  QuadrantBadge,
  StatusBadge,
  Toggle,
  quadDot,
} from "@/components/analytics/ui";
import { PriorityMatrix } from "@/components/analytics/PriorityMatrix";

export const Route = createFileRoute("/analytics")({
  head: () => ({
    meta: [
      { title: "DG App Analytics — Cluster & Network Performance" },
      {
        name: "description",
        content:
          "Operational analytics for ASMs: priority matrix, cluster ranking, ASM/DG drill-downs, engagement mix, penetration and funnel.",
      },
      { property: "og:title", content: "DG App Analytics" },
      {
        property: "og:description",
        content: "Drill into cluster, ASM and DG performance across market areas.",
      },
    ],
  }),
  component: AnalyticsPage,
});

type SectionKey =
  | "overview"
  | "matrix"
  | "clusters"
  | "network"
  | "mix"
  | "strategy"
  | "penetration"
  | "funnel";

const SECTIONS: { key: SectionKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "matrix", label: "Priority Matrix", icon: Grid2x2 },
  { key: "clusters", label: "Cluster Overview", icon: Table2 },
  { key: "network", label: "ASM & DG Network", icon: Users },
  { key: "mix", label: "Engagement Mix", icon: PieIcon },
  { key: "strategy", label: "Strategy & Execution", icon: Target },
  { key: "penetration", label: "Penetration Tracker", icon: TrendingUp },
  { key: "funnel", label: "Sales Funnel", icon: Filter },
];

const CHART = {
  priority: "oklch(0.58 0.13 165)",
  opportunity: "oklch(0.55 0.13 250)",
  maintain: "oklch(0.75 0.14 75)",
  deprioritize: "oklch(0.58 0.21 27)",
} as const;

const th = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";
const td = "px-3 py-2.5 text-sm";

function AnalyticsPage() {
  const [section, setSection] = useState<SectionKey>("overview");

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" aria-label="Back to launcher" className="rounded-full p-1.5 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-navy-foreground/60">
              JK Maxx · Analytics
            </p>
            <h1 className="truncate font-display text-lg leading-tight">DG App Analytics</h1>
          </div>
        </div>
        <nav className="mx-auto max-w-6xl overflow-x-auto px-2 pb-1">
          <div className="flex gap-1">
            {SECTIONS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSection(s.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-t-lg px-3 py-2 text-xs font-semibold transition",
                  section === s.key
                    ? "bg-background text-navy"
                    : "text-navy-foreground/70 hover:text-navy-foreground",
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5">
        {section === "overview" && <Overview onJump={setSection} />}
        {section === "matrix" && <MatrixSection />}
        {section === "clusters" && <ClusterOverview />}
        {section === "network" && <NetworkSection />}
        {section === "mix" && <MixSection />}
        {section === "strategy" && <StrategySection />}
        {section === "penetration" && <PenetrationSection />}
        {section === "funnel" && <FunnelSection />}
      </main>
    </div>
  );
}

/* ---------------- Overview ---------------- */

function Overview({ onJump }: { onJump: (s: SectionKey) => void }) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi
          label="Total revenue potential"
          value={`₹${(TOTAL_REVENUE_POTENTIAL / 1000).toFixed(1)}k Cr`}
          sub="Across 10 national clusters"
        />
        <Kpi label="Average penetration" value={`${AVG_PENETRATION}%`} sub="JK customers vs prospects" />
        <Kpi
          label="DGs in low-priority clusters"
          value={`${LOW_PRIORITY_DG_PCT}%`}
          sub="Low potential · low access"
          accent="critical"
        />
        <Kpi label="Clusters mapped" value={TOTAL_CLUSTERS_MAPPED} sub="Across 14 Maharashtra ASMs" />
      </div>

      <Panel
        title="Priority matrix"
        desc="Where national revenue potential meets DG access."
        right={
          <button
            onClick={() => onJump("matrix")}
            className="text-xs font-semibold text-navy underline-offset-2 hover:underline"
          >
            Open full matrix
          </button>
        }
      >
        <PriorityMatrix clusters={NATIONAL_CLUSTERS} compact />
      </Panel>

      <Panel title="Top insights">
        <div className="space-y-2">
          <Insight text={ENGAGEMENT_INSIGHT} />
          <Insight text={STRATEGY_INSIGHT} tone="critical" />
          <Insight
            text="Redevelopment Housing Projects grew penetration from 24.7% to 30% in five months — the strongest sourced trend nationally."
            tone="warn"
          />
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Priority Matrix ---------------- */

function MatrixSection() {
  const [scope, setScope] = useState<"india" | "mh">("india");
  const [area, setArea] = useState<"all" | "navi">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const clusters = scope === "mh" && area === "navi" ? NAVI_MUMBAI_CLUSTERS : NATIONAL_CLUSTERS;
  const unit = scope === "mh" && area === "navi" ? "₹ Cr" : "₹ Cr";
  const row = clusters.find((c) => c.cluster === selected);

  return (
    <>
      <Panel
        title="Priority matrix"
        desc="Filter by state and market area, then tap a cluster for detail."
        right={
          <div className="flex flex-wrap gap-2">
            <Toggle
              value={scope}
              onChange={(v) => {
                setScope(v);
                setSelected(null);
                if (v === "india") setArea("all");
              }}
              options={[
                { value: "india", label: "All India" },
                { value: "mh", label: "Maharashtra" },
              ]}
            />
            {scope === "mh" && (
              <Toggle
                value={area}
                onChange={(v) => {
                  setArea(v);
                  setSelected(null);
                }}
                options={[
                  { value: "all", label: "All areas" },
                  { value: "navi", label: "Navi Mumbai" },
                ]}
              />
            )}
          </div>
        }
      >
        <PriorityMatrix clusters={clusters} onSelect={setSelected} selected={selected} />
      </Panel>

      <Panel title={row ? row.cluster : "Cluster detail"}>
        {!row ? (
          <p className="text-sm text-muted-foreground">
            Select a cluster in the matrix to see its revenue potential, access level and what the
            quadrant implies for DG effort.
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <QuadrantBadge q={row.quadrant} />
              <AccessBadge level={row.access} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                  Revenue potential
                </p>
                <p className="mt-1 font-display text-2xl">
                  {row.revenue == null ? "Not sized" : `₹${row.revenue.toLocaleString("en-IN")} ${unit.replace("₹ ", "")}`}
                </p>
              </div>
              <div className="rounded-xl border border-border p-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Quadrant</p>
                <p className="mt-1 text-sm font-semibold">{QUADRANTS[row.quadrant].label}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{QUADRANTS[row.quadrant].meaning}</p>
          </div>
        )}
      </Panel>
    </>
  );
}

/* ---------------- Cluster overview ---------------- */

function ClusterOverview() {
  const [scope, setScope] = useState<"india" | "navi">("india");
  const [asc, setAsc] = useState(false);
  const rows = useMemo(() => {
    const base = scope === "india" ? NATIONAL_CLUSTERS : NAVI_MUMBAI_CLUSTERS;
    return [...base].sort((a, b) =>
      asc ? (a.revenue ?? 0) - (b.revenue ?? 0) : (b.revenue ?? 0) - (a.revenue ?? 0),
    );
  }, [scope, asc]);

  return (
    <Panel
      title="Cluster overview"
      desc="Clusters ranked by revenue potential."
      right={
        <Toggle
          value={scope}
          onChange={setScope}
          options={[
            { value: "india", label: "All India" },
            { value: "navi", label: "Navi Mumbai" },
          ]}
        />
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>#</th>
              <th className={th}>Cluster</th>
              <th className={th}>Quadrant</th>
              <th className={cn(th, "text-right")}>
                <button onClick={() => setAsc((v) => !v)} className="hover:text-navy">
                  Revenue ₹Cr {asc ? "↑" : "↓"}
                </button>
              </th>
              <th className={th}>Access</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.cluster} className="border-b border-border/60 last:border-0">
                <td className={cn(td, "text-muted-foreground")}>{i + 1}</td>
                <td className={cn(td, "font-medium")}>{r.cluster}</td>
                <td className={td}>
                  <QuadrantBadge q={r.quadrant} />
                </td>
                <td className={cn(td, "text-right font-semibold tabular-nums")}>
                  {r.revenue == null ? "—" : r.revenue.toLocaleString("en-IN")}
                </td>
                <td className={td}>
                  <AccessBadge level={r.access} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

/* ---------------- ASM & DG network ---------------- */

function NetworkSection() {
  const [asm, setAsm] = useState<string | null>(null);
  const [dg, setDg] = useState<string | null>(null);

  return (
    <Panel title="ASM & DG network" desc="Drill from ASM to DG to cluster.">
      <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs font-semibold">
        <button onClick={() => { setAsm(null); setDg(null); }} className={cn(!asm ? "text-navy" : "text-muted-foreground hover:text-navy")}>
          Maharashtra ASMs
        </button>
        {asm && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <button onClick={() => setDg(null)} className={cn(!dg ? "text-navy" : "text-muted-foreground hover:text-navy")}>
              {asm}
            </button>
          </>
        )}
        {dg && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-navy">{dg}</span>
          </>
        )}
      </nav>

      {!asm && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>ASM</th>
                <th className={th}>Market area</th>
                <th className={cn(th, "text-right")}>Clusters</th>
                <th className={cn(th, "text-right")}>Revenue ₹Cr</th>
                <th className={th}>Access</th>
                <th className={cn(th, "text-right")}>Contractors</th>
                <th className={cn(th, "text-right")}>Touchpoints</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {ASMS.map((a) => (
                <tr key={a.name} className={cn("border-b border-border/60 last:border-0", a.drillable && "cursor-pointer hover:bg-muted/50")} onClick={() => a.drillable && setAsm(a.name)}>
                  <td className={cn(td, "font-medium")}>{a.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{a.area}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{a.clustersMapped}</td>
                  <td className={cn(td, "text-right font-semibold tabular-nums")}>{a.revenue}</td>
                  <td className={td}><AccessBadge level={a.access} /></td>
                  <td className={cn(td, "text-right tabular-nums")}>{a.contractors ?? "—"}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{a.touchpoints ?? "—"}</td>
                  <td className={cn(td, "text-right")}>
                    {a.drillable ? (
                      <ChevronRight className="ml-auto h-4 w-4 text-navy" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Not synced</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {asm && !dg && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>DG</th>
                <th className={th}>Area</th>
                <th className={cn(th, "text-right")}>Clusters</th>
                <th className={cn(th, "text-right")}>Revenue ₹Cr</th>
                <th className={th}>Access</th>
                <th className={cn(th, "text-right")}>Targeted</th>
                <th className={cn(th, "text-right")}>Right strategy</th>
                <th className={cn(th, "text-right")}>% executed</th>
                <th className={th}>Status</th>
                <th className={th} />
              </tr>
            </thead>
            <tbody>
              {DGS_VIKRAM.map((d) => (
                <tr key={d.name} className={cn("border-b border-border/60 last:border-0", d.drillable && "cursor-pointer hover:bg-muted/50")} onClick={() => d.drillable && setDg(d.name)}>
                  <td className={cn(td, "font-medium")}>{d.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{d.area}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{d.clustersMapped}</td>
                  <td className={cn(td, "text-right font-semibold tabular-nums")}>{d.revenue}</td>
                  <td className={td}><AccessBadge level={d.access} /></td>
                  <td className={cn(td, "text-right tabular-nums")}>{d.targeted}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{d.rightStrategy}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{d.executed}%</td>
                  <td className={td}>
                    <StatusBadge status={d.status === "On Track" ? "On Track" : "Behind"} />
                  </td>
                  <td className={cn(td, "text-right")}>
                    {d.drillable ? (
                      <ChevronRight className="ml-auto h-4 w-4 text-navy" />
                    ) : (
                      <span className="text-[11px] text-muted-foreground">Not synced</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dg && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Cluster</th>
                <th className={cn(th, "text-right")}>Prospects</th>
                <th className={cn(th, "text-right")}>Revenue ₹Cr</th>
                <th className={cn(th, "text-right")}>Contractors</th>
                <th className={cn(th, "text-right")}>Touchpoints</th>
                <th className={th}>Quadrant</th>
              </tr>
            </thead>
            <tbody>
              {DG_RAJESH_CLUSTERS.map((c) => (
                <tr key={c.cluster} className="border-b border-border/60 last:border-0">
                  <td className={cn(td, "font-medium")}>{c.cluster}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{c.prospects}</td>
                  <td className={cn(td, "text-right font-semibold tabular-nums")}>{c.revenue}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{c.contractors}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{c.touchpoints}</td>
                  <td className={td}><QuadrantBadge q={c.quadrant} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

/* ---------------- Engagement mix ---------------- */

function MixSection() {
  const [q, setQ] = useState<QuadrantKey>("deprioritize");
  const roster = q === "maintain" || q === "deprioritize" ? ROSTER_A : ROSTER_B;

  return (
    <>
      <Panel title="Engagement mix" desc="Share of DGs targeting each quadrant. Tap a slice or legend row.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={ENGAGEMENT_MIX}
                  dataKey="pct"
                  nameKey="quadrant"
                  innerRadius={55}
                  outerRadius={95}
                  paddingAngle={2}
                  onClick={(d: any) => d?.payload?.quadrant && setQ(d.payload.quadrant)}
                >
                  {ENGAGEMENT_MIX.map((m) => (
                    <Cell
                      key={m.quadrant}
                      fill={CHART[m.quadrant]}
                      opacity={q === m.quadrant ? 1 : 0.45}
                      stroke="none"
                      cursor="pointer"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: any, n: any) => [`${v}% of DGs`, QUADRANTS[n as QuadrantKey].short]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 self-center">
            {ENGAGEMENT_MIX.map((m) => (
              <button
                key={m.quadrant}
                onClick={() => setQ(m.quadrant)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border p-2.5 text-left transition",
                  q === m.quadrant ? "border-navy bg-muted/60" : "border-border hover:bg-muted/40",
                )}
              >
                <span className={cn("h-2.5 w-2.5 rounded-full", quadDot[m.quadrant])} />
                <span className="flex-1 text-sm font-medium">{QUADRANTS[m.quadrant].label}</span>
                <span className="font-display text-lg">{m.pct}%</span>
              </button>
            ))}
            <Insight text={ENGAGEMENT_INSIGHT} />
          </div>
        </div>
      </Panel>

      <Panel title={`ASMs behind “${QUADRANTS[q].short}”`} desc="DG counts rolled up by ASM.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>ASM</th>
                <th className={th}>Market area</th>
                <th className={cn(th, "text-right")}>DG count</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((r) => (
                <tr key={r.name} className="border-b border-border/60 last:border-0">
                  <td className={cn(td, "font-medium")}>{r.name}</td>
                  <td className={cn(td, "text-muted-foreground")}>{r.area}</td>
                  <td className={cn(td, "text-right font-semibold tabular-nums")}>{r.dgs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Strategy ---------------- */

function StrategySection() {
  const [filter, setFilter] = useState<"all" | "On Track" | "Behind">("all");
  const rows = STRATEGY_ROWS.filter((r) => filter === "all" || r.status === filter);
  return (
    <Panel
      title="Strategy & execution"
      desc="Top clusters DGs are targeting nationally."
      right={
        <Toggle
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "On Track", label: "On Track" },
            { value: "Behind", label: "Behind" },
          ]}
        />
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className={th}>Cluster</th>
              <th className={th}>Quadrant</th>
              <th className={cn(th, "text-right")}>% of DGs planned</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.cluster} className="border-b border-border/60 last:border-0">
                <td className={cn(td, "font-medium")}>{r.cluster}</td>
                <td className={td}><QuadrantBadge q={r.quadrant} /></td>
                <td className={cn(td, "text-right")}>
                  <div className="flex items-center justify-end gap-2">
                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-navy"
                        style={{ width: `${(r.pct / 22) * 100}%` }}
                      />
                    </span>
                    <span className="font-semibold tabular-nums">{r.pct}%</span>
                  </div>
                </td>
                <td className={td}><StatusBadge status={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <Insight text={STRATEGY_INSIGHT} tone="critical" />
      </div>
    </Panel>
  );
}

/* ---------------- Penetration ---------------- */

function PenetrationSection() {
  const [row, setRow] = useState<PenetrationRow>(PENETRATION_ROWS[0]);
  const data = trendFor(row);
  return (
    <>
      <Panel title="Penetration tracker" desc="Tap a cluster to see its 5-month trend.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={th}>Cluster</th>
                <th className={cn(th, "text-right")}>Prospects</th>
                <th className={cn(th, "text-right")}>JK customers</th>
                <th className={cn(th, "text-right")}>Penetration</th>
                <th className={th}>Quadrant</th>
                <th className={cn(th, "text-right")}>MoM</th>
              </tr>
            </thead>
            <tbody>
              {PENETRATION_ROWS.map((r) => (
                <tr
                  key={r.cluster}
                  onClick={() => setRow(r)}
                  className={cn(
                    "cursor-pointer border-b border-border/60 last:border-0 hover:bg-muted/50",
                    row.cluster === r.cluster && "bg-muted/60",
                  )}
                >
                  <td className={cn(td, "font-medium")}>{r.cluster}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{r.prospects.toLocaleString("en-IN")}</td>
                  <td className={cn(td, "text-right tabular-nums")}>{r.customers.toLocaleString("en-IN")}</td>
                  <td className={cn(td, "text-right font-semibold tabular-nums")}>{r.penetration}%</td>
                  <td className={td}><QuadrantBadge q={r.quadrant} /></td>
                  <td className={cn(td, "text-right font-semibold tabular-nums", r.change >= 0 ? "text-good" : "text-bad")}>
                    {r.change > 0 ? "+" : ""}
                    {r.change}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel
        title={`${row.cluster} — penetration trend`}
        desc={
          row.cluster === "Redevelopment Housing Projects"
            ? "Sourced monthly figures, Jan'26 – May'26."
            : "Illustrative 5-month trend ending at the reported penetration."
        }
      >
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
              <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit="%" />
              <Tooltip formatter={(v: any) => [`${v}%`, "Penetration"]} />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--navy)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </>
  );
}

/* ---------------- Funnel ---------------- */

function FunnelSection() {
  const [view, setView] = useState<"cluster" | "dg">("cluster");
  return (
    <Panel
      title="Sales funnel"
      desc={view === "cluster" ? "Prospects → engaged → JK customers." : "Navi Mumbai DG funnel."}
      right={
        <Toggle
          value={view}
          onChange={setView}
          options={[
            { value: "cluster", label: "By cluster" },
            { value: "dg", label: "By DG (Navi Mumbai)" },
          ]}
        />
      }
    >
      {view === "cluster" ? (
        <div className="space-y-4">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={FUNNEL_BY_CLUSTER} margin={{ left: -14, right: 8, top: 8 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="cluster" tick={false} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <Tooltip />
                <Bar dataKey="prospects" name="Total prospects" fill="var(--navy)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="engaged" name="Engaged" fill={CHART.opportunity} radius={[4, 4, 0, 0]} />
                <Bar dataKey="customers" name="JK customers" fill={CHART.priority} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <th className={th}>Cluster</th>
                  <th className={cn(th, "text-right")}>Prospects</th>
                  <th className={cn(th, "text-right")}>Engaged</th>
                  <th className={cn(th, "text-right")}>JK customers</th>
                </tr>
              </thead>
              <tbody>
                {FUNNEL_BY_CLUSTER.map((f) => (
                  <tr key={f.cluster} className="border-b border-border/60 last:border-0">
                    <td className={cn(td, "font-medium")}>{f.cluster}</td>
                    <td className={cn(td, "text-right tabular-nums")}>{f.prospects.toLocaleString("en-IN")}</td>
                    <td className={cn(td, "text-right tabular-nums")}>{f.engaged.toLocaleString("en-IN")}</td>
                    <td className={cn(td, "text-right font-semibold tabular-nums")}>{f.customers.toLocaleString("en-IN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {FUNNEL_BY_DG.map((d) => (
            <div key={d.name} className="rounded-xl border border-border p-4">
              <p className="font-medium">{d.name}</p>
              <p className="text-xs text-muted-foreground">{d.area}</p>
              {d.synced ? (
                <dl className="mt-3 space-y-2">
                  {[
                    ["Prospects mapped", d.mapped],
                    ["Stakeholder touchpoints", d.touchpoints],
                    ["Contractors available", d.contractors],
                  ].map(([label, val]) => (
                    <div key={label as string}>
                      <div className="flex justify-between text-xs">
                        <dt className="text-muted-foreground">{label}</dt>
                        <dd className="font-semibold tabular-nums">{val as number}</dd>
                      </div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-navy"
                          style={{ width: `${((val as number) / (d.mapped ?? 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-3 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                  Funnel data not yet synced for this DG.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
