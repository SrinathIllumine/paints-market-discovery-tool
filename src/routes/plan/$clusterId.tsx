import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { useAppStore, type RoadmapStep } from "@/store/appStore";
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

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

const STEPS: { id: RoadmapStep; title: string }[] = [
  { id: "value", title: "Select your value proposition" },
  { id: "connect", title: "Design your connect strategy" },
  { id: "action", title: "Prioritize your action plan" },
];

const STAGE_HEADING_CLS = "font-display text-lg leading-tight";

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

  const [openStep, setOpenStep] = useState<RoadmapStep>("value");
  const [assetOpen, setAssetOpen] = useState<ActionAsset | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

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
  const strategies = selectedStrategies[clusterId] ?? [];

  const handleGenerate = () => {
    generateMonthlyEngagementPlanPdf({
      focusClusterId: clusterId,
      valueProposition: vp ?? "",
      strategies,
      strategyItems: strategyItems[clusterId] ?? {},
      strategyContacts: strategyContacts[clusterId] ?? {},
      selectedActions: selectedActions[clusterId] ?? {},
      customActions: customActions[clusterId] ?? {},
    });
    setConfirmOpen(false);
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Planning"
          title={cluster.name}
          subtitle="Curate your engagement plan"
          backTo="/plan"
        />
      }
    >
      <div className="space-y-6 px-6 py-8">
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const isOpen = openStep === step.id;
            return (
              <div key={step.id} className="overflow-hidden rounded-2xl border border-border bg-card">
                <button
                  type="button"
                  onClick={() => setOpenStep(isOpen ? ("" as RoadmapStep) : step.id)}
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
                    {step.id === "connect" && (
                      <ConnectStep
                        clusterId={clusterId}
                        strategies={strategies}
                        items={strategyItems[clusterId] ?? {}}
                        contacts={strategyContacts[clusterId] ?? {}}
                        onToggleStrategy={(s) => toggleSelectedStrategy(clusterId, s)}
                        onToggleItem={(s, item) => toggleStrategyItem(clusterId, s, item)}
                        onContactsChange={(s, list) => setStrategyContacts(clusterId, s, list)}
                      />
                    )}
                    {step.id === "action" && (
                      <ActionStep
                        clusterId={clusterId}
                        strategies={strategies}
                        selected={selectedActions[clusterId] ?? {}}
                        custom={customActions[clusterId] ?? {}}
                        onToggle={(s, a) => toggleSelectedAction(clusterId, s, a)}
                        onAddCustom={(s, t) => addCustomAction(clusterId, s, t)}
                        onRemoveCustom={(s, t) => removeCustomAction(clusterId, s, t)}
                        onOpenAsset={setAssetOpen}
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

      <AssetDialog asset={assetOpen} onClose={() => setAssetOpen(null)} />

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
            <Button
              onClick={handleGenerate}
              className="bg-navy text-navy-foreground hover:bg-navy/90"
            >
              Yes, generate plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
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
