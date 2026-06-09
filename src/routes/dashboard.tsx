import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Home,
  ArrowUpRight,
  TrendingUp,
  Trophy,
  AlertTriangle,
  Layers,
  Target,
  Percent,
  Wallet,
  ArrowUpDown,
} from "lucide-react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { BottomNav } from "@/components/app/BottomNav";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUSTERS, getCluster } from "@/data/clusters";
import { getClusterIntel, getRevenueProfile, formatRupees } from "@/lib/clusterScoring";
import { useAppStore, type SalesStage } from "@/store/appStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Market Discovery Tool" },
      { name: "description", content: "Demand Generator dashboard with KPIs, conversion trends and cluster intelligence." },
    ],
  }),
  component: DashboardPage,
});

/* ----------------------------- Mock past events ----------------------------- */

type EventRow = { name: string; clusterId: string; region: string; date: string; outcome?: string };

const PAST_EVENTS: EventRow[] = [
  { name: "Painter loyalty meet", clusterId: "mid-apartments", region: "Kharghar", date: "14 May", outcome: "32 painters attended, 18 leads" },
  { name: "Pre-handover paint audit", clusterId: "redevelopment", region: "Old Panvel", date: "06 May", outcome: "4 audits, 2 site conversions" },
  { name: "RWA premium exteriors session", clusterId: "gated-community", region: "Kamothe", date: "22 Apr", outcome: "55 attendees, 9 inquiries" },
  { name: "Hospital hygienic-finish demo", clusterId: "hospitals", region: "New Panvel", date: "12 Apr", outcome: "3 facility managers engaged" },
  { name: "Industrial coatings roadshow", clusterId: "midc", region: "Taloja MIDC", date: "28 Mar", outcome: "12 units visited, 5 quotations" },
];

/* ----------------------------- MoM conversions ----------------------------- */

const MOM_CONVERSIONS_ALL = [
  { month: "Jan", conversions: 4 },
  { month: "Feb", conversions: 6 },
  { month: "Mar", conversions: 5 },
  { month: "Apr", conversions: 9 },
  { month: "May", conversions: 8 },
  { month: "Jun", conversions: 12 },
];

// Deterministic per-cluster variation so each cluster has its own trend.
function getClusterConversions(clusterId: string) {
  let h = 0;
  for (const ch of clusterId) h = (h * 31 + ch.charCodeAt(0)) % 97;
  return MOM_CONVERSIONS_ALL.map((m, i) => ({
    month: m.month,
    conversions: Math.max(0, Math.round(m.conversions * (0.4 + ((h + i * 7) % 13) / 10))),
  }));
}

/* ----------------------------- Helpers ----------------------------- */

const MATRIX_LABEL: Record<string, string> = {
  HH: "High Potential · High Access",
  HL: "High Potential · Low Access",
  LH: "Low Potential · High Access",
  LL: "Low Potential · Low Access",
};
const MATRIX_TONE: Record<string, string> = {
  HH: "bg-emerald-100 text-emerald-800",
  HL: "bg-amber-100 text-amber-800",
  LH: "bg-sky-100 text-sky-800",
  LL: "bg-muted text-muted-foreground",
};

type Row = {
  id: string;
  name: string;
  matrixKey: string;
  prospects: number;
  penetrationPct: number;
  engagedPct: number;
  conversions: number;
  isTarget: boolean;
};

function buildRow(clusterId: string, stages: Record<string, SalesStage> | undefined, isTarget: boolean): Row {
  const c = getCluster(clusterId)!;
  const intel = getClusterIntel(clusterId, c.prospectCountEstimate);
  const total = c.prospectCountEstimate;
  const stageVals = Object.values(stages ?? {});
  const engaged = stageVals.filter((s) => s !== "prospects").length;
  const conversions = stageVals.filter((s) => s === "ongoing" || s === "closure").length;
  const penetrationBase = intel.jkPenetrationLabel === "strong" ? 32 : intel.jkPenetrationLabel === "moderate" ? 18 : 8;
  const penetrationPct = Math.min(100, penetrationBase + Math.round((conversions / Math.max(1, total)) * 60));
  const engagedPct = Math.round((engaged / Math.max(1, total)) * 100);
  const matrixKey = `${intel.revenueHML === "H" || intel.competitiveHML === "H" ? "H" : "L"}${intel.accessHML === "H" || intel.easeHML === "H" ? "H" : "L"}`;
  return { id: clusterId, name: c.name, matrixKey, prospects: total, penetrationPct, engagedPct, conversions, isTarget };
}

type SortKey = "name" | "matrix" | "prospects" | "penetration";

/* ----------------------------- Page ----------------------------- */

