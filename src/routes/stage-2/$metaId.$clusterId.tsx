import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomBar } from "@/components/app/BottomBar";
import { Segmented } from "@/components/app/Segmented";
import { Stepper } from "@/components/app/Stepper";
import { ScoreChip } from "@/components/app/ScoreChip";
import { Button } from "@/components/ui/button";
import { useAppStore, type Score } from "@/store/appStore";
import { computeScore } from "@/lib/scoring";

export const Route = createFileRoute("/stage-2/$metaId/$clusterId")({
  component: ScoringScreen,
});

const emptyScore = (): Score => ({
  potential: { size: null, demand: null, aov: null },
  access: { directConnections: 0, referralPotential: 0 },
  service: { retailersAvailable: null, productAvailable: null },
  shortlisted: false,
});

function ScoringScreen() {
  const { metaId, clusterId } = Route.useParams();
  const navigate = useNavigate();
  const clusterMaps = useAppStore((s) => s.clusterMaps);
  const scores = useAppStore((s) => s.scores);
  const setScore = useAppStore((s) => s.setScore);

  const cm = clusterMaps[clusterId];
  const s = scores[clusterId] ?? emptyScore();
  const breakdown = useMemo(() => computeScore(s), [s]);

  if (!cm) {
    return (
      <AppShell>
        <div className="p-6 text-center text-muted-foreground">Cluster map not found.</div>
      </AppShell>
    );
  }

  return (
    <AppShell
      header={
        <StageHeader
          eyebrow="Cluster Attractiveness"
          title={cm.clusterName}
          subtitle={cm.metaName}
          backTo={`/stage-2/${metaId}`}
          right={<ScoreChip total={breakdown.total} />}
        />
      }
      bottom={
        <BottomBar>
          <Button
            onClick={() => navigate({ to: "/stage-2/shortlist" })}
            className="h-12 w-full bg-critical text-base font-semibold text-critical-foreground hover:bg-critical/90"
          >
            See Shortlist
          </Button>
        </BottomBar>
      }
    >
      <div className="space-y-5 px-5 py-5">
        {/* Potential */}
        <Card title="Potential" badge={`${breakdown.potential}/40`}>
          <Field label="What's the size of the cluster?">
            <Segmented
              value={s.potential.size}
              onChange={(v) => setScore(clusterId, { potential: { ...s.potential, size: v } })}
              options={[
                { value: "S", label: "Small" },
                { value: "M", label: "Medium" },
                { value: "L", label: "Large" },
              ]}
            />
          </Field>
          <Field label="Demand frequency in the cluster">
            <Segmented
              value={s.potential.demand}
              onChange={(v) => setScore(clusterId, { potential: { ...s.potential, demand: v } })}
              options={[
                { value: "L", label: "Low" },
                { value: "M", label: "Moderate" },
                { value: "H", label: "High" },
              ]}
            />
          </Field>
          <Field label="Average Order Value">
            <Segmented
              value={s.potential.aov}
              onChange={(v) => setScore(clusterId, { potential: { ...s.potential, aov: v } })}
              options={[
                { value: "L", label: "Low" },
                { value: "M", label: "Medium" },
                { value: "H", label: "High" },
              ]}
            />
          </Field>
        </Card>

        {/* Access */}
        <Card title="Access" badge={`${breakdown.access}/30`}>
          <Field label="How many direct connections do you have with the cluster?">
            <Stepper
              value={s.access.directConnections}
              onChange={(n) =>
                setScore(clusterId, { access: { ...s.access, directConnections: n } })
              }
              max={50}
            />
          </Field>
          <Field label="How many referrals are possible from your contacts to connect with the direct prospects?">
            <Stepper
              value={s.access.referralPotential}
              onChange={(n) =>
                setScore(clusterId, { access: { ...s.access, referralPotential: n } })
              }
              max={30}
            />
          </Field>
        </Card>

        {/* Service capacity */}
        <Card title="Service Delivery Capacity" badge={`${breakdown.service}/30`}>
          <Field label="Do you have sufficient retailers / painters who can serve this cluster?">
            <Segmented<"Y" | "N">
              value={
                s.service.retailersAvailable === null
                  ? null
                  : s.service.retailersAvailable
                  ? "Y"
                  : "N"
              }
              onChange={(v) =>
                setScore(clusterId, { service: { ...s.service, retailersAvailable: v === "Y" } })
              }
              options={[
                { value: "Y", label: "Yes" },
                { value: "N", label: "No" },
              ]}
            />
          </Field>
          <Field label="Is there availability of your products to serve the cluster?">
            <Segmented<"Y" | "N">
              value={
                s.service.productAvailable === null
                  ? null
                  : s.service.productAvailable
                  ? "Y"
                  : "N"
              }
              onChange={(v) =>
                setScore(clusterId, { service: { ...s.service, productAvailable: v === "Y" } })
              }
              options={[
                { value: "Y", label: "Yes" },
                { value: "N", label: "No" },
              ]}
            />
          </Field>
        </Card>
      </div>
    </AppShell>
  );
}

function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-xl">{title}</h3>
        {badge && (
          <span className="rounded-full bg-navy/10 px-2.5 py-1 text-[11px] font-semibold text-navy">
            {badge}
          </span>
        )}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium leading-snug text-muted-foreground">{label}</p>
      {children}
    </div>
  );
}
