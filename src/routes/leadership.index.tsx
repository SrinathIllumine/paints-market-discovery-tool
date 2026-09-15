import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { LeadershipLayout, LeadershipScopeFilter } from "@/components/leadership/LeadershipLayout";
import { PotentialAccessMatrix } from "@/components/shared/PotentialAccessMatrix";
import { useLeadershipGeo, useLeadershipScopeLabel } from "@/store/leadershipStore";

export const Route = createFileRoute("/leadership/")({
  head: () => ({
    meta: [
      { title: "Priority Matrix — Leadership Analytics" },
      { name: "description", content: "Revenue potential plotted against DG access for every market cluster." },
    ],
  }),
  component: PriorityMatrixPage,
});

function PriorityMatrixPage() {
  const geo = useLeadershipGeo();
  const scopeLabel = useLeadershipScopeLabel();

  return (
    <LeadershipLayout>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-foreground">Priority Matrix: {scopeLabel}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{"\n"}</p>
      </div>

      <PotentialAccessMatrix geo={geo} headerRight={<LeadershipScopeFilter />} subtitle={"\n"} />

      <Link
        to="/leadership/clusters"
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-navy hover:underline"
      >
        See cluster-wise market overview <ArrowRight className="h-4 w-4" />
      </Link>
    </LeadershipLayout>
  );
}
