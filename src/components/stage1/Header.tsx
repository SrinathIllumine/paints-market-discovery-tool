import { Lock, Check } from "lucide-react";

const STAGES = [
  "Identify Market Clusters",
  "Shortlist Clusters",
  "Connect",
  "Create Trust Surplus",
  "Insidership",
];

export function Header({ step }: { step: 1 | 2 | 3 | 4 }) {
  const crumbs = ["Meta-cluster", "Cluster", "Prospects", "Cluster Map"];
  return (
    <header className="border-b border-border/60 bg-card/40 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-6 md:px-10">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Systematic Engagement & Discovery
            </p>
            <h1 className="mt-1 font-display text-3xl leading-tight text-foreground md:text-4xl">
              Welcome Sunil Kumar — let's map the clusters in your area,{" "}
              <span className="italic text-primary">Panvel, Mumbai</span>
            </h1>
          </div>
          <div className="text-sm text-muted-foreground">Stage 1 of 5</div>
        </div>

        {/* Stage progress */}
        <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
          {STAGES.map((label, i) => {
            const idx = i + 1;
            const active = idx === 1;
            return (
              <li
                key={label}
                className={[
                  "flex items-center gap-2 rounded-full border px-3 py-2 text-xs",
                  active
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                    active ? "bg-primary text-primary-foreground" : "bg-background",
                  ].join(" ")}
                >
                  {active ? idx : <Lock className="h-3 w-3" />}
                </span>
                <span className="truncate">{label}</span>
              </li>
            );
          })}
        </ol>

        {/* Breadcrumb within Stage 1 */}
        <nav className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          {crumbs.map((c, i) => {
            const idx = i + 1;
            const done = idx < step;
            const current = idx === step;
            return (
              <div key={c} className="flex items-center gap-2">
                <span
                  className={[
                    "flex items-center gap-1.5",
                    current ? "font-semibold text-foreground" : done ? "text-primary" : "",
                  ].join(" ")}
                >
                  {done && <Check className="h-3 w-3" />}
                  {c}
                </span>
                {i < crumbs.length - 1 && <span className="opacity-40">›</span>}
              </div>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
