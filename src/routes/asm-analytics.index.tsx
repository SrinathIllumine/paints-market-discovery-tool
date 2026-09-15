import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AsmAreaFilter, AsmLayout } from "@/components/asm/AsmLayout";
import { PotentialAccessMatrix } from "@/components/shared/PotentialAccessMatrix";
import { useAsmGeo } from "@/store/asmStore";

export const Route = createFileRoute("/asm-analytics/")({
  head: () => ({
    meta: [
      { title: "Priority Matrix — ASM Analytics" },
      { name: "description", content: "Revenue potential plotted against DG access for every market cluster." },
    ],
  }),
  component: AsmPriorityMatrixPage,
});

function AsmPriorityMatrixPage() {
  const geo = useAsmGeo();

  return (
    <AsmLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Priority Matrix</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Which are the top market clusters that can improve our market penetration?
        </p>
      </div>

      <PotentialAccessMatrix geo={geo} headerRight={<AsmAreaFilter />} />

      <Link
        to="/asm-analytics/clusters"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"
      >
        See cluster-wise market overview <ArrowRight className="h-4 w-4" />
      </Link>
    </AsmLayout>
  );
}
