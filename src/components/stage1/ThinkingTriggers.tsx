import { Lightbulb } from "lucide-react";

export function ThinkingTriggers({ items }: { items: string[] }) {
  return (
    <div className="mt-10 rounded-2xl border border-dashed border-border bg-muted/30 p-5">
      <div className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
        <Lightbulb className="h-3.5 w-3.5" />
        Thinking triggers
      </div>
      <ul className="grid gap-2 text-sm text-muted-foreground md:grid-cols-3">
        {items.map((t) => (
          <li key={t} className="leading-relaxed italic">
            “{t}”
          </li>
        ))}
      </ul>
    </div>
  );
}
