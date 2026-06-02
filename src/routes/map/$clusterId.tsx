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
  COMPETITIVE_BRANDS,
  HML_LABEL,
  type AccessRank,
  type ClusterAssessment,
  type HML,
} from "@/lib/clusterScoring";
import { cn } from "@/lib/utils";

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

  // Static HML for revenue & ease (data-driven, not user-rated)
  const revenueHML: HML = scoreToHML(scoreRevenue(profile.avgRevenuePerProspect));
  const easeHML: HML = scoreToHML(scoreEaseOfSale(clusterId));
  const accessHML: HML | null = accessRank ? (accessRank === "A" ? "H" : accessRank === "B" ? "M" : "L") : null;
  const competitiveScore = scoreCompetitiveBrands(brandPresence);
  const competitiveHML: HML | null = competitiveScore > 0 ? scoreToHML(competitiveScore) : null;

  // Difficulty narrative for ease of sale
  const difficultyLabel: string =
    easeHML === "H" ? "Easy — shorter cycles than most clusters" :
    easeHML === "M" ? "Moderate — comparable to typical clusters" :
    "Hard — longer cycle with more approvals than average";

  const provisionalAssessment: ClusterAssessment = {
    accessAnswers: existingAssessment?.accessAnswers ?? [],
    accessRank,
    competitiveAnswers: existingAssessment?.competitiveAnswers ?? [],
    brandPresence,
    cycleMonths,
    cycleEase,
    prospectCountOverride: prospectCount,
    avgRevenueOverride: avgRevenue,
    revenueRating,
    completedAt: Date.now(),
  };
  const scores = computeClusterScores(cluster, prospects.length, provisionalAssessment);

  const canSave = accessRank !== null;

  const hideSummaryOnEdit = () => setShowSummary(false);

  const handleSave = () => {
    if (!canSave) {
      toast.error("Pick an access ranking (A / B / C) to estimate");
      return;
    }
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
                <span className="font-display text-xl">1)	Is the revenue potential high in the cluster?</span>
                <HMLBadge hml={revenueHML} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="space-y-2 text-sm leading-relaxed">
                <NarrativeBullet>
                  This cluster has roughly <b>{prospectCount} {pluralCap.toLowerCase()}</b> with an average usable area of <b>{profile.sqftBand}</b>.
                </NarrativeBullet>
                <NarrativeBullet>
                  Each {pluralCap.toLowerCase().replace(/s$/, "")} can typically deliver <b>{formatRupees(profile.avgRevenuePerProspect)}</b> in revenue.
                </NarrativeBullet>
                <NarrativeBullet>
                  Total cluster revenue potential is <b className="text-critical">{formatRupees(totalRevenue)}</b> — a meaningful pool to anchor your monthly plan.
                </NarrativeBullet>
                <NarrativeBullet>
                  Benchmark: avg cluster prospect across Panvel delivers <b>{formatRupees(revenueBenchmark)}</b>. This cluster sits{" "}
                  <b className={cn(
                    profile.avgRevenuePerProspect >= revenueBenchmark * 1.1 ? "text-green-700"
                    : profile.avgRevenuePerProspect <= revenueBenchmark * 0.9 ? "text-red-700"
                    : "text-orange-700",
                  )}>
                    {profile.avgRevenuePerProspect >= revenueBenchmark * 1.1 ? "above" :
                     profile.avgRevenuePerProspect <= revenueBenchmark * 0.9 ? "below" : "around"}
                  </b>{" "}the benchmark.
                </NarrativeBullet>
              </ul>
            </AccordionContent>
          </AccordionItem>

          {/* Access */}
          <AccordionItem value="access" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-display text-xl">2)	Do you have access to this cluster?</span>
                <HMLBadge hml={accessHML} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm font-semibold">Select your access level for this cluster</p>
              <div className="mt-2 space-y-2">
                {(
                  [
                    { key: "A", label: "A - I already have strong connects in this cluster" },
                    { key: "B", label: "B - I have moderate connects in this cluster" },
                    { key: "C", label: "C - I don't have any connects in this cluster" },
                  ] as { key: AccessRank; label: string }[]
                ).map((opt) => (
                  <label
                    key={opt.key}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 text-sm",
                      accessRank === opt.key ? "border-critical bg-critical/5" : "border-border bg-card",
                    )}
                  >
                    <input
                      type="radio"
                      name={`access-rank-${clusterId}`}
                      checked={accessRank === opt.key}
                      onChange={() => {
                        hideSummaryOnEdit();
                        setAccessRank(opt.key);
                      }}
                      className="h-4 w-4 accent-critical"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Competitive */}
          <AccordionItem value="competitive" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-display text-xl">3) Is the competitive strength stopping us from entering the cluster?</span>
                <HMLBadge hml={competitiveHML} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="mb-2 text-sm text-muted-foreground">
                Mark each brand's presence in this cluster:
              </p>
              <div className="space-y-2">
                {COMPETITIVE_BRANDS.map((brand) => (
                  <div
                    key={brand}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <span className="text-sm font-medium">{brand}</span>
                    <div className="flex shrink-0 gap-1.5">
                      {(["H", "M", "L"] as HML[]).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() =>
                            {
                              hideSummaryOnEdit();
                              setBrandPresence((prev) => ({ ...prev, [brand]: lvl }));
                            }
                          }
                          className={cn(
                            "h-7 w-auto min-w-[36px] px-1.5 rounded-md border text-xs font-semibold",
                            brandPresence[brand] === lvl
                              ? "border-critical bg-critical text-critical-foreground"
                              : "border-border bg-card text-muted-foreground hover:bg-muted/40",
                          )}
                        >
                          {HML_LABEL[lvl]}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Ease of sale */}
          <AccordionItem value="ease" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="flex w-full items-center justify-between gap-3 pr-2">
                <span className="font-display text-xl">4) Is the average cycle time supporting the ease of sale?</span>
                <HMLBadge hml={easeHML} />
              </span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ul className="space-y-2 text-sm leading-relaxed">
                <NarrativeBullet>
                  Average sales cycle in this cluster is <b>{cycle.label}</b> (~{cycle.months} months).
                </NarrativeBullet>
                <NarrativeBullet>{cycle.explanation}</NarrativeBullet>
                <NarrativeBullet>
                  Benchmark: typical Panvel cluster closes in ~<b>{cycleBenchmarkMonths} months</b>. This cluster runs{" "}
                  <b className={cn(
                    cycle.days <= cycleBenchmarkDays * 0.9 ? "text-green-700"
                    : cycle.days >= cycleBenchmarkDays * 1.1 ? "text-red-700"
                    : "text-orange-700",
                  )}>
                    {cycle.days <= cycleBenchmarkDays * 0.9 ? "faster than" :
                     cycle.days >= cycleBenchmarkDays * 1.1 ? "slower than" : "around"}
                  </b>{" "}the benchmark.
                </NarrativeBullet>
                <NarrativeBullet>
                  Difficulty: <b>{difficultyLabel}</b>.
                </NarrativeBullet>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

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

/** Ease label inverse of cycle time: low cycle ⇒ high ease. Honour user H/M/L if set. */
function easeFromCycle(months: number, override: HML | undefined): HML {
  if (override) return cycleTimeToEaseHML(override);
  if (months <= 1) return "H";
  if (months <= 3) return "M";
  return "L";
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

function Tile({
  label,
  value,
  subtle,
  highlight,
}: {
  label: string;
  value: string;
  subtle?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3",
        highlight ? "border-critical/30 bg-critical/5" : "border-border bg-muted/30",
        subtle && "opacity-90",
      )}
    >
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-display text-lg leading-tight">{value}</p>
    </div>
  );
}

