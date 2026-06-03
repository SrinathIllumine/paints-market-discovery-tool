import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { AddProspectSheet } from "@/components/maps/AddProspectSheet";
import { CLUSTERS, getCluster, prospectPlural } from "@/data/clusters";
import { PANVEL_CENTER } from "@/data/clusters";
import { PANVEL_BOUNDARY } from "@/data/panvelBoundary";
import { groupIntoRegions } from "@/lib/regions";
import { useAppStore, type Prospect } from "@/store/appStore";
import { searchPlacesForCluster } from "@/lib/places.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Loader2, MapPin, BookmarkCheck } from "lucide-react";
import { toast } from "sonner";
import {
  computeClusterScores,
  getCycle,
  getRevenueProfile,
  formatRupees,
  scoreToHML,
  scoreRevenue,
  scoreEaseOfSale,
  scoreCompetitiveBrands,
  scoreAccessFromAnswers,
  getClusterIntel,
  getAccessInsights,
  getAccessQuestions3,
  getDominantContractors,
  COMPETITIVE_BRANDS,
  HML_LABEL,
  type AccessRank,
  type ClusterAssessment,
  type HML,
  type YesNo,
} from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export const Route = createFileRoute("/map/$clusterId")({
  component: ClusterDetailScreen,
  errorComponent: ({ error, reset }) => (
    <AppShell bottom={<BottomNav />}>
      <div className="space-y-3 p-6 text-center">
        <p className="font-display text-xl">Something went wrong loading this cluster.</p>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button onClick={reset} className="bg-navy text-navy-foreground hover:bg-navy/90">Retry</Button>
      </div>
    </AppShell>
  ),
});

