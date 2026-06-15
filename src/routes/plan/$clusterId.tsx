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
import { BarChart2, ChevronDown, ChevronUp, FileDown, Plus, Star, Trash2, X } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import { getCustomerGroups, getValuePropsForGroup, getCampIdeas, type ContactEntry } from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

const CONTRACTOR_BUCKET = "CONTRACTOR" as const;
const RETAILER_BUCKET = "RETAILER" as const;
const STAKEHOLDER_BUCKET = "D2C" as const;

// Stable empty references — prevents Zustand infinite re-render (React error #185)
const EMPTY_ARR: string[] = [];
const EMPTY_REC: Record<string, string[]> = {};
const EMPTY_CONTACTS: ContactEntry[] = [];
const EMPTY_SC: Record<string, Partial<Record<string, ContactEntry[]>>> = {};

function PlanClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();

  const customerGroups = useAppStore((s) => s.plan.customerGroupsByCluster[clusterId] ?? EMPTY_ARR);
  const groupValueProps = useAppStore((s) => s.plan.groupValuePropsByCluster[clusterId] ?? EMPTY_REC);
  const selectedCamps = useAppStore((s) => s.plan.selectedCampsByCluster[clusterId] ?? EMPTY_ARR);
  const starred = useAppStore((s) => s.plan.starredByCluster[clusterId] ?? EMPTY_ARR);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster ?? EMPTY_SC);

  const toggleCustomerGroup = useAppStore((s) => s.toggleCustomerGroup);
  const toggleGroupValueProp = useAppStore((s) => s.toggleGroupValueProp);
  const toggleSelectedCamp = useAppStore((s) => s.toggleSelectedCamp);
  const toggleStarred = useAppStore((s) => s.toggleStarred);
  const setStrategyContacts = useAppStore((s) => s.setStrategyContacts);
  const unlockStage = useAppStore((s) => s.unlockStage);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const [q1Open, setQ1Open] = useState(false);
  const [q2Open, setQ2Open] = useState(false);
  const [q3Open, setQ3Open] = useState(false);
  const [campsOpen, setCampsOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [retailOpen, setRetailOpen] = useState(false);
  const [stakeOpen, setStakeOpen] = useState(false);

  const cluster = useMemo(() => {
    try {
      return getCluster(clusterId) ?? null;
    } catch {
      return null;
    }
  }, [clusterId]);

  const groups = useMemo(() => {
    if (!cluster) return [];
    try {
      return getCustomerGroups(clusterId) ?? [];
    } catch {
      return [];
    }
  }, [clusterId, cluster]);

  const camps = useMemo(() => {
    if (!cluster) return [];
    try {
      return getCampIdeas(clusterId) ?? [];
    } catch {
      return [];
    }
  }, [clusterId, cluster]);

  const contractors = strategyContacts[clusterId]?.[CONTRACTOR_BUCKET] ?? EMPTY_CONTACTS;
  const retailers = strategyContacts[clusterId]?.[RETAILER_BUCKET] ?? EMPTY_CONTACTS;
  const stakeholders = strategyContacts[clusterId]?.[STAKEHOLDER_BUCKET] ?? EMPTY_CONTACTS;

  const isStarred = (key: string) => starred.includes(key);

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

  const handleGenerate = () => {
    generateMonthlyEngagementPlanPdf({
      focusClusterId: clusterId,
      customerGroups: groups
        .filter((g) => customerGroups.includes(g.id))
        .map((g) => ({
          id: g.id,
          label: g.label,
          pct: g.pct,
          valueProps: groupValueProps[g.id] ?? [],
        })),
      camps: camps
        .filter((c) => selectedCamps.includes(c.id))
        .map((c) => ({ id: c.id, label: c.label, starred: isStarred(`camp:${c.id}`) })),
      contractors: contractors.map((c) => ({ ...c, starred: isStarred(`contractor:${c.id}`) })),
      retailers: retailers.map((c) => ({ ...c, starred: isStarred(`retailer:${c.id}`) })),
      stakeholders: stakeholders.map((c) => ({ ...c, starred: isStarred(`stakeholder:${c.id}`) })),
    });
    setConfirmOpen(false);
    unlockStage(3);
    setMonthlyFocus(clusterId);
  };

  const selectedCampObjs = camps.filter((c) => selectedCamps.includes(c.id));
  const selectedGroupObjs = groups.filter((g) => customerGroups.includes(g.id));
  const validContractors = contractors.filter((c) => (c.name ?? "").trim());
  const validRetailers = retailers.filter((c) => (c.name ?? "").trim());
  const validStakeholders = stakeholders.filter((c) => (c.name ?? "").trim());

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="CLUSTER ENGAGEMENT PLAN" title="Cluster Engagement Plan" backTo="/plan" />}
    >
      <div className="space-y-4 px-4 py-5 pb-24">
        {/* Title */}
        <div>
          <h2 className="font-serif text-xl leading-tight text-foreground">
            Cluster: <span className="text-critical">{cluster.name}</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Design your quarterly engagement plan on one page</p>
        </div>

        {/* Question 1 */}
        <Accordion
          open={q1Open}
          onToggle={() => setQ1Open((o) => !o)}
          title={`What is your value proposition for ${cluster.name.toLowerCase()}?`}
        >
          {/* Insights */}
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-widest text-blue-700">Insights</p>
                <ul className="space-y-1 text-[11px] leading-relaxed text-blue-900">
                  <li>• Vacation windows (Apr–Jun, Oct) drive 70%+ of repaint decisions</li>
                  <li>• Small private schools are the highest-volume segment (35%)</li>
                  <li>• Committee approval needed — contractor + trustee connect works best</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setChartOpen(true)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 text-[10px] font-medium text-blue-700"
              >
                <BarChart2 className="h-3 w-3" />
                Chart
              </button>
            </div>
          </div>

          {/* Customer group cards */}
          <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
            Select customer groups — tap a card to choose
          </p>
          <div className="space-y-2.5">
            {groups.map((g) => {
              const selected = customerGroups.includes(g.id);
              const props = getValuePropsForGroup(clusterId, g.id);
              const valueProp = props[0] ?? "";
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    toggleCustomerGroup(clusterId, g.id);
                    if (props[0]) toggleGroupValueProp(clusterId, g.id, props[0]);
                  }}
                  className={cn(
                    "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                    selected ? "border-critical bg-critical/5" : "border-border bg-card",
                  )}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-serif text-sm text-foreground">{g.label}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                      {g.pct}%
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-muted-foreground">{valueProp}</p>
                </button>
              );
            })}
          </div>
        </Accordion>

        {/* Question 2 */}
        <Accordion
          open={q2Open}
          onToggle={() => setQ2Open((o) => !o)}
          title="What actions are you doing to engage with this community?"
        >
          <div className="space-y-2.5">
            {/* Camps */}
            <SubAccordion
              open={campsOpen}
              onToggle={() => setCampsOpen((o) => !o)}
              title="Camps & events with the community"
            >
              <div className="space-y-2">
                {camps.map((c) => {
                  const on = selectedCamps.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-xl border px-3 py-2.5",
                        on ? "border-critical bg-critical/5" : "border-border bg-card",
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleSelectedCamp(clusterId, c.id)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-critical"
                      />
                      <span>
                        <span className="block text-sm font-medium text-foreground">{c.label}</span>
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">{c.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </SubAccordion>

            {/* Contractors */}
            <SubAccordion
              open={contractOpen}
              onToggle={() => setContractOpen((o) => !o)}
              title="Contractors to reach out"
            >
              <ContactTable
                emptyHint="Add contractors you plan to engage."
                contacts={contractors}
                onChange={(list) => setStrategyContacts(clusterId, CONTRACTOR_BUCKET, list)}
              />
            </SubAccordion>

            {/* Retailers */}
            <SubAccordion
              open={retailOpen}
              onToggle={() => setRetailOpen((o) => !o)}
              title="Retailers who can connect to cluster"
            >
              <ContactTable
                emptyHint="Add retailers who can introduce you to the cluster."
                contacts={retailers}
                onChange={(list) => setStrategyContacts(clusterId, RETAILER_BUCKET, list)}
              />
            </SubAccordion>

            {/* Stakeholders */}
            <SubAccordion open={stakeOpen} onToggle={() => setStakeOpen((o) => !o)} title="Direct stakeholder outreach">
              <ContactTable
                emptyHint="Add stakeholders / decision-makers you plan to meet directly."
                contacts={stakeholders}
                onChange={(list) => setStrategyContacts(clusterId, STAKEHOLDER_BUCKET, list)}
              />
            </SubAccordion>
          </div>
        </Accordion>

        {/* Action plan */}
        <Accordion open={q3Open} onToggle={() => setQ3Open((o) => !o)} title="Your action plan">
          {selectedGroupObjs.length === 0 &&
          selectedCampObjs.length === 0 &&
          validContractors.length === 0 &&
          validRetailers.length === 0 &&
          validStakeholders.length === 0 ? (
            <p className="text-xs text-muted-foreground">Make selections above to see your action plan here.</p>
          ) : (
            <div className="space-y-5">
              {/* Customer groups — read only */}
              {selectedGroupObjs.length > 0 && (
                <div>
                  <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Customer groups selected
                  </p>
                  <div className="space-y-1.5">
                    {selectedGroupObjs.map((g) => (
                      <div key={g.id} className="rounded-xl border border-border bg-card px-3 py-2">
                        <p className="font-serif text-sm text-foreground">{g.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {(groupValueProps[g.id] ?? [])[0] ?? "No value proposition selected"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Camps — starrable */}
              {selectedCampObjs.length > 0 && (
                <StarSection heading="Camps / events — star to prioritize">
                  {selectedCampObjs.map((c) => (
                    <StarRow
                      key={c.id}
                      title={c.label}
                      subtitle={c.description}
                      starred={isStarred(`camp:${c.id}`)}
                      onToggle={() => toggleStarred(clusterId, `camp:${c.id}`)}
                    />
                  ))}
                </StarSection>
              )}

              {/* Contractors — starrable */}
              <StarSection heading="Contractors — star to prioritize">
                {validContractors.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No contractors added yet.</p>
                ) : (
                  validContractors.map((c) => (
                    <StarRow
                      key={c.id}
                      title={c.name}
                      subtitle={[c.phone, c.area, c.brandPreference].filter(Boolean).join(" · ")}
                      starred={isStarred(`contractor:${c.id}`)}
                      onToggle={() => toggleStarred(clusterId, `contractor:${c.id}`)}
                    />
                  ))
                )}
              </StarSection>

              {/* Retailers — starrable */}
              <StarSection heading="Retailers — star to prioritize">
                {validRetailers.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No retailers added yet.</p>
                ) : (
                  validRetailers.map((c) => (
                    <StarRow
                      key={c.id}
                      title={c.name}
                      subtitle={[c.phone, c.area, c.brandPreference].filter(Boolean).join(" · ")}
                      starred={isStarred(`retailer:${c.id}`)}
                      onToggle={() => toggleStarred(clusterId, `retailer:${c.id}`)}
                    />
                  ))
                )}
              </StarSection>

              {/* Stakeholders — starrable */}
              <StarSection heading="Stakeholders — star to prioritize">
                {validStakeholders.length === 0 ? (
                  <p className="text-[11px] text-muted-foreground">No stakeholders added yet.</p>
                ) : (
                  validStakeholders.map((c) => (
                    <StarRow
                      key={c.id}
                      title={c.name}
                      subtitle={[c.phone, c.area, c.brandPreference].filter(Boolean).join(" · ")}
                      starred={isStarred(`stakeholder:${c.id}`)}
                      onToggle={() => toggleStarred(clusterId, `stakeholder:${c.id}`)}
                    />
                  ))
                )}
              </StarSection>
            </div>
          )}
        </Accordion>

        <Button
          onClick={() => setConfirmOpen(true)}
          className="h-12 w-full gap-2 bg-navy font-serif text-base text-navy-foreground hover:bg-navy/90"
        >
          <FileDown className="h-4 w-4" /> Generate quarterly cluster engagement plan
        </Button>
      </div>

      {/* Chart popup */}
      {chartOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-6"
          onClick={() => setChartOpen(false)}
        >
          <div className="w-full max-w-sm rounded-2xl bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <p className="font-serif text-base text-foreground">Customer group distribution</p>
              <button type="button" onClick={() => setChartOpen(false)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2.5">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center gap-3 text-xs">
                  <span className="w-32 shrink-0 text-foreground">{g.label}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-navy" style={{ width: `${g.pct}%` }} />
                  </div>
                  <span className="w-8 shrink-0 text-right font-semibold text-foreground">{g.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Generate confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ready to generate?</DialogTitle>
            <DialogDescription>
              The PDF will capture your selected customer groups, value propositions, camps / events and contacts for{" "}
              <b>{cluster.name}</b>.
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

/* ── Accordion ── */
function Accordion({
  open,
  onToggle,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="font-serif text-sm leading-snug text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t border-border px-4 py-4">{children}</div>}
    </div>
  );
}

/* ── SubAccordion ── */
function SubAccordion({
  open,
  onToggle,
  title,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-background">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="text-sm font-medium text-foreground">{title}</span>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

/* ── StarSection + StarRow ── */
function StarSection({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{heading}</p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function StarRow({
  title,
  subtitle,
  starred,
  onToggle,
}: {
  title: string;
  subtitle?: string;
  starred: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="flex-1">
        <p className="font-serif text-sm text-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="shrink-0 rounded-lg p-1.5 hover:bg-muted/40"
        aria-label="Prioritize"
      >
        <Star className={cn("h-4 w-4", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
      </button>
    </div>
  );
}

/* ── ContactTable ── */
function ContactTable({
  contacts,
  onChange,
  emptyHint,
}: {
  contacts: ContactEntry[];
  onChange: (list: ContactEntry[]) => void;
  emptyHint?: string;
}) {
  const update = (i: number, patch: Partial<ContactEntry>) =>
    onChange(contacts.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () =>
    onChange([
      ...contacts,
      {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: "",
        phone: "",
        area: "",
        brandPreference: "",
      },
    ]);
  const remove = (i: number) => onChange(contacts.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-2">
      {contacts.length === 0 && emptyHint && <p className="text-[11px] text-muted-foreground">{emptyHint}</p>}
      {contacts.map((c, i) => (
        <div
          key={c.id}
          className="grid grid-cols-2 gap-1.5 rounded-xl border border-border bg-background p-2 sm:grid-cols-4"
        >
          <FieldInput value={c.name} placeholder="Name" onChange={(v) => update(i, { name: v })} />
          <FieldInput value={c.phone ?? ""} placeholder="Phone" onChange={(v) => update(i, { phone: v })} />
          <FieldInput value={c.area ?? ""} placeholder="Area" onChange={(v) => update(i, { area: v })} />
          <div className="flex items-center gap-1">
            <FieldInput
              value={c.brandPreference ?? ""}
              placeholder="Current brand"
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
      <Button size="sm" variant="outline" onClick={add} className="h-7 gap-1 text-xs">
        <Plus className="h-3 w-3" /> Add
      </Button>
    </div>
  );
}

function FieldInput({
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
      className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
    />
  );
}