function EditableTile({
  label,
  value,
  onChange,
  type,
  formatted,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  type: "int" | "rupees";
  formatted?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <input
        type="number"
        min={0}
        step={type === "int" ? 1 : 10000}
        value={value}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="mt-0.5 w-full rounded-md border border-transparent bg-transparent px-0 py-0 font-display text-lg leading-tight focus:border-border focus:bg-background focus:px-2"
      />
      {type === "rupees" && formatted && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">{formatted}</p>
      )}
    </div>
  );
}

function HMLPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: HML | undefined;
  onChange: (v: HML) => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-border bg-muted/30 p-3">
      <p className="mb-2 text-sm">{label}</p>
      <div className="flex gap-2">
        {(["H", "M", "L"] as HML[]).map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange(lvl)}
            className={cn(
              "flex-1 rounded-lg border px-3 py-2 text-sm font-semibold",
              value === lvl
                ? "border-critical bg-critical text-critical-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40",
            )}
          >
            {HML_LABEL[lvl]}
          </button>
        ))}
      </div>
    </div>
  );
}

function SummaryCell({ label, hml }: { label: string; hml: HML }) {
  const styles =
    hml === "H"
      ? "bg-green-100 text-green-800 border-green-300"
      : hml === "M"
      ? "bg-orange-100 text-orange-800 border-orange-300"
      : "bg-red-100 text-red-800 border-red-300";
  return (
    <div className={cn("rounded-xl border p-3 text-center", styles)}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold leading-tight">{HML_LABEL[hml]}</p>
    </div>
  );
}

void CLUSTERS;
