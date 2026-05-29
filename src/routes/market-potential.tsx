import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS, getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { MapPin, TrendingUp, Layers, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/market-potential")({
  head: () => ({
    meta: [
      { title: "Market Potential Map" },
      { name: "description", content: "Shortlisted clusters that form your market potential map." },
    ],
  }),
  component: MarketPotentialPage,
});



function MarketPotentialPage() {
  const shortlistedIds = useAppStore((s) => s.plan.targetClusterIds);
  const clusterStates = useAppStore((s) => s.clusters);
  const toggleTargetCluster = useAppStore((s) => s.toggleTargetCluster);

  const rows = shortlistedIds
    .map((id) => getCluster(id))
    .filter((c): c is NonNullable<ReturnType<typeof getCluster>> => Boolean(c))
    .map((c) => ({
      cluster: c,
      prospects: clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate,
    }));

  const totalProspects = rows.reduce((n, r) => n + r.prospects, 0);
  
  const highCount = rows.filter((r) => r.cluster.potential === "H").length;

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Market Potential Map"
          title="Your shortlisted clusters"
          subtitle="Updates each time you shortlist a new cluster."
          backTo="/map"
        />
      }
    >
      <div className="space-y-5 px-5 py-5">
        {rows.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            No clusters shortlisted yet. Open a cluster card and tap “Shortlist this cluster to my market map”.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3">
              <StatTile icon={<Layers className="h-4 w-4" />} label="Clusters" value={String(rows.length)} />
              <StatTile icon={<TrendingUp className="h-4 w-4" />} label="High potential" value={String(highCount)} />
              <StatTile icon={<MapPin className="h-4 w-4" />} label="Prospects" value={String(totalProspects)} />
            </div>

            <section className="space-y-2">
              <h2 className="font-display text-xl px-1">Shortlisted clusters</h2>
              {rows.map(({ cluster, prospects }) => (
                <div
                  key={cluster.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-display text-lg leading-tight">{cluster.name}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{cluster.nature}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-critical/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-critical">
                      {POTENTIAL_LABEL[cluster.potential]}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cluster.demandTags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-foreground">
                      {prospects} prospects
                    </span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toggleTargetCluster(cluster.id);
                        toast.success("Cluster removed from your market map", { duration: 1800 });
                      }}
                      className="h-8 gap-1 text-xs"
                    >
                      <X className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </div>
                </div>
              ))}
            </section>
          </>
        )}
      </div>
    </AppShell>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center shadow-sm">
      <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-critical/10 text-critical">
        {icon}
      </div>
      <p className="mt-1 font-display text-xl leading-none">{value}</p>
      <p className="mt-1 text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

void CLUSTERS;
