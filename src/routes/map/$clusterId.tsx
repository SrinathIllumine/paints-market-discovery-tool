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
import { CLUSTERS, getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import { PANVEL_CENTER } from "@/data/clusters";
import { PANVEL_BOUNDARY } from "@/data/panvelBoundary";
import { groupIntoRegions } from "@/lib/regions";
import { useAppStore, type Prospect } from "@/store/appStore";
import { searchPlacesForCluster } from "@/lib/places.functions";
import { useServerFn } from "@tanstack/react-start";
import { Phone, Plus, Users, Loader2, MapPin, Check } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  const navigate = useNavigate();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);

  const state = useAppStore((s) => s.clusters[clusterId]);
  const stakeholders = useAppStore((s) => s.stakeholders[clusterId]) ?? [];
  const ensureCluster = useAppStore((s) => s.ensureCluster);
  const markVisited = useAppStore((s) => s.markVisited);
  const setProspects = useAppStore((s) => s.setProspects);
  const addProspect = useAppStore((s) => s.addProspect);
  const toggleProspectSelected = useAppStore((s) => s.toggleProspectSelected);

  const callPlaces = useServerFn(searchPlacesForCluster);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickingPin, setPickingPin] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [stkOpen, setStkOpen] = useState(false);

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

  const cs = state ?? { jkShare: null, prospects: [], selectedProspectIds: [], visited: true };

  const regions = useMemo(() => groupIntoRegions(cs.prospects), [cs.prospects]);

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

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
        {/* Market potential */}
        <Section title="Market Potential">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full bg-critical/10 px-3 py-1 text-xs font-semibold text-critical">
              {POTENTIAL_LABEL[cluster.potential]}
            </span>
            <span className="text-sm text-muted-foreground">
              {loading ? "Loading prospects…" : `${cs.prospects.length} prospects identified`}
            </span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {cluster.potentialReasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-critical">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </Section>

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
              prospects={cs.prospects}
              selectedIds={cs.selectedProspectIds}
              onToggle={(id) => toggleProspectSelected(clusterId, id)}
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
          {regions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {regions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px]"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: r.color }}
                  />
                  <span className="font-medium">{r.label}</span>
                  <span className="text-muted-foreground">({r.prospects.length})</span>
                </div>
              ))}
              <div className="flex items-center gap-1.5 rounded-full border border-dashed border-foreground/40 px-2.5 py-1 text-[11px] text-muted-foreground">
                Panvel area outline
              </div>
            </div>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            <MapPin className="mr-1 inline h-3 w-3" />
            {cs.prospects.length} prospects on map · {cs.selectedProspectIds.length} selected
          </p>
        </Section>

        {/* Prospects by region (collapsible cards) */}
        <section className="space-y-3">
          <h2 className="font-display text-xl">Prospects by region</h2>
          {cs.prospects.length === 0 ? (
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
                      {r.prospects.map((p) => {
                        const isSel = cs.selectedProspectIds.includes(p.id);
                        return (
                          <li key={p.id}>
                            <button
                              type="button"
                              onClick={() => toggleProspectSelected(clusterId, p.id)}
                              className="flex w-full items-start justify-between gap-3 py-2.5 text-left"
                            >
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{p.name}</p>
                                {p.locality && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {p.locality}
                                  </p>
                                )}
                              </div>
                              <span
                                className={cn(
                                  "mt-0.5 flex h-6 shrink-0 items-center gap-1 rounded-full px-2 text-[10px] font-semibold",
                                  isSel
                                    ? "bg-critical text-critical-foreground"
                                    : "border border-border bg-muted/40 text-muted-foreground",
                                )}
                              >
                                {isSel && <Check className="h-3 w-3" />}
                                {isSel ? "Selected" : "Select"}
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </section>

        {/* Stakeholder connects link — only when contacts exist */}
        {stakeholders.length > 0 && (
          <button
            type="button"
            onClick={() => setStkOpen(true)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-4 text-left shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy/10 text-navy">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg leading-tight">Stakeholder Connects</p>
                <p className="text-xs text-muted-foreground">
                  {stakeholders.length} contact{stakeholders.length === 1 ? "" : "s"} added
                </p>
              </div>
            </div>
            <span className="text-xs font-semibold text-critical">View</span>
          </button>
        )}

        <Button
          onClick={() => navigate({ to: "/connects/$clusterId", params: { clusterId } })}
          className="h-12 w-full bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90"
        >
          Plan connects for this cluster
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

      <Sheet open={stkOpen} onOpenChange={setStkOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle className="font-display text-2xl">
              Stakeholders · {cluster.name}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {stakeholders.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No stakeholders yet. Add them in Stage 2 → Connects.
              </div>
            ) : (
              stakeholders.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.prospect}</p>
                  </div>
                  <a
                    href={`tel:${s.phone}`}
                    className="flex items-center gap-1 rounded-full bg-critical/10 px-3 py-1.5 text-xs font-semibold text-critical"
                  >
                    <Phone className="h-3 w-3" /> {s.phone}
                  </a>
                </div>
              ))
            )}
            <Button
              onClick={() => {
                setStkOpen(false);
                navigate({ to: "/connects/$clusterId", params: { clusterId } });
              }}
              className="mt-3 h-11 w-full bg-navy text-navy-foreground hover:bg-navy/90"
            >
              Manage stakeholders
            </Button>
          </div>
        </SheetContent>
      </Sheet>
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
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-display text-xl">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}

void CLUSTERS;
