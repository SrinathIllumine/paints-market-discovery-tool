import { ChevronRight } from "lucide-react";
import { Cluster, POTENTIAL_LABEL } from "@/data/clusters";
import { cn } from "@/lib/utils";

const potentialClass: Record<"H" | "M" | "L", string> = {
  H: "bg-critical/10 text-critical",
  M: "bg-amber-100 text-amber-800",
  L: "bg-muted text-muted-foreground",
};

export function ClusterCard({
  cluster,
  onClick,
  rightSlot,
}: {
  cluster: Cluster;
  onClick: () => void;
  rightSlot?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:bg-muted/40"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate font-display text-lg leading-tight">{cluster.name}</h3>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
              potentialClass[cluster.potential],
            )}
          >
            {POTENTIAL_LABEL[cluster.potential]}
          </span>
        </div>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{cluster.description}</p>
        {rightSlot && <div className="mt-2">{rightSlot}</div>}
      </div>
      <ChevronRight className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
