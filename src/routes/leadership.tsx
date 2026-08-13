import { createFileRoute, Link } from "@tanstack/react-router";
import { LeadershipLayout } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leadership")({
  head: () => ({
    meta: [
      { title: "Priority Matrix — Leadership Analytics" },
      { name: "description", content: "Potential vs access across all market clusters." },
    ],
  }),
  component: PriorityMatrixPage,
});

type QuadrantKey = "HH" | "HL" | "LH" | "LL";

const QUADRANTS: Record<QuadrantKey, { title: string; desc: string; tone: string }> = {
  HH: {
    title: "High Potential – High Access",
    desc: "High revenue potential and strong DG access. Focus here first to gain market share.",
    tone: "border-emerald-200 bg-emerald-50",
  },
  HL: {
    title: "High Potential – Low Access",
    desc: "High revenue potential but DGs lack strong connects. Building access unlocks future opportunity.",
    tone: "border-amber-200 bg-amber-50",
  },
  LH: {
    title: "Low Potential – High Access",
    desc: "Easy to approach but limited revenue upside. Engage selectively to keep the pipeline active.",
    tone: "border-sky-200 bg-sky-50",
  },
  LL: {
    title: "Low Potential – Low Access",
    desc: "Low returns and hard to penetrate. Redirect DG effort to higher potential clusters.",
    tone: "border-muted bg-muted/40",
  },
};

function PriorityMatrixPage() {
  const grouped: Record<QuadrantKey, { id: string; name: string }[]> = { HH: [], HL: [], LH: [], LL: [] };

  for (const c of CLUSTERS) {
    const intel = getClusterIntel(c.id, c.prospectCountEstimate);
    const potential = intel.revenueHML === "H" || intel.competitiveHML === "H" ? "H" : "L";
    const access = intel.accessHML === "H" || intel.easeHML === "H" ? "H" : "L";
    const key = `${potential}${access}` as QuadrantKey;
    grouped[key].push({ id: c.id, name: c.name });
  }

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Potential vs Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Each cluster is placed by its revenue potential and how easily DGs can access it.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {(Object.keys(QUADRANTS) as QuadrantKey[]).map((key) => {
          const q = QUADRANTS[key];
          const clusters = grouped[key];
          return (
            <div key={key} className={cn("rounded-2xl border p-4", q.tone)}>
              <h2 className="font-display text-base font-bold text-foreground">{q.title}</h2>
              <p className="mt-1 text-xs text-muted-foreground">{q.desc}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {clusters.map((c) => (
                  <Link
                    key={c.id}
                    to="/plan/$clusterId"
                    params={{ clusterId: c.id }}
                    className="rounded-full border border-border bg-card px-2.5 py-1 text-xs font-medium text-foreground hover:border-critical hover:text-critical"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </LeadershipLayout>
  );
}
