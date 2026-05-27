import { Cluster, POTENTIAL_LABEL } from "@/data/clusters";
import { cn } from "@/lib/utils";

const ring: Record<"H" | "M" | "L", string> = {
  H: "from-critical/15 to-critical/5 ring-critical/30",
  M: "from-amber-200/40 to-amber-50 ring-amber-300/50",
  L: "from-muted to-muted/40 ring-border",
};

const pill: Record<"H" | "M" | "L", string> = {
  H: "bg-critical text-critical-foreground",
  M: "bg-amber-500 text-white",
  L: "bg-muted-foreground text-background",
};

export function BubbleCircle({
  cluster,
  onClick,
  badge,
}: {
  cluster: Cluster;
  onClick: () => void;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2"
    >
      <div
        className={cn(
          "relative flex aspect-square w-full items-center justify-center rounded-full bg-gradient-to-br p-3 text-center ring-1 transition-transform group-hover:scale-[1.03] group-active:scale-95",
          ring[cluster.potential],
        )}
      >
        <span className="line-clamp-3 px-1 font-display text-sm leading-tight text-foreground">
          {cluster.name}
        </span>
        <span
          className={cn(
            "absolute -top-1 right-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider shadow-sm",
            pill[cluster.potential],
          )}
          title={`${POTENTIAL_LABEL[cluster.potential]} potential`}
        >
          {POTENTIAL_LABEL[cluster.potential]}
        </span>
        {badge && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-navy px-2 py-0.5 text-[10px] font-semibold text-navy-foreground shadow">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
