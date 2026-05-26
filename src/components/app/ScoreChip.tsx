import { cn } from "@/lib/utils";
import { scoreBand } from "@/lib/scoring";

export function ScoreChip({ total }: { total: number }) {
  const band = scoreBand(total);
  return (
    <span
      className={cn(
        "inline-flex items-baseline gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
        band.tone === "high" && "bg-critical/10 text-critical",
        band.tone === "mid" && "bg-navy/10 text-navy",
        band.tone === "low" && "bg-muted text-muted-foreground",
      )}
    >
      <span className="text-base leading-none">{total}</span>
      <span className="text-[10px] uppercase tracking-wider">{band.label}</span>
    </span>
  );
}
