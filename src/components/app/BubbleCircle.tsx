import { Sparkles, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function BubbleCircle({
  title,
  subtitle,
  recommended,
  adjacent,
  mapped,
  trailing,
  onClick,
}: {
  title: string;
  subtitle?: string;
  recommended?: boolean;
  adjacent?: boolean;
  mapped?: boolean;
  trailing?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative flex w-[100px] shrink-0 snap-start flex-col items-center"
    >
      <div
        className={cn(
          "relative flex h-[100px] w-[100px] items-center justify-center rounded-full border bg-card p-2 text-center shadow-md transition-all active:scale-95 group-hover:shadow-lg",
          recommended
            ? "border-critical/50 bg-gradient-to-br from-critical/10 to-critical/0 ring-2 ring-critical/20"
            : adjacent
              ? "border-navy/30 bg-gradient-to-br from-navy/5 to-transparent"
              : "border-border",
        )}
      >
        {recommended && (
          <span className="absolute -top-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-critical px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-critical-foreground shadow">
            <Sparkles className="h-2 w-2" /> Top
          </span>
        )}
        {!recommended && adjacent && (
          <span className="absolute -top-2 left-1/2 inline-flex -translate-x-1/2 items-center rounded-full bg-navy px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider text-navy-foreground shadow">
            Adjacent
          </span>
        )}
        {mapped && (
          <span className="absolute bottom-0 right-0 inline-flex items-center rounded-full bg-critical p-1 text-critical-foreground shadow">
            <CheckCircle2 className="h-3 w-3" />
          </span>
        )}
        <span className="line-clamp-3 text-[10px] font-semibold leading-tight text-foreground">
          {title}
        </span>
      </div>
      {subtitle && (
        <span className="mt-1.5 line-clamp-1 text-[9px] text-muted-foreground">
          {subtitle}
        </span>
      )}
      {trailing && <div className="mt-1">{trailing}</div>}
    </button>
  );
}

export function BubbleScroller({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {children}
    </div>
  );
}
