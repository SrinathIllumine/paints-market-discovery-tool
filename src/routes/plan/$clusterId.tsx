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
import { ChevronDown, ChevronUp, FileDown, Info, Plus, Star, Trash2 } from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import { getCustomerGroups, getValuePropsForGroup, getCampIdeas, type ContactEntry } from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

const CONTRACTOR_BUCKET = "CONTRACTOR" as const;
const RETAILER_BUCKET = "RETAILER" as const;
const STAKEHOLDER_BUCKET = "D2C" as const;

function PlanClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();

  const customerGroups = useAppStore((s) => s.plan.customerGroupsByCluster[clusterId] ?? []);
  const groupValueProps = useAppStore((s) => s.plan.groupValuePropsByCluster[clusterId] ?? {});
  const selectedCamps = useAppStore((s) => s.plan.selectedCampsByCluster[clusterId] ?? []);
  const starred = useAppStore((s) => s.plan.starredByCluster[clusterId] ?? []);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster ?? {});

  const toggleCustomerGroup = useAppStore((s) => s.toggleCustomerGroup);
  const toggleGroupValueProp = useAppStore((s) => s.toggleGroupValueProp);
  const toggleSelectedCamp = useAppStore((s) => s.toggleSelectedCamp);
  const toggleStarred = useAppStore((s) => s.toggleStarred);
  const setStrategyContacts = useAppStore((s) => s.setStrategyContacts);
  const unlockStage = useAppStore((s) => s.unlockStage);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);

  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const contractors = strategyContacts[clusterId]?.[CONTRACTOR_BUCKET] ?? [];
  const retailers = strategyContacts[clusterId]?.[RETAILER_BUCKET] ?? [];
  const stakeholders = strategyContacts[clusterId]?.[STAKEHOLDER_BUCKET] ?? [];

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
        .map((g) => ({ id: g.id, label: g.label, pct: g.pct, valueProps: groupValueProps[g.id] ?? [] })),
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

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="CLUSTER ENGAGEMENT PLAN" title="Cluster Engagement Plan" backTo="/plan" />}
    >
      <div className="space-y-5 px-5 py-5 pb-24">
        <div className="space-y-0.5">
          <h2 className="font-display text-xl leading-tight">
            Selected Cluster: <span className="text-critical">{cluster.name}</span>
          </h2>
          <p className="text-sm text-muted-foreground">Design your quarterly engagement plan on one page</p>
        </div>

        <Section
          number="1"
          title={`What is your value proposition for ${cluster.name.toLowerCase()}?`}
          subtitle="Pick the customer groups you want to target, then select the value propositions for each."
        >
          <InsightsCard cluster={cluster.name}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              % distribution of customer groups
            </p>
            <div className="space-y-1.5">
              {groups.map((g) => (
                <div key={g.id} className="flex items-center gap-2 text-xs">
                  <div className="w-28 shrink-0 text-foreground">{g.label}</div>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-navy" style={{ width: `${g.pct}%` }} />
                  </div>
                  <div className="w-8 shrink-0 text-right font-semibold text-foreground">{g.pct}%</div>
                </div>
              ))}
            </div>
          </InsightsCard>

          <div className="space-y-2">
            {groups.map((g) => {
              const selectedGroup = customerGroups.includes(g.id);
              const props = getValuePropsForGroup(clusterId, g.id);
              const chosenProps = groupValueProps[g.id] ?? [];
              return (
                <div
                  key={g.id}
                  className={cn(
                    "rounded-lg border",
                    selectedGroup ? "border-critical bg-critical/5" : "border-border bg-card",
                  )}
                >
                  <label className="flex cursor-pointer items-center gap-2 px-3 py-2.5 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedGroup}
                      onChange={() => toggleCustomerGroup(clusterId, g.id)}
                      className="h-4 w-4 accent-critical"
                    />
                    <span className="flex-1 font-semibold text-foreground">{g.label}</span>
                    <span className="text-xs text-muted-foreground">{g.pct}%</span>
                  </label>
                  {selectedGroup && (
                    <div className="space-y-1.5 border-t border-border px-3 py-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Value propositions for this group
                      </p>
                      {props.map((p) => {
                        const on = chosenProps.includes(p);
                        return (
                          <label
                            key={p}
                            className={cn(
                              "flex cursor-pointer items-start gap-2 rounded-md border px-2.5 py-2 text-sm",
                              on ? "border-critical bg-critical/10" : "border-border bg-background",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={on}
                              onChange={() => toggleGroupValueProp(clusterId, g.id, p)}
                              className="mt-0.5 h-4 w-4 shrink-0 accent-critical"
                            />
                            <span className="leading-snug">{p}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Section>

        <Section
          number="2"
          title="What actions are you doing to engage with this community?"
          subtitle="Plan camps / events and capture the key people you intend to reach out to."
        >
          <SubSection number="2.1" title="Are you planning to conduct any camps / events with the community?">
            <div className="space-y-2">
              {camps.map((c) => {
                const on = selectedCamps.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
                      on ? "border-critical bg-critical/5" : "border-border bg-card",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggleSelectedCamp(clusterId, c.id)}
                      className="mt-0.5 h-4 w-4 shrink-0 accent-critical"
                    />
                    <span className="leading-snug">
                      <span className="block font-semibold">{c.label}</span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">{c.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </SubSection>

          <SubSection number="2.2" title="Are you planning to reach out to any contractors?">
            <ContactTable
              emptyHint="Add contractors you plan to engage."
              contacts={contractors}
              onChange={(list) => setStrategyContacts(clusterId, CONTRACTOR_BUCKET, list)}
            />
          </SubSection>

          <SubSection
            number="2.3"
            title="Are you planning to reach out to any retailers who can connect you to the cluster?"
          >
            <ContactTable
              emptyHint="Add retailers who can introduce you to the cluster."
              contacts={retailers}
              onChange={(list) => setStrategyContacts(clusterId, RETAILER_BUCKET, list)}
            />
          </SubSection>

          <SubSection
            number="2.4"
            title={`Are you planning to reach out directly to ${cluster.name.toLowerCase()} stakeholders?`}
          >
            <ContactTable
              emptyHint="Add stakeholders / decision-makers you plan to meet directly."
              contacts={stakeholders}
              onChange={(list) => setStrategyContacts(clusterId, STAKEHOLDER_BUCKET, list)}
            />
          </SubSection>
        </Section>

        <Section
          number="3"
          title="Create your action plan"
          subtitle="Review what you've selected and star the items to prioritize for this quarter."
        >
          <ActionPlanReview
            clusterId={clusterId}
            groups={groups}
            customerGroups={customerGroups}
            groupValueProps={groupValueProps}
            camps={camps}
            selectedCamps={selectedCamps}
            contractors={contractors}
            retailers={retailers}
            stakeholders={stakeholders}
            starred={starred}
            onToggleStar={(k) => toggleStarred(clusterId, k)}
          />
        </Section>

        <Button
          onClick={() => setConfirmOpen(true)}
          className="h-12 w-full gap-2 bg-navy text-base font-semibold text-navy-foreground hover:bg-navy/90"
        >
          <FileDown className="h-4 w-4" /> Generate Quarterly Cluster Engagement Plan
        </Button>
      </div>

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

/* ── Layout primitives ── */
function Section({
  number,
  title,
  subtitle,
  children,
}: {
  number: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <p className="text-[11px] font-bold uppercase tracking-widest text-critical">Q{number}</p>
        <h3 className="text-base font-semibold leading-tight text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function SubSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="rounded-lg border border-border bg-card">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left"
      >
        <span className="flex-1 text-sm font-semibold text-foreground">
          <span className="mr-1 text-critical">{number}.</span> {title}
        </span>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {open && <div className="border-t border-border px-3 py-3">{children}</div>}
    </div>
  );
}

function InsightsCard({ cluster, children }: { cluster: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
      <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-blue-800">
        <Info className="h-3.5 w-3.5" /> Insights · {cluster}
      </div>
      {children}
    </div>
  );
}

/* ── Action plan review ── */
function ActionPlanReview({
  clusterId,
  groups,
  customerGroups,
  groupValueProps,
  camps,
  selectedCamps,
  contractors,
  retailers,
  stakeholders,
  starred,
  onToggleStar,
}: {
  clusterId: string;
  groups: { id: string; label: string }[];
  customerGroups: string[];
  groupValueProps: Record<string, string[]>;
  camps: { id: string; label: string }[];
  selectedCamps: string[];
  contractors: ContactEntry[];
  retailers: ContactEntry[];
  stakeholders: ContactEntry[];
  starred: string[];
  onToggleStar: (key: string) => void;
}) {
  const isStarred = (key: string) => starred.includes(key);
  const selectedGroups = groups.filter((g) => customerGroups.includes(g.id));
  const selectedCampObjs = camps.filter((c) => selectedCamps.includes(c.id));

  const nothingSelected =
    selectedGroups.length === 0 &&
    selectedCampObjs.length === 0 &&
    contractors.length === 0 &&
    retailers.length === 0 &&
    stakeholders.length === 0;

  if (nothingSelected) {
    return (
      <p className="text-xs text-muted-foreground">
        Make selections in Q1 and Q2 to see your action plan summary here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {selectedGroups.length > 0 && (
        <ReviewBlock title="Value propositions selected">
          <div className="space-y-2.5">
            {selectedGroups.map((g) => {
              const props = groupValueProps[g.id] ?? [];
              return (
                <div key={g.id} className="rounded-md border border-border bg-background p-2.5">
                  <p className="text-xs font-semibold text-foreground">{g.label}</p>
                  {props.length === 0 ? (
                    <p className="mt-1 text-xs text-muted-foreground">No value propositions picked yet.</p>
                  ) : (
                    <ul className="mt-1 space-y-1">
                      {props.map((p) => (
                        <li key={p} className="text-xs leading-snug text-foreground">
                          • {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </ReviewBlock>
      )}
      <ReviewBlock title="Engagement approach">
        <div className="space-y-3">
          <StarList
            heading="Camps / events planned"
            items={selectedCampObjs.map((c) => ({ key: `camp:${c.id}`, label: c.label }))}
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            empty="No camps / events selected in Q2.1."
          />
          <StarList
            heading="Contractors to be converted"
            items={contractors
              .filter((c) => (c.name ?? "").trim())
              .map((c) => ({
                key: `contractor:${c.id}`,
                label: [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" · "),
              }))}
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            empty="No contractors added in Q2.2."
          />
          <StarList
            heading="Retailers who can help me connect"
            items={retailers
              .filter((c) => (c.name ?? "").trim())
              .map((c) => ({
                key: `retailer:${c.id}`,
                label: [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" · "),
              }))}
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            empty="No retailers added in Q2.3."
          />
          <StarList
            heading="Stakeholders to reach out directly"
            items={stakeholders
              .filter((c) => (c.name ?? "").trim())
              .map((c) => ({
                key: `stakeholder:${c.id}`,
                label: [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" · "),
              }))}
            isStarred={isStarred}
            onToggleStar={onToggleStar}
            empty="No stakeholders added in Q2.4."
          />
        </div>
      </ReviewBlock>
    </div>
  );
}

function ReviewBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      {children}
    </div>
  );
}

function StarList({
  heading,
  items,
  isStarred,
  onToggleStar,
  empty,
}: {
  heading: string;
  items: { key: string; label: string }[];
  isStarred: (key: string) => boolean;
  onToggleStar: (key: string) => void;
  empty: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-foreground">{heading}</p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it) => {
            const on = isStarred(it.key);
            return (
              <li
                key={it.key}
                className="flex items-center gap-2 rounded-md border border-border bg-background px-2.5 py-2"
              >
                <span className="flex-1 text-xs leading-snug text-foreground">{it.label}</span>
                <button
                  type="button"
                  onClick={() => onToggleStar(it.key)}
                  className="rounded p-1 hover:bg-muted/40"
                  aria-label="Prioritize"
                >
                  <Star className={cn("h-4 w-4", on ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ── Contact table ── */
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
      {contacts.length === 0 && emptyHint && <p className="text-xs text-muted-foreground">{emptyHint}</p>}
      {contacts.map((c, i) => (
        <div
          key={c.id}
          className="grid grid-cols-2 gap-1.5 rounded-md border border-border bg-background p-2 sm:grid-cols-4"
        >
          <Input value={c.name} placeholder="Name" onChange={(v) => update(i, { name: v })} />
          <Input value={c.phone ?? ""} placeholder="Phone" onChange={(v) => update(i, { phone: v })} />
          <Input value={c.area ?? ""} placeholder="Area" onChange={(v) => update(i, { area: v })} />
          <div className="flex items-center gap-1">
            <Input
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
