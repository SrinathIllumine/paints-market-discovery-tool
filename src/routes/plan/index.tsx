import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import {
  getCluster,
  POTENTIAL_LABEL,
  prospectSingular,
  PANVEL_CENTER,
} from "@/data/clusters";
import { useAppStore, type ConnectApproach, type TriState } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronRight, FileDown, Loader2, Settings2 } from "lucide-react";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { PANVEL_BOUNDARY } from "@/data/panvelBoundary";
import { groupIntoRegions } from "@/lib/regions";
import { useServerFn } from "@tanstack/react-start";
import { searchPlacesForCluster } from "@/lib/places.functions";
import type { Prospect } from "@/store/appStore";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";

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

const APPROACH_OPTIONS: { key: ConnectApproach; label: string }[] = [
  { key: "L1", label: "L1: I have natural connects (direct contacts)" },
  { key: "L2", label: "L2: Partner-led" },
  { key: "L3", label: "L3: I need to do cold-calling" },
  { key: "L4", label: "L4: I can do promotions and campaigns" },
];

const TRI_OPTIONS: { key: TriState; label: string }[] = [
  { key: "Y", label: "Yes" },
  { key: "N", label: "No" },
  { key: "DK", label: "Don't know" },
];

function PlanScreen() {
  const shortlisted = useAppStore((s) => s.plan.targetClusterIds);
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const toggleFocus = useAppStore((s) => s.toggleMonthlyFocus);
  const prospectAnswers = useAppStore((s) => s.plan.prospectAnswers);
  const setProspectAnswer = useAppStore((s) => s.setProspectAnswer);
  const clustersState = useAppStore((s) => s.clusters);
  const stakeholders = useAppStore((s) => s.stakeholders);
  const setProspects = useAppStore((s) => s.setProspects);

  const [openClusterId, setOpenClusterId] = useState<string>("");
  const [openProspectId, setOpenProspectId] = useState<string>("");
  const [loadingClusterId, setLoadingClusterId] = useState<string>("");
  const callPlaces = useServerFn(searchPlacesForCluster);

  // Auto-load prospects when a cluster is expanded if not already loaded.
  useEffect(() => {
    if (!openClusterId) return;
    const c = getCluster(openClusterId);
    if (!c) return;
    const cs = clustersState[openClusterId];
    if (cs && cs.prospects.length > 0) return;
    setLoadingClusterId(openClusterId);
    callPlaces({
      data: {
        textQuery: c.placesQuery,
        lat: PANVEL_CENTER.lat,
        lng: PANVEL_CENTER.lng,
        radiusMeters: 25000,
      },
    })
      .then((res) => {
        const mapped: Prospect[] = res.places.map((p) => ({
          id: p.id,
          name: p.name,
          lat: p.lat,
          lng: p.lng,
          placeId: p.id,
          locality: p.formattedAddress,
          source: "places",
        }));
        setProspects(openClusterId, mapped);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoadingClusterId(""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openClusterId]);

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
            You haven't shortlisted any clusters yet. Go to the{" "}
            <Link to="/map" className="font-semibold text-critical underline">
              Market Map
            </Link>{" "}
            and shortlist clusters first.
          </div>
        ) : (
          <Accordion
            type="multiple"
            defaultValue={["focus", "approach"]}
            className="space-y-3"
          >
            {/* Card 1: Focus clusters */}
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
                  Pick from the clusters you've shortlisted on your market map.
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

            {/* Card 2: Decide your connect approach */}
            <AccordionItem
              value="approach"
              className="overflow-hidden rounded-2xl border border-border bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <span className="text-left font-display text-lg leading-tight">
                  2. Decide your connect approach
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {focusClusters.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Pick focus clusters above first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {focusClusters.map((c) => {
                      const isOpen = openClusterId === c.id;
                      const cs = clustersState[c.id];
                      const prospects = cs?.prospects ?? [];
                      const regions = groupIntoRegions(prospects);
                      const isLoading = loadingClusterId === c.id;
                      const singular = prospectSingular(c.id);

                      return (
                        <div
                          key={c.id}
                          className="overflow-hidden rounded-2xl border border-border bg-card"
                        >
                          <button
                            onClick={() => {
                              setOpenClusterId(isOpen ? "" : c.id);
                              setOpenProspectId("");
                            }}
                            className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
                          >
                            <div className="min-w-0">
                              <p className="font-display text-base leading-tight">
                                {c.name}
                              </p>
                              <p className="mt-0.5 text-[11px] text-muted-foreground">
                                {prospects.length} {singular.toLowerCase()}
                                {prospects.length === 1 ? "" : "s"} identified
                              </p>
                            </div>
                            <ChevronDown
                              className={cn(
                                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                                isOpen && "rotate-180",
                              )}
                            />
                          </button>

                          {isOpen && (
                            <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                              <div className="relative h-56 w-full overflow-hidden rounded-2xl border border-border">
                                <GoogleMap
                                  prospects={prospects}
                                  selectedIds={prospects.map((p) => p.id)}
                                  onToggle={() => {}}
                                  pickingPin={false}
                                  readOnly
                                  regions={regions}
                                  boundary={PANVEL_BOUNDARY}
                                />
                                {isLoading && (
                                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60">
                                    <Loader2 className="h-5 w-5 animate-spin text-navy" />
                                  </div>
                                )}
                              </div>

                              {prospects.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                  {isLoading
                                    ? "Loading prospects…"
                                    : "No prospects yet."}
                                </p>
                              ) : (
                                <div className="space-y-3">
                                  {/* Column headers */}
                                  <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                    <span>{singular}</span>
                                    <span>Decide your connect approach</span>
                                  </div>

                                  {regions.map((r) => (
                                    <div key={r.id} className="space-y-1.5">
                                      <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                                        <span
                                          className="h-2.5 w-2.5 rounded-full"
                                          style={{ backgroundColor: r.color }}
                                        />
                                        {r.label}
                                      </div>
                                      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                                        {r.prospects.map((p) => {
                                          const ans =
                                            prospectAnswers?.[c.id]?.[p.id];
                                          const expanded =
                                            openProspectId === p.id;
                                          return (
                                            <li key={p.id}>
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  setOpenProspectId(
                                                    expanded ? "" : p.id,
                                                  )
                                                }
                                                className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left"
                                              >
                                                <div className="min-w-0">
                                                  <p className="truncate text-sm font-medium">
                                                    {p.name}
                                                  </p>
                                                  {ans?.approach && (
                                                    <p className="mt-0.5 text-[11px] text-critical">
                                                      {ans.approach} selected
                                                    </p>
                                                  )}
                                                </div>
                                                <span
                                                  className={cn(
                                                    "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
                                                    expanded
                                                      ? "border-critical bg-critical text-critical-foreground"
                                                      : "border-border bg-muted/40 text-muted-foreground",
                                                  )}
                                                  aria-label="Decide approach"
                                                >
                                                  {expanded ? (
                                                    <ChevronDown className="h-4 w-4" />
                                                  ) : (
                                                    <Settings2 className="h-4 w-4" />
                                                  )}
                                                </span>
                                              </button>
                                              {expanded && (
                                                <div className="space-y-4 border-t border-border bg-muted/30 px-3 py-3">
                                                  <ProspectQuestion
                                                    label="Decide your connect approach"
                                                    options={APPROACH_OPTIONS}
                                                    value={ans?.approach ?? null}
                                                    onChange={(v) =>
                                                      setProspectAnswer(
                                                        c.id,
                                                        p.id,
                                                        { approach: v },
                                                      )
                                                    }
                                                  />
                                                  <ProspectQuestion
                                                    label={`Is there an immediate need for the ${singular.toLowerCase()} for repainting work?`}
                                                    options={TRI_OPTIONS}
                                                    value={
                                                      ans?.immediateNeed ?? null
                                                    }
                                                    onChange={(v) =>
                                                      setProspectAnswer(
                                                        c.id,
                                                        p.id,
                                                        { immediateNeed: v },
                                                      )
                                                    }
                                                  />
                                                  <ProspectQuestion
                                                    label="Are they using JK's solutions?"
                                                    options={TRI_OPTIONS}
                                                    value={ans?.usingJk ?? null}
                                                    onChange={(v) =>
                                                      setProspectAnswer(
                                                        c.id,
                                                        p.id,
                                                        { usingJk: v },
                                                      )
                                                    }
                                                  />
                                                </div>
                                              )}
                                            </li>
                                          );
                                        })}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              )}
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
              prospectsByCluster: Object.fromEntries(
                focusIds.map((id) => [id, clustersState[id]?.prospects ?? []]),
              ),
              prospectAnswers: prospectAnswers ?? {},
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

function ProspectQuestion<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {options.map((o) => {
          const active = value === o.key;
          return (
            <label
              key={o.key}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                active
                  ? "border-critical bg-critical/5"
                  : "border-border bg-card",
              )}
            >
              <input
                type="radio"
                checked={active}
                onChange={() => onChange(o.key)}
                className="mt-0.5 h-4 w-4 accent-critical"
              />
              <span className="leading-snug">{o.label}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

// keep unused import out of the way
void ChevronRight;
