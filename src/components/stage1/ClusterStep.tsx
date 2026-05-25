import { Bubble } from "./Bubble";
import { ThinkingTriggers } from "./ThinkingTriggers";
import { AddItemDialog } from "./AddItemDialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TRIGGERS_CLUSTER, type MetaCluster } from "@/data/clusters";

export function ClusterStep({
  meta,
  selectedIds,
  onToggle,
  onAdd,
  onBack,
  onNext,
}: {
  meta: MetaCluster;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onAdd: (name: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const sorted = [...meta.clusters].sort(
    (a, b) => Number(!!b.recommended) - Number(!!a.recommended),
  );
  const canNext = selectedIds.length > 0;

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Meta-cluster</p>
          <h2 className="mt-1 font-display text-3xl md:text-4xl">{meta.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Select the clusters you want to map in Panvel. Multiple selections are encouraged — you
            are building an intelligence asset, not filling a form.
          </p>
        </div>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-5 md:gap-6">
        {sorted.map((c) => (
          <Bubble
            key={c.id}
            label={c.name}
            recommended={c.recommended}
            selected={selectedIds.includes(c.id)}
            size="sm"
            onClick={() => onToggle(c.id)}
          />
        ))}
        <div className="self-center">
          <AddItemDialog
            triggerLabel="Add missing cluster"
            title="Add a cluster"
            description={`Add a cluster inside ${meta.name}.`}
            onAdd={(d) => onAdd(d.name)}
          />
        </div>
      </div>

      <ThinkingTriggers items={TRIGGERS_CLUSTER} />

      <div className="mt-10 flex justify-end">
        <Button size="lg" disabled={!canNext} onClick={onNext} className="rounded-full">
          Map prospects <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
