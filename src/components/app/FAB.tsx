import { Plus } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function FAB({
  onClick,
  children,
  className,
  icon = <Plus className="h-5 w-5" />,
  label,
}: {
  onClick: () => void;
  children?: ReactNode;
  className?: string;
  icon?: ReactNode;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        "absolute bottom-6 right-5 z-20 flex h-14 items-center gap-2 rounded-full bg-critical px-5 text-sm font-semibold text-critical-foreground shadow-lg shadow-critical/30 transition-transform active:scale-95",
        className,
      )}
    >
      {icon}
      {children}
    </button>
  );
}
