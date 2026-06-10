import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, Users, Lightbulb, ArrowRight, History } from "lucide-react";
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
          "A guided intelligence tool for JK Cement Demand Generators to map clusters, build cluster engagement plans, and progress prospects through the sales funnel.",
      },
    ],
  }),
  component: IntroScreen,
});

type CardDef = {
  icon: typeof MapIcon;
  title: string;
  desc: string;
  to: "/map" | "/plan" | "/sales-enablement";
  progress: string | null;
};

function IntroScreen() {
  const targetClusterIds = useAppStore((s) => s.plan.targetClusterIds);
  const stakeholders = useAppStore((s) => s.stakeholders);

  void stakeholders;

  const planProgress = targetClusterIds.length > 0 ? " " : null;

  const props: CardDef[] = [
    {
      icon: MapIcon,
      title: "Identify Your Market Potential",
      desc: "Map your clusters with their revenue potential, access level, competitive strength and ease of sale.",
      to: "/map",
      progress: null,
    },
    {
      icon: Users,
      title: "Create Monthly Cluster Engagement Plan",
      desc: "Select your focus cluster and co-create your value proposition, strategy and action plan.",
      to: "/plan",
      progress: planProgress,
    },
    {
      icon: Lightbulb,
      title: "Sales Enablers",
      desc: "Move prospects through the customer management funnel and record progress.",
      to: "/sales-enablement",
      progress: null,
    },
  ];

  return (
    <AppShell bottom={<BottomNav />}>
      <div className="bg-navy px-5 pb-7 pt-8 text-navy-foreground md:rounded-t-3xl">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
              JK Cement · Demand Generator
            </p>
            <h1 className="mt-2 font-display text-3xl leading-tight">Market Discovery Tool</h1>
            <p className="mt-2 text-sm text-white/75">Welcome Sunil Kumar</p>
          </div>
          <Link
            to="/dashboard"
            aria-label="Open my dashboard"
            title="My Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-critical text-sm font-semibold text-white shadow-md ring-2 ring-white/20 transition-transform hover:scale-105"
          >
            SK
          </Link>
        </div>
      </div>


      <div className="space-y-3 px-5 py-5">
        {props.map(({ icon: Icon, title, desc, to, progress }, idx) => (
          <div key={title} className="space-y-3">
            <Link
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
            {idx === 1 && (
              <div className="grid grid-cols-2 gap-3">
                <div />
                <Link
                  to="/plan/past-roadmap"
                  className="flex items-center justify-between gap-2 rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-critical/10 text-critical">
                      <History className="h-4 w-4" />
                    </div>
                    <p className="min-w-0 font-display text-sm leading-tight">Review Past Market Engagements</p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>

    </AppShell>
  );
}
