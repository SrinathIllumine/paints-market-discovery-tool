import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, BarChart3, Crown, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "JK Maxx Market Engagement Suite" },
      {
        name: "description",
        content:
          "Choose your workspace: the DG field app, operational cluster analytics, or the leadership executive snapshot.",
      },
      { property: "og:title", content: "JK Maxx Market Engagement Suite" },
      {
        property: "og:description",
        content:
          "One suite for demand generators, ASM analytics and leadership review of cluster market penetration.",
      },
    ],
  }),
  component: Launcher,
});

const tiles = [
  {
    to: "/app" as const,
    icon: LayoutGrid,
    title: "Main DG App",
    desc: "Manage clusters, prospects, and daily engagement",
    tone: "bg-navy text-navy-foreground",
  },
  {
    to: "/analytics" as const,
    icon: BarChart3,
    title: "DG App Analytics",
    desc: "Drill into cluster, ASM and DG performance",
    tone: "bg-info/12 text-info",
  },
  {
    to: "/leadership" as const,
    icon: Crown,
    title: "Leadership Dashboard",
    desc: "Executive snapshot of market penetration and strategy execution",
    tone: "bg-critical/10 text-critical",
  },
];

function Launcher() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="mx-auto w-full max-w-3xl px-5 py-10 sm:py-16">
        <header className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-navy font-display text-lg text-navy-foreground">
            JK
          </div>
          <h1 className="mt-5 font-display text-3xl leading-tight sm:text-4xl">
            Market Engagement Suite
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Pick where you want to work today.
          </p>
        </header>

        <div className="mt-8 grid gap-4">
          {tiles.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-navy/40 hover:shadow-md"
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${t.tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl leading-tight">{t.title}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{t.desc}</span>
                </span>
                <ArrowRight className="h-5 w-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-navy" />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
