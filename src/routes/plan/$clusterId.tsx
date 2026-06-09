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
  MARKET_ENGAGEMENT_OPTIONS,
  getValuePropositions,
  type ConnectStrategy,
  type ContactEntry,
  type MarketEngagementCategory,
} from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

type PlanStep = "value" | "market" | "customer";

const STEPS: { id: PlanStep; title: string }[] = [
  { id: "value",    title: "Select your value proposition" },
  { id: "market",   title: "Design your market engagement strategy" },
  { id: "customer", title: "Design your customer engagement strategy" },
];

const STAGE_HEADING_CLS = "font-display text-lg leading-tight";

// We re-use the existing store slots:
//   market-engagement selections → strategyItemsByCluster[clusterId]["BRAND"]
//   market-engagement touchpoints → strategyContactsByCluster[clusterId]["BRAND"]
//   customer-engagement strategies → selectedStrategiesByCluster[clusterId]
const MARKET_BUCKET: ConnectStrategy = "BRAND";

const CATEGORY_TONE: Record<MarketEngagementCategory, string> = {
  Knowledge: "border-blue-200 bg-blue-50 text-blue-800",
  Service:   "border-amber-200 bg-amber-50 text-amber-800",
  Social:    "border-violet-200 bg-violet-50 text-violet-800",
};

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

  const [openStep, setOpenStep] = useState<PlanStep>("value");
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
      selectedActions: {},
      customActions: {},
    });
    setConfirmOpen(false);
  };

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
          <p className="text-sm text-muted-foreground">Roadmap for the cluster</p>
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
                        strategies={customerStrategies}
                        onToggle={(s) => toggleSelectedStrategy(clusterId, s)}
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
  strategies, onToggle,
}: { strategies: ConnectStrategy[]; onToggle: (s: ConnectStrategy) => void }) {
  return (
    <div>
      <p className="mb-2 text-xs text-muted-foreground">
        Pick one or more channels you'll lean on to reach the end customer.
      </p>
      <div className="space-y-2">
        {CONNECT_STRATEGY_OPTIONS.map((opt) => {
          const active = strategies.includes(opt.key);
          return (
            <label
              key={opt.key}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 text-sm",
                active ? "border-critical bg-critical/5" : "border-border bg-card",
              )}
            >
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
          );
        })}
      </div>
    </div>
  );
}

/* ---------------- shared: contacts table ---------------- */

function ContactTable({
  title, contacts, onChange,
}: {
  title: string;
  contacts: ContactEntry[];
  onChange: (list: ContactEntry[]) => void;
}) {
  const list = contacts;
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
                placeholder="Notes"
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
