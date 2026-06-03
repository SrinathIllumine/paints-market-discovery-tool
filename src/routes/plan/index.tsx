import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { computeClusterScores } from "@/lib/clusterScoring";
import { useAppStore, type RoadmapStep } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, ExternalLink, FileDown, Map, Plus, Trash2 } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  CONNECT_STRATEGY_OPTIONS,
  CONNECT_STRATEGY_LABEL,
  D2C_CHANNELS,
  generateActionPlan,
  getLocalCampaignSuggestions,
  type ActionLink,
  type ConnectStrategy,
  type ContactEntry,
  type StrategyAnswers,
} from "@/lib/strategyContent";
import { getTopics } from "@/data/eventTopics";

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
  { id: "focus", title: "Which cluster would you like to focus on this month?" },
  { id: "connect", title: "Design your connect strategy" },
  { id: "action", title: "Action plan" },
];

function PlanScreen() {
  const shortlisted = useAppStore((s) => s.plan.targetClusterIds);
  const assessments = useAppStore((s) => s.assessments);
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const toggleFocus = useAppStore((s) => s.toggleMonthlyFocus);
  const strategyByCluster = useAppStore((s) => s.plan.connectStrategyByCluster);
  const answersByCluster = useAppStore((s) => s.plan.strategyAnswersByCluster);
  const setStrategy = useAppStore((s) => s.setConnectStrategy);
  const setAnswers = useAppStore((s) => s.setStrategyAnswers);
  const roadmapCompletion = useAppStore((s) => s.plan.roadmapCompletion);
  const setRoadmapStep = useAppStore((s) => s.setRoadmapStep);

  const [openStep, setOpenStep] = useState<RoadmapStep>("focus");

  const sortedShortlisted = useMemo(() => {
    const scoreFor = (id: string): number => {
      const a = assessments[id];
      const c = getCluster(id);
      if (!a || !c) return 0;
      return computeClusterScores(c, 0, a).aggregate;
    };
    return [...shortlisted].sort((a, b) => scoreFor(b) - scoreFor(a));
  }, [shortlisted, assessments]);

  const focusClusters = useMemo(
    () => focusIds.map((id) => getCluster(id)).filter((c): c is NonNullable<ReturnType<typeof getCluster>> => Boolean(c)),
    [focusIds],
  );

  const allStrategiesSelected =
    focusClusters.length > 0 && focusClusters.every((c) => Boolean(strategyByCluster[c.id]));

  const completion = roadmapCompletion ?? { focus: false, connect: false, action: false };
  const allCompleted = completion.focus && completion.connect && completion.action;

  const stepReady = (step: RoadmapStep): boolean => {
    if (step === "focus") return focusIds.length > 0;
    if (step === "connect") return allStrategiesSelected;
    if (step === "action") return allStrategiesSelected;
    return false;
  };

  const handleGenerate = () => {
    if (!allCompleted) {
      window.alert("Plan your roadmap to generate the report");
      return;
    }
    generateMonthlyEngagementPlanPdf({
      focusClusterIds: focusIds,
      strategyByCluster,
      answersByCluster,
    });
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 3 of 3"
          title="Create Monthly Cluster Engagement Plan"
          subtitle="June 2026"
        />
      }
    >
      <div className="px-5 py-5">
        {shortlisted.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            You haven't saved any cluster potential yet. Go to{" "}
            <Link to="/map" className="font-semibold text-critical underline">Cluster Potential</Link>{" "}
            and save your first cluster.
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center gap-2">
              <Map className="h-4 w-4 text-critical" />
              <h2 className="text-base font-bold uppercase tracking-wider text-muted-foreground">Roadmap</h2>
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
                        {idx + 1}. {step.title}
                      </span>
                      <ChevronDown
                        className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                      />
                    </button>

                    {isOpen && (
                      <div className="space-y-4 border-t border-border px-4 pb-4 pt-3">
                        {step.id === "focus" && (
                          <FocusStep shortlisted={sortedShortlisted} focusIds={focusIds} onToggle={toggleFocus} />
                        )}
                        {step.id === "connect" && (
                          <ConnectStep
                            focusClusters={focusClusters}
                            strategyByCluster={strategyByCluster}
                            answersByCluster={answersByCluster}
                            onSelectStrategy={setStrategy}
                            onSetAnswers={setAnswers}
                          />
                        )}
                        {step.id === "action" && (
                          <ActionStepView
                            focusClusters={focusClusters}
                            strategyByCluster={strategyByCluster}
                            answersByCluster={answersByCluster}
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
          <FileDown className="h-4 w-4" /> Generate Monthly Cluster Engagement Plan
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
        Sorted by aggregate cluster potential — pick the clusters you'll focus on this month.
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
                active ? "border-critical bg-critical/5" : "border-border bg-card hover:bg-muted/40",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{c.name}</p>
              </div>
              <div className={cn("mt-1 h-5 w-5 shrink-0 rounded-md border-2", active ? "border-critical bg-critical" : "border-border")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConnectStep({
  focusClusters,
  strategyByCluster,
  answersByCluster,
  onSelectStrategy,
  onSetAnswers,
}: {
  focusClusters: NonNullable<ReturnType<typeof getCluster>>[];
  strategyByCluster: Record<string, ConnectStrategy>;
  answersByCluster: Record<string, StrategyAnswers>;
  onSelectStrategy: (clusterId: string, strategy: ConnectStrategy) => void;
  onSetAnswers: (clusterId: string, patch: Partial<StrategyAnswers>) => void;
}) {
  if (focusClusters.length === 0) {
    return <p className="text-sm text-muted-foreground">Pick focus clusters in the previous step first.</p>;
  }
  return (
    <div className="space-y-3">
      {focusClusters.map((c) => {
        const selected = strategyByCluster[c.id] ?? null;
        const answers = answersByCluster[c.id] ?? {};
        return (
          <div key={c.id} className="rounded-2xl border border-border bg-muted/30 p-3">
            <p className="mb-2 text-sm font-bold">{c.name}</p>
            <div className="space-y-1.5">
              {CONNECT_STRATEGY_OPTIONS.map((opt) => {
                const active = selected === opt.key;
                return (
                  <label
                    key={opt.key}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                      active ? "border-critical bg-critical/5" : "border-border bg-card",
                    )}
                  >
                    <input
                      type="radio"
                      name={`strategy-${c.id}`}
                      checked={active}
                      onChange={() => onSelectStrategy(c.id, opt.key)}
                      className="mt-0.5 h-4 w-4 accent-critical"
                    />
                    <span className="leading-snug">
                      <span className="font-semibold">{opt.label}</span>
                      <span className="block text-xs text-muted-foreground">{opt.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>

            {selected && (
              <div className="mt-3 border-t border-border pt-3">
                <StrategyQuestions
                  clusterId={c.id}
                  strategy={selected}
                  answers={answers}
                  onChange={(patch) => onSetAnswers(c.id, patch)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ContactList({
  contacts,
  onChange,
  addLabel,
}: {
  contacts: ContactEntry[];
  onChange: (next: ContactEntry[]) => void;
  addLabel: string;
}) {
  return (
    <div className="space-y-2">
      {contacts.map((ct, i) => (
        <div key={ct.id} className="flex items-start gap-2 rounded-md border border-border bg-card p-2">
          <div className="grid flex-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-4">
            <input
              placeholder="Name"
              value={ct.name}
              onChange={(e) => {
                const next = [...contacts];
                next[i] = { ...ct, name: e.target.value };
                onChange(next);
              }}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <input
              placeholder="Phone"
              value={ct.phone ?? ""}
              onChange={(e) => {
                const next = [...contacts];
                next[i] = { ...ct, phone: e.target.value };
                onChange(next);
              }}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <input
              placeholder="Area"
              value={ct.area ?? ""}
              onChange={(e) => {
                const next = [...contacts];
                next[i] = { ...ct, area: e.target.value };
                onChange(next);
              }}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            />
            <input
              placeholder="Brand Preference"
              value={ct.brandPreference ?? ""}
              onChange={(e) => {
                const next = [...contacts];
                next[i] = { ...ct, brandPreference: e.target.value };
                onChange(next);
              }}
              className="rounded border border-border bg-background px-2 py-1 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange(contacts.filter((_, j) => j !== i))}
            className="rounded p-1 text-muted-foreground hover:bg-muted"
            aria-label="Remove contact"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="gap-1"
        onClick={() => {
          const newCt: ContactEntry = {
            id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            name: "",
          };
          onChange([...contacts, newCt]);
        }}
      >
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </Button>
    </div>
  );
}

function StrategyQuestions({
  clusterId,
  strategy,
  answers,
  onChange,
}: {
  clusterId: string;
  strategy: ConnectStrategy;
  answers: StrategyAnswers;
  onChange: (patch: Partial<StrategyAnswers>) => void;
}) {
  if (strategy === "BRAND") {
    const suggestions = getLocalCampaignSuggestions(clusterId);
    const selected = answers.selectedCampaigns ?? [];
    return (
      <div className="rounded-md border border-border bg-card p-2">
        <p className="mb-1.5 uppercase tracking-wider text-muted-foreground text-xs">
          Which brand awareness strategy would you like to do?
        </p>
        <div className="space-y-1">
          {suggestions.map((s) => {
            const on = selected.includes(s);
            return (
              <label key={s} className="flex cursor-pointer items-start gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    onChange({
                      selectedCampaigns: on ? selected.filter((x) => x !== s) : [...selected, s],
                    })
                  }
                  className="mt-0.5 h-3.5 w-3.5 accent-critical"
                />
                <span className="leading-snug">{s}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (strategy === "CONTRACTOR") {
    const contractors = answers.contractors ?? [];
    return (
      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
          Add the contractors active in this cluster
        </p>
        <ContactList
          contacts={contractors}
          onChange={(next) => onChange({ contractors: next })}
          addLabel="Add contractor"
        />
      </div>
    );
  }

  if (strategy === "OUTREACH") {
    const community = answers.communityContacts ?? [];
    const awareTopics = getTopics(clusterId, "Awareness");
    const meetTopics = getTopics(clusterId, "Contractor Meet");
    const allTopics = [...awareTopics, ...meetTopics];
    const selectedTopics = answers.selectedEventTopics ?? [];
    return (
      <div className="space-y-2">
        <YesNo
          question="Do you have a touchpoint in the community?"
          value={answers.hasCommunityTouchpoint}
          onChange={(v) => onChange({ hasCommunityTouchpoint: v })}
        />
        {answers.hasCommunityTouchpoint === "Y" && (
          <ContactList
            contacts={community}
            onChange={(next) => onChange({ communityContacts: next })}
            addLabel="Add community contact"
          />
        )}
        <YesNo
          question="Do you want to conduct contribution events?"
          value={answers.consideredContributionEvents}
          onChange={(v) => onChange({ consideredContributionEvents: v })}
        />
        {answers.consideredContributionEvents === "Y" && allTopics.length > 0 && (
          <div className="rounded-md border border-border bg-card p-2">
            <p className="mb-1.5 uppercase tracking-wider text-muted-foreground text-xs">
              Suggested contribution events
            </p>
            <div className="space-y-1">
              {allTopics.map((t) => {
                const isSel = selectedTopics.includes(t);
                return (
                  <label key={t} className="flex cursor-pointer items-start gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={isSel}
                      onChange={() => {
                        onChange({
                          selectedEventTopics: isSel
                            ? selectedTopics.filter((x) => x !== t)
                            : [...selectedTopics, t],
                        });
                      }}
                      className="mt-0.5 h-3.5 w-3.5 accent-critical"
                    />
                    <span className="leading-snug">{t}</span>
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // D2C
  const channels = answers.d2cChannels ?? [];
  return (
    <div className="rounded-md border border-border bg-card p-2">
      <p className="mb-1.5 uppercase tracking-wider text-muted-foreground text-xs">Pick your choice of direct channels strategy</p>
      <div className="space-y-1">
        {D2C_CHANNELS.map((ch) => {
          const on = channels.includes(ch);
          return (
            <label key={ch} className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={on}
                onChange={() => onChange({ d2cChannels: on ? channels.filter((x) => x !== ch) : [...channels, ch] })}
                className="h-3.5 w-3.5 accent-critical"
              />
              {ch}
            </label>
          );
        })}
      </div>
    </div>
  );
}

function YesNo({
  question,
  value,
  onChange,
}: {
  question: string;
  value: "Y" | "N" | undefined;
  onChange: (v: "Y" | "N") => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-md border border-border bg-card px-3 py-2 text-sm">
      <p className="leading-snug">{question}</p>
      <div className="flex shrink-0 gap-1.5">
        {(["Y", "N"] as const).map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "h-7 w-9 rounded-md border text-xs font-semibold",
              value === opt
                ? "border-critical bg-critical text-critical-foreground"
                : "border-border bg-card text-muted-foreground hover:bg-muted/40",
            )}
          >
            {opt === "Y" ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  );
}

function ActionStepView({
  focusClusters,
  strategyByCluster,
  answersByCluster,
}: {
  focusClusters: NonNullable<ReturnType<typeof getCluster>>[];
  strategyByCluster: Record<string, ConnectStrategy>;
  answersByCluster: Record<string, StrategyAnswers>;
}) {
  const [openLink, setOpenLink] = useState<ActionLink | null>(null);

  if (focusClusters.length === 0) {
    return <p className="text-sm text-muted-foreground">Pick focus clusters in step 1 first.</p>;
  }
  return (
    <>
      <div className="space-y-3">
        {focusClusters.map((c) => {
          const strategy = strategyByCluster[c.id];
          if (!strategy) {
            return (
              <div key={c.id} className="rounded-2xl border border-dashed border-border bg-muted/30 p-3 text-sm text-muted-foreground">
                <p className="font-bold text-foreground">{c.name}</p>
                <p className="mt-1 text-xs">Pick a connect strategy in step 2 first.</p>
              </div>
            );
          }
          const steps = generateActionPlan(c.id, strategy, answersByCluster[c.id] ?? {});
          return (
            <div key={c.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-sm font-bold">{c.name}</p>
                <span className="rounded-full bg-critical/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-critical">
                  {CONNECT_STRATEGY_LABEL[strategy]}
                </span>
              </div>
              <ol className="list-decimal space-y-2 pl-5 text-sm leading-snug">
                {steps.map((s, i) => (
                  <li key={i}>
                    <span>{s.text}</span>
                    {s.link && (
                      <button
                        type="button"
                        onClick={() => setOpenLink(s.link!)}
                        className="ml-1 inline-flex items-center gap-1 align-baseline text-critical underline underline-offset-2 hover:no-underline"
                      >
                        {s.link.label}
                        <ExternalLink className="h-3 w-3" />
                      </button>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          );
        })}
      </div>

      <Dialog open={Boolean(openLink)} onOpenChange={(o) => !o && setOpenLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{openLink?.label}</DialogTitle>
            {openLink?.kind === "deck" && (
              <DialogDescription>
                Opening <span className="font-mono text-foreground">{openLink.deckTitle}</span> (placeholder deck).
              </DialogDescription>
            )}
          </DialogHeader>
          {openLink?.kind === "popup-list" && (
            <ul className="space-y-1.5 text-sm">
              {(openLink.items ?? []).map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-critical">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )}
          {openLink?.kind === "popup-text" && (
            <p className="whitespace-pre-line text-sm leading-relaxed">{openLink.body}</p>
          )}
          {openLink?.kind === "popup-contacts" && (
            <div className="space-y-2">
              {(openLink.contacts ?? []).length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts added yet.</p>
              ) : (
                (openLink.contacts ?? []).map((c, i) => (
                  <div key={c.id ?? i} className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <p className="font-semibold">{c.name || "Unnamed contact"}</p>
                    <dl className="mt-1 grid grid-cols-[110px_1fr] gap-y-1 text-xs">
                      {c.phone && (<><dt className="text-muted-foreground">Phone</dt><dd>{c.phone}</dd></>)}
                      {c.area && (<><dt className="text-muted-foreground">Area</dt><dd>{c.area}</dd></>)}
                      {c.brandPreference && (<><dt className="text-muted-foreground">Brand Preference</dt><dd>{c.brandPreference}</dd></>)}
                    </dl>
                  </div>
                ))
              )}
            </div>
          )}
          {openLink?.kind === "deck" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{openLink.body}</p>
              <div className="rounded-lg border border-dashed border-border bg-muted/40 p-4 text-center text-xs text-muted-foreground">
                Deck preview unavailable — this is a placeholder reference.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
