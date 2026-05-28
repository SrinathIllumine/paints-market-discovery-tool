import { Cluster } from "@/data/clusters";

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
        className="relative flex aspect-square w-full items-center justify-center rounded-full bg-white p-3 text-center text-black border-2 border-black shadow-lg transition-transform group-hover:scale-[1.03] group-active:scale-95"
      >
        <span className="line-clamp-3 px-1 font-display text-sm leading-tight">
          {cluster.name}
        </span>
        {badge && (
          <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white border border-black px-2 py-0.5 text-[10px] font-semibold text-black shadow">
            {badge}
          </span>
        )}
      </div>
    </button>
  );
}
