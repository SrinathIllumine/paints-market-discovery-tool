import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex w-full gap-1.5">
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={cn(
              "flex-1 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-navy bg-navy text-navy-foreground"
                : "border-border bg-card text-foreground hover:bg-muted",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
