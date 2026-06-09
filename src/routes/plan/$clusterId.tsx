import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { ChevronDown, FileDown, Plus, Trash2 } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  CONNECT_STRATEGY_OPTIONS,
  CONNECT_STRATEGY_LABEL,
  MARKET_ENGAGEMENT_OPTIONS,
  getValuePropositions,
  getD2cInitiatives,
  getRecommendedActions,
  type ConnectStrategy,
  type ContactEntry,
  type MarketEngagementCategory,
} from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

type PlanStep = "value" | "market" | "customer" | "action";

const STEPS: { id: PlanStep; title: string }[] = [
  { id: "value",    title: "Select your value proposition" },
  { id: "market",   title: "Design your market engagement strategy" },
  { id: "customer", title: "Design your customer engagement strategy" },
  { id: "action",   title: "Action plan" },
];

const STAGE_HEADING_CLS = "font-display text-lg leading-tight";

// Market-engagement selections live under the BRAND bucket (legacy).
const MARKET_BUCKET: ConnectStrategy = "BRAND";

const CATEGORY_TONE: Record<MarketEngagementCategory, string> = {
  Knowledge: "border-blue-200 bg-blue-50 text-blue-800",
  Service:   "border-amber-200 bg-amber-50 text-amber-800",
  Social:    "border-violet-200 bg-violet-50 text-violet-800",
};

const INFLUENCER_ROLES = ["Site supervisor", "Interior designer", "Architect", "Other"];

function PlanClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();
  const cluster = useMemo(() => getCluster(clusterId), [clusterId]);

  const valuePropByCluster   = useAppStore((s) => s.plan.valuePropositionByCluster);
  const setValueProposition  = useAppStore((s) => s.setValueProposition);
  const selectedStrategies   = useAppStore((s) => s.plan.selectedStrategiesByCluster);
  const toggleSelectedStrategy = useAppStore((s) => s.toggleSelectedStrategy);
  const strategyItems        = useAppStore((s) => s.plan.strategyItemsByCluster);
  const toggleStrategyItem   = useAppStore((s) => s.toggleStrategyItem);
  const strategyContacts     = useAppStore((s) => s.plan.strategyContactsByCluster);
  const setStrategyContacts  = useAppStore((s) => s.setStrategyContacts);
  const selectedActions      = useAppStore((s) => s.plan.selectedActionsByCluster);
  const toggleSelectedAction = useAppStore((s) => s.toggleSelectedAction);
  const eventEstimates       = useAppStore((s) => s.plan.eventEstimatesByCluster);
  const setEventEstimate     = useAppStore((s) => s.setEventEstimate);

  const [openStep, setOpenStep] = useState<PlanStep>("value");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [estimateEventId, setEstimateEventId] = useState<string | null>(null);

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
      customActions: {},
    });
    setConfirmOpen(false);
  };

  const estimateEvent = estimateEventId
    ? MARKET_ENGAGEMENT_OPTIONS.find((m) => m.id === estimateEventId)
    : undefined;
  const estimateValue = estimateEventId
    ? (eventEstimates[clusterId]?.[estimateEventId] ?? {})
    : {};

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Planning"
          title="My Engagement Plan"
          backTo="/plan"
        />
      }
    >
      <div className="space-y-5 px-6 py-6">
        <div className="space-y-1">
          <h2 className="font-display text-xl leading-tight">
            Selected Cluster: <span className="text-critical">{cluster.name}</span>
          </h2>
          <p className="text-sm text-muted-foreground">Roadmap for the cluster - Design with your ASM</p>
        </div>

        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isOpen = openStep === step.id;
            return (
              <div key={step.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenStep(isOpen ? ("" as PlanStep) : step.id)}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                >
                  <span className={STAGE_HEADING_CLS}>
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
                        clusterId={clusterId}
                        selected={vp}
                        onSelect={(v) => setValueProposition(clusterId, v)}
                      />
                    )}
                    {step.id === "market" && (
                      <MarketStep
                        selected={marketSelected}
                        contacts={marketContacts}
                        onToggleItem={(it) => toggleStrategyItem(clusterId, MARKET_BUCKET, it)}
                        onContactsChange={(list) => setStrategyContacts(clusterId, MARKET_BUCKET, list)}
                      />
                    )}
                    {step.id === "customer" && (
                      <CustomerStep
                        clusterId={clusterId}
                        strategies={customerStrategies}
                        contactsByStrategy={strategyContacts[clusterId] ?? {}}
                        onToggle={(s) => toggleSelectedStrategy(clusterId, s)}
                        onContactsChange={(s, list) => setStrategyContacts(clusterId, s, list)}
                      />
                    )}
                    {step.id === "action" && (
                      <ActionStep
                        clusterId={clusterId}
                        marketSelected={marketSelected}
                        customerStrategies={customerStrategies}
                        selectedActions={selectedActions[clusterId] ?? {}}
                        eventEstimates={eventEstimates[clusterId] ?? {}}
                        onToggleAction={(s, a) => toggleSelectedAction(clusterId, s, a)}
                        onOpenEstimate={(eventId) => setEstimateEventId(eventId)}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => setConfirmOpen(true)}
          className="h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <FileDown className="h-4 w-4" /> Generate Monthly Cluster Engagement Plan
        </Button>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ready to generate?</DialogTitle>
            <DialogDescription>
              Have you completed all your planning decisions for <b>{cluster.name}</b>? The PDF will
              capture your current selections.
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

/* ---------------- Stage 1: value proposition ---------------- */

function ValueStep({
  clusterId, selected, onSelect,
}: { clusterId: string; selected?: string; onSelect: (v: string) => void }) {
  const baseOptions = useMemo(() => getValuePropositions(clusterId).slice(0, 2), [clusterId]);
  const [customs, setCustoms] = useState<string[]>(() => {
    if (selected && !baseOptions.includes(selected)) return [selected];
    return [];
  });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");

  const allOptions = [...baseOptions, ...customs];

  const submitCustom = () => {
    const t = draft.trim();
    if (!t) { setAdding(false); return; }
    if (!allOptions.includes(t)) setCustoms((c) => [...c, t]);
    onSelect(t);
    setDraft("");
    setAdding(false);
  };

  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Pick one value proposition to carry through your plan.
      </p>
      <div className="space-y-2">
        {allOptions.map((opt) => {
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

        {adding ? (
          <div className="flex items-start gap-1.5 rounded-lg border border-dashed border-border bg-background p-2">
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submitCustom(); }}
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

/* ---------------- Stage 2: market engagement ---------------- */

function MarketStep({
  selected, contacts, onToggleItem, onContactsChange,
}: {
  selected: string[];
  contacts: ContactEntry[];
  onToggleItem: (item: string) => void;
  onContactsChange: (list: ContactEntry[]) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Pick the brand-building &amp; contribution events you'll run this month — across knowledge,
        service and social contributions.
      </p>

      <div className="space-y-2">
        {MARKET_ENGAGEMENT_OPTIONS.map((opt) => {
          const active = selected.includes(opt.id);
          return (
            <label
              key={opt.id}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                active ? "border-critical bg-critical/5" : "border-border bg-card",
              )}
            >
              <input
                type="checkbox"
                checked={active}
                onChange={() => onToggleItem(opt.id)}
                className="mt-0.5 h-4 w-4 accent-critical"
              />
              <span className="min-w-0 flex-1 leading-snug">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{opt.label}</span>
                  <span className={cn(
                    "rounded-full border px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider",
                    CATEGORY_TONE[opt.category],
                  )}>
                    {opt.category}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">{opt.description}</span>
              </span>
            </label>
          );
        })}
      </div>

      <ContactTable
        title="Touchpoints / community contacts"
        contacts={contacts}
        onChange={onContactsChange}
      />
    </div>
  );
}

/* ---------------- Stage 3: customer engagement ---------------- */

function CustomerStep({
  clusterId, strategies, contactsByStrategy, onToggle, onContactsChange,
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
        Pick one or more channels you'll lean on to reach the end customer. Multiple selections allowed.
      </p>
      <div className="space-y-3">
        {CONNECT_STRATEGY_OPTIONS.map((opt) => {
          const active = strategies.includes(opt.key);
          return (
            <div
              key={opt.key}
              className={cn(
                "rounded-lg border",
                active ? "border-critical bg-critical/5" : "border-border bg-card",
              )}
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
                  <StrategyDetails
                    clusterId={clusterId}
                    strategy={opt.key}
                    contacts={contactsByStrategy[opt.key] ?? []}
                    onContactsChange={(list) => onContactsChange(opt.key, list)}
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

function StrategyDetails({
  clusterId, strategy, contacts, onContactsChange,
}: {
  clusterId: string;
  strategy: ConnectStrategy;
  contacts: ContactEntry[];
  onContactsChange: (list: ContactEntry[]) => void;
}) {
  if (strategy === "D2C") {
    const suggestions = getD2cInitiatives(clusterId);
    return (
      <div className="space-y-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          SUGGESTED DIRECT-SALES STRATEGIES
        </p>
        <ul className="list-disc space-y-1 pl-5 text-xs marker:text-critical">
          {suggestions.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </div>
    );
  }

  if (strategy === "INFLUENCER") {
    return (
      <ContactTable
        title="Influencer contacts"
        contacts={contacts}
        onChange={onContactsChange}
        showRole
      />
    );
  }

  const title =
    strategy === "CONTRACTOR" ? "Contractor contacts"
      : strategy === "RETAILER" ? "Retailer contacts"
      : "Contacts";
  return (
    <ContactTable
      title={title}
      contacts={contacts}
      onChange={onContactsChange}
    />
  );
}

/* ---------------- Stage 4: action plan ---------------- */

function ActionStep({
  clusterId, marketSelected, customerStrategies, selectedActions, eventEstimates,
  onToggleAction, onOpenEstimate,
}: {
  clusterId: string;
  marketSelected: string[];
  customerStrategies: ConnectStrategy[];
  selectedActions: Partial<Record<ConnectStrategy, string[]>>;
  eventEstimates: Record<string, { participants?: number; contractors?: number }>;
  onToggleAction: (s: ConnectStrategy, a: string) => void;
  onOpenEstimate: (eventId: string) => void;
}) {
  const chosenEvents = MARKET_ENGAGEMENT_OPTIONS.filter((m) => marketSelected.includes(m.id));

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">
        Plan the next concrete steps for each event and each customer engagement strategy.
      </p>

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Contribution & brand events
        </h4>
        {chosenEvents.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No events selected in Stage 2 yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {chosenEvents.map((ev) => {
              const est = eventEstimates[ev.id] ?? {};
              const filled = est.participants != null || est.contractors != null;
              return (
                <li key={ev.id} className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-tight">{ev.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{ev.category}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={filled ? "outline" : "default"}
                      onClick={() => onOpenEstimate(ev.id)}
                      className={cn(
                        "h-8 shrink-0 text-xs",
                        !filled && "bg-navy text-navy-foreground hover:bg-navy/90",
                      )}
                    >
                      {filled ? "Edit estimate" : "Plan event"}
                    </Button>
                  </div>
                  {filled && (
                    <p className="mt-1.5 text-[11px] text-muted-foreground">
                      Participants: <b className="text-foreground">{est.participants ?? "—"}</b>{" · "}
                      Contractors: <b className="text-foreground">{est.contractors ?? "—"}</b>
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section>
        <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Customer engagement strategies
        </h4>
        {customerStrategies.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No customer engagement strategies selected in Stage 3 yet.
          </p>
        ) : (
          <div className="space-y-3">
            {customerStrategies.map((s) => {
              const actions = getRecommendedActions(s, clusterId);
              const chosen = selectedActions[s] ?? [];
              return (
                <div key={s} className="rounded-lg border border-border bg-background p-3">
                  <p className="mb-1.5 text-sm font-semibold">{CONNECT_STRATEGY_LABEL[s]}</p>
                  <ul className="space-y-1.5">
                    {actions.map((a) => {
                      const on = chosen.includes(a.text);
                      return (
                        <li key={a.text}>
                          <label className="flex cursor-pointer items-start gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => onToggleAction(s, a.text)}
                              className="mt-0.5 h-4 w-4 accent-critical"
                            />
                            <span className="leading-snug">{a.text}</span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

/* ---------------- shared: contacts table ---------------- */

function ContactTable({
  title, contacts, onChange, showRole = false,
}: {
  title: string;
  contacts: ContactEntry[];
  onChange: (list: ContactEntry[]) => void;
  showRole?: boolean;
}) {
  const list = contacts;
  const update = (i: number, patch: Partial<ContactEntry>) => {
    const next = list.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange(next);
  };
  const add = () =>
    onChange([...list, { id: `c-${Date.now()}`, name: "", phone: "", area: "", brandPreference: "", role: showRole ? INFLUENCER_ROLES[0] : undefined }]);
  const remove = (i: number) => onChange(list.filter((_, idx) => idx !== i));

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
        <Button size="sm" variant="outline" onClick={add} className="h-7 gap-1 text-xs">
          <Plus className="h-3 w-3" /> Add
        </Button>
      </div>
      <div className="space-y-2">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground">No contacts yet. Add one to get started.</p>
        )}
        {list.map((c, i) => (
          <div key={c.id} className={cn(
            "grid grid-cols-2 gap-1.5 rounded-md border border-border bg-background p-2",
            showRole ? "sm:grid-cols-5" : "sm:grid-cols-4",
          )}>
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
                  <option key={r} value={r}>{r}</option>
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
  value, placeholder, onChange,
}: { value: string; placeholder: string; onChange: (v: string) => void }) {
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
  label, value, onChange,
}: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
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
