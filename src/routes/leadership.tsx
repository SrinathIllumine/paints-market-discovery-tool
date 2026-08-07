import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { cn } from "@/lib/utils";
import {
  NATIONAL_CLUSTERS,
  TOTAL_REVENUE_POTENTIAL,
  AVG_PENETRATION,
  LOW_PRIORITY_DG_PCT,
  MOM_PENETRATION_CHANGE,
  NATIONAL_PENETRATION_TREND,
  STRATEGY_ROWS,
  ENGAGEMENT_INSIGHT,
  STRATEGY_INSIGHT,
} from "@/data/analytics";
import { QuadrantBadge, Insight } from "@/components/analytics/ui";

export const Route = createFileRoute("/leadership")({
  head: () => ({
    meta: [
      { title: "Leadership Dashboard — Market Penetration at a Glance" },
      {
        name: "description",
        content:
          "Executive snapshot of revenue potential, national penetration trend, focus clusters and strategy execution health.",
      },
      { property: "og:title", content: "Leadership Dashboard" },
      {
        property: "og:description",
        content: "One-glance executive view of market penetration and strategy execution.",
      },
    ],
  }),
  component: LeadershipPage,
});

const onTrack = STRATEGY_ROWS.filter((r) => r.status === "On Track").length;
const behind = STRATEGY_ROWS.length - onTrack;

const execData = [
  { name: "On Track", value: onTrack, fill: "oklch(0.58 0.13 165)" },
  { name: "Behind", value: behind, fill: "oklch(0.58 0.21 27)" },
];

const topClusters = [...NATIONAL_CLUSTERS]
  .sort((a, b) => (b.revenue ?? 0) - (a.revenue ?? 0))
  .slice(0, 5);

function LeadershipPage() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border bg-navy text-navy-foreground">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
          <Link to="/" aria-label="Back to launcher" className="rounded-full p-1.5 hover:bg-white/10">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-navy-foreground/60">
              JK Maxx · Executive view
            </p>
            <h1 className="font-display text-xl leading-tight">Leadership Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-10 px-5 py-10">
        {/* Hero KPIs */}
        <section className="grid grid-cols-2 gap-x-6 gap-y-8">
          <Hero
            label="Revenue potential"
            value={`₹${(TOTAL_REVENUE_POTENTIAL / 1000).toFixed(1)}k Cr`}
            sub="Top 10 national clusters"
          />
          <Hero label="Avg. penetration" value={`${AVG_PENETRATION}%`} sub="JK customers of prospects" />
          <Hero
            label="DGs mis-targeting"
            value={`${LOW_PRIORITY_DG_PCT}%`}
            sub="In low potential · low access"
            tone="bad"
          />
          <Hero
            label="Penetration MoM"
            value={
              <span className="inline-flex items-center gap-1">
                {MOM_PENETRATION_CHANGE > 0 ? (
                  <ArrowUpRight className="h-6 w-6" />
                ) : (
                  <ArrowDownRight className="h-6 w-6" />
                )}
                {Math.abs(MOM_PENETRATION_CHANGE)} pts
              </span>
            }
            sub="April'26 → May'26"
            tone="good"
          />
        </section>

        {/* Where to focus */}
        <Block title="Where should we focus" sub="Top 5 clusters by national revenue potential">
          <ol className="divide-y divide-border">
            {topClusters.map((c, i) => (
              <li key={c.cluster} className="flex items-center gap-3 py-3.5">
                <span className="font-display text-2xl text-muted-foreground/60">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.cluster}</p>
                  <div className="mt-1">
                    <QuadrantBadge q={c.quadrant} />
                  </div>
                </div>
                <p className="shrink-0 font-display text-xl tabular-nums">
                  ₹{(c.revenue ?? 0).toLocaleString("en-IN")} Cr
                </p>
              </li>
            ))}
          </ol>
        </Block>

        {/* Execution */}
        <Block title="Are we executing well" sub={`${onTrack} of ${STRATEGY_ROWS.length} focus clusters on track`}>
          <div className="flex flex-col items-center gap-6 sm:flex-row">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={execData}
                    dataKey="value"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="none"
                    isAnimationActive={false}
                  >
                    {execData.map((d) => (
                      <Cell key={d.name} fill={d.fill} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: any, n: any) => [`${v} clusters`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full space-y-3">
              {execData.map((d) => (
                <div key={d.name} className="flex items-center gap-2.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                  <span className="flex-1 text-sm font-medium">{d.name}</span>
                  <span className="font-display text-xl">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 space-y-2">
            <Insight text={ENGAGEMENT_INSIGHT} />
            <Insight text={STRATEGY_INSIGHT} tone="critical" />
          </div>
        </Block>

        {/* Trend */}
        <Block title="National penetration trend" sub="Average penetration across tracked clusters, last 5 months">
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={NATIONAL_PENETRATION_TREND} margin={{ left: -20, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="pen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--navy)" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="var(--navy)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" unit="%" domain={[20, 32]} />
                <Tooltip formatter={(v: any) => [`${v}%`, "Penetration"]} />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--navy)"
                  strokeWidth={2.5}
                  fill="url(#pen)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Block>

        <p className="pb-6 text-center text-xs text-muted-foreground">
          Need the detail behind these numbers?{" "}
          <Link to="/analytics" className="font-semibold text-navy underline-offset-2 hover:underline">
            Open DG App Analytics
          </Link>
        </p>
      </main>
    </div>
  );
}

function Hero({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  sub: string;
  tone?: "good" | "bad";
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-2 font-display text-4xl leading-none sm:text-5xl",
          tone === "good" && "text-good",
          tone === "bad" && "text-bad",
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Block({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="font-display text-2xl leading-tight">{title}</h2>
      {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      <div className="mt-4 rounded-2xl border border-border bg-card p-5 shadow-sm">{children}</div>
    </section>
  );
}

