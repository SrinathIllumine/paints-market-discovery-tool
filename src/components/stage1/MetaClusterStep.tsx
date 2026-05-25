import { META_CLUSTERS, TRIGGERS_META, type MetaCluster } from "@/data/clusters";
import { Bubble } from "./Bubble";
import { ThinkingTriggers } from "./ThinkingTriggers";
import { AddItemDialog } from "./AddItemDialog";

export function MetaClusterStep({
  customMeta,
  selectedId,
  onSelect,
  onAdd,
}: {
  customMeta: MetaCluster[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAdd: (name: string) => void;
}) {
  const all = [...META_CLUSTERS, ...customMeta];
  // Recommended first
  const sorted = [...all].sort((a, b) => Number(!!b.recommended) - Number(!!a.recommended));

  return (
    <section className="mx-auto max-w-7xl px-6 py-10 md:px-10">
      <div className="mb-8 max-w-2xl">
        <h2 className="font-display text-3xl md:text-4xl">Pick a meta-cluster to explore</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Start with a broad lens on the demand landscape in Panvel. Recommended bubbles reflect the
          strongest signals from local infrastructure and construction intelligence.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {sorted.map((m) => (
          <Bubble
            key={m.id}
            label={m.short ?? m.name}
            recommended={m.recommended}
            selected={selectedId === m.id}
            size={m.recommended ? "lg" : "md"}
            onClick={() => onSelect(m.id)}
          />
        ))}
        <div className="self-center">
          <AddItemDialog
            triggerLabel="Add missing meta-cluster"
            title="Add a meta-cluster"
            description="Capture a segment you see in your geography that isn't already listed."
            onAdd={(d) => onAdd(d.name)}
          />
        </div>
      </div>

      <ThinkingTriggers items={TRIGGERS_META} />
    </section>
  );
}
