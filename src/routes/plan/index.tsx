import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS, getCluster } from "@/data/clusters";
import { computeClusterScores, HML_LABEL, type HML } from "@/lib/clusterScoring";
import { useAppStore, type RoadmapStep } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Check, ChevronDown, FileDown, Map, Plus, Trash2 } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import {
  CONNECT_STRATEGY_OPTIONS,
  CONNECT_STRATEGY_LABEL,
  getValuePropositions,
  getRecommendedActions,
  getBrandInitiatives,
  getContributionEvents,
  getD2cInitiatives,
  getContractorSuggestions,
  type ActionAsset,
  type ConnectStrategy,
  type ContactEntry,
} from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/")({
  head: () => ({
    meta: [
      { title: "Monthly Cluster Engagement Plan" },
      { name: "description", content: "Plan your monthly engagement across clusters." },
    ],
  }),
  component: PlanScreen,
});

const STEPS: { id: RoadmapStep; title: string }[] = [
  { id: "value", title: "Select your value proposition" },
  { id: "connect", title: "Design your connect strategy" },
  { id: "action", title: "Build your action plan" },
];

const STAGE_HEADING_CLS = "font-display text-lg leading-tight";

function PlanScreen() {
  const focusIds = useAppStore((s) => s.plan.monthlyFocusIds);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);
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
  const roadmapCompletion = useAppStore((s) => s.plan.roadmapCompletion);
  const setRoadmapStep = useAppStore((s) => s.setRoadmapStep);
  const clusterStates = useAppStore((s) => s.clusters);

  const [openStep, setOpenStep] = useState<RoadmapStep>("value");
  const [assetOpen, setAssetOpen] = useState<ActionAsset | null>(null);
  const [clusterQuery, setClusterQuery] = useState("");
  const [clusterPickerOpen, setClusterPickerOpen] = useState(true);

  // Bucket all clusters by potential × access (H/M/L combinations).
  const sortedClusters = useMemo(() => {
    return [...CLUSTERS].map((c) => {
      const pc = clusterStates[c.id]?.prospects.length ?? c.prospectCountEstimate;
      const sc = computeClusterScores(c, pc);
      return { c, sc };
    });
  }, [clusterStates]);

  const filtered = useMemo(() => {
    const q = clusterQuery.trim().toLowerCase();
    if (!q) return sortedClusters;
    return sortedClusters.filter(({ c }) => c.name.toLowerCase().includes(q));
  }, [sortedClusters, clusterQuery]);

  const BUCKETS: { potential: HML; access: HML; label: string; recommended?: boolean }[] = [
    { potential: "H", access: "H", label: "High Potential · High Access", recommended: true },
    { potential: "H", access: "M", label: "High Potential · Medium Access" },
    { potential: "H", access: "L", label: "High Potential · Low Access" },
    { potential: "M", access: "H", label: "Medium Potential · High Access" },
    { potential: "M", access: "M", label: "Medium Potential · Medium Access" },
    { potential: "M", access: "L", label: "Medium Potential · Low Access" },
    { potential: "L", access: "H", label: "Low Potential · High Access" },
    { potential: "L", access: "M", label: "Low Potential · Medium Access" },
    { potential: "L", access: "L", label: "Low Potential · Low Access" },
  ];

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
      const ca = customActions[focusClusterId] ?? {};
      return strategies.some((s) => (sa[s] ?? []).length > 0 || (ca[s] ?? []).length > 0);
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
      strategyItems: strategyItems[focusClusterId] ?? {},
      strategyContacts: strategyContacts[focusClusterId] ?? {},
      selectedActions: selectedActions[focusClusterId] ?? {},
      customActions: customActions[focusClusterId] ?? {},
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
        {/* Cluster focus picker — bucketed, searchable, collapses on select */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <button
            type="button"
            onClick={() => setClusterPickerOpen((v) => !v)}
            className="flex w-full items-start justify-between gap-3 text-left"
          >
            <div className="min-w-0">
              <h2 className={STAGE_HEADING_CLS}>
                Which cluster would you like to focus on this month?
              </h2>
              {focusCluster && !clusterPickerOpen && (
                <p className="mt-1 text-xs text-muted-foreground">
                  Focused: <b className="text-foreground">{focusCluster.name}</b> · tap to change
                </p>
              )}
            </div>
            <ChevronDown className={cn(
              "mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform",
              clusterPickerOpen && "rotate-180",
            )} />
          </button>

          {clusterPickerOpen && (
            <div className="mt-3 space-y-3">
              <input
                value={clusterQuery}
                onChange={(e) => setClusterQuery(e.target.value)}
                placeholder="Search clusters…"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              />
              {BUCKETS.map((b) => {
                const items = filtered.filter(
                  ({ sc }) => sc.potentialHML === b.potential && sc.accessRollupHML === b.access,
                );
                if (items.length === 0) return null;
                return (
                  <BucketCard
                    key={b.label}
                    label={b.label}
                    recommended={b.recommended}
                    defaultOpen={Boolean(b.recommended)}
                    count={items.length}
                  >
                    <div className="space-y-1.5">
                      {items.map(({ c, sc }) => {
                        const active = focusClusterId === c.id;
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setMonthlyFocus(c.id);
                              setClusterPickerOpen(false);
                            }}
                            className={cn(
                              "flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left transition-colors",
                              active ? "border-critical bg-critical/5" : "border-border bg-background hover:bg-muted/40",
                            )}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{c.name}</p>
                              <p className="mt-0.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                <LabelChip label="Potential" hml={sc.potentialHML} />
                                <LabelChip label="Access" hml={sc.accessRollupHML} />
                              </p>
                            </div>
                            <div className={cn(
                              "h-5 w-5 shrink-0 rounded-full border-2",
                              active ? "border-critical bg-critical" : "border-border",
                            )} />
                          </button>
                        );
                      })}
                    </div>
                  </BucketCard>
                );
              })}
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground">No clusters match "{clusterQuery}".</p>
              )}
            </div>
          )}
        </section>


        {/* Roadmap */}
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
                            clusterId={focusCluster.id}
                            selected={vp}
                            onSelect={(v) => setValueProposition(focusCluster.id, v)}
                          />
                        )}
                        {step.id === "connect" && (
                          <ConnectStep
                            clusterId={focusCluster.id}
                            strategies={strategies}
                            items={strategyItems[focusCluster.id] ?? {}}
                            contacts={strategyContacts[focusCluster.id] ?? {}}
                            onToggleStrategy={(s) => toggleSelectedStrategy(focusCluster.id, s)}
                            onToggleItem={(s, item) => toggleStrategyItem(focusCluster.id, s, item)}
                            onContactsChange={(s, list) => setStrategyContacts(focusCluster.id, s, list)}
                          />
                        )}
                        {step.id === "action" && (
                          <ActionStep
                            clusterId={focusCluster.id}
                            strategies={strategies}
                            selected={selectedActions[focusCluster.id] ?? {}}
                            custom={customActions[focusCluster.id] ?? {}}
                            onToggle={(s, a) => toggleSelectedAction(focusCluster.id, s, a)}
                            onAddCustom={(s, t) => addCustomAction(focusCluster.id, s, t)}
                            onRemoveCustom={(s, t) => removeCustomAction(focusCluster.id, s, t)}
                            onOpenAsset={setAssetOpen}
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
      </div>

      <AssetDialog asset={assetOpen} onClose={() => setAssetOpen(null)} />
    </AppShell>
  );
}

