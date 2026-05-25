import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Prospect } from "@/data/clusters";
import { Button } from "@/components/ui/button";
import { MapPin, X } from "lucide-react";

export function MapView({
  prospects,
  selectedIds,
  onToggle,
}: {
  prospects: (Prospect & { clusterName: string })[];
  selectedIds: string[];
  onToggle: (id: string) => void;
}) {
  const [openPin, setOpenPin] = useState<string | null>(null);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-map-bg shadow-inner">
      {/* Stylised Panvel map */}
      <svg viewBox="0 0 400 300" className="absolute inset-0 h-full w-full">
        {/* land mass */}
        <path
          d="M10,80 Q60,40 140,55 Q220,30 300,70 Q380,100 380,180 Q360,260 280,275 Q180,295 100,265 Q20,230 10,160 Z"
          fill="var(--map-land)"
          stroke="var(--border)"
          strokeWidth="1"
        />
        {/* water inlet (right side — Panvel creek) */}
        <path
          d="M380,180 Q360,260 280,275 L400,300 L400,150 Z"
          fill="var(--map-water)"
          opacity="0.6"
        />
        {/* major roads */}
        <g stroke="var(--map-road)" strokeWidth="3" fill="none" strokeLinecap="round">
          {/* Mumbai-Pune Expressway diagonal */}
          <path d="M20,250 Q150,180 380,90" strokeWidth="4" />
          {/* NH-48 */}
          <path d="M40,60 Q180,120 360,200" />
          {/* JNPT road */}
          <path d="M200,40 Q220,160 320,280" strokeWidth="2.5" />
          {/* local */}
          <path d="M80,140 Q200,150 320,140" strokeWidth="1.5" strokeDasharray="4 4" />
        </g>
        {/* labels */}
        <g fill="var(--muted-foreground)" fontSize="9" fontFamily="var(--font-sans)">
          <text x="50" y="100">Kharghar</text>
          <text x="180" y="155">Panvel</text>
          <text x="290" y="110">Taloja</text>
          <text x="160" y="240">Kalamboli</text>
          <text x="300" y="240">Ulwe</text>
          <text x="340" y="285" fill="var(--primary)">Creek</text>
        </g>
      </svg>

      {/* Pins */}
      {prospects.map((p) => {
        const isSel = selectedIds.includes(p.id);
        return (
          <div
            key={p.id}
            className="absolute -translate-x-1/2 -translate-y-full"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <button
              type="button"
              onClick={() => setOpenPin(openPin === p.id ? null : p.id)}
              className={cn(
                "group relative flex items-center justify-center transition-transform hover:scale-110",
                isSel && "scale-110",
              )}
            >
              <MapPin
                className={cn(
                  "h-7 w-7 drop-shadow-md transition-colors",
                  isSel ? "fill-primary text-primary" : "fill-card text-muted-foreground",
                )}
                strokeWidth={1.5}
              />
            </button>
            {openPin === p.id && (
              <div className="absolute left-1/2 top-0 z-10 w-56 -translate-x-1/2 -translate-y-[calc(100%+8px)] rounded-xl border border-border bg-popover p-3 text-left shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.locality}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                      {p.clusterName}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenPin(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <Button
                  size="sm"
                  variant={isSel ? "secondary" : "default"}
                  className="mt-3 w-full"
                  onClick={() => {
                    onToggle(p.id);
                  }}
                >
                  {isSel ? "Remove from map" : "Add to cluster map"}
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
