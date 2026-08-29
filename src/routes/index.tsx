import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Map as MapIcon, Monitor, LayoutDashboard, ArrowRight } from "lucide-react";
import { SYSTEM_TILES } from "@/lib/systemTiles";
import { cn } from "@/lib/utils";

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

type ViewMode = "systemic" | "product";

type ProductTileDef = {
  icon: typeof MapIcon;
  title: string;
  desc: string;
  to: "/market-discovery" | "/leadership" | "/dashboard";
  cta: string;
};

const PRODUCT_TILES: ProductTileDef[] = [
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
  const [view, setView] = useState<ViewMode>("systemic");

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background p-6">
      <div className={cn("w-full space-y-8", view === "systemic" ? "max-w-6xl" : "max-w-4xl")}>
        <div className="space-y-3 text-center">
          <p className="text-lg font-medium tracking-wide text-muted-foreground">Paints</p>
          <h1 className="font-display text-4xl font-bold leading-tight text-foreground">
            Market Intelligence System
          </h1>
          <p className="text-sm text-muted-foreground">
            {view === "systemic" ? "How the system works, end to end" : "Select your interface to continue"}
          </p>

          <div className="inline-flex items-center rounded-full border border-border bg-card p-1 text-sm shadow-sm">
            <button
              type="button"
              onClick={() => setView("systemic")}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition-colors",
                view === "systemic" ? "bg-navy text-navy-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Systemic View
            </button>
            <button
              type="button"
              onClick={() => setView("product")}
              className={cn(
                "rounded-full px-4 py-1.5 font-medium transition-colors",
                view === "product" ? "bg-navy text-navy-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              Product View
            </button>
          </div>
        </div>

        {view === "product" ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {PRODUCT_TILES.map(({ icon: Icon, title, desc, to, cta }) => (
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
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SYSTEM_TILES.map((tile) => {
              const Icon = tile.icon;
              return (
                <Link
                  key={tile.slug}
                  to="/systemic/$slug"
                  params={{ slug: tile.slug }}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-6 text-left shadow-sm transition-shadow hover:shadow-lg"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-navy/10 text-navy transition-colors group-hover:bg-navy group-hover:text-white">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h2 className="font-display text-lg font-bold leading-tight text-foreground">{tile.title}</h2>
                  {tile.layer && (
                    <span className="mt-1 inline-block w-fit rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {tile.layer}
                    </span>
                  )}
                  <p className="mt-3 flex-1 text-sm text-muted-foreground">{tile.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-navy transition-colors group-hover:text-critical">
                    View details <ArrowRight className="h-4 w-4" />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
