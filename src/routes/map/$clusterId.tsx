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
import { CLUSTERS, getCluster } from "@/data/clusters";
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
  getAccessQuestions,
  getCompetitiveQuestions,
  getCycle,
  getRevenueProfile,
  formatRupees,
  type AccessRank,
  type YesNo,
  type ClusterAssessment,
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
    // Pull all available prospects from Google Places (paged inside the
    // server fn). Google's Places API caps text search at ~60 results.
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

  // Assessment local state (seed from store if present)
  const accessQuestions = useMemo(() => getAccessQuestions(clusterId), [clusterId]);
  const competitiveQuestions = useMemo(() => getCompetitiveQuestions(clusterId), [clusterId]);
  const [accessAnswers, setAccessAnswers] = useState<YesNo[]>(
    () => existingAssessment?.accessAnswers ?? accessQuestions.map(() => "N"),
  );
  const [accessRank, setAccessRank] = useState<AccessRank | null>(
    existingAssessment?.accessRank ?? null,
  );
  const [competitiveAnswers, setCompetitiveAnswers] = useState<YesNo[]>(
    () => existingAssessment?.competitiveAnswers ?? competitiveQuestions.map(() => "N"),
  );

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

  const profile = getRevenueProfile(clusterId);
  const cycle = getCycle(clusterId);
  const totalRevenue = profile.avgRevenuePerProspect * prospects.length;

  const provisionalAssessment: ClusterAssessment = {
    accessAnswers,
    accessRank,
    competitiveAnswers,
    completedAt: Date.now(),
  };
  void computeClusterScores(cluster, prospects.length, provisionalAssessment);

  const canSave = accessRank !== null;

  const handleSave = () => {
    if (!canSave) {
      toast.error("Pick an access ranking (A / B / C) to save");
      return;
    }
    setAssessment(clusterId, provisionalAssessment);
    toast.success("Cluster potential saved", { duration: 1800 });
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setSheetOpen(true)}
              className="h-8 gap-1 text-xs"
            >
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

        {/* Prospects by region (collapsible cards) — view only */}
        <section className="space-y-3">
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
                        <span
                          className="h-3 w-3 shrink-0 rounded-full"
                          style={{ backgroundColor: r.color }}
                        />
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
                          {p.locality && (
                            <p className="truncate text-xs text-muted-foreground">{p.locality}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        {/* ──────────────── Cluster scoring sub-sections (collapsible, one open at a time) ──────────────── */}

        <Accordion type="single" collapsible defaultValue="revenue" className="space-y-3">
          <AccordionItem value="revenue" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="font-display text-xl">Cluster Revenue Potential</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Tile label="Prospects in cluster" value={String(prospects.length)} />
                <Tile label="Avg. revenue / prospect" value={formatRupees(profile.avgRevenuePerProspect)} />
                <Tile label="Avg. usable area" value={profile.sqftBand} subtle />
                <Tile label="Total cluster revenue potential" value={formatRupees(totalRevenue)} highlight />
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Estimated from typical paint-cycle revenue per {cluster.nature.toLowerCase()} prospect.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="access" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="font-display text-xl">Cluster Access</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <p className="text-sm font-semibold">Access capability</p>
              <div className="mt-2 space-y-2">
                {accessQuestions.map((q, i) => (
                  <YesNoRow
                    key={q}
                    question={q}
                    value={accessAnswers[i]}
                    onChange={(v) =>
                      setAccessAnswers((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      })
                    }
                  />
                ))}
              </div>

              <p className="mt-4 text-sm font-semibold">Access ranking</p>
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
                      onChange={() => setAccessRank(opt.key)}
                      className="h-4 w-4 accent-critical"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="competitive" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="font-display text-xl">Competitive Strength</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2">
                {competitiveQuestions.map((q, i) => (
                  <YesNoRow
                    key={q}
                    question={q}
                    value={competitiveAnswers[i]}
                    onChange={(v) =>
                      setCompetitiveAnswers((prev) => {
                        const next = [...prev];
                        next[i] = v;
                        return next;
                      })
                    }
                  />
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="ease" className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <span className="font-display text-xl">Ease of Sale</span>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="rounded-xl border border-border bg-muted/30 p-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Avg. cycle time</p>
                <p className="mt-0.5 font-display text-xl leading-tight">{cycle.label}</p>
                <p className="mt-2 text-sm text-muted-foreground">{cycle.explanation}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>


        <Button
          onClick={handleSave}
          disabled={!canSave}
          className="h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <BookmarkCheck className="h-4 w-4" />
          {existingAssessment ? "Update cluster potential" : "Save cluster potential"}
        </Button>
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
  badge,
  children,
}: {
  title: string;
  right?: React.ReactNode;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{title}</h2>
        {badge ? (
          <span className="shrink-0 rounded-full bg-critical/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-critical">
            {badge}
          </span>
        ) : (
          right
        )}
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

function YesNoRow({
  question,
  value,
  onChange,
}: {
  question: string;
  value: YesNo | undefined;
  onChange: (v: YesNo) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-sm">
      <p className="leading-snug">{question}</p>
      <div className="flex shrink-0 gap-1.5">
        {(["Y", "N"] as YesNo[]).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-7 w-9 rounded-md border text-xs font-semibold",
              value === opt
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
}

void CLUSTERS;