function DashboardPage() {
  const stagesAll = useAppStore((s) => s.sales.prospectStages);
  const targetClusterIds = useAppStore((s) => s.plan.targetClusterIds);

  const rows = useMemo(() => {
    return CLUSTERS.map((c) => buildRow(c.id, stagesAll[c.id], targetClusterIds.includes(c.id)));
  }, [stagesAll, targetClusterIds]);

  // KPI values
  const kpi = useMemo(() => {
    const totalRevenue = CLUSTERS.reduce((sum, c) => sum + c.prospectCountEstimate * getRevenueProfile(c.id).avgRevenuePerProspect, 0);
    const totalClusters = CLUSTERS.length;
    const activeClusters = new Set<string>(targetClusterIds);
    for (const r of rows) if (r.conversions > 0 || r.engagedPct > 0) activeClusters.add(r.id);

    const activeRows = rows.filter((r) => activeClusters.has(r.id));
    const totalEngaged = activeRows.reduce((s, r) => s + Math.round((r.engagedPct / 100) * r.prospects), 0);
    const totalConversions = activeRows.reduce((s, r) => s + r.conversions, 0);
    const conversionRate = totalEngaged > 0 ? Math.round((totalConversions / totalEngaged) * 100) : 0;

    const top = [...activeRows].sort(
      (a, b) => (b.penetrationPct + b.conversions * 3) - (a.penetrationPct + a.conversions * 3),
    )[0];

    // Attention: high potential clusters with weak penetration
    const attention = [...rows]
      .filter((r) => r.matrixKey.startsWith("H"))
      .sort((a, b) => a.penetrationPct - b.penetrationPct)[0];

    return {
      totalRevenue,
      totalClusters,
      activeClusters: activeClusters.size,
      conversionRate,
      top,
      attention,
    };
  }, [rows, targetClusterIds]);

  const [sortKey, setSortKey] = useState<SortKey>("penetration");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === "name") cmp = a.name.localeCompare(b.name);
      else if (sortKey === "matrix") cmp = a.matrixKey.localeCompare(b.matrixKey);
      else if (sortKey === "prospects") cmp = a.prospects - b.prospects;
      else cmp = a.penetrationPct - b.penetrationPct;
      return sortDir === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  const toggleSort = (k: SortKey) => {
    if (sortKey === k) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir(k === "name" ? "asc" : "desc"); }
  };

  const [historyOpen, setHistoryOpen] = useState(false);
  const [chartClusterId, setChartClusterId] = useState<string>("all");
  const chartData = useMemo(
    () => (chartClusterId === "all" ? MOM_CONVERSIONS_ALL : getClusterConversions(chartClusterId)),
    [chartClusterId],
  );

  return (
    <AppShell bottom={<BottomNav />}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-navy px-5 pb-5 pt-6 text-navy-foreground md:rounded-t-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
              JK Cement · Demand Generator
            </p>
            <h1 className="mt-1 font-display text-2xl leading-tight">My Dashboard</h1>
          </div>
          <Link to="/" aria-label="Home" className="rounded-full p-1.5 text-navy-foreground/80 hover:bg-white/10">
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="space-y-5 px-5 py-5">
        {/* Profile card */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-critical text-lg font-semibold text-white">
              SK
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg leading-tight">Sunil Kumar</h3>
              <p className="text-xs text-muted-foreground">Demand Generator · Panvel</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Exp. in JK: 3 years</p>
            </div>
          </div>
        </section>

        {/* KPI Section */}
        <section>
          <h2 className="mb-2 font-display text-base">Performance at a glance</h2>
          <div className="grid grid-cols-2 gap-2">
            <KpiCard
              icon={<Wallet className="h-4 w-4" />}
              label="Market Revenue Potential"
              value={formatRupees(kpi.totalRevenue)}
              hint="Aggregated across all clusters"
              tone="navy"
            />
            <KpiCard
              icon={<Layers className="h-4 w-4" />}
              label="Total Clusters"
              value={kpi.totalClusters}
              hint="Available to you"
              tone="neutral"
            />
            <KpiCard
              icon={<Target className="h-4 w-4" />}
              label="Active Clusters"
              value={kpi.activeClusters}
              hint="Where you've engaged"
              tone="emerald"
            />
            <KpiCard
              icon={<Percent className="h-4 w-4" />}
              label="Conversion Rate"
              value={`${kpi.conversionRate}%`}
              hint="Converted / engaged"
              tone={kpi.conversionRate >= 30 ? "emerald" : kpi.conversionRate >= 15 ? "amber" : "critical"}
            />
            <KpiCard
              icon={<Trophy className="h-4 w-4" />}
              label="Top Performing Cluster"
              value={kpi.top ? truncate(kpi.top.name, 22) : "—"}
              hint={kpi.top ? `${kpi.top.penetrationPct}% penetration` : "Start engaging"}
              tone="emerald"
              href={kpi.top ? `/plan/${kpi.top.id}` : undefined}
            />
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4" />}
              label="Cluster Needing Attention"
              value={kpi.attention ? truncate(kpi.attention.name, 22) : "—"}
              hint={kpi.attention ? `Only ${kpi.attention.penetrationPct}% penetration` : "All clusters healthy"}
              tone="critical"
              href={kpi.attention ? `/plan/${kpi.attention.id}` : undefined}
            />
          </div>
        </section>

        {/* MoM Conversion Chart */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="font-display text-lg leading-tight">Conversions · Month on Month</h2>
              <p className="text-xs text-muted-foreground">
                {chartClusterId === "all"
                  ? "Trend of converted prospects across all clusters"
                  : `Trend for ${getCluster(chartClusterId)?.name ?? chartClusterId}`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={chartClusterId}
                onChange={(e) => setChartClusterId(e.target.value)}
                className="rounded border border-border bg-background px-2 py-1 text-xs"
                aria-label="Filter conversions by cluster"
              >
                <option value="all">All clusters</option>
                {CLUSTERS.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span className="flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                <TrendingUp className="h-3 w-3" /> MoM
              </span>
            </div>
          </div>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid var(--border)" }}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="conversions" fill="var(--navy)" radius={[6, 6, 0, 0]} barSize={22} />
                <Line type="monotone" dataKey="conversions" stroke="var(--critical)" strokeWidth={2} dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </section>


        {/* Cluster Summary Table */}
        <section className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between px-4 pb-2 pt-4">
            <div>
              <h2 className="font-display text-base leading-tight">Cluster Summary</h2>
              <p className="text-[11px] text-muted-foreground">Sortable view of all clusters in your market</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground">
                <tr>
                  <Th onClick={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir}>Cluster</Th>
                  <Th onClick={() => toggleSort("matrix")} active={sortKey === "matrix"} dir={sortDir}>Matrix</Th>
                  <Th onClick={() => toggleSort("prospects")} active={sortKey === "prospects"} dir={sortDir} className="text-right">Prospects</Th>
                  <Th onClick={() => toggleSort("penetration")} active={sortKey === "penetration"} dir={sortDir} className="text-right">Penetration</Th>
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link to="/plan/$clusterId" params={{ clusterId: r.id }} className="font-medium text-navy hover:underline">
                        {r.name}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-semibold", MATRIX_TONE[r.matrixKey])}>
                        {r.matrixKey}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.prospects}</td>
                    <td className="px-3 py-2 text-right">
                      <span className={cn(
                        "tabular-nums font-semibold",
                        r.penetrationPct >= 30 ? "text-emerald-700" : r.penetrationPct >= 15 ? "text-amber-700" : "text-critical",
                      )}>
                        {r.penetrationPct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-2 text-[11px] text-muted-foreground">
            <div className="flex flex-wrap gap-2">
              <Legend tone="bg-emerald-500" label="≥30%" />
              <Legend tone="bg-amber-500" label="15–29%" />
              <Legend tone="bg-critical" label="<15%" />
            </div>
            <span>{rows.length} clusters</span>
          </div>
        </section>

        {/* Quick links */}
        <section className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40"
          >
            <div>
              <p className="font-display text-sm leading-tight">View Engagement History</p>
              <p className="text-[11px] text-muted-foreground">Past contribution events &amp; outcomes</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </button>
          <Link
            to="/network"
            className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors hover:bg-muted/40"
          >
            <div>
              <p className="font-display text-sm leading-tight">View My Network</p>
              <p className="text-[11px] text-muted-foreground">Contractors, stakeholders, influencers, retailers</p>
            </div>
            <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </section>
      </div>

      {/* Past events popup */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Engagement history</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {PAST_EVENTS.map((e, i) => (
              <li key={i} className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-medium leading-tight">{e.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {getCluster(e.clusterId)?.name ?? e.clusterId} · {e.region} · {e.date}
                </p>
                {e.outcome && (
                  <p className="mt-1 text-xs text-navy">
                    <span className="font-semibold">Outcome:</span> {e.outcome}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

const TONE_CLASS: Record<string, { icon: string; ring: string }> = {
  navy: { icon: "bg-navy/10 text-navy", ring: "ring-navy/10" },
  neutral: { icon: "bg-muted text-muted-foreground", ring: "ring-border" },
  emerald: { icon: "bg-emerald-100 text-emerald-700", ring: "ring-emerald-100" },
  amber: { icon: "bg-amber-100 text-amber-700", ring: "ring-amber-100" },
  critical: { icon: "bg-critical/10 text-critical", ring: "ring-critical/10" },
};

function KpiCard({
  icon, label, value, hint, tone = "neutral", href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
  tone?: keyof typeof TONE_CLASS;
  href?: string;
}) {
  const t = TONE_CLASS[tone];
  const inner = (
    <div className={cn(
      "h-full rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors",
      href && "hover:bg-muted/40",
    )}>
      <div className="flex items-start justify-between gap-2">
        <span className={cn("flex h-7 w-7 items-center justify-center rounded-full", t.icon)}>{icon}</span>
        {href && <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />}
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-base leading-tight">{value}</p>
      {hint && <p className="mt-0.5 truncate text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
  if (href) return <Link to={href} className="block">{inner}</Link>;
  return inner;
}

function Th({
  children, onClick, active, dir, className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  dir: "asc" | "desc";
  className?: string;
}) {
  return (
    <th className={cn("px-3 py-2 font-semibold", className)}>
      <button type="button" onClick={onClick} className="inline-flex items-center gap-1 hover:text-foreground">
        {children}
        <ArrowUpDown className={cn("h-3 w-3", active ? "text-navy" : "text-muted-foreground/50", active && dir === "asc" && "rotate-180")} />
      </button>
    </th>
  );
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn("h-2 w-2 rounded-full", tone)} /> {label}
    </span>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
