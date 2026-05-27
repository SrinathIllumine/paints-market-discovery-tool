import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { PANVEL_CENTER } from "@/data/clusters";
import type { Prospect } from "@/store/appStore";
import type { Region } from "@/lib/regions";
import { convexHull } from "@/lib/regions";
import { Layers } from "lucide-react";

type Props = {
  prospects: Prospect[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  pickingPin: boolean;
  onPinDropped?: (latLng: { lat: number; lng: number }) => void;
  readOnly?: boolean;
  regions?: Region[];
  boundary?: { lat: number; lng: number }[];
};

export function GoogleMap({
  prospects,
  selectedIds,
  onToggle,
  pickingPin,
  onPinDropped,
  readOnly,
  regions,
  boundary,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const polygonsRef = useRef<google.maps.Polygon[]>([]);
  const boundaryRef = useRef<google.maps.Polygon | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [ready, setReady] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");

  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new g.maps.Map(containerRef.current, {
          center: PANVEL_CENTER,
          zoom: 11,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: "greedy",
        });
        infoRef.current = new g.maps.InfoWindow();
        setReady(true);
      })
      .catch((err) => console.error("Maps load failed", err));
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current) mapRef.current.setMapTypeId(mapType);
  }, [mapType]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    if (clickListenerRef.current) {
      clickListenerRef.current.remove();
      clickListenerRef.current = null;
    }
    const el = containerRef.current;
    if (el) el.style.cursor = pickingPin ? "crosshair" : "";
    if (pickingPin && onPinDropped) {
      clickListenerRef.current = mapRef.current.addListener(
        "click",
        (e: google.maps.MapMouseEvent) => {
          if (!e.latLng) return;
          onPinDropped({ lat: e.latLng.lat(), lng: e.latLng.lng() });
        },
      );
    }
    return () => {
      if (clickListenerRef.current) {
        clickListenerRef.current.remove();
        clickListenerRef.current = null;
      }
    };
  }, [ready, pickingPin, onPinDropped]);

  // Color lookup per prospect
  const colorById = new Map<string, string>();
  if (regions) {
    for (const r of regions) for (const p of r.prospects) colorById.set(p.id, r.color);
  }

  // Markers
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    const g = window.google;
    const map = mapRef.current;
    const existing = markersRef.current;
    const nextIds = new Set(prospects.map((p) => p.id));
    for (const [id, marker] of existing) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    }
    for (const p of prospects) {
      const isSelected = selectedIds.includes(p.id);
      const regionColor = colorById.get(p.id);
      const baseColor = regionColor ?? (isSelected ? "#dc2626" : "#94a3b8");
      let marker = existing.get(p.id);
      const icon = {
        path: g.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 8 : 6,
        fillColor: baseColor,
        fillOpacity: 1,
        strokeColor: "#ffffff",
        strokeWeight: 2,
      };
      if (!marker) {
        marker = new g.maps.Marker({
          position: { lat: p.lat, lng: p.lng },
          map,
          title: p.name,
          icon,
        });
        marker.addListener("click", () => {
          if (!infoRef.current) return;
          const isSel = selectedIds.includes(p.id);
          const html = `
            <div style="font-family: Manrope, sans-serif; min-width:180px">
              <div style="font-weight:600;font-size:13px;color:#0f172a;margin-bottom:2px">${escapeHtml(p.name)}</div>
              ${p.locality ? `<div style="font-size:11px;color:#64748b">${escapeHtml(p.locality)}</div>` : ""}
              ${readOnly ? "" : `<button id="toggle-${p.id}" style="margin-top:8px;background:${isSel ? "#e2e8f0" : "#dc2626"};color:${isSel ? "#0f172a" : "#fff"};border:none;padding:6px 10px;border-radius:8px;font-weight:600;font-size:12px;cursor:pointer">${isSel ? "Remove from map" : "Add to map"}</button>`}
            </div>`;
          infoRef.current.setContent(html);
          infoRef.current.open({ map, anchor: marker });
          if (!readOnly) {
            setTimeout(() => {
              const btn = document.getElementById(`toggle-${p.id}`);
              if (btn) btn.onclick = () => {
                onToggle(p.id);
                infoRef.current?.close();
              };
            }, 0);
          }
        });
        existing.set(p.id, marker);
      } else {
        marker.setPosition({ lat: p.lat, lng: p.lng });
        marker.setIcon(icon);
      }
    }
  }, [ready, prospects, selectedIds, onToggle, readOnly, regions]);

  // Region polygons (dotted, convex-hull)
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    const g = window.google;
    for (const poly of polygonsRef.current) poly.setMap(null);
    polygonsRef.current = [];
    if (!regions) return;

    const dashSymbol = {
      path: "M 0,-1 0,1",
      strokeOpacity: 1,
      scale: 3,
    };

    for (const r of regions) {
      if (r.prospects.length < 3) continue;
      const hull = convexHull(r.prospects.map((p) => ({ lat: p.lat, lng: p.lng })));
      const poly = new g.maps.Polygon({
        paths: hull,
        strokeOpacity: 0,
        strokeColor: r.color,
        fillColor: r.color,
        fillOpacity: 0.08,
        icons: [{ icon: dashSymbol, offset: "0", repeat: "12px" }],
        map: mapRef.current,
        clickable: false,
      });
      polygonsRef.current.push(poly);
    }
  }, [ready, regions]);

  // Panvel boundary
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    const g = window.google;
    if (boundaryRef.current) {
      boundaryRef.current.setMap(null);
      boundaryRef.current = null;
    }
    if (!boundary || boundary.length < 3) return;
    boundaryRef.current = new g.maps.Polygon({
      paths: boundary,
      strokeOpacity: 0,
      strokeColor: "#0f172a",
      fillColor: "#0f172a",
      fillOpacity: 0.03,
      icons: [
        {
          icon: { path: "M 0,-1 0,1", strokeOpacity: 1, scale: 4, strokeColor: "#0f172a" },
          offset: "0",
          repeat: "16px",
        },
      ],
      map: mapRef.current,
      clickable: false,
    });
  }, [ready, boundary]);

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      {ready && (
        <button
          type="button"
          onClick={() => setMapType((t) => (t === "roadmap" ? "hybrid" : "roadmap"))}
          className="absolute right-3 top-3 z-10 flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-xs font-medium shadow-md"
          aria-label="Toggle satellite"
        >
          <Layers className="h-3.5 w-3.5" /> {mapType === "roadmap" ? "Satellite" : "Map"}
        </button>
      )}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/40 text-sm text-muted-foreground">
          Loading map…
        </div>
      )}
    </div>
  );
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!,
  );
}