function LabelChip({ label, hml }: { label: string; hml: HML }) {
  const cls =
    hml === "H" ? "bg-green-100 text-green-800"
    : hml === "M" ? "bg-orange-100 text-orange-800"
    : "bg-red-100 text-red-800";
  return (
    <span className={cn("rounded-full px-2 py-0.5", cls)}>
      {label}: {HML_LABEL[hml]}
    </span>
  );
}

function BucketCard({
  label, recommended, defaultOpen, count, children,
}: {
  label: string;
  recommended?: boolean;
  defaultOpen?: boolean;
  count: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState<boolean>(Boolean(defaultOpen));
  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-left"
      >
        <div className="flex items-center gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-foreground/80">
            {label}
          </p>
          {recommended && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-800">
              Recommended
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">({count})</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  );
}

/* ---------------- Step components ---------------- */

function ValueStep({
  clusterId, selected, onSelect,
}: { clusterId: string; selected?: string; onSelect: (v: string) => void }) {
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
  clusterId, strategies, items, contacts, onToggleStrategy, onToggleItem, onContactsChange,
}: {
  clusterId: string;
  strategies: ConnectStrategy[];
  items: Partial<Record<ConnectStrategy, string[]>>;
  contacts: Partial<Record<ConnectStrategy, ContactEntry[]>>;
  onToggleStrategy: (s: ConnectStrategy) => void;
  onToggleItem: (s: ConnectStrategy, item: string) => void;
  onContactsChange: (s: ConnectStrategy, list: ContactEntry[]) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Choose up to 3 strategies. Then pick the specific initiatives for each.
      </p>
      <div className="space-y-3">
        {CONNECT_STRATEGY_OPTIONS.map((opt) => {
          const active = strategies.includes(opt.key);
          const disabled = !active && strategies.length >= 3;
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
                  onChange={() => onToggleStrategy(opt.key)}
                  className="mt-0.5 h-4 w-4 accent-critical"
                />
                <span className="leading-snug">
                  <span className="font-semibold">{opt.label}</span>
                  <span className="block text-xs text-muted-foreground">{opt.description}</span>
                </span>
              </label>
              {active && (
                <div className="mt-2 ml-6 space-y-2">
                  <StrategyContent
                    strategy={opt.key}
                    clusterId={clusterId}
                    selectedItems={items[opt.key] ?? []}
                    contacts={contacts[opt.key] ?? []}
                    onToggleItem={(it) => onToggleItem(opt.key, it)}
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

function StrategyContent({
  strategy, clusterId, selectedItems, contacts, onToggleItem, onContactsChange,
}: {
  strategy: ConnectStrategy;
  clusterId: string;
  selectedItems: string[];
  contacts: ContactEntry[];
  onToggleItem: (item: string) => void;
  onContactsChange: (list: ContactEntry[]) => void;
}) {
  if (strategy === "BRAND") {
    return (
      <ItemList
        title="Brand awareness initiatives"
        items={getBrandInitiatives(clusterId)}
        selected={selectedItems}
        onToggle={onToggleItem}
      />
    );
  }
  if (strategy === "D2C") {
    return (
      <ItemList
        title="Direct sales initiatives"
        items={getD2cInitiatives(clusterId)}
        selected={selectedItems}
        onToggle={onToggleItem}
      />
    );
  }
  if (strategy === "CONTRACTOR") {
    return (
      <ContactTable
        title="Contractors you'd engage"
        contacts={contacts}
        seed={getContractorSuggestions(clusterId)}
        onChange={onContactsChange}
      />
    );
  }
  // OUTREACH: events + community contacts
  return (
    <div className="space-y-3">
      <ItemList
        title="Contribution event suggestions"
        items={getContributionEvents(clusterId)}
        selected={selectedItems}
        onToggle={onToggleItem}
      />
      <ContactTable
        title="Community touchpoints / influencers"
        contacts={contacts}
        seed={[]}
        onChange={onContactsChange}
      />
    </div>
  );
}

function ItemList({
  title, items, selected, onToggle,
}: { title: string; items: string[]; selected: string[]; onToggle: (s: string) => void }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="space-y-1.5">
        {items.map((it) => {
          const on = selected.includes(it);
          return (
            <label key={it} className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={on}
                onChange={() => onToggle(it)}
                className="mt-0.5 h-4 w-4 accent-critical"
              />
              <span className="leading-snug">{it}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ContactTable({
  title, contacts, seed, onChange,
}: {
  title: string;
  contacts: ContactEntry[];
  seed: ContactEntry[];
  onChange: (list: ContactEntry[]) => void;
}) {
  const list = contacts.length > 0 ? contacts : seed;
  const update = (i: number, patch: Partial<ContactEntry>) => {
    const next = list.map((c, idx) => (idx === i ? { ...c, ...patch } : c));
    onChange(next);
  };
  const add = () =>
    onChange([...list, { id: `c-${Date.now()}`, name: "", phone: "", area: "", brandPreference: "" }]);
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
          <div key={c.id} className="grid grid-cols-2 gap-1.5 rounded-md border border-border bg-background p-2 sm:grid-cols-4">
            <Input value={c.name} placeholder="Name" onChange={(v) => update(i, { name: v })} />
            <Input value={c.phone ?? ""} placeholder="Phone" onChange={(v) => update(i, { phone: v })} />
            <Input value={c.area ?? ""} placeholder="Area" onChange={(v) => update(i, { area: v })} />
            <div className="flex items-center gap-1">
              <Input
                value={c.brandPreference ?? ""}
                placeholder="Brand preference"
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

function ActionStep({
  clusterId, strategies, selected, custom, onToggle, onAddCustom, onRemoveCustom, onOpenAsset,
}: {
  clusterId: string;
  strategies: ConnectStrategy[];
  selected: Partial<Record<ConnectStrategy, string[]>>;
  custom: Partial<Record<ConnectStrategy, string[]>>;
  onToggle: (s: ConnectStrategy, a: string) => void;
  onAddCustom: (s: ConnectStrategy, t: string) => void;
  onRemoveCustom: (s: ConnectStrategy, t: string) => void;
  onOpenAsset: (a: ActionAsset) => void;
}) {
  const [draft, setDraft] = useState<Partial<Record<ConnectStrategy, string>>>({});

  if (strategies.length === 0) {
    return <p className="text-sm text-muted-foreground">Pick at least one strategy first.</p>;
  }
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Pick the recommended actions you'll commit to, or add your own customized plan items.
      </p>
      {strategies.map((s) => {
        const actions = getRecommendedActions(s, clusterId);
        const sel = selected[s] ?? [];
        const cust = custom[s] ?? [];
        return (
          <div key={s} className="rounded-lg border border-border bg-card p-3">
            <p className="mb-2 text-sm font-semibold">{CONNECT_STRATEGY_LABEL[s]}</p>
            <div className="space-y-1.5">
              {actions.map((a) => {
                const on = sel.includes(a.text);
                return (
                  <div key={a.text} className="rounded border border-border bg-background p-2">
                    <label className="flex cursor-pointer items-start gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => onToggle(s, a.text)}
                        className="mt-0.5 h-4 w-4 accent-critical"
                      />
                      <span className="leading-snug">{a.text}</span>
                    </label>
                    {a.assets && a.assets.length > 0 && (
                      <div className="mt-1.5 ml-6 flex flex-wrap gap-1.5">
                        {a.assets.map((asset, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => onOpenAsset(asset)}
                            className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] text-navy hover:bg-muted/60"
                          >
                            {asset.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {cust.length > 0 && (
                <div className="space-y-1">
                  {cust.map((c) => (
                    <div key={c} className="flex items-start gap-2 rounded border border-dashed border-border bg-background p-2 text-sm">
                      <span className="flex-1 leading-snug">{c}</span>
                      <button
                        type="button"
                        onClick={() => onRemoveCustom(s, c)}
                        className="rounded p-1 text-muted-foreground hover:bg-muted/40"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-1.5 pt-1">
                <input
                  value={draft[s] ?? ""}
                  onChange={(e) => setDraft({ ...draft, [s]: e.target.value })}
                  placeholder="Add your own customized action"
                  className="flex-1 rounded border border-border bg-background px-2 py-1.5 text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 text-xs"
                  onClick={() => {
                    const t = (draft[s] ?? "").trim();
                    if (!t) return;
                    onAddCustom(s, t);
                    setDraft({ ...draft, [s]: "" });
                  }}
                >
                  <Plus className="h-3 w-3" /> Add
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AssetDialog({ asset, onClose }: { asset: ActionAsset | null; onClose: () => void }) {
  return (
    <Dialog open={asset !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{asset?.label ?? ""}</DialogTitle>
          {asset?.kind === "deck" && (
            <DialogDescription>Sample proposal deck contents.</DialogDescription>
          )}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {asset?.kind === "list" && asset.items && (
            <ul className="space-y-2 text-sm">
              {asset.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-critical">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )}
          {asset?.kind === "text" && <p className="text-sm">{asset.body}</p>}
          {asset?.kind === "deck" && <p className="text-sm leading-relaxed">{asset.body}</p>}
          {asset?.kind === "contacts" && asset.contacts && (
            <div className="space-y-2">
              {asset.contacts.map((c) => (
                <div key={c.id} className="rounded border border-border bg-card p-2 text-xs">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-muted-foreground">{c.phone} · {c.area}</p>
                  {c.brandPreference && (
                    <p className="text-muted-foreground">Prefers: {c.brandPreference}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
