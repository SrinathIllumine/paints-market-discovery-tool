import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { AddProspectSheet } from "@/components/maps/AddProspectSheet";
import { CLUSTERS, getCluster, prospectPlural } from "@/data/clusters";
import { PANVEL_CENTER } from "@/data/clusters";
import { PANVEL_BOUNDARY } from "@/data/panvelBoundary";
import { QuadrantSnapshot } from "@/components/app/QuadrantSnapshot";
import { groupIntoRegions } from "@/lib/regions";
import { useAppStore, type Prospect } from "@/store/appStore";
import { searchPlacesForCluster } from "@/lib/places.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Loader2, MapPin, Home, FileDown } from "lucide-react";
import { generateClusterReportPdf } from "@/lib/clusterReport";
import {
  computeClusterScores,
  getRevenueProfile,
  formatRupees,
  getClusterIntel,
  getCompetitiveInsights,
  getEaseInsights,
  getRepaintingCycleYears,
  highlightBrands,
  scoreRevenue,
  scoreToHML,
  HML_LABEL,
  scoreFromHML,
  type HML,
  type YesNo,
} from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/map/$clusterId")({
  component: ClusterDetailScreen,
  errorComponent: ({ error, reset }) => (
    <AppShell bottom={<BottomNav />}>
      <div className="space-y-3 p-6 text-center">
        <p className="font-display text-xl">Something went wrong loading this cluster.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} className="bg-navy text-navy-foreground hover:bg-navy/90">
          Retry
        </Button>
      </div>
    </AppShell>
  ),
});

type Tab = "prospects" | "mapping" | "snapshot";

const TABS: { id: Tab; label: string }[] = [
  { id: "prospects", label: "Prospects by region" },
  { id: "mapping", label: "Cluster Potential Mapping" },
  { id: "snapshot", label: "Cluster Snapshot" },
];

