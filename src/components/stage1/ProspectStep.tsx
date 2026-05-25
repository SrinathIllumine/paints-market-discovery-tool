import { useMemo } from "react";
import type { Cluster, Prospect } from "@/data/clusters";
import { MapView } from "./MapView";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Check } from "lucide-react";
import { AddItemDialog } from "./AddItemDialog";

type ProspectExt = Prospect & { clusterId: string; clusterName: string };

export function ProspectStep({
  clusters,
  customProspects,
  selectedIds,
  onToggle,
  onAdd,
  onBack,
  onConfirm,
}: {
  clusters: Cluster[];
  customProspects: ProspectExt[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAdd: (clusterId: string, p: { name: string; locality?: string }) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const allProspects: ProspectExt[] = useMemo(() => {
    const base = clusters.flatMap((c) =>
      c.prospects.map((p) => ({ ...p, clusterId: c.id, clusterName: c.name })),
    );
    return [...base, ...customProspects];
  }, [clusters, customProspects]);

  const canConfirm = selectedIds.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Prospect map</p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">
            Map the prospects you'll engage
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Tap a pin to see the project. Add anything the map missed — local intelligence beats
            satellite data.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <MapView prospects={allProspects} selectedIds={selectedIds} onToggle={onToggle} />

        <div className="flex flex-col rounded-2xl border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl">Prospects</h3>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              {selectedIds.length} selected
            </span>
          </div>

          <ul className="max-h-[400px] flex-1 space-y-1 overflow-y-auto pr-2">
            {clusters.map((c) => {
              const items = allProspects.filter((p) => p.clusterId === c.id);
              if (items.length === 0) return null;
              return (
                <li key={c.id} className="pb-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {c.name}
                  </p>
                  <ul className="space-y-1">
                    {items.map((p) => {
                      const sel = selectedIds.includes(p.id);
                      return (
                        <li key={p.id}>
                          <label className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted/50">
                            <Checkbox
                              checked={sel}
                              onCheckedChange={() => onToggle(p.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-foreground">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.locality}</p>
                            </div>
                          </label>
                        </li>
                      );
                    })}
                    <li className="pt-1">
                      <AddItemDialog
                        triggerLabel="Add prospect"
                        title={`Add prospect to ${c.name}`}
                        withLocality
                        onAdd={(d) => onAdd(c.id, { name: d.name, locality: d.locality })}
                      />
                    </li>
                  </ul>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      <div className="mt-10 flex justify-end">
        <Button size="lg" disabled={!canConfirm} onClick={onConfirm} className="rounded-full">
          <Check className="h-4 w-4" /> Confirm & create Cluster Map
        </Button>
      </div>
    </section>
  );
}
