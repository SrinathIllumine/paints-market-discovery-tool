import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import {
  useAppStore,
  SALES_STAGES,
  SALES_STAGE_LABEL,
  EMPTY_PROSPECTS,
  EMPTY_STAGE_MAP,
  type SalesStage,
} from "@/store/appStore";
import { getCluster } from "@/data/clusters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/sales-enablement/$clusterId/")({
  component: ClusterFunnelPage,
});

// Visual proportions for a tapered funnel (top to bottom).
const FUNNEL_WIDTHS: Record<SalesStage, number> = {
  prospects: 100,
  contacted: 86,
  decision: 72,
  closure: 58,
  ongoing: 44,
};

const STAGE_THEME: Record<SalesStage, { bg: string; ring: string; pill: string; text: string }> = {
  prospects: { bg: "from-navy to-navy/80",          ring: "ring-navy/40",          pill: "bg-white/15 text-white", text: "text-white" },
  contacted: { bg: "from-navy/85 to-navy/65",       ring: "ring-navy/30",          pill: "bg-white/15 text-white", text: "text-white" },
  decision:  { bg: "from-amber-500 to-amber-400",   ring: "ring-amber-300/40",     pill: "bg-white/25 text-white", text: "text-white" },
  closure:   { bg: "from-critical to-critical/80",  ring: "ring-critical/30",      pill: "bg-white/20 text-white", text: "text-white" },
  ongoing:   { bg: "from-green-600 to-green-500",   ring: "ring-green-400/40",     pill: "bg-white/25 text-white", text: "text-white" },
};

function ClusterFunnelPage() {
  const { clusterId } = Route.useParams();
  const cluster = getCluster(clusterId);

  const prospects = useAppStore((s) => s.clusters[clusterId]?.prospects ?? EMPTY_PROSPECTS);
  const stages = useAppStore((s) => s.sales.prospectStages[clusterId] ?? EMPTY_STAGE_MAP);
  const activity = useAppStore((s) => s.sales.prospectActivity);
  const seed = useAppStore((s) => s.seedSalesStages);

  const [openStage, setOpenStage] = useState<SalesStage | null>(null);
  const [search, setSearch] = useState("");

  // Seed only once per cluster — guarded both at store level and here.
  const prospectIds = useMemo(() => prospects.map((p) => p.id), [prospects]);
  useEffect(() => {
    if (prospectIds.length > 0) seed(clusterId, prospectIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clusterId, prospectIds.length]);

  const visibleByStage = useMemo(() => {
    const out: Record<SalesStage, typeof prospects> = {
      prospects: [], contacted: [], decision: [], closure: [], ongoing: [],
    };
    for (const p of prospects) {
      if (activity[p.id]?.notInterested) continue;
      const st = stages[p.id] ?? "prospects";
      out[st].push(p);
    }
    return out;
  }, [prospects, stages, activity]);

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
          eyebrow="Customer Management Funnel"
          title={cluster.name}
          subtitle="Tap a stage band to move prospects forward."
          backTo="/sales-enablement"
        />
      }
    >
      <div className="space-y-3 px-5 py-6">
        <div className="rounded-3xl border border-border bg-gradient-to-b from-muted/40 to-card p-5 shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
            {SALES_STAGES.map((s, i) => {
              const widthPct = FUNNEL_WIDTHS[s];
              const theme = STAGE_THEME[s];
              const count = visibleByStage[s].length;
              const nextW = i < SALES_STAGES.length - 1 ? FUNNEL_WIDTHS[SALES_STAGES[i + 1]] : widthPct - 6;
              // Tapered trapezoid via clip-path: pinch in toward the next stage's width.
              const insetPct = (widthPct - nextW) / 2;
              const clip = `polygon(0 0, 100% 0, ${100 - (insetPct / widthPct) * 100}% 100%, ${(insetPct / widthPct) * 100}% 100%)`;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setOpenStage(s)}
                  style={{ width: `${widthPct}%`, clipPath: clip }}
                  className={cn(
                    "group relative h-16 bg-gradient-to-b ring-1 transition-transform hover:-translate-y-0.5 hover:shadow-lg",
                    theme.bg,
                    theme.ring,
                  )}
                >
                  <div className={cn("flex h-full items-center justify-center gap-3 px-4", theme.text)}>
                    <span className="truncate text-sm font-semibold leading-tight drop-shadow">
                      {SALES_STAGE_LABEL[s]}
                    </span>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-bold", theme.pill)}>
                      {count}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            {prospects.length} total prospects in this cluster
          </p>
        </div>

        <p className="text-center text-[11px] text-muted-foreground">
          Tap any band to view and update prospects in that stage.
        </p>
      </div>

      <Dialog open={openStage !== null} onOpenChange={(o) => { if (!o) { setOpenStage(null); setSearch(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {openStage ? SALES_STAGE_LABEL[openStage] : ""} —{" "}
              {openStage ? visibleByStage[openStage].length : 0} prospects
            </DialogTitle>
          </DialogHeader>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search prospects in this stage…"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {openStage && visibleByStage[openStage].length === 0 && (
              <p className="text-sm text-muted-foreground">No prospects in this stage.</p>
            )}
            {openStage &&
              visibleByStage[openStage]
                .filter((p) => {
                  const q = search.trim().toLowerCase();
                  if (!q) return true;
                  return p.name.toLowerCase().includes(q) || (p.locality ?? "").toLowerCase().includes(q);
                })
                .map((p) => (
                  <Link
                    key={p.id}
                    to="/sales-enablement/$clusterId/$prospectId"
                    params={{ clusterId, prospectId: p.id }}
                    onClick={() => { setOpenStage(null); setSearch(""); }}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{p.name}</p>
                      {p.locality && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{p.locality}</p>
                      )}
                    </div>
                    <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
