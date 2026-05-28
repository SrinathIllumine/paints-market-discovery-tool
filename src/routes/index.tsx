import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, Users, Lightbulb, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { BottomNav } from "@/components/app/BottomNav";
import { useAppStore } from "@/store/appStore";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Market Discovery Tool" },
      {
        name: "description",
        content:
          "A guided intelligence tool for JK Cement Demand Generators to map clusters, build stakeholder connects, and plan outreach.",
      },
    ],
  }),
  component: IntroScreen,
});

function IntroScreen() {
  const stakeholders = useAppStore((s) => s.stakeholders);
  const targetClusterIds = useAppStore((s) => s.plan.targetClusterIds);
  const insights = useAppStore((s) => s.insights);

  const clustersWithConnects = Object.entries(stakeholders).filter(
    ([, arr]) => (arr?.length ?? 0) > 0,
  );
  const totalConnects = clustersWithConnects.reduce((n, [, arr]) => n + (arr?.length ?? 0), 0);
  const connectsProgress =
    totalConnects > 0
      ? `${totalConnects} connect${totalConnects === 1 ? "" : "s"} created for ${clustersWithConnects.length} cluster${clustersWithConnects.length === 1 ? "" : "s"}`
      : null;

  const planProgress =
    targetClusterIds.length > 0
      ? `Outreach plan created for ${targetClusterIds.length} cluster${targetClusterIds.length === 1 ? "" : "s"}`
      : null;

  const totalInsights = 3 + insights.length;
  const insightsProgress = `${totalInsights} market insights received from MEs and Retailers`;

  const props = [
    {
      icon: MapIcon,
      title: "Create a cluster map",
      desc: "Visualise your market with clusters, prospects and intelligence.",
      to: "/map" as const,
      progress: connectsProgress,
    },
    {
      icon: Users,
      title: "Build a structured outreach plan",
      desc: "Plan stakeholder connects and execution events month by month.",
      to: "/plan" as const,
      progress: planProgress,
    },
    {
      icon: Lightbulb,
      title: "Track local market intelligence",
      desc: "Capture insights at every step and reuse them across stages.",
      to: "/insights" as const,
      progress: insightsProgress,
    },
  ];

  return (
    <AppShell bottom={<BottomNav />}>
      <div className="bg-navy px-5 pb-7 pt-8 text-navy-foreground md:rounded-t-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
          JK Cement · Demand Generator
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Market Discovery Tool</h1>
        <p className="mt-2 text-sm text-white/75">Welcome Sunil Kumar</p>
      </div>

      <div className="space-y-3 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What you can achieve with this app
        </p>
        {props.map(({ icon: Icon, title, desc, to, progress }) => (
          <Link
            key={title}
            to={to}
            className="relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 pb-7 text-left shadow-sm transition-colors hover:bg-muted/40"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-critical/10 text-critical">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg leading-tight">{title}</h3>
              <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
            </div>
            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
            {progress && (
              <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-critical">
                {progress}
              </span>
            )}
          </Link>
        ))}

        <Link
          to="/map"
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-critical text-base font-semibold text-critical-foreground shadow-lg shadow-critical/20"
        >
          Start with Market Map <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </AppShell>
  );
}
