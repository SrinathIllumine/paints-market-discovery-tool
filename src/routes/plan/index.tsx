import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster, POTENTIAL_LABEL } from "@/data/clusters";
import {
  useAppStore,
  type ConnectModel,
  type RoadmapStep,
} from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, FileDown, Map } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  CONNECT_MODEL_OPTIONS,
  CONNECT_MODEL_LABEL,
  getRoadmapVariants,
} from "@/lib/roadmapContent";

export const Route = createFileRoute("/plan/")({
  head: () => ({
    meta: [
      { title: "Monthly Market Engagement Plan" },
      {
        name: "description",
        content: "Plan your monthly engagement across shortlisted clusters.",
      },
    ],
  }),
  component: PlanScreen,
});

const STEPS: { id: RoadmapStep; title: string }[] = [
  { id: "focus", title: "Which cluster would you like to focus on this month?" },
  { id: "connect", title: "Design your connect model" },
  { id: "value", title: "Value proposition" },
  { id: "action", title: "Action plan" },
];

function PlanScreen() {
  const shortlisted = useAppStore((s) => s.plan.targetClusterIds);
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const toggleFocus = useAppStore((s) => s.toggleMonthlyFocus);
  const connectModelByCluster = useAppStore(
    (s) => s.plan.connectModelByCluster,
  );
  const setConnectModel = useAppStore((s) => s.setConnectModel);
  const roadmapCompletion = useAppStore((s) => s.plan.roadmapCompletion);
  const setRoadmapStep = useAppStore((s) => s.setRoadmapStep);
  const clustersState = useAppStore((s) => s.clusters);
  const stakeholders = useAppStore((s) => s.stakeholders);

  const [openStep, setOpenStep] = useState<RoadmapStep>("focus");

  const focusClusters = useMemo(
    () =>
      focusIds
        .map((id) => getCluster(id))
        .filter((c): c is NonNullable<ReturnType<typeof getCluster>> =>
          Boolean(c),
        ),
    [focusIds],
  );

  const allModelsSelected =
    focusClusters.length > 0 &&
    focusClusters.every((c) => Boolean(connectModelByCluster?.[c.id]));

  const completion = roadmapCompletion ?? {
    focus: false,
    connect: false,
    value: false,
    action: false,
  };

  const allCompleted =
    completion.focus &&
    completion.connect &&
    completion.value &&
    completion.action;

  const stepReady = (step: RoadmapStep): boolean => {
    if (step === "focus") return focusIds.length > 0;
    if (step === "connect") return allModelsSelected;
    if (step === "value" || step === "action") return allModelsSelected;
    return false;
  };

  const handleGenerate = () => {
    if (!allCompleted) {
      window.alert("Plan your roadmap to generate the report");
      return;
    }
    generateMonthlyEngagementPlanPdf({
      focusClusterIds: focusIds,
      prospectsByCluster: Object.fromEntries(
        focusIds.map((id) => [id, clustersState[id]?.prospects ?? []]),
      ),
      connectModelByCluster: connectModelByCluster ?? {},
      stakeholders,
    });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 3 of 3"
          title="Create Monthly Market Engagement Plan"
          subtitle="June 2026"
        />
      }
    >
      <div className="px-5 py-5">
        {shortlisted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            You haven't shortlisted any clusters yet. Go to the{" "}
            <Link to="/map" className="font-semibold text-critical underline">
              Market Map
            </Link>{" "}
            and shortlist clusters first.
          </div>
        ) : (
          <>
            {/* Mini section header */}
            <div className="mb-3 flex items-center gap-2">
              <Map className="h-4 w-4 text-critical" />
              <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground">
                Roadmap
              </h2>
            </div>

            <div className="relative space-y-3">
              {/* Vertical roadmap connector line */}
              <div className="pointer-events-none absolute left-[18px] top-3 bottom-3 w-px bg-border" />

              {STEPS.map((step, idx) => {
                const isOpen = openStep === step.id;
                const done = completion[step.id];
                const ready = stepReady(step.id);
                return (
                  <div
                    key={step.id}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    {/* Step indicator dot */}
                    <div
                      className={cn(
                        "absolute left-2 top-3 z-10 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                        done
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-border bg-card text-muted-foreground",
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
                        {idx + 1}. {step.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span
                          className={cn(
                            "flex h-5 w-5 items-center justify-center rounded-full border-2",
                            done
                              ? "border-green-600 bg-green-600 text-white"
                              : "border-border bg-card text-transparent",
                          )}
                          aria-label={done ? "Completed" : "Not completed"}
                        >
                          <Check className="h-3 w-3" />
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 text-muted-foreground transition-transform",
                            isOpen && "rotate-180",
                          )}
                        />
                      </div>
                    </button>

                    {isOpen && (
                      <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                        {step.id === "focus" && (
                          <FocusStep
                            shortlisted={shortlisted}
                            focusIds={focusIds}
                            onToggle={toggleFocus}
                          />
                        )}
                        {step.id === "connect" && (
                          <ConnectStep
                            focusClusters={focusClusters}
                            connectModelByCluster={connectModelByCluster ?? {}}
                            onSelect={setConnectModel}
                          />
                        )}
                        {step.id === "value" && (
                          <ValueOrActionStep
                            kind="value"
                            focusClusters={focusClusters}
                            connectModelByCluster={connectModelByCluster ?? {}}
                          />
                        )}
                        {step.id === "action" && (
                          <ValueOrActionStep
                            kind="action"
                            focusClusters={focusClusters}
                            connectModelByCluster={connectModelByCluster ?? {}}
                          />
                        )}

                        <CompleteButton
                          step={step.id}
                          done={done}
                          ready={ready}
                          onToggle={(c) => {
                            setRoadmapStep(step.id, c);
                            if (c) {
                              const next = STEPS[idx + 1];
                              if (next) setOpenStep(next.id);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        <Button
          disabled={shortlisted.length === 0}
          onClick={handleGenerate}
          className={cn(
            "mt-5 h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90",
            !allCompleted && "opacity-60",
          )}
        >
          <FileDown className="h-4 w-4" /> Generate Monthly Market Engagement Plan
        </Button>
      </div>
    </AppShell>
  );
}

/* ---------------- Step components ---------------- */

function FocusStep({
  shortlisted,
  focusIds,
  onToggle,
}: {
  shortlisted: string[];
  focusIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Pick from the clusters you've shortlisted on your market map.
      </p>
      <div className="space-y-2">
        {shortlisted.map((id) => {
          const c = getCluster(id);
          if (!c) return null;
          const active = focusIds.includes(id);
          return (
            <button
              key={id}
              type="button"
              onClick={() => onToggle(id)}
              className={cn(
                "flex w-full items-start justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                active
                  ? "border-critical bg-critical/5"
                  : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {POTENTIAL_LABEL[c.potential]} potential
                </p>
              </div>
              <div
                className={cn(
                  "mt-1 h-5 w-5 shrink-0 rounded-md border-2",
                  active ? "border-critical bg-critical" : "border-border",
                )}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectStep({
  focusClusters,
  connectModelByCluster,
  onSelect,
}: {
  focusClusters: NonNullable<ReturnType<typeof getCluster>>[];
  connectModelByCluster: Record<string, ConnectModel>;
  onSelect: (clusterId: string, model: ConnectModel) => void;
}) {
  if (focusClusters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pick focus clusters in the previous step first.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {focusClusters.map((c) => {
        const selected = connectModelByCluster[c.id] ?? null;
        return (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-muted/30 p-3"
          >
            <p className="mb-2 text-sm font-bold">{c.name}</p>
            <div className="space-y-1.5">
              {CONNECT_MODEL_OPTIONS.map((opt) => {
                const active = selected === opt.key;
                return (
                  <label
                    key={opt.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                      active
                        ? "border-critical bg-critical/5"
                        : "border-border bg-card",
                    )}
                  >
                    <input
                      type="radio"
                      name={`connect-${c.id}`}
                      checked={active}
                      onChange={() => onSelect(c.id, opt.key)}
                      className="mt-0.5 h-4 w-4 accent-critical"
                    />
                    <span className="leading-snug">{opt.label}</span>
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

function ValueOrActionStep({
  kind,
  focusClusters,
  connectModelByCluster,
}: {
  kind: "value" | "action";
  focusClusters: NonNullable<ReturnType<typeof getCluster>>[];
  connectModelByCluster: Record<string, ConnectModel>;
}) {
  const incomplete = focusClusters.filter(
    (c) => !connectModelByCluster[c.id],
  );

  if (focusClusters.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Pick focus clusters in step 1 first.
      </p>
    );
  }
  if (incomplete.length === focusClusters.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a connect model in step 2 to see your{" "}
        {kind === "value" ? "value proposition" : "action plan"}.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {focusClusters.map((c) => {
        const model = connectModelByCluster[c.id];
        if (!model) {
          return (
            <div
              key={c.id}
              className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground"
            >
              <p className="font-display font-semibold text-foreground">
                {c.name}
              </p>
              <p className="mt-1 text-xs">
                Pick a connect model in step 2 first.
              </p>
            </div>
          );
        }
        const variants = getRoadmapVariants(c.id, model);
        return (
          <div
            key={c.id}
            className="rounded-2xl border border-border bg-card p-3"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-sm font-bold">{c.name}</p>
              <span className="rounded-full bg-critical/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-critical">
                {model} · {CONNECT_MODEL_LABEL[model]}
              </span>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-border bg-muted/30 p-3"
                >
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {v.audience}
                  </p>
                  <ul className="list-disc space-y-1 pl-4 text-sm leading-snug">
                    {(kind === "value" ? v.valueProps : v.actions).map(
                      (item, j) => (
                        <li key={j}>{item}</li>
                      ),
                    )}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CompleteButton({
  step,
  done,
  ready,
  onToggle,
}: {
  step: RoadmapStep;
  done: boolean;
  ready: boolean;
  onToggle: (completed: boolean) => void;
}) {
  void step;
  return (
    <div className="flex items-center justify-end gap-2 pt-1">
      {done ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggle(false)}
          className="gap-1.5 border-green-600 text-green-700 hover:bg-green-50"
        >
          <Check className="h-3.5 w-3.5" /> Completed
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={!ready}
          onClick={() => onToggle(true)}
          className="bg-navy text-navy-foreground hover:bg-navy/90"
        >
          Mark as completed
        </Button>
      )}
    </div>
  );
}
