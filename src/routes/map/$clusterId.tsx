import { createFileRoute } from "@tanstack/react-router";
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
import { QuadrantSnapshot } from "@/components/app/QuadrantSnapshot";
import { groupIntoRegions } from "@/lib/regions";
import { useAppStore, type Prospect } from "@/store/appStore";
import { searchPlacesForCluster } from "@/lib/places.functions";
import { useServerFn } from "@tanstack/react-start";
import { Plus, Loader2, MapPin, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  computeClusterScores,
  getRevenueProfile,
  formatRupees,
  getClusterIntel,
  getCompetitiveInsights,
  getEaseInsights,
  getPaintsCagr,
  highlightBrands,
  HML_LABEL,
  scoreFromHML,
  scoreToHML,
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
    if (!existingAssessment) setAssessment(clusterId, { completedAt: Date.now() });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterId]);

  const hasProspects = (state?.prospects.length ?? 0) > 0;
  useEffect(() => {
    if (!cluster) return;
    if (hasProspects) return;
    if (loading) return;

    // Divide Panvel area into a 4x4 grid of overlapping sub-regions and run
    // parallel Places searches. Google text-search caps results at ~60 per
    // query, so a single 25km query misses most prospects in dense clusters.
    const GRID = 4;
    const STEP = 0.045; // ~5 km
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
  const scores = computeClusterScores(cluster, prospects.length);
  const observedCount = intel.totalProspectsObserved || prospects.length || cluster.prospectCountEstimate;
  const totalRevenue = profile.avgRevenuePerProspect * observedCount;
  const singular = pluralCap.toLowerCase().replace(/s$/, "");

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
      <div className="space-y-8 px-6 py-8">
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

        {/* Cluster Potential Mapping — four collapsible subsections */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Cluster Potential Mapping</h2>

          <Accordion type="multiple" defaultValue={["revenue"]} className="space-y-2">
            <CollapsibleSub value="revenue" title="Revenue Potential" hml={intel.revenueHML}>
              <ul className="space-y-2 text-sm leading-relaxed">
                <Bullet>
                  There are <b>{observedCount} {pluralCap.toLowerCase()}</b> present in this cluster.
                </Bullet>
                <Bullet>
                  The national average revenue per {singular} is <b>{formatRupees(profile.avgRevenuePerProspect)}</b>.
                </Bullet>
                <Bullet>
                  Total cluster revenue potential is{" "}
                  <b className="text-critical">{formatRupees(totalRevenue)}</b>.
                </Bullet>
                <Bullet>
                  <span className="inline-flex flex-wrap items-center gap-1">
                    <span>
                      Paints-business growth rate for this cluster:{" "}
                      <b className="text-emerald-700">
                        {getPaintsCagr(clusterId).cagr} CAGR
                      </b>{" "}
                      ({getPaintsCagr(clusterId).period}).
                    </span>
                    <TooltipProvider delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="Source"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[260px] text-xs">
                          Source: {getPaintsCagr(clusterId).source}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                </Bullet>
              </ul>
            </CollapsibleSub>

            <CollapsibleSub value="competitive" title="Competitive Strength" hml={intel.competitiveHML}>
              <ul className="space-y-2 text-sm leading-relaxed">
                {getCompetitiveInsights(clusterId).slice(0, 2).map((line, i) => (
                  <Bullet key={i}>{highlightBrands(line)}</Bullet>
                ))}
              </ul>
            </CollapsibleSub>

            <CollapsibleSub value="access" title="Access" hml={intel.accessHML}>
              <ul className="space-y-2 text-sm leading-relaxed">
                <Bullet>
                  There are <b>{intel.contractorCount}</b> contractors dominating this cluster.
                </Bullet>
                <Bullet>
                  There are <b>{intel.retailerCount}</b> retailers operating within this cluster.
                </Bullet>
              </ul>
            </CollapsibleSub>

            <CollapsibleSub value="ease" title="Ease of Sale" hml={intel.easeHML}>
              <ul className="space-y-2 text-sm leading-relaxed">
                {getEaseInsights(clusterId).map((line, i) => (
                  <Bullet key={i}>{line}</Bullet>
                ))}
              </ul>
            </CollapsibleSub>
          </Accordion>
        </section>


        {/* Snapshot + scoring tiles */}
        <section className="space-y-3">
          <h2 className="font-display text-2xl">Cluster Snapshot</h2>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <p className="mb-2 text-xs text-muted-foreground">
              Position of <b>{cluster.name}</b> against all other clusters.
            </p>
            <QuadrantSnapshot highlightId={cluster.id} />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <ScoreTile label="Revenue" score={scores.revenue} />
            <ScoreTile label="Competitive" score={scores.competitive} />
            <ScoreTile label="Access" score={scores.access} />
            <ScoreTile label="Ease of Sale" score={scores.ease} />
          </div>
        </section>


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
  title, right, children,
}: { title: string; right?: React.ReactNode; children: React.ReactNode }) {
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

function CollapsibleSub({
  value, title, hml, children,
}: { value: string; title: string; hml: HML; children: React.ReactNode }) {
  return (
    <AccordionItem
      value={value}
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
    >
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
    hml === "H" ? "bg-green-100 text-green-800 border-green-300"
    : hml === "M" ? "bg-orange-100 text-orange-800 border-orange-300"
    : "bg-red-100 text-red-800 border-red-300";
  return (
    <span className={cn(
      "shrink-0 rounded-full border font-semibold uppercase tracking-wider",
      small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-0.5 text-[10px]",
      cls,
    )}>
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

function HMLTile({ label, hml }: { label: string; hml: HML }) {
  const cls =
    hml === "H" ? "border-green-300 bg-green-50 text-green-800"
    : hml === "M" ? "border-orange-300 bg-orange-50 text-orange-800"
    : "border-red-300 bg-red-50 text-red-800";
  return (
    <div className={cn("rounded-xl border p-2 text-center", cls)}>
      <p className="text-[10px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-0.5 font-display text-sm leading-tight">{HML_LABEL[hml]}</p>
    </div>
  );
}

function ScoreTile({ label, score }: { label: string; score: number }) {
  const hi = score >= 6;
  const cls = hi
    ? "border-green-300 bg-green-50 text-green-800"
    : "border-red-300 bg-red-50 text-red-800";
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

function ParentCard({
  title, hml, children,
}: { title: string; hml: HML; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3 px-1">
        <h3 className="font-display text-xl leading-tight">{title}</h3>
        <HMLBadge hml={hml} />
      </div>
      {children}
    </div>
  );
}


void CLUSTERS;
void scoreFromHML;
void scoreToHML;
