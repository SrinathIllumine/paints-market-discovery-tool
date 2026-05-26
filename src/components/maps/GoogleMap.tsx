import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/googleMaps";
import { PANVEL_CENTER } from "@/data/clusters";
import type { Prospect } from "@/store/appStore";
import { Layers } from "lucide-react";

export type GoogleMapHandle = {
  map: google.maps.Map | null;
};

type Props = {
  prospects: Prospect[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  pickingPin: boolean;
  onPinDropped?: (latLng: { lat: number; lng: number }) => void;
  readOnly?: boolean;
};

export function GoogleMap({
  prospects,
  selectedIds,
  onToggle,
  pickingPin,
  onPinDropped,
  readOnly,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map());
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const clickListenerRef = useRef<google.maps.MapsEventListener | null>(null);
  const [ready, setReady] = useState(false);
  const [mapType, setMapType] = useState<"roadmap" | "hybrid">("roadmap");

  // Init map
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then((g) => {
        if (cancelled || !containerRef.current) return;
        mapRef.current = new g.maps.Map(containerRef.current, {
          center: PANVEL_CENTER,
          zoom: 12,
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

  // Pin-drop mode
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

  // Sync markers
  useEffect(() => {
    if (!ready || !mapRef.current || !window.google) return;
    const g = window.google;
    const map = mapRef.current;
    const existing = markersRef.current;
    const nextIds = new Set(prospects.map((p) => p.id));
    // Remove gone
    for (const [id, marker] of existing) {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        existing.delete(id);
      }
    }
    // Add/update
    for (const p of prospects) {
      const isSelected = selectedIds.includes(p.id);
      let marker = existing.get(p.id);
      const icon = {
        path: g.maps.SymbolPath.CIRCLE,
        scale: isSelected ? 9 : 7,
        fillColor: isSelected ? "#dc2626" : "#94a3b8",
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
  }, [ready, prospects, selectedIds, onToggle, readOnly]);

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
