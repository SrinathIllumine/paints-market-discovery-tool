import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FileDown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AsmLayout } from "@/components/asm/AsmLayout";
import { QuadrantTypeBadge } from "@/components/leadership/LeadershipLayout";
import { CLUSTERS } from "@/data/clusters";
import { ALL_ASM_AREA_IDS, getTerritoryClusterRows } from "@/lib/asmPerformance";
import { getClusterScoresForGeo, seededRandom } from "@/lib/clusterGenerator";
import { ASM_GEO } from "@/data/geography";
import { getCampIdeas, getContractorSuggestions, getCustomerGroups, getValuePropsForGroup } from "@/lib/strategyContent";
import { CONTRACTOR_ENABLERS, EVENT_ENABLERS, getClusterValueProps } from "@/lib/engagementContent";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/asm-analytics/plan/$clusterId")({
  head: ({ params }) => ({
    meta: [{ title: `Cluster Engagement Plan — ${params.clusterId} — ASM Analytics` }],
  }),
  component: AsmClusterEngagementPlanPage,
});

/** Groups whose share of the cluster is at-or-above average — the same "recommended by default" rule the Market Discovery System's own planning tool uses. */
function getRecommendedGroupIds(groups: { id: string; pct: number }[]): Set<string> {
  if (groups.length === 0) return new Set();
  const avg = groups.reduce((sum, g) => sum + g.pct, 0) / groups.length;
  return new Set(groups.filter((g) => g.pct >= avg).map((g) => g.id));
}

function AsmClusterEngagementPlanPage() {
  const { clusterId } = Route.useParams();
  const cluster = CLUSTERS.find((c) => c.id === clusterId);
  const scores = getClusterScoresForGeo(clusterId, ASM_GEO);
  const territoryRow = getTerritoryClusterRows(ALL_ASM_AREA_IDS).find((r) => r.clusterId === clusterId);

  const groups = getCustomerGroups(clusterId);
  const recommendedIds = getRecommendedGroupIds(groups);
  const focusGroups = groups.filter((g) => recommendedIds.has(g.id));

  const camps = getCampIdeas(clusterId);
  const starredCampId =
    camps.length > 0 ? camps[Math.floor(seededRandom(`${clusterId}|asm-plan|starred-camp`) * camps.length)].id : null;

  const contractors = getContractorSuggestions(clusterId);
  const contractorNames = contractors.map((c) => c.name).filter(Boolean).join(", ");

  if (!cluster) {
    return (
      <AsmLayout>
        <p className="text-sm text-muted-foreground">Cluster not found.</p>
      </AsmLayout>
    );
  }

  const handleDownload = () => {
    generateMonthlyEngagementPlanPdf({
      focusClusterId: clusterId,
      valueProps: getClusterValueProps(clusterId),
      customerGroups: focusGroups.map((g) => ({
        id: g.id,
        label: g.label,
        pct: g.pct,
        valueProps: getValuePropsForGroup(clusterId, g.id),
      })),
      camps: camps.map((c) => ({ id: c.id, label: c.label, starred: c.id === starredCampId })),
      contractors: contractors.map((c, i) => ({ ...c, starred: i === 0 })),
      retailers: [],
      stakeholders: [],
      campEnablers: Object.fromEntries(camps.map((c) => [c.id, EVENT_ENABLERS.map((e) => e.label)])),
      contractorEnablers: CONTRACTOR_ENABLERS.map((e) => e.label),
    });
  };

  return (
    <AsmLayout>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/asm-analytics/execution"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-navy hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> Back to execution
        </Link>
        <Button onClick={handleDownload} className="gap-2 bg-navy text-navy-foreground hover:bg-navy/90">
          <FileDown className="h-4 w-4" /> Download PDF
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Cluster Engagement Plan
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold text-foreground">{cluster.name}</h1>
          </div>
          <QuadrantTypeBadge quadrant={scores.quadrant} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-4">
          <Stat label="Targeting DGs" value={territoryRow?.dgNames.join(", ") || "None this month"} />
          <Stat label="Engagement Plans" value={String(territoryRow?.plans ?? 0)} />
          <Stat label="Executed" value={String(territoryRow?.executed ?? 0)} />
          <Stat
            label="Status"
            value={territoryRow?.onTrack ? "On Track" : "Behind"}
            tone={territoryRow?.onTrack ? "text-emerald-700" : "text-critical"}
          />
        </div>
      </div>

      {focusGroups.length > 0 && (
        <div className="mb-6 rounded-2xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-5 py-3">
            <h2 className="font-display text-base font-bold text-foreground">
              Customer groups and their value propositions
            </h2>
          </div>
          <div className="divide-y divide-border">
            {focusGroups.map((g) => (
              <div key={g.id} className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <p className="font-display text-sm font-semibold text-foreground">{g.label}</p>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {g.pct}%
                  </span>
                </div>
                <ul className="mt-2 space-y-1.5">
                  {getValuePropsForGroup(clusterId, g.id).map((p, i) => (
                    <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                      <span className="mt-0.5 shrink-0 text-navy">•</span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border px-5 py-3">
          <h2 className="font-display text-base font-bold text-foreground">Action plan</h2>
        </div>
        <div className="divide-y divide-border">
          <div className="px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Events & camps
            </p>
            <div className="space-y-2">
              {camps.map((c) => (
                <div key={c.id} className="flex items-start gap-2.5 rounded-xl border border-border px-3 py-2.5">
                  <Star
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      c.id === starredCampId ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                    )}
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{c.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="px-5 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Contractors to convert
            </p>
            <div className="flex items-start gap-2.5 rounded-xl border border-border px-3 py-2.5">
              <Star className="mt-0.5 h-4 w-4 shrink-0 fill-amber-400 text-amber-400" />
              <div>
                <p className="text-sm font-medium text-foreground">Contractors to convert</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{contractorNames || "None identified yet"}</p>
              </div>
            </div>
          </div>
        </div>
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Priority items (starred) are the focus for this quarter.
        </p>
      </div>
    </AsmLayout>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("mt-0.5 text-sm font-semibold", tone ?? "text-foreground")}>{value}</p>
    </div>
  );
}