function ClusterDetailScreen() {
  const { clusterId } = Route.useParams();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);

  const state = useAppStore((s) => s.clusters[clusterId]);
  const ensureCluster = useAppStore((s) => s.ensureCluster);
  const markVisited = useAppStore((s) => s.markVisited);
  const setProspects = useAppStore((s) => s.setProspects);
  const addProspect = useAppStore((s) => s.addProspect);
  const existingAssessment = useAppStore((s) => s.assessments[clusterId]);
  const setAssessment = useAppStore((s) => s.setAssessment);

  const callPlaces = useServerFn(searchPlacesForCluster);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickingPin, setPickingPin] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    ensureCluster(clusterId);
    markVisited(clusterId);
  }, [clusterId, ensureCluster, markVisited]);

  useEffect(() => {
    if (!cluster) return;
    if (!state || state.prospects.length > 0) return;
    setLoading(true);
    callPlaces({
      data: {
        textQuery: cluster.placesQuery,
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
        setProspects(clusterId, mapped);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cluster?.id]);

  const prospects = state?.prospects ?? [];
  const regions = useMemo(() => groupIntoRegions(prospects), [prospects]);
  const selectedAllIds = useMemo(() => prospects.map((p) => p.id), [prospects]);

  // Card state seeded from store
  const profile = getRevenueProfile(clusterId);
  const cycle = getCycle(clusterId);

  const [accessRank, setAccessRank] = useState<AccessRank | null>(existingAssessment?.accessRank ?? null);
  const [accessAnswers, setAccessAnswers] = useState<(YesNo | undefined)[]>(
    existingAssessment?.accessAnswers3 ?? [undefined, undefined, undefined],
  );
  const [contractorsOpen, setContractorsOpen] = useState(false);
  const [brandPresence, setBrandPresence] = useState<Partial<Record<string, HML>>>(
    existingAssessment?.brandPresence ?? {},
  );
  const [cycleMonths, setCycleMonths] = useState<number>(
    existingAssessment?.cycleMonths ?? cycle.months,
  );
  const [cycleEase, setCycleEase] = useState<HML | undefined>(existingAssessment?.cycleEase);
  const [prospectCount, setProspectCount] = useState<number>(
    existingAssessment?.prospectCountOverride ?? prospects.length,
  );
  const [avgRevenue, setAvgRevenue] = useState<number>(
    existingAssessment?.avgRevenueOverride ?? profile.avgRevenuePerProspect,
  );
  const [revenueRating, setRevenueRating] = useState<HML | undefined>(existingAssessment?.revenueRating);
  const [showSummary, setShowSummary] = useState<boolean>(Boolean(existingAssessment));


  // Keep prospectCount synced if user hasn't overridden and places result lands later
  useEffect(() => {
    if (!existingAssessment?.prospectCountOverride && prospects.length > 0) {
      setProspectCount(prospects.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospects.length]);

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

  const pluralCap = prospectPlural(clusterId);
  const totalRevenue = avgRevenue * prospectCount;

  // Benchmarks across all clusters
  const revenueBenchmark = useMemo(() => {
    const all = CLUSTERS.map((c) => getRevenueProfile(c.id).avgRevenuePerProspect);
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, []);
  const cycleBenchmarkDays = useMemo(() => {
    const all = CLUSTERS.map((c) => getCycle(c.id).days);
    return all.reduce((a, b) => a + b, 0) / all.length;
  }, []);
  const cycleBenchmarkMonths = Math.round((cycleBenchmarkDays / 30) * 10) / 10;

  // Backend intelligence (Google Maps + internet sources) — drives static HML
  const intel = useMemo(
    () => getClusterIntel(clusterId, prospects.length || profile.avgRevenuePerProspect ? prospects.length : 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [clusterId, prospects.length],
  );
  const revenueHML: HML = intel.revenueHML;
  const easeHML: HML = intel.easeHML;
  const competitiveHML: HML = intel.competitiveHML;
  void easeHML;
  void competitiveHML;

  // Access HML: until the user answers any question, show the intel default;
  // once any answer is provided, derive dynamically from the answers.
  const answersTouched = accessAnswers.some((a) => a !== undefined);
  const accessHML: HML = answersTouched
    ? scoreToHML(scoreAccessFromAnswers(accessAnswers))
    : "H";

  // Effective totals for revenue narrative — prefer backend-observed count if available
  const observedCount = intel.totalProspectsObserved || prospectCount;
  const observedTotalRevenue = profile.avgRevenuePerProspect * observedCount;

  const provisionalAssessment: ClusterAssessment = {
    accessAnswers: existingAssessment?.accessAnswers ?? [],
    accessRank,
    competitiveAnswers: existingAssessment?.competitiveAnswers ?? [],
    brandPresence,
    accessAnswers3: accessAnswers,
    cycleMonths,
    cycleEase,
    prospectCountOverride: prospectCount,
    avgRevenueOverride: avgRevenue,
    revenueRating,
    completedAt: Date.now(),
  };
  const scores = computeClusterScores(cluster, prospects.length, provisionalAssessment);


  const canSave = true; // Backend-driven; user input optional

  const hideSummaryOnEdit = () => setShowSummary(false);

  const handleSave = () => {
    setAssessment(clusterId, provisionalAssessment);
    setShowSummary(true);
    toast.success("Cluster potential estimated", { duration: 1800 });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Cluster Card"
          title={cluster.name}
          subtitle={`${cluster.nature} — ${cluster.description}`}
          backTo="/map"
        />
      }
    >
      <div className="space-y-5 px-5 py-5">
        {/* Map */}
        <Section
          title="Geo View"
          right={
            <Button size="sm" variant="outline" onClick={() => setSheetOpen(true)} className="h-8 gap-1 text-xs">
              <Plus className="h-3.5 w-3.5" /> Add prospect
            </Button>
          }
        >
          <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-border">
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
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-background/60">
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
        </Section>

        {/* Prospects by region */}
        <section className="space-y-3">
          <h2 className="font-display text-xl">Prospects by region</h2>
          {prospects.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
              {loading ? "Loading prospects…" : "No prospects identified yet."}
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={[]} className="space-y-2">
              {regions.map((r) => (
                <AccordionItem key={r.id} value={r.id} className="overflow-hidden rounded-2xl border border-border bg-card">
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

        {/* ──────────────── Cluster scoring sub-sections ──────────────── */}
        <h2 className="px-1 pt-1 font-display text-2xl">Map the Cluster Potential</h2>
        <Accordion type="single" collapsible defaultValue="revenue" className="space-y-3">
          {/* Revenue */}
          <AccordionItem value="revenue" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-display text-xl">Cluster Revenue Potential</span>
                <HMLBadge hml={revenueHML} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              {(() => {
                const singular = pluralCap.toLowerCase().replace(/s$/, "");
                return (
                  <ul className="space-y-2 text-sm leading-relaxed">
                    <NarrativeBullet>
                      There are <b>{observedCount} {pluralCap.toLowerCase()}</b> present in this cluster.
                    </NarrativeBullet>
                    <NarrativeBullet>
                      The national average revenue per {singular} is <b>{formatRupees(profile.avgRevenuePerProspect)}</b>.
                    </NarrativeBullet>
                    <NarrativeBullet>
                      Total cluster revenue potential for {pluralCap.toLowerCase()} is{" "}
                      <b className="text-critical">{formatRupees(observedTotalRevenue)}</b>.
                    </NarrativeBullet>
                  </ul>
                );
              })()}
            </AccordionContent>
          </AccordionItem>

          {/* Access — merges old Competitive Strength + Ease of Sale */}
          <AccordionItem value="access" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-display text-xl">Cluster Access</span>
                <HMLBadge hml={accessHML} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Insights</p>
              <ul className="mb-4 space-y-2 text-sm leading-relaxed">
                {getAccessInsights(clusterId).map((line, i) => (
                  <NarrativeBullet key={i}>{line}</NarrativeBullet>
                ))}
              </ul>

              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Quick checks</p>
              <div className="space-y-2">
                {getAccessQuestions3(clusterId).map((q, i) => {
                  const v = accessAnswers[i];
                  return (
                    <div key={q.id} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-sm leading-snug">
                        {q.question}
                        {q.kind === "contractors" && (
                          <>
                            {" "}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); setContractorsOpen(true); }}
                              className="text-critical underline underline-offset-2 hover:no-underline"
                            >
                              Click here to see the list of contractors
                            </button>
                          </>
                        )}
                      </p>
                      <div className="mt-2 flex gap-2">
                        {(["Y", "N"] as const).map((opt) => (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              hideSummaryOnEdit();
                              const next = [...accessAnswers];
                              next[i] = opt;
                              setAccessAnswers(next);
                            }}
                            className={cn(
                              "h-8 min-w-[56px] rounded-md border px-3 text-xs font-semibold",
                              v === opt
                                ? "border-critical bg-critical text-critical-foreground"
                                : "border-border bg-card text-muted-foreground hover:bg-muted/40",
                            )}
                          >
                            {opt === "Y" ? "Yes" : "No"}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Dialog open={contractorsOpen} onOpenChange={setContractorsOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Dominant contractors in this cluster</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
              {getDominantContractors(clusterId).map((c, i) => (
                <div key={i} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                  <p className="font-semibold">{c.name}</p>
                  <dl className="mt-1 grid grid-cols-[110px_1fr] gap-y-1 text-xs">
                    <dt className="text-muted-foreground">Phone</dt><dd>{c.phone}</dd>
                    <dt className="text-muted-foreground">Area</dt><dd>{c.area}</dd>
                    <dt className="text-muted-foreground">Brand Preference</dt><dd>{c.brandPreference}</dd>
                  </dl>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>


        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <BookmarkCheck className="h-4 w-4" /> Estimate Cluster Potential
        </Button>

        {showSummary && (
          <>
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="font-display text-xl">Total Cluster Mapped</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Snapshot across all clusters — this cluster is highlighted.
              </p>
              <ClusterSnapshotMatrix highlightId={clusterId} />
            </section>

            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl leading-tight">{cluster.name}</h2>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Cluster Potential Score
                  </p>
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                  scores.aggregate > 7 ? "bg-green-100 text-green-800"
                  : scores.aggregate >= 5 ? "bg-orange-100 text-orange-800"
                  : "bg-red-100 text-red-800",
                )}>
                  {scores.aggregate} / 10
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <ScoreTile label="Revenue" value={scores.revenue} />
                <ScoreTile label="Access" value={scores.access} />
                <ScoreTile label="Competitive" value={scores.competitive} />
                <ScoreTile label="Ease of sale" value={scores.ease} />
              </div>
            </section>
          </>
        )}
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

function Section({
  title,
  right,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

function HMLBadge({ hml }: { hml: HML | null }) {
  if (!hml) return null;
  const cls =
    hml === "H" ? "bg-green-100 text-green-800 border-green-300"
    : hml === "M" ? "bg-orange-100 text-orange-800 border-orange-300"
    : "bg-red-100 text-red-800 border-red-300";
  return (
    <span className={cn("shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider", cls)}>
      {HML_LABEL[hml]}
    </span>
  );
}

function NarrativeBullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2">
      <span className="mt-0.5 text-critical">•</span>
      <span className="flex-1">{children}</span>
    </li>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const cls =
    value > 7 ? "border-green-300 bg-green-50 text-green-800"
    : value >= 5 ? "border-orange-300 bg-orange-50 text-orange-800"
    : "border-red-300 bg-red-50 text-red-800";
  return (
    <div className={cn("rounded-xl border p-2 text-center", cls)}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-base leading-tight">{value}/10</p>
    </div>
  );
}

function ClusterSnapshotMatrix({ highlightId }: { highlightId: string }) {
  const assessments = useAppStore((s) => s.assessments);
  const clusterStates = useAppStore((s) => s.clusters);
  const navigate = useNavigate();

  type Pt = { id: string; name: string; access: number; potential: number; current: boolean };
  const points: Pt[] = useMemo(() => {
    return Object.entries(assessments)
      .map(([id, a]) => {
        const c = getCluster(id);
        if (!c) return null;
        const count = clusterStates[id]?.prospects.length ?? c.prospectCountEstimate;
        const s = computeClusterScores(c, count, a);
        return {
          id,
          name: c.name,
          access: (s.access + s.ease) / 2,
          potential: (s.revenue + s.competitive) / 2,
          current: id === highlightId,
        } satisfies Pt;
      })
      .filter((p): p is Pt => Boolean(p));
  }, [assessments, clusterStates, highlightId]);

  const W = 320;
  const H = 320;
  const pad = 40;
  const innerW = W - pad * 2;
  const innerH = H - pad * 2;
  const xFor = (v: number) => pad + (v / 10) * innerW;
  const yFor = (v: number) => H - pad - (v / 10) * innerH;

  return (
    <div className="mt-3 overflow-x-auto text-foreground">
      <svg viewBox={`0 0 ${W} ${H}`} className="mx-auto block h-auto w-full max-w-sm">
        <rect x={pad} y={pad} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.35} />
        <rect x={pad + innerW / 2} y={pad} width={innerW / 2} height={innerH / 2} fill="var(--critical)" fillOpacity={0.12} />
        <rect x={pad} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.15} />
        <rect x={pad + innerW / 2} y={pad + innerH / 2} width={innerW / 2} height={innerH / 2} fill="var(--muted)" fillOpacity={0.55} />
        <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="currentColor" strokeOpacity="0.4" />
        <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="currentColor" strokeOpacity="0.4" />
        <line x1={pad + innerW / 2} y1={pad} x2={pad + innerW / 2} y2={H - pad} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />
        <line x1={pad} y1={pad + innerH / 2} x2={W - pad} y2={pad + innerH / 2} stroke="currentColor" strokeOpacity="0.2" strokeDasharray="3 3" />

        <text x={pad + 6} y={pad + 14} fontSize="9" fill="currentColor" opacity="0.6">Low access · High potential</text>
        <text x={W - pad - 6} y={pad + 14} fontSize="9" fill="currentColor" opacity="0.7" textAnchor="end">High access · High potential</text>
        <text x={pad + 6} y={H - pad - 6} fontSize="9" fill="currentColor" opacity="0.5">Low access · Low potential</text>
        <text x={W - pad - 6} y={H - pad - 6} fontSize="9" fill="currentColor" opacity="0.6" textAnchor="end">High access · Low potential</text>
        <text x={W / 2} y={H - 8} fontSize="10" fill="currentColor" textAnchor="middle">Access →</text>
        <text x={12} y={H / 2} fontSize="10" fill="currentColor" textAnchor="middle" transform={`rotate(-90 12 ${H / 2})`}>Potential →</text>

        {points.map((p) => {
          const cx = xFor(p.access);
          const cy = yFor(p.potential);
          return (
            <g key={p.id} className="cursor-pointer" onClick={() => navigate({ to: "/map/$clusterId", params: { clusterId: p.id } })}>
              <circle
                cx={cx}
                cy={cy}
                r={p.current ? 8 : 6}
                fill={p.current ? "var(--critical)" : "currentColor"}
                fillOpacity={p.current ? 1 : 0.25}
                stroke={p.current ? "var(--background)" : "currentColor"}
                strokeOpacity={p.current ? 1 : 0.4}
                strokeWidth={p.current ? 2 : 1}
              />
              <text x={cx + 9} y={cy + 3} fontSize="9" fill="currentColor" opacity={p.current ? 1 : 0.4}>
                {p.name.length > 20 ? p.name.slice(0, 19) + "…" : p.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {points.length} cluster{points.length === 1 ? "" : "s"} mapped so far
      </p>
    </div>
  );
}

void CLUSTERS;
