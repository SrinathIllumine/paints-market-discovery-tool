import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, useRef } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, FileDown, Plus, Star, Trash2 } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  CONNECT_STRATEGY_OPTIONS,
  CONNECT_STRATEGY_LABEL,
  MARKET_ENGAGEMENT_OPTIONS,
  getMarketOptionsForStrategies,
  getValuePropositionCards,
  getRecommendedActions,
  type ActionAsset,
  type ConnectStrategy,
  type ContactEntry,
  type MarketEngagementCategory,
  type MarketEngagementOption,
  type ValuePropositionCard,
} from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

type PlanStep = 0 | 1 | 2 | 3;

const MARKET_BUCKET: ConnectStrategy = "BRAND";

const CATEGORY_TONE: Record<MarketEngagementCategory, string> = {
  Knowledge: "border-blue-200 bg-blue-50 text-blue-800",
  Service: "border-amber-200 bg-amber-50 text-amber-800",
  Social: "border-violet-200 bg-violet-50 text-violet-800",
};

const CATEGORY_BLURB: Record<MarketEngagementCategory, string> = {
  Knowledge: "Share know-how",
  Service: "Offer on-ground help",
  Social: "Show up in the community",
};

const INFLUENCER_ROLES = ["Site supervisor", "Interior designer", "Architect", "Other"];

/* ─────────────────────────────────────────────────────────────
   Stepper bar
───────────────────────────────────────────────────────────── */
const STEP_LABELS = [
  ["Design Value", "Proposition"],
  ["Select", "Connect", "Approach"],
  ["Plan", "Outreach", "Initiatives"],
  ["Create", "Action", "Plan"],
];

const ARROW_PX = 12;

