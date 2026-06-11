import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { useAppStore } from "@/store/appStore";
import { getCluster } from "@/data/clusters";
import { ChevronRight, Users } from "lucide-react";

export const Route = createFileRoute("/sales-enablement/")({
  component: SalesEnablementLanding,
});

function SalesEnablementLanding() {
  const monthlyFocus = useAppStore((s) => s.plan.monthlyFocusIds);
  const targets = useAppStore((s) => s.plan.targetClusterIds);
  // Prefer the cluster chosen in the monthly plan; fall back to other mapped clusters.
  const shortlisted = monthlyFocus;

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="STAGE 3 OF 3 · SALES ENABLERS" title="Customer Management Funnel" />}
      subtitle="Pick a cluster from your monthly plan to manage its funnel."
    >
      <div className="space-y-6 px-6 py-8">
        {shortlisted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No cluster selected yet. Create a monthly plan or visit a cluster from the Cluster Potential page first.
          </div>
        ) : (
          shortlisted.map((id) => {
            const c = getCluster(id);
            if (!c) return null;
            return (
              <Link
                key={id}
                to="/sales-enablement/$clusterId"
                params={{ clusterId: id }}
                className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-critical/10 text-critical">
                  <Users className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-lg leading-tight">{c.name}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{c.description}</p>
                </div>
                <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />
              </Link>
            );
          })
        )}
      </div>
    </AppShell>
  );
}
