import { Lightbulb } from "lucide-react";

export function TriggerCard({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
      <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-critical/70" />
      <p>{text}</p>
    </div>
  );
}
