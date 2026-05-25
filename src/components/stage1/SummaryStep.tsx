import type { Cluster, MetaCluster, Prospect } from "@/data/clusters";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Lock, Pencil } from "lucide-react";

type ProspectExt = Prospect & { clusterId: string; clusterName: string };

export function SummaryStep({
  meta,
  clusters,
  prospects,
  onEdit,
}: {
  meta: MetaCluster;
  clusters: Cluster[];
  prospects: ProspectExt[];
  onEdit: () => void;
}) {
  return (
    <section className="mx-auto max-w-5xl px-6 py-12 md:px-10">
      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm md:p-10">
        <div className="flex items-center gap-3 text-primary">
          <CheckCircle2 className="h-6 w-6" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em]">
            Cluster Map saved
          </span>
        </div>
        <h2 className="mt-3 font-display text-4xl">Your Panvel cluster intelligence</h2>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This map becomes the foundation for shortlisting, connecting and building trust with the
          right ecosystems in your geography.
        </p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Meta-cluster</p>
            <p className="mt-2 font-display text-2xl">{meta.name}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Clusters</p>
            <p className="mt-2 font-display text-2xl">{clusters.length}</p>
          </div>
          <div className="rounded-2xl bg-muted/40 p-5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">Prospects</p>
            <p className="mt-2 font-display text-2xl">{prospects.length}</p>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          {clusters.map((c) => {
            const items = prospects.filter((p) => p.clusterId === c.id);
            return (
              <div key={c.id} className="rounded-xl border border-border p-5">
                <p className="font-semibold text-foreground">{c.name}</p>
                <ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                  {items.map((p) => (
                    <li key={p.id}>
                      • {p.name}
                      <span className="text-xs"> — {p.locality}</span>
                    </li>
                  ))}
                  {items.length === 0 && (
                    <li className="italic">No prospects mapped in this cluster.</li>
                  )}
                </ul>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Lock className="h-4 w-4" />
            Stage 2 — Shortlist Clusters — unlocks once specs are provided.
          </div>
          <Button variant="outline" onClick={onEdit} className="rounded-full">
            <Pencil className="h-4 w-4" /> Edit cluster map
          </Button>
        </div>
      </div>
    </section>
  );
}
