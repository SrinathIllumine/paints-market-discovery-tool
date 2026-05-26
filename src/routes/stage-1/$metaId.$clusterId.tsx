import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { FAB } from "@/components/app/FAB";
import { BottomBar } from "@/components/app/BottomBar";
import { Button } from "@/components/ui/button";
import { GoogleMap } from "@/components/maps/GoogleMap";
import { AddProspectSheet } from "@/components/maps/AddProspectSheet";
import { META_CLUSTERS, PANVEL_CENTER } from "@/data/clusters";
import { clusterPlacesConfig } from "@/data/clusterPlaces";
import { useAppStore, type Prospect } from "@/store/appStore";
import { searchPlacesForCluster } from "@/lib/places.functions";
import { useServerFn } from "@tanstack/react-start";
import { Save, CheckCircle2, Plus } from "lucide-react";

export const Route = createFileRoute("/stage-1/$metaId/$clusterId")({
  component: MapScreen,
});

function MapScreen() {
  const { metaId, clusterId } = Route.useParams();
  const navigate = useNavigate();

  const customMeta = useAppStore((s) => s.customMeta);
  const customClusters = useAppStore((s) => s.customClusters);
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const upsertClusterMap = useAppStore((s) => s.upsertClusterMap);
  const setProspects = useAppStore((s) => s.setProspects);
  const addProspect = useAppStore((s) => s.addProspect);
  const toggleProspectSelected = useAppStore((s) => s.toggleProspectSelected);

  const meta = useMemo(
    () =>
      META_CLUSTERS.find((m) => m.id === metaId) ??
      customMeta.find((m) => m.id === metaId),
    [metaId, customMeta],
  );
  const cluster = useMemo(() => {
    if (!meta) return undefined;
    return (
      meta.clusters.find((c) => c.id === clusterId) ??
      (customClusters[meta.id] ?? []).find((c) => c.id === clusterId)
    );
  }, [meta, customClusters, clusterId]);

  const existingMap = clusterMaps[clusterId];
  const [saved, setSaved] = useState<boolean>(!!existingMap);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [pickingPin, setPickingPin] = useState(false);
  const [pendingLatLng, setPendingLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [loadingPlaces, setLoadingPlaces] = useState(false);

  const fetchPlaces = useServerFn(searchPlacesForCluster);
  const initRef = useRef(false);

  // Initialise cluster map and fetch prospects on first visit
  useEffect(() => {
    if (!meta || !cluster) return;
    if (initRef.current) return;
    initRef.current = true;

    if (!existingMap) {
      upsertClusterMap({
        metaId: meta.id,
        metaName: meta.name,
        clusterId: cluster.id,
        clusterName: cluster.name,
        prospects: [],
        selectedProspectIds: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      const cfg = clusterPlacesConfig(cluster.id);
      setLoadingPlaces(true);
      fetchPlaces({
        data: { textQuery: cfg.textQuery, lat: PANVEL_CENTER.lat, lng: PANVEL_CENTER.lng },
      })
        .then(({ places }) => {
          const prospects: Prospect[] = places.map((p) => ({
            id: p.id,
            name: p.name,
            lat: p.lat,
            lng: p.lng,
            placeId: p.id,
            locality: p.formattedAddress,
            source: "places",
          }));
          setProspects(cluster.id, prospects);
        })
        .catch((e) => console.error("Places fetch failed", e))
        .finally(() => setLoadingPlaces(false));
    }
  }, [meta, cluster, existingMap, upsertClusterMap, setProspects, fetchPlaces]);

  if (!meta || !cluster) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">Cluster not found.</div>
      </AppShell>
    );
  }

  const map = clusterMaps[cluster.id];
  const prospects = map?.prospects ?? [];
  const selectedIds = map?.selectedProspectIds ?? [];

  const handleSave = () => {
    setSaved(true);
  };

  if (saved && map) {
    return (
      <SavedView
        metaId={meta.id}
        clusterName={cluster.name}
        prospects={prospects.filter((p) => selectedIds.includes(p.id))}
        onDiscoverNew={() => navigate({ to: "/stage-1/$metaId", params: { metaId: meta.id } })}
      />
    );
  }

  return (
    <AppShell
      header={
        <StageHeader
          eyebrow="Create Cluster Map"
          title={cluster.name}
          subtitle={loadingPlaces ? "Finding prospects nearby…" : `${selectedIds.length} prospects selected`}
          backTo={`/stage-1/${meta.id}`}
        />
      }
      bottom={
        <BottomBar>
          <Button
            onClick={handleSave}
            disabled={selectedIds.length === 0}
            className="h-12 w-full bg-critical text-base font-semibold text-critical-foreground hover:bg-critical/90"
          >
            <Save className="h-4 w-4" /> Save Cluster Map
          </Button>
        </BottomBar>
      }
    >
      <div className="relative h-[calc(100vh-13rem)] min-h-[420px] w-full">
        <GoogleMap
          prospects={prospects}
          selectedIds={selectedIds}
          onToggle={(id) => toggleProspectSelected(cluster.id, id)}
          pickingPin={pickingPin}
          onPinDropped={(latLng) => {
            setPickingPin(false);
            setPendingLatLng(latLng);
            setSheetOpen(true);
          }}
        />
        {pickingPin && (
          <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-navy px-3 py-1.5 text-xs font-medium text-navy-foreground shadow-lg">
            Tap anywhere on the map to drop a pin
          </div>
        )}
      </div>

      <FAB onClick={() => setSheetOpen(true)} label="Add prospect" icon={<Plus className="h-5 w-5" />}>
        Add Prospect
      </FAB>

      <AddProspectSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onStartPinPick={() => setPickingPin(true)}
        pendingLatLng={pendingLatLng}
        onClearPending={() => setPendingLatLng(null)}
        onSubmit={(d) => {
          const id = `manual-${Date.now()}`;
          addProspect(cluster.id, {
            id,
            name: d.name,
            lat: d.lat,
            lng: d.lng,
            locality: d.locality,
            source: "manual",
          });
        }}
      />
    </AppShell>
  );
}

function SavedView({
  metaId,
  clusterName,
  prospects,
  onDiscoverNew,
}: {
  metaId: string;
  clusterName: string;
  prospects: Prospect[];
  onDiscoverNew: () => void;
}) {
  const navigate = useNavigate();
  return (
    <AppShell
      header={
        <StageHeader
          eyebrow="Cluster Map Saved"
          title={clusterName}
          subtitle={`${prospects.length} prospects in your map`}
          backTo={`/stage-1/${metaId}`}
        />
      }
      bottom={
        <BottomBar>
          <div className="flex gap-2">
            <Button variant="outline" className="h-12 flex-1" onClick={() => navigate({ to: "/stage-1" })}>
              All stages
            </Button>
            <Button
              onClick={onDiscoverNew}
              className="h-12 flex-1 bg-critical text-critical-foreground hover:bg-critical/90"
            >
              Discover a New Cluster
            </Button>
          </div>
        </BottomBar>
      }
    >
      <div className="relative h-[55vh] min-h-[340px] w-full">
        <GoogleMap
          prospects={prospects}
          selectedIds={prospects.map((p) => p.id)}
          onToggle={() => {}}
          pickingPin={false}
          readOnly
        />
      </div>
      <div className="space-y-3 px-5 py-5">
        <div className="rounded-2xl border border-critical/30 bg-critical/5 p-4">
          <div className="flex items-center gap-2 text-critical">
            <CheckCircle2 className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-wider">Map saved</p>
          </div>
          <p className="mt-1 text-sm text-foreground">
            Stage 2 (Shortlist Clusters) is now unlocked.
          </p>
        </div>
        <ul className="space-y-1.5">
          {prospects.slice(0, 8).map((p) => (
            <li key={p.id} className="flex items-start gap-2 text-sm">
              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-critical" />
              <div>
                <p className="font-medium text-foreground">{p.name}</p>
                {p.locality && <p className="text-xs text-muted-foreground">{p.locality}</p>}
              </div>
            </li>
          ))}
          {prospects.length > 8 && (
            <li className="text-xs text-muted-foreground">+ {prospects.length - 8} more</li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
