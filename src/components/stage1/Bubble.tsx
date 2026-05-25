import { cn } from "@/lib/utils";

export function Bubble({
  label,
  recommended,
  selected,
  size = "md",
  onClick,
}: {
  label: string;
  recommended?: boolean;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}) {
  const dims =
    size === "lg"
      ? "h-44 w-44 text-sm md:h-48 md:w-48"
      : size === "sm"
      ? "h-32 w-32 text-xs"
      : "h-36 w-36 text-[13px] md:h-40 md:w-40";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex shrink-0 items-center justify-center rounded-full p-4 text-center font-medium leading-tight transition-all duration-300",
        "shadow-[0_4px_24px_-8px_oklch(0.5_0.1_240_/_0.25)] hover:-translate-y-1 hover:shadow-[0_12px_36px_-10px_oklch(0.5_0.1_240_/_0.35)]",
        dims,
        recommended
          ? "bg-bubble-recommended text-bubble-foreground"
          : "bg-bubble text-bubble-foreground",
        selected && "ring-4 ring-primary ring-offset-2 ring-offset-background",
        recommended && !selected && "ring-2 ring-recommended-ring/60",
      )}
    >
      {recommended && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-recommended-ring px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow">
          Recommended
        </span>
      )}
      <span className="whitespace-pre-line">{label}</span>
      {recommended && (
        <span aria-hidden className="pointer-events-none absolute inset-0 rounded-full bg-recommended-ring/0 transition-colors group-hover:bg-recommended-ring/5" />
      )}
    </button>
  );
}