function ClusterDetailScreen() {
  const navigate = useNavigate();
  const { clusterId } = Route.useParams();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);

  const [activeTab, setActiveTab] = useState<Tab>("prospects");

  const tabTopRef = useRef<HTMLDivElement>(null);

  const goToTab = (tab: Tab) => {
    setActiveTab(tab);
    requestAnimationFrame(() => {
      let el = tabTopRef.current?.parentElement;
      while (el) {
        const { overflowY } = getComputedStyle(el);
        if (el.scrollHeight > el.clientHeight && overflowY !== "visible") {
          el.scrollTop = 0;
          break;
        }
        el = el.parentElement;
      }
    });
  };

  const state = useAppStore((s) => s.clusters[clusterId]);
  const ensureCluster = useAppStore((s) => s.ensureCluster);
  const markVisited = useAppStore((s) => s.markVisited);
  const setProspects = useAppStore((s) => s.setProspects);
  const addProspect = useAppStore((s) => s.addProspect);
  const existingAssessment = useAppStore((s) => s.assessments[clusterId]);
  const setAssessment = useAppStore((s) => s.setAssessment);
  const unlockStage = useAppStore((s) => s.unlockStage);

  const [accessAnswers, setAccessAnswers] = useState<("Y" | "N" | null)[]>(() => {
    const saved = existingAssessment?.accessAnswers3;
    if (saved && saved.length === 3) {
      return saved.map((v) => v ?? null) as ("Y" | "N" | null)[];
    }
    return [null, null, null];
  });

  const callPlaces = useServerFn(searchPlacesForCluster);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickingPin, setPickingPin] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    ensureCluster(clusterId);
    markVisited(clusterId);
    if (!existingAssessment) setAssessment(clusterId, { completedAt: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterId]);

  const hasProspects = (state?.prospects.length ?? 0) > 0;
  useEffect(() => {
    if (!cluster) return;
    if (hasProspects) return;
    if (loading) return;

    const GRID = 4;
    const STEP = 0.045;
    const RADIUS_M = 6000;
    const centers: Array<{ lat: number; lng: number }> = [];
    const offset = (GRID - 1) / 2;
    for (let i = 0; i < GRID; i++) {
      for (let j = 0; j < GRID; j++) {
        centers.push({
          lat: PANVEL_CENTER.lat + (i - offset) * STEP,
          lng: PANVEL_CENTER.lng + (j - offset) * STEP,
        });
      }
    }

    setLoading(true);
    Promise.all(
      centers.map((c) =>
        callPlaces({
          data: {
            textQuery: cluster.placesQuery,
            lat: c.lat,
            lng: c.lng,
            radiusMeters: RADIUS_M,
          },
        }).catch((e) => {
          console.error("Places sub-region failed", c, e);
          return { places: [] as Awaited<ReturnType<typeof callPlaces>>["places"] };
        }),
      ),
    )
      .then((results) => {
        const seen = new Set<string>();
        const mapped: Prospect[] = [];
        for (const res of results) {
          for (const p of res.places) {
            if (seen.has(p.id)) continue;
            seen.add(p.id);
            mapped.push({
              id: p.id,
              name: p.name,
              lat: p.lat,
              lng: p.lng,
              placeId: p.id,
              locality: p.formattedAddress,
              source: "places",
            });
          }
        }
        setProspects(clusterId, mapped);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster?.id, hasProspects]);

  const prospects = state?.prospects ?? [];
  const regions = useMemo(() => groupIntoRegions(prospects), [prospects]);
  const selectedAllIds = useMemo(() => prospects.map((p) => p.id), [prospects]);
  const profile = getRevenueProfile(clusterId);

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

  const pluralCap = prospectPlural(clusterId);
  const intel = getClusterIntel(clusterId, prospects.length);
  const observedCount = intel.totalProspectsObserved || prospects.length || cluster.prospectCountEstimate;
  const totalRevenue = profile.avgRevenuePerProspect * observedCount;
  const singular = pluralCap.toLowerCase().replace(/s$/, "");
  const cycleYears = getRepaintingCycleYears(clusterId);
  const annualRevenue = totalRevenue / cycleYears;
  const annualRevenuePerProspect = profile.avgRevenuePerProspect / cycleYears;
  const dynamicRevenueHML: HML = scoreToHML(scoreRevenue(annualRevenuePerProspect));

  const accessYesCount = accessAnswers.filter((a) => a === "Y").length;
  const accessScore = Math.round(accessYesCount * 3.33 * 10) / 10;
  const allAnswered = accessAnswers.every((a) => a !== null);
  const dynamicAccessHML: HML | null = allAnswered ? scoreToHML(accessScore) : null;

  const userAccessScore = allAnswered ? accessScore : undefined;
  const scores = computeClusterScores(cluster, prospects.length, existingAssessment, userAccessScore);

  const handleAccessAnswers = (next: ("Y" | "N" | null)[]) => {
    setAccessAnswers(next);
    setAssessment(clusterId, {
      ...(existingAssessment ?? { completedAt: Date.now() }),
      accessAnswers3: next.map((v) => v ?? undefined) as (YesNo | undefined)[],
      completedAt: Date.now(),
    });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="STAGE 1 OF 3 · MAP MY MARKET POTENTIAL"
          title={cluster.name}
          subtitle={`${cluster.nature} — ${cluster.description}`}
          backTo="/map"
        />
      }
    >
      <div className="flex min-h-full flex-col">
        {/* Tab bar */}
        <div className="sticky top-0 z-50 flex shrink-0 bg-red-600">
          {TABS.map((t) => (
            <button
              key={t.id}
              data-tour={`cluster-tab-${t.id}`}
              onClick={() => goToTab(t.id)}
              className={cn(
                "flex-1 border-b-2 px-2 py-2.5 text-center text-[13px] font-medium leading-tight transition-colors",
                activeTab === t.id
                  ? "border-b-2 border-white bg-white/10 text-white"
                  : "border-b-2 border-transparent text-white/80",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div ref={tabTopRef} />

        <div className="pb-8">
          {/* TAB 1: Prospects by region */}
          {activeTab === "prospects" && (
            <div className="space-y-5 px-6 py-6">
              <div className="space-y-0.5">
                <h2 className="font-display text-2xl">View prospects by region</h2>
              </div>
              <section data-tour="cluster-geo-view" className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="font-display text-xl">Geo View</h2>
                  <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)} className="h-8 gap-1 text-xs">
                    <Plus className="h-3.5 w-3.5" /> Add prospect
                  </Button>
                </div>
                <div className="relative h-64 w-full overflow-hidden rounded-2xl border border-border">
                  <GoogleMap
                    prospects={prospects}
                    selectedIds={selectedAllIds}
                    onToggle={() => {}}
                    readOnly
                    pickingPin={pickingPin}
                    onPinDropped={(ll) => {
                      setPendingLatLng(ll);
                      setPickingPin(false);
                      setSheetOpen(true);
                    }}
                    regions={regions}
                    boundary={PANVEL_BOUNDARY}
                  />
                  {loading && (
                    <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/60">
                      <Loader2 className="h-5 w-5 animate-spin text-navy" />
                    </div>
                  )}
                  {pickingPin && (
                    <div className="pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-critical px-3 py-1 text-[11px] font-semibold text-critical-foreground shadow">
                      Tap on the map to drop a pin
                    </div>
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  <MapPin className="mr-1 inline h-3 w-3" />
                  {prospects.length} prospects on map · all included by default
                </p>
              </section>

              <section data-tour="cluster-prospects-region" className="space-y-3">
                <h2 className="font-display text-xl">Prospects by region</h2>
                {prospects.length === 0 ? (
                  <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
                    {loading ? "Loading prospects…" : "No prospects identified yet."}
                  </div>
                ) : (
                  <Accordion type="multiple" defaultValue={[]} className="space-y-2">
                    {regions.map((r) => (
                      <AccordionItem
                        key={r.id}
                        value={r.id}
                        className="overflow-hidden rounded-2xl border border-border bg-card"
                      >
                        <AccordionTrigger className="px-4 py-3 hover:no-underline">
                          <div className="flex w-full items-center justify-between gap-3 pr-2">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: r.color }} />
                              <span className="font-display text-base leading-tight">{r.label}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {r.prospects.length} prospect{r.prospects.length === 1 ? "" : "s"}
                            </span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="px-4 pb-3">
                          <ul className="divide-y divide-border">
                            {r.prospects.map((p) => (
                              <li key={p.id} className="py-2.5">
                                <p className="truncate text-sm font-medium">{p.name}</p>
                                {p.locality && <p className="truncate text-xs text-muted-foreground">{p.locality}</p>}
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </section>

              <Button
                data-tour="cluster-calc-button"
                onClick={() => goToTab("mapping")}
                size="lg"
                className="w-full gap-2 bg-navy text-navy-foreground hover:bg-navy/90"
              >
                Map your cluster potential
              </Button>
            </div>
          )}

          {/* TAB 2: Cluster Potential Mapping */}
          {activeTab === "mapping" && (
            <div className="space-y-3 px-6 py-6">
              <div className="space-y-0.5">
                <h2 className="font-display text-2xl">Map your cluster potential</h2>
              </div>
              <Accordion
                data-tour="cluster-mapping-cards"
                type="multiple"
                defaultValue={["revenue", "competitive", "access", "ease"]}
                className="space-y-2"
              >
                <CollapsibleSub value="revenue" title="Explore the Revenue Potential" hml={dynamicRevenueHML}>
                  <ul className="space-y-2 text-sm leading-relaxed">
                    <Bullet>
                      There are{" "}
                      <b>
                        {observedCount} {pluralCap.toLowerCase()}
                      </b>{" "}
                      present in this cluster.
                    </Bullet>
                    <Bullet>
                      The national avg. revenue per society is{" "}
                      <b>₹18 L</b>.
                    </Bullet>
                    <Bullet>
                      Repainting cycle time for societies is{" "}
                      <b>
                        {cycleYears} yr{cycleYears === 1 ? "" : "s"}
                      </b>
                      .
                    </Bullet>
                    <Bullet>
                      Total annual cluster revenue potential is{" "}
                      <b className="text-critical">{formatRupees(annualRevenue)}</b>.
                    </Bullet>
                  </ul>
                </CollapsibleSub>

                <CollapsibleSub value="competitive" title="View the Competitive Strength" hml={intel.competitiveHML}>
                  <ul className="space-y-2 text-sm leading-relaxed">
                    {getCompetitiveInsights(clusterId)
                      .slice(0, 2)
                      .map((line, i) => (
                        <Bullet key={i}>{highlightBrands(line)}</Bullet>
                      ))}
                  </ul>
                </CollapsibleSub>

                <CollapsibleSub
                  value="access"
                  title="Share Your Access Level in this Cluster"
                  hml={dynamicAccessHML ?? intel.accessHML}
                >
                  <AccessQuestions
                    pluralLower={pluralCap.toLowerCase()}
                    singular={singular}
                    answers={accessAnswers}
                    onChange={handleAccessAnswers}
                    score={accessScore}
                    allAnswered={allAnswered}
                  />
                </CollapsibleSub>

                <CollapsibleSub value="ease" title="View Ease of Sale in this Cluster" hml={intel.easeHML}>
                  <ul className="space-y-2 text-sm leading-relaxed">
                    {getEaseInsights(clusterId).map((line, i) => (
                      <Bullet key={i}>{line}</Bullet>
                    ))}
                  </ul>
                </CollapsibleSub>
              </Accordion>

              <Button
                data-tour="cluster-generate-snapshot"
                onClick={() => goToTab("snapshot")}
                size="lg"
                className="w-full gap-2 bg-navy text-navy-foreground hover:bg-navy/90"
              >
                Generate the Cluster Snapshot for this Cluster
              </Button>
            </div>
          )}

          {/* TAB 3: Cluster Snapshot */}
          {activeTab === "snapshot" && (
            <div className="space-y-4 px-6 py-6">
              <div className="space-y-0.5">
                <h2 className="font-display text-2xl">Cluster snapshot</h2>
              </div>

              {/* Strategic insights — above chart */}
              {allAnswered && (
                <StrategicInsights
                  clusterName={cluster.name}
                  potentialScore={scores.potentialScore}
                  accessRollupScore={scores.accessRollupScore}
                />
              )}

              {/* Chart */}
              <div
                data-tour="cluster-snapshot-graph"
                className="rounded-2xl border border-border bg-card p-4 shadow-sm"
              >
                <QuadrantSnapshot mode="single" highlightId={cluster.id} isStageComplete={allAnswered} />
              </div>

              {allAnswered && (
                <div className="flex flex-col gap-2">
                  <Button
                    onClick={() =>
                      generateClusterReportPdf({
                        clusterId,
                        prospects,
                        accessHML: dynamicAccessHML ?? intel.accessHML,
                        potentialScore: scores.potentialScore,
                        accessRollupScore: scores.accessRollupScore,
                      })
                    }
                    size="lg"
                    variant="outline"
                    className="w-full gap-2 border-navy text-navy hover:bg-navy/5"
                  >
                    <FileDown className="h-4 w-4" />
                    Generate cluster report
                  </Button>
                  <Button
                    data-tour="cluster-next-stage"
                    onClick={() => {
                      unlockStage(2);
                      navigate({ to: "/" });
                    }}
                    size="lg"
                    className="w-full gap-2 bg-critical text-critical-foreground hover:bg-critical/90"
                  >
                    <Home className="h-4 w-4" />
                    Go to the next stage
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <AddProspectSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStartPinPick={() => setPickingPin(true)}
        pendingLatLng={pendingLatLng}
        onClearPending={() => setPendingLatLng(null)}
        onSubmit={({ name, locality, lat, lng }) => {
          addProspect(clusterId, {
            id: `manual-${Date.now()}`,
            name,
            locality,
            lat,
            lng,
            source: "manual",
          });
        }}
      />
    </AppShell>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function CollapsibleSub({
  value,
  title,
  hml,
  children,
}: {
  value: string;
  title: string;
  hml: HML | null;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={value} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex w-full items-center justify-between gap-3 pr-2">
          <span className="font-display text-lg leading-tight">{title}</span>
          <HMLBadge hml={hml} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 pt-1">{children}</AccordionContent>
    </AccordionItem>
  );
}

function HMLBadge({ hml, small }: { hml: HML | null; small?: boolean }) {
  if (!hml) return null;
  const cls =
    hml === "H"
      ? "bg-green-100 text-green-800 border-green-300"
      : hml === "M"
        ? "bg-orange-100 text-orange-800 border-orange-300"
        : "bg-red-100 text-red-800 border-red-300";
  return (
    <span
      className={cn(
        "shrink-0 rounded-full border font-semibold uppercase tracking-wider",
        small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[10px]",
        cls,
      )}
    >
      {HML_LABEL[hml]}
    </span>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-0.5 text-critical">•</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function ScoreTile({ label, score }: { label: string; score: number }) {
  const hi = score >= 6;
  const cls = hi ? "border-green-300 bg-green-50 text-green-800" : "border-red-300 bg-red-50 text-red-800";
  return (
    <div className={cn("rounded-xl border p-2 text-center", cls)}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-base leading-tight">
        <span className="font-bold">{score}</span>
        <span className="text-xs opacity-70">/10</span>
      </p>
    </div>
  );
}

function AccessQuestions({
  pluralLower,
  singular,
  answers,
  onChange,
  score,
  allAnswered,
}: {
  pluralLower: string;
  singular: string;
  answers: ("Y" | "N" | null)[];
  onChange: (next: ("Y" | "N" | null)[]) => void;
  score: number;
  allAnswered: boolean;
}) {
  const questions = [
    `Are some of the leading ${pluralLower} in your area already your customers?`,
    `Do you have access to contractors in this cluster who are also loyal to JK?`,
    `Do you have any touchpoints who can connect you to the decision-makers in ${pluralLower}?`,
  ];
  const set = (i: number, v: "Y" | "N") => {
    const next = [...answers];
    next[i] = v;
    onChange(next);
  };
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {questions.map((q, i) => (
          <li key={i} className="rounded-xl border border-border bg-background/40 p-3">
            <p className="mb-2 text-sm leading-snug">{q}</p>
            <div className="flex gap-2">
              {(["Y", "N"] as const).map((v) => {
                const active = answers[i] === v;
                return (
                  <button
                    key={v}
                    type="button"
                    onClick={() => set(i, v)}
                    className={cn(
                      "flex-1 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? v === "Y"
                          ? "border-green-400 bg-green-100 text-green-800"
                          : "border-red-400 bg-red-100 text-red-800"
                        : "border-border bg-card text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {v === "Y" ? "Yes" : "No"}
                  </button>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <div>{allAnswered ? <p>&nbsp;</p> : <p className="text-muted-foreground">Answer all the questions</p>}</div>
    </div>
  );
}

// ── Strategic Insights ─────────────────────────────────────────────────────────

function StrategicInsights({
  clusterName,
  potentialScore,
  accessRollupScore,
}: {
  clusterName: string;
  potentialScore: number;
  accessRollupScore: number;
}) {
  const highPotential = potentialScore >= 5;
  const highAccess = accessRollupScore >= 5;

  const label =
    highPotential && highAccess
      ? "High Potential · High Access"
      : highPotential && !highAccess
        ? "High Potential · Low Access"
        : !highPotential && highAccess
          ? "Low Potential · High Access"
          : "Low Potential · Low Access";

  const wrapperCls =
    highPotential && highAccess
      ? "border-green-200 bg-green-50"
      : highPotential && !highAccess
        ? "border-orange-200 bg-orange-50"
        : !highPotential && highAccess
          ? "border-blue-200 bg-blue-50"
          : "border-red-200 bg-red-50";

  const badgeCls =
    highPotential && highAccess
      ? "bg-green-100 text-green-800"
      : highPotential && !highAccess
        ? "bg-orange-100 text-orange-800"
        : !highPotential && highAccess
          ? "bg-blue-100 text-blue-800"
          : "bg-red-100 text-red-800";

  const message =
    highPotential && highAccess
      ? `${clusterName} cluster has high potential and high access. It is highly recommended to create an engagement plan for this cluster.`
      : highPotential && !highAccess
        ? `${clusterName} cluster has high potential but low access. It is recommended to create an engagement plan to build more connects for this cluster.`
        : !highPotential && highAccess
          ? `${clusterName} cluster has strong access but low overall potential. Conduct events to fully leverage the available market within this cluster.`
          : `${clusterName} cluster has low potential and low access. It is not recommended to prioritise an engagement plan for this cluster.`;

  return (
    <div className={cn("rounded-2xl border p-4 space-y-3", wrapperCls)}>
      <span
        className={cn(
          "inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
          badgeCls,
        )}
      >
        {label}
      </span>
      <p className="text-sm leading-snug">{message}</p>
    </div>
  );
}

void CLUSTERS;
void scoreFromHML;
void scoreToHML;
void ScoreTile;
