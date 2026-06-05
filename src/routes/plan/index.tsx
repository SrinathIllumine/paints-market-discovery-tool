import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { computeClusterScores, getClusterIntel } from "@/lib/clusterScoring";
import { useAppStore, type RoadmapStep } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, FileDown, Map } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  CONNECT_STRATEGY_OPTIONS,
  CONNECT_STRATEGY_LABEL,
  COMMITMENT_FIELDS,
  getValuePropositions,
  getRecommendedActions,
  type ConnectStrategy,
} from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/")({
  head: () => ({
    meta: [
      { title: "Monthly Cluster Engagement Plan" },
      { name: "description", content: "Plan your monthly engagement across shortlisted clusters." },
    ],
  }),
  component: PlanScreen,
});

const STEPS: { id: RoadmapStep; title: string }[] = [
  { id: "value", title: "Select your value proposition" },
  { id: "connect", title: "Design your connect strategy" },
  { id: "action", title: "Build your action plan" },
];

function PlanScreen() {
  const shortlisted = useAppStore((s) => s.plan.targetClusterIds);
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);
  const valuePropByCluster = useAppStore((s) => s.plan.valuePropositionByCluster);
  const setValueProposition = useAppStore((s) => s.setValueProposition);
  const selectedStrategies = useAppStore((s) => s.plan.selectedStrategiesByCluster);
  const toggleSelectedStrategy = useAppStore((s) => s.toggleSelectedStrategy);
  const commitments = useAppStore((s) => s.plan.commitmentsByCluster);
  const setCommitment = useAppStore((s) => s.setCommitment);
  const selectedActions = useAppStore((s) => s.plan.selectedActionsByCluster);
  const toggleSelectedAction = useAppStore((s) => s.toggleSelectedAction);
  const roadmapCompletion = useAppStore((s) => s.plan.roadmapCompletion);
  const setRoadmapStep = useAppStore((s) => s.setRoadmapStep);
  const clusterStates = useAppStore((s) => s.clusters);

  const [openStep, setOpenStep] = useState<RoadmapStep>("value");

  // Sort: High Potential + High Access first, then rest by aggregate
  const sortedShortlisted = useMemo(() => {
    return [...shortlisted].sort((a, b) => {
      const ca = getCluster(a), cb = getCluster(b);
      if (!ca || !cb) return 0;
      const ia = getClusterIntel(a, clusterStates[a]?.prospects.length ?? 0);
      const ib = getClusterIntel(b, clusterStates[b]?.prospects.length ?? 0);
      const aIsTop = (ia.revenueHML === "H" || ia.competitiveHML === "H") && ia.accessHML === "H";
      const bIsTop = (ib.revenueHML === "H" || ib.competitiveHML === "H") && ib.accessHML === "H";
      if (aIsTop !== bIsTop) return aIsTop ? -1 : 1;
      const sa = computeClusterScores(ca, clusterStates[a]?.prospects.length ?? 0).aggregate;
      const sb = computeClusterScores(cb, clusterStates[b]?.prospects.length ?? 0).aggregate;
      return sb - sa;
    });
  }, [shortlisted, clusterStates]);

  const focusClusterId = focusIds[0];
  const focusCluster = focusClusterId ? getCluster(focusClusterId) : undefined;
  const vp = focusClusterId ? valuePropByCluster[focusClusterId] : undefined;
  const strategies = focusClusterId ? selectedStrategies[focusClusterId] ?? [] : [];

  const completion = roadmapCompletion ?? { value: false, connect: false, action: false };
  const allCompleted = completion.value && completion.connect && completion.action;

  const stepReady = (step: RoadmapStep): boolean => {
    if (!focusClusterId) return false;
    if (step === "value") return Boolean(vp);
    if (step === "connect") return strategies.length > 0;
    if (step === "action") {
      const sa = selectedActions[focusClusterId] ?? {};
      return strategies.some((s) => (sa[s] ?? []).length > 0);
    }
    return false;
  };

  const handleGenerate = () => {
    if (!focusClusterId || !allCompleted) {
      window.alert("Pick a cluster and complete all roadmap stages to generate the report.");
      return;
    }
    generateMonthlyEngagementPlanPdf({
      focusClusterId,
      valueProposition: vp ?? "",
      strategies,
      commitments: commitments[focusClusterId] ?? {},
      selectedActions: selectedActions[focusClusterId] ?? {},
    });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 2 of 4"
          title="Create Monthly Cluster Engagement Plan"
          subtitle="June 2026"
        />
      }
    >
      <div className="space-y-5 px-5 py-5">
        {shortlisted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            You haven't mapped any clusters yet. Go to{" "}
            <Link to="/map" className="font-semibold text-critical underline">Cluster Potential</Link>{" "}
            and visit your first cluster.
          </div>
        ) : (
          <>
            {/* Focus question — at the top, outside the roadmap */}
            <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h2 className="font-display text-lg leading-tight">
                Which cluster would you like to focus on this month?
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Sorted by access + potential — pick one.
              </p>
              <div className="mt-3 space-y-2">
                {sortedShortlisted.map((id) => {
                  const c = getCluster(id);
                  if (!c) return null;
                  const intel = getClusterIntel(id, clusterStates[id]?.prospects.length ?? 0);
                  const active = focusClusterId === id;
                  const isTop = (intel.revenueHML === "H" || intel.competitiveHML === "H") && intel.accessHML === "H";
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setMonthlyFocus(id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                        active ? "border-critical bg-critical/5" : "border-border bg-card hover:bg-muted/40",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{c.name}</p>
                        {isTop && (
                          <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-critical">
                            High potential · High access
                          </p>
                        )}
                      </div>
                      <div
                        className={cn(
                          "h-5 w-5 shrink-0 rounded-full border-2",
                          active ? "border-critical bg-critical" : "border-border",
                        )}
                      />
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Roadmap — only after a focus cluster is chosen */}
            {focusCluster && (
              <>
                <div className="mb-1 flex items-center gap-2">
                  <Map className="h-4 w-4 text-critical" />
                  <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground">
                    Co-create your plan
                  </h2>
                </div>

                <div className="relative space-y-3">
                  <div className="pointer-events-none absolute left-[18px] top-3 bottom-3 w-px bg-border" />
                  {STEPS.map((step, idx) => {
                    const isOpen = openStep === step.id;
                    const done = completion[step.id];
                    const ready = stepReady(step.id);
                    return (
                      <div key={step.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
                        <div
                          className={cn(
                            "absolute left-2 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                            done ? "border-green-600 bg-green-600 text-white" : "border-border bg-card text-muted-foreground",
                          )}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
                        </div>

                        <button
                          type="button"
                          onClick={() => setOpenStep(isOpen ? ("" as RoadmapStep) : step.id)}
                          className="flex w-full items-center justify-between gap-3 py-3 pl-10 pr-4 text-left"
                        >
                          <span className="text-base font-bold leading-tight">
                            Stage {idx + 1}: {step.title}
                          </span>
                          <ChevronDown
                            className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                          />
                        </button>

                        {isOpen && (
                          <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                            {step.id === "value" && (
                              <ValueStep
                                clusterId={focusCluster.id}
                                selected={vp}
                                onSelect={(v) => setValueProposition(focusCluster.id, v)}
                              />
                            )}
                            {step.id === "connect" && (
                              <ConnectStep
                                clusterId={focusCluster.id}
                                strategies={strategies}
                                commitments={commitments[focusCluster.id] ?? {}}
                                onToggle={(s) => toggleSelectedStrategy(focusCluster.id, s)}
                                onCommit={(s, k, v) => setCommitment(focusCluster.id, s, k, v)}
                              />
                            )}
                            {step.id === "action" && (
                              <ActionStep
                                clusterId={focusCluster.id}
                                strategies={strategies}
                                selected={selectedActions[focusCluster.id] ?? {}}
                                onToggle={(s, a) => toggleSelectedAction(focusCluster.id, s, a)}
                              />
                            )}

                            <div className="flex items-center justify-end gap-2 pt-1">
                              {done ? (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setRoadmapStep(step.id, false)}
                                  className="gap-1.5 border-green-600 text-green-700 hover:bg-green-50"
                                >
                                  <Check className="h-3.5 w-3.5" /> Completed
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={!ready}
                                  onClick={() => {
                                    setRoadmapStep(step.id, true);
                                    const next = STEPS[idx + 1];
                                    if (next) setOpenStep(next.id);
                                  }}
                                  className="bg-navy text-navy-foreground hover:bg-navy/90"
                                >
                                  Mark as completed
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <Button
                  onClick={handleGenerate}
                  className={cn(
                    "h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90",
                    !allCompleted && "opacity-60",
                  )}
                >
                  <FileDown className="h-4 w-4" /> Generate Monthly Cluster Engagement Plan
                </Button>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}

/* ---------------- Step components ---------------- */

function ValueStep({
  clusterId,
  selected,
  onSelect,
}: {
  clusterId: string;
  selected?: string;
  onSelect: (v: string) => void;
}) {
  const options = getValuePropositions(clusterId);
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Pick one value proposition to carry through your action plan.
      </p>
      <div className="space-y-2">
        {options.map((opt) => {
          const active = selected === opt;
          return (
            <label
              key={opt}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                active ? "border-critical bg-critical/5" : "border-border bg-card",
              )}
            >
              <input
                type="radio"
                name="value-prop"
                checked={active}
                onChange={() => onSelect(opt)}
                className="mt-0.5 h-4 w-4 accent-critical"
              />
              <span className="leading-snug">{opt}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ConnectStep({
  clusterId,
  strategies,
  commitments,
  onToggle,
  onCommit,
}: {
  clusterId: string;
  strategies: ConnectStrategy[];
  commitments: Partial<Record<ConnectStrategy, Record<string, string | number>>>;
  onToggle: (s: ConnectStrategy) => void;
  onCommit: (s: ConnectStrategy, k: string, v: string | number) => void;
}) {
  void clusterId;
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Choose up to 3 strategies. Add lightweight commitments for each one you pick.
      </p>
      <div className="space-y-2">
        {CONNECT_STRATEGY_OPTIONS.map((opt) => {
          const active = strategies.includes(opt.key);
          const disabled = !active && strategies.length >= 3;
          const fields = COMMITMENT_FIELDS[opt.key];
          const values = commitments[opt.key] ?? {};
          return (
            <div key={opt.key}>
              <label
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                  active ? "border-critical bg-critical/5" : "border-border bg-card",
                  disabled && "opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  disabled={disabled}
                  onChange={() => onToggle(opt.key)}
                  className="mt-0.5 h-4 w-4 accent-critical"
                />
                <span className="leading-snug">
                  <span className="font-semibold">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </label>
              {active && (
                <div className="mt-2 ml-6 grid gap-2 rounded-lg border border-border bg-card p-3 sm:grid-cols-2">
                  {fields.map((f) => (
                    <label key={f.key} className="flex flex-col gap-1 text-xs">
                      <span className="font-medium text-muted-foreground">{f.label}</span>
                      <input
                        type={f.type}
                        placeholder={f.placeholder}
                        value={String(values[f.key] ?? "")}
                        onChange={(e) =>
                          onCommit(
                            opt.key,
                            f.key,
                            f.type === "number" ? Number(e.target.value) : e.target.value,
                          )
                        }
                        className="rounded border border-border bg-background px-2 py-1.5 text-sm"
                      />
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ActionStep({
  clusterId,
  strategies,
  selected,
  onToggle,
}: {
  clusterId: string;
  strategies: ConnectStrategy[];
  selected: Partial<Record<ConnectStrategy, string[]>>;
  onToggle: (s: ConnectStrategy, a: string) => void;
}) {
  if (strategies.length === 0) {
    return <p className="text-sm text-muted-foreground">Pick at least one strategy first.</p>;
  }
  return (
    <div className="space-y-3">
      {strategies.map((s) => {
        const actions = getRecommendedActions(s, clusterId);
        const sel = selected[s] ?? [];
        return (
          <div key={s} className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-sm font-semibold">{CONNECT_STRATEGY_LABEL[s]}</p>
            <div className="space-y-1.5">
              {actions.map((a) => {
                const on = sel.includes(a);
                return (
                  <label key={a} className="flex cursor-pointer items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => onToggle(s, a)}
                      className="mt-0.5 h-4 w-4 accent-critical"
                    />
                    <span className="leading-snug">{a}</span>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
