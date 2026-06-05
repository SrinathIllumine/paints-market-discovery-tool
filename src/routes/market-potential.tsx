import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { QuadrantSnapshot } from "@/components/app/QuadrantSnapshot";

export const Route = createFileRoute("/market-potential")({
  head: () => ({
    meta: [
      { title: "My Cluster Map" },
      { name: "description", content: "Snapshot of clusters by potential and access." },
    ],
  }),
  component: ClusterMapPage,
});

function ClusterMapPage() {
  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="My Cluster Map"
          title="All clusters"
          subtitle="Snapshot driven by backend cluster intelligence."
          backTo="/map"
        />
      }
    >
      <div className="space-y-6 px-5 py-5">
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h2 className="font-display text-xl">Cluster Snapshot</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Each cluster placed by Revenue Potential vs Cluster Access.
          </p>
          <div className="mt-3">
            <QuadrantSnapshot />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