function StepperBar({ current, onGoTo }: { current: PlanStep; onGoTo: (n: PlanStep) => void }) {
  return (
    <div className="flex items-stretch px-5 pb-4" style={{ gap: 2 }}>
      {STEP_LABELS.map((lines, i) => {
        const active = i <= current;
        const isFirst = i === 0;
        const isLast = i === STEP_LABELS.length - 1;
        const clipPath = isFirst
          ? `polygon(0 0, calc(100% - ${ARROW_PX}px) 0, 100% 50%, calc(100% - ${ARROW_PX}px) 100%, 0 100%)`
          : isLast
            ? `polygon(0 0, 100% 0, 100% 100%, 0 100%, ${ARROW_PX}px 50%)`
            : `polygon(0 0, calc(100% - ${ARROW_PX}px) 0, 100% 50%, calc(100% - ${ARROW_PX}px) 100%, 0 100%, ${ARROW_PX}px 50%)`;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onGoTo(i as PlanStep)}
            style={{
              flex: 1,
              minWidth: 0,
              clipPath,
              paddingTop: 8,
              paddingBottom: 8,
              paddingLeft: isFirst ? 10 : ARROW_PX + 6,
              paddingRight: isLast ? 10 : ARROW_PX + 6,
              border: "none",
              outline: "none",
              cursor: "pointer",
              background: active ? "#1B2F5E" : "#CBD5E1",
              transition: "background 0.15s",
            }}
          >
            {lines.map((line, li) => (
              <span
                key={li}
                style={{
                  display: "block",
                  fontSize: 9,
                  fontWeight: 500,
                  lineHeight: 1.35,
                  letterSpacing: "0.02em",
                  color: active ? "#ffffff" : "#1B2F5E",
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {line}
              </span>
            ))}
          </button>
        );
      })}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Main screen
───────────────────────────────────────────────────────────── */
function PlanClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);

  const valuePropByCluster = useAppStore((s) => s.plan.valuePropositionByCluster);
  const setValueProposition = useAppStore((s) => s.setValueProposition);
  const selectedStrategies = useAppStore((s) => s.plan.selectedStrategiesByCluster);
  const toggleSelectedStrategy = useAppStore((s) => s.toggleSelectedStrategy);
  const strategyItems = useAppStore((s) => s.plan.strategyItemsByCluster);
  const toggleStrategyItem = useAppStore((s) => s.toggleStrategyItem);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster);
  const setStrategyContacts = useAppStore((s) => s.setStrategyContacts);
  const selectedActions = useAppStore((s) => s.plan.selectedActionsByCluster);
  const toggleSelectedAction = useAppStore((s) => s.toggleSelectedAction);
  const customActions = useAppStore((s) => s.plan.customActionsByCluster);
  const addCustomAction = useAppStore((s) => s.addCustomAction);
  const removeCustomAction = useAppStore((s) => s.removeCustomAction);
  const eventEstimates = useAppStore((s) => s.plan.eventEstimatesByCluster);
  const setEventEstimate = useAppStore((s) => s.setEventEstimate);
  const unlockStage = useAppStore((s) => s.unlockStage);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);

  const mainRef = useRef<HTMLElement>(null);
  const [step, setStep] = useState<PlanStep>(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [estimateEventId, setEstimateEventId] = useState<string | null>(null);

  // Stage 4: starred items (local state — committed this month)
  const [starredItems, setStarredItems] = useState<Set<string>>(new Set());
  const toggleStar = (key: string) =>
    setStarredItems((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const goTo = (n: PlanStep) => {
    setStep(n);
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  };

  if (!cluster) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">
          Cluster not found.{" "}
          <button className="text-navy underline" onClick={() => navigate({ to: "/plan" })}>
            Go back
          </button>
        </div>
      </AppShell>
    );
  }

  const vp = valuePropByCluster[clusterId];
  const customerStrategies = selectedStrategies[clusterId] ?? [];
  const marketSelected = strategyItems[clusterId]?.[MARKET_BUCKET] ?? [];
  const marketContacts = strategyContacts[clusterId]?.[MARKET_BUCKET] ?? [];

  const handleGenerate = () => {
    generateMonthlyEngagementPlanPdf({
      focusClusterId: clusterId,
      valueProposition: vp ?? "",
      strategies: customerStrategies,
      strategyItems: strategyItems[clusterId] ?? {},
      strategyContacts: strategyContacts[clusterId] ?? {},
      selectedActions: selectedActions[clusterId] ?? {},
      customActions: customActions[clusterId] ?? {},
      marketSelected,
      eventEstimates: eventEstimates[clusterId] ?? {},
    });
    setConfirmOpen(false);
    unlockStage(3);
    setMonthlyFocus(clusterId);
  };

  const estimateEvent = estimateEventId ? MARKET_ENGAGEMENT_OPTIONS.find((m) => m.id === estimateEventId) : undefined;
  const estimateValue = estimateEventId ? (eventEstimates[clusterId]?.[estimateEventId] ?? {}) : {};

  return (
    <AppShell
      ref={mainRef}
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="STAGE 2 OF 3 · MY ACTION PLAN" title="My Action Plan" backTo="/plan" />}
    >
      <div className="space-y-4 px-5 py-5">
        <div className="space-y-0.5">
          <h2 className="font-display text-xl leading-tight">
            Selected Cluster: <span className="text-critical">{cluster.name}</span>
          </h2>
          <p className="text-sm text-muted-foreground">Roadmap for the cluster — design with your ASM</p>
        </div>
      </div>

      <StepperBar current={step} onGoTo={goTo} />

      <div className="px-5 pb-8 space-y-4">
        {/* Stage 1: Value Proposition */}
        {step === 0 && (
          <>
            <StageSectionTitle index={1} title="Design value proposition" />
            <ValueStep clusterId={clusterId} selected={vp} onSelect={(v) => setValueProposition(clusterId, v)} />
            <NavButtons onNext={() => goTo(1)} />
          </>
        )}

        {/* Stage 2: Connect Approach */}
        {step === 1 && (
          <>
            <StageSectionTitle index={2} title="Select connect approach" />
            <CustomerStep
              clusterId={clusterId}
              strategies={customerStrategies}
              contactsByStrategy={strategyContacts[clusterId] ?? {}}
              onToggle={(s) => toggleSelectedStrategy(clusterId, s)}
              onContactsChange={(s, list) => setStrategyContacts(clusterId, s, list)}
            />
            <NavButtons onBack={() => goTo(0)} onNext={() => goTo(2)} />
          </>
        )}

        {/* Stage 3: Outreach Initiatives */}
        {step === 2 && (
          <>
            <StageSectionTitle index={3} title="Plan outreach initiatives" />
            <OutreachStep
              clusterId={clusterId}
              customerStrategies={customerStrategies}
              marketSelected={marketSelected}
              marketContacts={marketContacts}
              selectedActions={selectedActions[clusterId] ?? {}}
              customActions={customActions[clusterId] ?? {}}
              onToggleEvent={(it) => toggleStrategyItem(clusterId, MARKET_BUCKET, it)}
              onContactsChange={(list) => setStrategyContacts(clusterId, MARKET_BUCKET, list)}
              onToggleAction={(s, a) => toggleSelectedAction(clusterId, s, a)}
              onAddCustom={(s, t) => addCustomAction(clusterId, s, t)}
              onRemoveCustom={(s, t) => removeCustomAction(clusterId, s, t)}
            />
            <NavButtons onBack={() => goTo(1)} onNext={() => goTo(3)} />
          </>
        )}

        {/* Stage 4: Action Plan */}
        {step === 3 && (
          <>
            <StageSectionTitle index={4} title="Create action plan" />
            <ActionPlanStep
              clusterId={clusterId}
              customerStrategies={customerStrategies}
              marketSelected={marketSelected}
              selectedActions={selectedActions[clusterId] ?? {}}
              customActions={customActions[clusterId] ?? {}}
              eventEstimates={eventEstimates[clusterId] ?? {}}
              starredItems={starredItems}
              onToggleStar={toggleStar}
              onOpenEstimate={(id) => setEstimateEventId(id)}
            />
            <Button
              onClick={() => setConfirmOpen(true)}
              className="h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90 mt-4"
            >
              <FileDown className="h-4 w-4" /> Generate Monthly Cluster Engagement Plan
            </Button>
            <NavButtons onBack={() => goTo(2)} />
          </>
        )}
      </div>

      {/* Confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ready to generate?</DialogTitle>
            <DialogDescription>
              Have you completed all your planning decisions for <b>{cluster.name}</b>? The PDF will capture your
              current selections.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              Keep editing
            </Button>
            <Button onClick={handleGenerate} className="bg-navy text-navy-foreground hover:bg-navy/90">
              Yes, generate plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Event estimate dialog */}
      <Dialog open={estimateEventId !== null} onOpenChange={(o) => !o && setEstimateEventId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Plan: {estimateEvent?.label ?? ""}</DialogTitle>
            <DialogDescription>
              Estimate the audience size so you can prepare materials, samples and logistics.
            </DialogDescription>
          </DialogHeader>
          {estimateEventId && (
            <div className="grid grid-cols-2 gap-3">
              <NumberField
                label="Participants estimated"
                value={estimateValue.participants}
                onChange={(v) => setEventEstimate(clusterId, estimateEventId, { participants: v })}
              />
              <NumberField
                label="Contractors estimated"
                value={estimateValue.contractors}
                onChange={(v) => setEventEstimate(clusterId, estimateEventId, { contractors: v })}
              />
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setEstimateEventId(null)} className="bg-navy text-navy-foreground hover:bg-navy/90">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared helpers
───────────────────────────────────────────────────────────── */
function StageSectionTitle({ index, title }: { index: number; title: string }) {
  return (
    <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">
      Stage {index}: {title}
    </p>
  );
}

function NavButtons({ onBack, onNext }: { onBack?: () => void; onNext?: () => void }) {
  return (
    <div className={cn("flex mt-4", onBack && onNext ? "justify-between" : onBack ? "justify-start" : "justify-end")}>
      {onBack && (
        <Button size="sm" variant="outline" onClick={onBack} className="gap-1.5">
          <ChevronLeft className="h-3.5 w-3.5" /> Back
        </Button>
      )}
      {onNext && (
        <Button size="sm" onClick={onNext} className="gap-1.5 bg-navy text-navy-foreground hover:bg-navy/90">
          Next <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stage 1: Value proposition
───────────────────────────────────────────────────────────── */
function ValueStep({
  clusterId,
  selected,
  onSelect,
}: {
  clusterId: string;
  selected?: string;
  onSelect: (v: string) => void;
}) {
  const baseCards: ValuePropositionCard[] = useMemo(() => getValuePropositionCards(clusterId).slice(0, 2), [clusterId]);
  const baseTitles = baseCards.map((c) => c.title);
  const [customs, setCustoms] = useState<string[]>(() => {
    if (selected && !baseTitles.includes(selected)) return [selected];
    return [];
  });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const submitCustom = () => {
    const t = draft.trim();
    if (!t) {
      setAdding(false);
      return;
    }
    if (!baseTitles.includes(t) && !customs.includes(t)) setCustoms((c) => [...c, t]);
    onSelect(t);
    setDraft("");
    setAdding(false);
  };

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">Pick one value proposition to carry through your plan.</p>
      <div className="space-y-2">
        {baseCards.map((card) => {
          const active = selected === card.title;
          return (
            <label
              key={card.title}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
                active ? "border-critical bg-critical/5" : "border-border bg-card",
              )}
            >
              <input
                type="radio"
                name="value-prop"
                checked={active}
                onChange={() => onSelect(card.title)}
                className="mt-1 h-4 w-4 shrink-0 accent-critical"
              />
              <span className="block font-semibold text-foreground leading-snug">{card.title}</span>
            </label>
          );
        })}
        {customs.map((opt) => {
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
                className="mt-0.5 h-4 w-4 shrink-0 accent-critical"
              />
              <span className="leading-snug">{opt}</span>
            </label>
          );
        })}
        {adding ? (
          <div className="flex items-start gap-1.5 rounded-lg border border-dashed border-border bg-background p-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitCustom();
              }}
              placeholder="Type your own value proposition…"
              className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-sm"
            />
            <Button size="sm" onClick={submitCustom} className="h-8 bg-navy text-navy-foreground hover:bg-navy/90">
              Add
            </Button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-muted/40"
          >
            <Plus className="h-3.5 w-3.5" /> Add your value proposition
          </button>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stage 2: Connect approach — contact table for each strategy
   D2C shows "Stakeholder Connects" instead of checklist
───────────────────────────────────────────────────────────── */
function CustomerStep({
  clusterId,
  strategies,
  contactsByStrategy,
  onToggle,
  onContactsChange,
}: {
  clusterId: string;
  strategies: ConnectStrategy[];
  contactsByStrategy: Partial<Record<ConnectStrategy, ContactEntry[]>>;
  onToggle: (s: ConnectStrategy) => void;
  onContactsChange: (s: ConnectStrategy, list: ContactEntry[]) => void;
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pick one or more channels. Add your key contacts for each selected approach.
      </p>
      <div className="space-y-3">
        {CONNECT_STRATEGY_OPTIONS.map((opt) => {
          const active = strategies.includes(opt.key);
          const contactTitle =
            opt.key === "D2C"
              ? "Stakeholder Connects"
              : opt.key === "CONTRACTOR"
                ? "Contractor Contacts"
                : opt.key === "RETAILER"
                  ? "Retailer Contacts"
                  : "Influencer Contacts";
          return (
            <div
              key={opt.key}
              className={cn("rounded-lg border", active ? "border-critical bg-critical/5" : "border-border bg-card")}
            >
              <label className="flex cursor-pointer items-start gap-2 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggle(opt.key)}
                  className="mt-0.5 h-4 w-4 accent-critical"
                />
                <span className="leading-snug">
                  <span className="font-semibold">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </label>
              {active && (
                <div className="border-t border-border px-3 py-3">
                  <ContactTable
                    title={contactTitle}
                    contacts={contactsByStrategy[opt.key] ?? []}
                    onChange={(list) => onContactsChange(opt.key, list)}
                    showRole={opt.key === "INFLUENCER"}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stage 3: Outreach initiatives
   - Contribution events at top (from getMarketOptionsForStrategies)
   - Connect actions per selected strategy (selectable)
───────────────────────────────────────────────────────────── */
function OutreachStep({
  clusterId,
  customerStrategies,
  marketSelected,
  marketContacts,
  selectedActions,
  customActions,
  onToggleEvent,
  onContactsChange,
  onToggleAction,
  onAddCustom,
  onRemoveCustom,
}: {
  clusterId: string;
  customerStrategies: ConnectStrategy[];
  marketSelected: string[];
  marketContacts: ContactEntry[];
  selectedActions: Partial<Record<ConnectStrategy, string[]>>;
  customActions: Partial<Record<ConnectStrategy, string[]>>;
  onToggleEvent: (id: string) => void;
  onContactsChange: (list: ContactEntry[]) => void;
  onToggleAction: (s: ConnectStrategy, a: string) => void;
  onAddCustom: (s: ConnectStrategy, a: string) => void;
  onRemoveCustom: (s: ConnectStrategy, a: string) => void;
}) {
  const marketOptions: MarketEngagementOption[] = useMemo(
    () => getMarketOptionsForStrategies(customerStrategies.length > 0 ? customerStrategies : ["CONTRACTOR"]),
    [customerStrategies],
  );
  const [draftByStrategy, setDraftByStrategy] = useState<Partial<Record<ConnectStrategy, string>>>({});

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Select the contribution events and connect actions you plan to run this month.
      </p>

      {/* Contribution events */}
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contribution Events
        </p>
        {!customerStrategies.length && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 mb-2">
            No connect approach selected. Go back to Stage 2 to pick one.
          </div>
        )}
        <div className="space-y-2">
          {marketOptions.map((opt) => {
            const active = marketSelected.includes(opt.id);
            return (
              <label
                key={opt.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm",
                  active ? "border-critical bg-critical/5" : "border-border bg-card",
                )}
              >
                <input
                  type="checkbox"
                  checked={active}
                  onChange={() => onToggleEvent(opt.id)}
                  className="mt-1 h-4 w-4 accent-critical"
                />
                <span className="min-w-0 flex-1 leading-snug">
                  {/*<span className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                        CATEGORY_TONE[opt.category],
                      )}
                    >
                      {opt.category} · {CATEGORY_BLURB[opt.category]}
                    </span>
                  </span>*/}
                  <span className="block text-sm font-semibold">{opt.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Connect actions per strategy */}
      {customerStrategies.map((s) => {
        const actions = getRecommendedActions(s, clusterId);
        const chosen = selectedActions[s] ?? [];
        const customs = customActions[s] ?? [];
        const draft = draftByStrategy[s] ?? "";
        return (
          <div key={s}>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Connect Actions — {CONNECT_STRATEGY_LABEL[s]}
            </p>
            <div className="space-y-1.5">
              {actions.map((a) => {
                const on = chosen.includes(a.text);
                return (
                  <label
                    key={a.text}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                      on ? "border-critical bg-critical/5" : "border-border bg-card",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => onToggleAction(s, a.text)}
                      className="mt-0.5 h-4 w-4 accent-critical"
                    />
                    <span className="leading-snug">{a.text}</span>
                  </label>
                );
              })}
              {customs.map((c, i) => (
                <div
                  key={`cust-${i}`}
                  className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                >
                  <span className="flex items-start gap-2">
                    <span className="mt-0.5 inline-flex h-4 w-4 items-center justify-center rounded border border-critical bg-critical/10 text-[10px] text-critical">
                      +
                    </span>
                    <span className="leading-snug">{c}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => onRemoveCustom(s, c)}
                    className="rounded p-1 text-muted-foreground hover:bg-muted/40"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <input
                value={draft}
                onChange={(e) => setDraftByStrategy((d) => ({ ...d, [s]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const t = draft.trim();
                    if (t) {
                      onAddCustom(s, t);
                      setDraftByStrategy((d) => ({ ...d, [s]: "" }));
                    }
                  }
                }}
                placeholder="Add your own action…"
                className="flex-1 rounded border border-border bg-background px-2 py-1 text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const t = draft.trim();
                  if (t) {
                    onAddCustom(s, t);
                    setDraftByStrategy((d) => ({ ...d, [s]: "" }));
                  }
                }}
                className="h-7 gap-1 text-xs"
              >
                <Plus className="h-3 w-3" /> Add
              </Button>
            </div>
          </div>
        );
      })}

      <ContactTable title="Touchpoints / community contacts" contacts={marketContacts} onChange={onContactsChange} />
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Stage 4: Action plan — star items to commit for this month
───────────────────────────────────────────────────────────── */
function ActionPlanStep({
  clusterId,
  customerStrategies,
  marketSelected,
  selectedActions,
  customActions,
  eventEstimates,
  starredItems,
  onToggleStar,
  onOpenEstimate,
}: {
  clusterId: string;
  customerStrategies: ConnectStrategy[];
  marketSelected: string[];
  selectedActions: Partial<Record<ConnectStrategy, string[]>>;
  customActions: Partial<Record<ConnectStrategy, string[]>>;
  eventEstimates: Record<string, { participants?: number; contractors?: number }>;
  starredItems: Set<string>;
  onToggleStar: (key: string) => void;
  onOpenEstimate: (eventId: string) => void;
}) {
  const chosenEvents = MARKET_ENGAGEMENT_OPTIONS.filter((m) => marketSelected.includes(m.id));

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Star the items you're committing to take up this month.</p>

      {/* Contribution events */}
      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contribution Events
        </h4>
        {chosenEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No events selected in Stage 3 yet.</p>
        ) : (
          <ul className="space-y-2">
            {chosenEvents.map((ev) => {
              const key = `event-${ev.id}`;
              const starred = starredItems.has(key);
              const est = eventEstimates[ev.id] ?? {};
              const filled = est.participants != null || est.contractors != null;
              return (
                <li key={ev.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-tight">{ev.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{ev.category}</p>
                      {filled && (
                        <p className="mt-1 text-[11px] text-muted-foreground">
                          Participants: <b className="text-foreground">{est.participants ?? "—"}</b>
                          {" · "}
                          Contractors: <b className="text-foreground">{est.contractors ?? "—"}</b>
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={filled ? "outline" : "default"}
                        onClick={() => onOpenEstimate(ev.id)}
                        className={cn(
                          "h-7 shrink-0 text-xs",
                          !filled && "bg-navy text-navy-foreground hover:bg-navy/90",
                        )}
                      >
                        {filled ? "Edit" : "Plan"}
                      </Button>
                      <button
                        type="button"
                        onClick={() => onToggleStar(key)}
                        className="rounded p-1 hover:bg-muted/40"
                        aria-label="Star"
                      >
                        <Star
                          className={cn("h-5 w-5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                        />
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Connect actions per strategy */}
      {customerStrategies.map((s) => {
        const allActions = [
          ...getRecommendedActions(s, clusterId)
            .filter((a) => (selectedActions[s] ?? []).includes(a.text))
            .map((a) => a.text),
          ...(customActions[s] ?? []),
        ];
        if (allActions.length === 0) return null;
        return (
          <section key={s}>
            <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {CONNECT_STRATEGY_LABEL[s]} Actions
            </h4>
            <ul className="space-y-2">
              {allActions.map((text) => {
                const key = `action-${s}-${text}`;
                const starred = starredItems.has(key);
                return (
                  <li
                    key={key}
                    className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2.5"
                  >
                    <span className="flex-1 text-sm leading-snug">{text}</span>
                    <button
                      type="button"
                      onClick={() => onToggleStar(key)}
                      className="rounded p-1 hover:bg-muted/40 shrink-0"
                      aria-label="Star"
                    >
                      <Star
                        className={cn("h-5 w-5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {customerStrategies.length === 0 && chosenEvents.length === 0 && (
        <p className="text-xs text-muted-foreground">
          Nothing selected yet. Go back to Stage 3 to select your initiatives.
        </p>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Shared: contacts table
───────────────────────────────────────────────────────────── */
function ContactTable({
  title,
  contacts,
  onChange,
  showRole = false,
}: {
  title: string;
  contacts: ContactEntry[];
  onChange: (list: ContactEntry[]) => void;
  showRole?: boolean;
}) {
  const update = (i: number, patch: Partial<ContactEntry>) =>
    onChange(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () =>
    onChange([
      ...contacts,
      {
        id: `c-${Date.now()}`,
        name: "",
        phone: "",
        area: "",
        brandPreference: "",
        role: showRole ? INFLUENCER_ROLES[0] : undefined,
      },
    ]);
  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Button size="sm" variant="outline" onClick={add} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {contacts.length === 0 && (
          <p className="text-xs text-muted-foreground">No contacts yet. Add one to get started.</p>
        )}
        {contacts.map((c, i) => (
          <div
            key={c.id}
            className={cn(
              "grid grid-cols-2 gap-1.5 rounded-md border border-border bg-background p-2",
              showRole ? "sm:grid-cols-5" : "sm:grid-cols-4",
            )}
          >
            <Input value={c.name} placeholder="Name" onChange={(v) => update(i, { name: v })} />
            <Input value={c.phone ?? ""} placeholder="Phone" onChange={(v) => update(i, { phone: v })} />
            <Input value={c.area ?? ""} placeholder="Area" onChange={(v) => update(i, { area: v })} />
            {showRole && (
              <select
                value={c.role ?? INFLUENCER_ROLES[0]}
                onChange={(e) => update(i, { role: e.target.value })}
                className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
              >
                {INFLUENCER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
            <div className="flex items-center gap-1">
              <Input
                value={c.brandPreference ?? ""}
                placeholder="Brand Preference"
                onChange={(v) => update(i, { brandPreference: v })}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="rounded p-1 text-muted-foreground hover:bg-muted/40"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Input({
  value,
  placeholder,
  onChange,
}: {
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded border border-border bg-background px-2 py-1 text-xs"
    />
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</span>
      <input
        type="number"
        min={0}
        value={value ?? ""}
        onChange={(e) => {
          const t = e.target.value;
          onChange(t === "" ? undefined : Math.max(0, Number(t)));
        }}
        className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
      />
    </label>
  );
}
