import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { useAppStore, SALES_STAGES, SALES_STAGE_LABEL, type SalesStage } from "@/store/appStore";
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

function ClusterFunnelPage() {
  const { clusterId } = Route.useParams();
  const cluster = getCluster(clusterId);
  const navigate = useNavigate();

  const prospects = useAppStore((s) => s.clusters[clusterId]?.prospects ?? []);
  const stages = useAppStore((s) => s.sales.prospectStages[clusterId] ?? {});
  const activity = useAppStore((s) => s.sales.prospectActivity);
  const seed = useAppStore((s) => s.seedSalesStages);

  const [openStage, setOpenStage] = useState<SalesStage | null>(null);

  useEffect(() => {
    if (prospects.length > 0) seed(clusterId, prospects.map((p) => p.id));
  }, [clusterId, prospects, seed]);

  // Filter out "not interested" from counts.
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

  const maxW = 320;
  const widths: Record<SalesStage, number> = {
    prospects: maxW,
    contacted: Math.round(maxW * 0.85),
    decision: Math.round(maxW * 0.7),
    closure: Math.round(maxW * 0.55),
    ongoing: Math.round(maxW * 0.4),
  };
  const colors: Record<SalesStage, string> = {
    prospects: "bg-navy text-navy-foreground",
    contacted: "bg-navy/85 text-navy-foreground",
    decision: "bg-critical/80 text-critical-foreground",
    closure: "bg-critical text-critical-foreground",
    ongoing: "bg-green-600 text-white",
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Customer Management Funnel"
          title={cluster.name}
          subtitle="Tap a stage to move prospects forward."
          backTo="/sales-enablement"
        />
      }
    >
      <div className="space-y-4 px-5 py-5">
        <div className="flex flex-col items-center gap-2">
          {SALES_STAGES.map((s) => {
            const count = visibleByStage[s].length;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setOpenStage(s)}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-4 py-3 shadow-sm transition-transform hover:scale-[1.02]",
                  colors[s],
                )}
                style={{ width: widths[s] }}
              >
                <span className="text-sm font-semibold leading-tight">{SALES_STAGE_LABEL[s]}</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{count}</span>
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground">
          {prospects.length} total prospects in this cluster
        </p>
      </div>

      <Dialog open={openStage !== null} onOpenChange={(o) => !o && setOpenStage(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {openStage ? SALES_STAGE_LABEL[openStage] : ""} —{" "}
              {openStage ? visibleByStage[openStage].length : 0} prospects
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto">
            {openStage && visibleByStage[openStage].length === 0 && (
              <p className="text-sm text-muted-foreground">No prospects in this stage.</p>
            )}
            {openStage &&
              visibleByStage[openStage].map((p) => (
                <Link
                  key={p.id}
                  to="/sales-enablement/$clusterId/$prospectId"
                  params={{ clusterId, prospectId: p.id }}
                  onClick={() => setOpenStage(null)}
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

      {/* prevent unused-warning when this file is included in tree */}
      <span hidden onClick={() => navigate({ to: "/sales-enablement" })} />
    </AppShell>
  );
}
