import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, Users, Lightbulb, ArrowRight, History } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { BottomNav } from "@/components/app/BottomNav";
import { Tour } from "@/components/app/Tour";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

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
  count: number;
  countLabel: string;
  tourId: string;
};

function IntroScreen() {
  const assessments = useAppStore((s) => s.assessments);
  const valueProps = useAppStore((s) => s.plan.valuePropositionByCluster);
  const unlockedStage = useAppStore((s) => s.unlockedStage);

  const mappedCount = Object.keys(assessments).length;
  const plannedCount = Object.values(valueProps).filter((v) => v && v.trim().length > 0).length;
  // Highlight only the current next stage based on user-driven progression.
  const nextStageIdx = unlockedStage - 1; // 0, 1, or 2

  const props: CardDef[] = [
    {
      icon: MapIcon,
      title: "Map Market Potential",
      desc: "Map your clusters with their revenue potential, access level, competitive strength and ease of sale.",
      to: "/map",
      count: mappedCount,
      countLabel: "cluster",
      tourId: "home-card-map",
    },
    {
      icon: Users,
      title: "Create Monthly Cluster Engagement Plan",
      desc: "Select your focus cluster and co-create your value proposition, strategy and action plan.",
      to: "/plan",
      count: plannedCount,
      countLabel: "cluster",
      tourId: "home-card-plan",
    },
    {
      icon: Lightbulb,
      title: "Sales Enablers",
      desc: "Move prospects through the customer management funnel and record progress.",
      to: "/sales-enablement",
      count: 0,
      countLabel: "",
      tourId: "home-card-sales",
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
            data-tour="home-dashboard"
            aria-label="Open my dashboard"
            title="My Dashboard"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-critical text-sm font-semibold text-white shadow-md ring-2 ring-white/20 transition-transform hover:scale-105"
          >
            SK
          </Link>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        {props.map(({ icon: Icon, title, desc, to, count, countLabel, tourId }, idx) => {
          const isPlanCard = idx === 1;
          const isNextStage = idx === nextStageIdx;
          return (
            <div key={title} className={cn("relative", isPlanCard && "pb-5")}>
              {isNextStage && (
                <span className="absolute -top-2 left-4 z-10 rounded-full bg-critical px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-critical-foreground shadow">
                  {nextStageIdx === 0 ? "First Stage" : "Next Stage"}
                </span>
              )}
              <Link
                to={to}
                data-tour={tourId}
                className={cn(
                  "relative flex items-start gap-3 rounded-2xl border bg-card p-4 pb-7 text-left shadow-sm transition-colors hover:bg-muted/40",
                  isNextStage ? "border-critical ring-2 ring-critical/40" : "border-border",
                )}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-critical/10 text-critical">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg leading-tight">{title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                {count > 0 && (
                  <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-critical">
                    {count} {countLabel}
                    {count === 1 ? "" : "s"} {idx === 0 ? "mapped" : idx === 1 ? "planned" : ""}
                  </span>
                )}
              </Link>
              {isPlanCard && (
                <Link
                  to="/plan/past-roadmap"
                  className="absolute -bottom-1 right-4 inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground shadow-md transition-colors hover:bg-muted/40"
                >
                  <History className="h-3.5 w-3.5 text-critical" />
                  Review Past Engagements
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <Tour
        tourKey="home-v1"
        steps={[
          {
            selector: '[data-tour="home-card-map"]',
            title: "Step 1 · Map Market Potential",
            body: "Start here. Identify your clusters and map each one's revenue potential, access, competitive strength and ease of sale.",
          },
          {
            selector: '[data-tour="home-card-plan"]',
            title: "Step 2 · Monthly Engagement Plan",
            body: "Once you've mapped clusters, pick a focus cluster and co-create your value proposition, strategy and action plan.",
          },
          {
            selector: '[data-tour="home-card-sales"]',
            title: "Step 3 · Sales Enablers",
            body: "Move prospects through the customer management funnel and record your progress.",
          },
          {
            selector: '[data-tour="home-dashboard"]',
            title: "Your Dashboard",
            body: "Tap your initials anytime to see your overall progress and history.",
          },
        ]}
      />
    </AppShell>
  );
}
