import { createFileRoute } from "@tanstack/react-router";
import { AsmLayout } from "@/components/asm/AsmLayout";
import { PotentialAccessMatrix } from "@/components/shared/PotentialAccessMatrix";
import { ASM_GEO } from "@/data/geography";

export const Route = createFileRoute("/asm-analytics/")({
  head: () => ({
    meta: [
      { title: "Priority Matrix — ASM Analytics" },
      { name: "description", content: "Revenue potential plotted against DG access, across my whole territory." },
    ],
  }),
  component: AsmPriorityMatrixPage,
});

function AsmPriorityMatrixPage() {
  return (
    <AsmLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Priority Matrix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Revenue potential plotted against DG access, combined across Panvel, Khopoli, Karjat and Pen.
        </p>
      </div>

      <PotentialAccessMatrix geo={ASM_GEO} />
    </AsmLayout>
  );
}
