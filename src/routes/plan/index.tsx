import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import { useAppStore, type Pathways } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { FileDown, Sparkles } from "lucide-react";
import {
  generateMonthlyEngagementPlanPdf,
  prioritizePathways,
} from "@/lib/monthlyPlanReport";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/plan/")({
  head: () => ({
    meta: [
      { title: "Monthly Market Engagement Plan" },
      {
        name: "description",
        content: "Plan your monthly engagement across shortlisted clusters.",
      },
    ],
  }),
  component: PlanScreen,
});

const PATHWAYS: { key: keyof Pathways; label: string }[] = [
  { key: "L1", label: "L1: Do you have any connects — contractors / painters, etc.?" },
  { key: "L2", label: "L2: Do you want to do collective events / contribution events?" },
  { key: "L3", label: "L3: Do you want to do cold calling?" },
  { key: "L4", label: "L4: Do you want to do promotional activities (brochures, e-mails)?" },
];

function PlanScreen() {
  const shortlisted = useAppStore((s) => s.plan.targetClusterIds);
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const valueProps = useAppStore((s) => s.plan.valueProps);
  const pathways = useAppStore((s) => s.plan.pathways);
  const stakeholders = useAppStore((s) => s.stakeholders);

  const toggleFocus = useAppStore((s) => s.toggleMonthlyFocus);
  const setValueProp = useAppStore((s) => s.setValueProp);
  const setPathway = useAppStore((s) => s.setPathway);

  const focusClusters = focusIds
    .map((id) => getCluster(id))
    .filter((c): c is NonNullable<ReturnType<typeof getCluster>> => Boolean(c));

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 3 of 3"
          title="Create Monthly Market Engagement Plan"
          subtitle="June 2026"
        />
      }
    >
      <div className="px-5 py-5">
        {shortlisted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            You haven’t shortlisted any clusters yet. Go to the{" "}
            <Link to="/map" className="font-semibold text-critical underline">
              Market Map
            </Link>{" "}
            and shortlist clusters first.
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={["focus", "vp", "pathways"]} className="space-y-3">
            {/* Q1: Focus clusters */}
            <AccordionItem
              value="focus"
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex w-full items-center justify-between pr-2">
                  <span className="text-left font-display text-lg leading-tight">
                    1. Which cluster would you like to focus on this month?
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {focusIds.length} / {shortlisted.length}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <p className="mb-2 text-xs text-muted-foreground">
                  Pick from the clusters you’ve shortlisted on your market map.
                </p>
                <div className="space-y-2">
                  {shortlisted.map((id) => {
                    const c = getCluster(id);
                    if (!c) return null;
                    const active = focusIds.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleFocus(id)}
                        className={cn(
                          "flex w-full items-start justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                          active
                            ? "border-critical bg-critical/5"
                            : "border-border bg-card hover:bg-muted/40",
                        )}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-medium">{c.name}</p>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {POTENTIAL_LABEL[c.potential]} potential
                          </p>
                        </div>
                        <div
                          className={cn(
                            "mt-1 h-5 w-5 shrink-0 rounded-md border-2",
                            active ? "border-critical bg-critical" : "border-border",
                          )}
                        />
                      </button>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Q2: Value proposition */}
            <AccordionItem
              value="vp"
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-left font-display text-lg leading-tight">
                  2. Define your value proposition for each cluster
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {focusClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Pick focus clusters above first.</p>
                ) : (
                  <div className="space-y-3">
                    {focusClusters.map((c) => (
                      <div key={c.id} className="space-y-1.5">
                        <p className="text-sm font-medium">{c.name}</p>
                        <Textarea
                          value={valueProps[c.id] ?? ""}
                          onChange={(e) => setValueProp(c.id, e.target.value)}
                          placeholder="What is the most compelling reason for this cluster to choose JK?"
                          className="min-h-[72px] text-sm"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Q3: Pathways */}
            <AccordionItem
              value="pathways"
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-left font-display text-lg leading-tight">
                  3. Which connect models will you use for each cluster?
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {focusClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Pick focus clusters above first.</p>
                ) : (
                  <div className="space-y-4">
                    {focusClusters.map((c) => {
                      const pw = pathways[c.id] ?? {
                        L1: false,
                        L2: false,
                        L3: false,
                        L4: false,
                      };
                      const ranked = prioritizePathways(
                        pw,
                        stakeholders[c.id]?.length ?? 0,
                      );
                      return (
                        <div
                          key={c.id}
                          className="rounded-2xl border border-border bg-card p-3"
                        >
                          <p className="font-medium">{c.name}</p>
                          <div className="mt-2 space-y-1.5">
                            {PATHWAYS.map(({ key, label }) => {
                              const checked = pw[key];
                              return (
                                <label
                                  key={key}
                                  className={cn(
                                    "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                                    checked
                                      ? "border-critical bg-critical/5"
                                      : "border-border bg-card",
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={(e) =>
                                      setPathway(c.id, key, e.target.checked)
                                    }
                                    className="mt-0.5 h-4 w-4 accent-critical"
                                  />
                                  <span className="leading-snug">{label}</span>
                                </label>
                              );
                            })}
                          </div>
                          {ranked.length > 0 && (
                            <div className="mt-3 rounded-xl border border-dashed border-border bg-muted/30 p-3">
                              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-critical">
                                <Sparkles className="h-3 w-3" /> Suggested priority
                              </div>
                              <ol className="space-y-1.5 text-xs">
                                {ranked.map((r) => (
                                  <li key={r.key} className="flex gap-2">
                                    <span className="font-semibold text-foreground">
                                      P{r.priority}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="font-medium text-foreground">{r.label}</p>
                                      <p className="text-muted-foreground">{r.rationale}</p>
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Button
          disabled={focusIds.length === 0}
          onClick={() =>
            generateMonthlyEngagementPlanPdf({
              focusClusterIds: focusIds,
              valueProps,
              pathways,
              stakeholders,
            })
          }
          className="mt-5 h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90 disabled:opacity-60"
        >
          <FileDown className="h-4 w-4" /> Generate Monthly Market Engagement Plan
        </Button>
      </div>
    </AppShell>
  );
}
