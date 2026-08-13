import { createFileRoute, Link } from "@tanstack/react-router";
import { Map as MapIcon, Monitor, LayoutDashboard, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Paints — Market Intelligence System" },
      {
        name: "description",
        content: "Select your interface to continue.",
      },
    ],
  }),
  component: MetaHome,
});

type TileDef = {
  icon: typeof MapIcon;
  title: string;
  desc: string;
  to: "/market-discovery" | "/leadership" | "/dashboard";
  cta: string;
};

const TILES: TileDef[] = [
  {
    icon: MapIcon,
    title: "Market Discovery System",
    desc: "Map your market clusters by revenue potential, access and competitive strength, build cluster engagement plans, and move prospects through the sales funnel.",
    to: "/market-discovery",
    cta: "Open Market Discovery",
  },
  {
    icon: Monitor,
    title: "Leadership Analytics App",
    desc: "Aggregated visibility for leadership across all DGs — cluster prioritisation, market penetration, engagement focus and execution tracking.",
    to: "/leadership",
    cta: "Open Leadership App",
  },
  {
    icon: LayoutDashboard,
    title: "DG Dashboard",
    desc: "Your personal performance snapshot — KPIs, conversion trends and cluster-wise progress for your own market.",
    to: "/dashboard",
    cta: "Open My Dashboard",
  },
];

function MetaHome() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium tracking-wide text-muted-foreground">Paints</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
            Market Intelligence System
          </h1>
          <p className="text-sm text-muted-foreground">Select your interface to continue</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {TILES.map(({ icon: Icon, title, desc, to, cta }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-critical/10 text-critical transition-colors group-hover:bg-critical group-hover:text-white">
                <Icon className="h-7 w-7" />
              </div>
              <h2 className="font-display text-xl font-bold leading-tight text-foreground">{title}</h2>
              <p className="mb-4 mt-1 flex-1 text-sm text-muted-foreground">{desc}</p>
              <span className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors group-hover:border-critical group-hover:text-critical">
                {cta} <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
