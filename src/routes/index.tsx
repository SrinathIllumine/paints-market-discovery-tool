import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, Users, Lightbulb, HandHeart, ArrowRight, Lock } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { BottomNav } from "@/components/app/BottomNav";
import { useAppStore } from "@/store/appStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Demand Discovery Tool" },
      {
        name: "description",
        content:
          "A guided intelligence tool for JK Cement Demand Generators to map clusters, build cluster engagement plans, and track post-sale handholding.",
      },
    ],
  }),
  component: IntroScreen,
});

type CardDef = {
  icon: typeof MapIcon;
  title: string;
  desc: string;
  to: "/map" | "/plan" | "/sales-enablement" | "/handhold";
  progress: string | null;
  disabled?: boolean;
};

function IntroScreen() {
  const targetClusterIds = useAppStore((s) => s.plan.targetClusterIds);
  const stakeholders = useAppStore((s) => s.stakeholders);

  void stakeholders;

  const planProgress = targetClusterIds.length > 0 ? " " : null;

  const props: CardDef[] = [
    {
      icon: MapIcon,
      title: "Identify Your Cluster Potential",
      desc: "Map your clusters with their revenue potential, access level, competitive strength and ease of sale.",
      to: "/map",
      progress: null,
    },
    {
      icon: Users,
      title: "Create Monthly Cluster Engagement Plan",
      desc: "Select your cluster strategy, build engagement with the prospects to become an insider and build brand awareness.",
      to: "/plan",
      progress: planProgress,
    },
    {
      icon: Lightbulb,
      title: "Sales Enablement",
      desc: "Get the enablers and best practices to follow during sales engagements.",
      to: "/sales-enablement",
      progress: null,
      disabled: true,
    },
    {
      icon: HandHeart,
      title: "Handhold Customers",
      desc: "Handhold the customers post-sales.",
      to: "/handhold",
      progress: null,
      disabled: true,
    },
  ];

  return (
    <AppShell bottom={<BottomNav />}>
      <div className="bg-navy px-5 pb-7 pt-8 text-navy-foreground md:rounded-t-3xl">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
          JK Cement · Demand Generator
        </p>
        <h1 className="mt-2 font-display text-3xl leading-tight">Demand Discovery Tool</h1>
        <p className="mt-2 text-sm text-white/75">Welcome Sunil Kumar</p>
      </div>

      <div className="space-y-3 px-5 py-5">
        {props.map(({ icon: Icon, title, desc, to, progress, disabled }) => {
          const body = (
            <>
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                  disabled
                    ? "bg-muted text-muted-foreground"
                    : "bg-critical/10 text-critical",
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-lg leading-tight">{title}</h3>
                  {disabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      <Lock className="h-2.5 w-2.5" /> Coming soon
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p>
              </div>
              {!disabled && (
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              {progress && (
                <span className="absolute bottom-2 right-3 text-[11px] font-semibold text-critical">
                  {progress}
                </span>
              )}
            </>
          );

          if (disabled) {
            return (
              <div
                key={title}
                aria-disabled="true"
                title="Coming soon"
                className="relative flex cursor-not-allowed items-start gap-3 rounded-2xl border border-dashed border-border bg-card/60 p-4 pb-7 text-left opacity-70 shadow-sm"
              >
                {body}
              </div>
            );
          }

          return (
            <Link
              key={title}
              to={to}
              className="relative flex items-start gap-3 rounded-2xl border border-border bg-card p-4 pb-7 text-left shadow-sm transition-colors hover:bg-muted/40"
            >
              {body}
            </Link>
          );
        })}
      </div>
    </AppShell>
  );
}
