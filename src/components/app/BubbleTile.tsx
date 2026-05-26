import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function BubbleTile({
  title,
  subtitle,
  recommended,
  adjacent,
  onClick,
  trailing,
}: {
  title: string;
  subtitle?: string;
  recommended?: boolean;
  adjacent?: boolean;
  onClick: () => void;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex w-full items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-4 text-left shadow-sm transition-all active:scale-[0.99]",
        recommended
          ? "border-critical/40 ring-1 ring-critical/20"
          : "border-border",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {recommended && (
            <span className="inline-flex items-center gap-1 rounded-full bg-critical/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-critical">
              <Sparkles className="h-3 w-3" /> Recommended
            </span>
          )}
          {adjacent && !recommended && (
            <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              Adjacent
            </span>
          )}
        </div>
        <p className="mt-1.5 text-base font-semibold text-foreground">{title}</p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {trailing ?? <ChevronRight className="h-5 w-5 text-muted-foreground" />}
    </button>
  );
}
