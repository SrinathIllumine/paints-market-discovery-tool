import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS, getCluster } from "@/data/clusters";
import { useAppStore, type EventType, type ReadinessAnswer } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Star } from "lucide-react";

export const Route = createFileRoute("/plan/")({
  head: () => ({
    meta: [
      { title: "Outreach Plan · Stage 3" },
      { name: "description", content: "Convert insights into an actionable monthly outreach plan." },
    ],
  }),
  component: PlanScreen,
});

const POT_SCORE = { H: 3, M: 2, L: 1 } as const;

function PlanScreen() {
  const targetIds = useAppStore((s) => s.plan.targetClusterIds);
  const toggleTarget = useAppStore((s) => s.toggleTargetCluster);
  const stakeholders = useAppStore((s) => s.stakeholders);
  const clusterStates = useAppStore((s) => s.clusters);
  const events = useAppStore((s) => s.plan.events);
  const addEvent = useAppStore((s) => s.addEvent);
  const removeEvent = useAppStore((s) => s.removeEvent);
  const readinessMap = useAppStore((s) => s.plan.readiness);
  const setReadiness = useAppStore((s) => s.setReadiness);

  const ranked = useMemo(() => {
    return [...CLUSTERS]
      .map((c) => {
        const stkCount = stakeholders[c.id]?.length ?? 0;
        const jk = clusterStates[c.id]?.jkShare;
        const jkScore = jk === "H" ? 3 : jk === "M" ? 2 : jk === "L" ? 1 : 0;
        const score = POT_SCORE[c.potential] * 2 + stkCount + jkScore;
        return { cluster: c, score, stkCount };
      })
      .sort((a, b) => b.score - a.score);
  }, [stakeholders, clusterStates]);

  const [eventOpen, setEventOpen] = useState(false);
  const [eventDraft, setEventDraft] = useState<{
    clusterId: string;
    type: EventType;
    date: string;
    note: string;
  }>({
    clusterId: CLUSTERS[0].id,
    type: "Workshop",
    date: "",
    note: "",
  });

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="Stage 3 of 3 · Outreach Plan"
          title="Plan this period"
          subtitle="Pick targets, plan events, check delivery readiness."
        />
      }
    >
      <div className="space-y-6 px-5 py-5">
        {/* 1 — Targets */}
        <Section
          title="Target clusters for this period"
          subtitle="Top of the list is recommended based on potential, connects and JK share."
        >
          <div className="space-y-2">
            {ranked.map(({ cluster, score, stkCount }, i) => {
              const active = targetIds.includes(cluster.id);
              return (
                <button
                  key={cluster.id}
                  onClick={() => toggleTarget(cluster.id)}
                  className={cn(
                    "flex w-full items-start justify-between gap-3 rounded-2xl border p-3 text-left transition-colors",
                    active
                      ? "border-critical bg-critical/5"
                      : "border-border bg-card hover:bg-muted/40",
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {i === 0 && <Star className="h-3.5 w-3.5 fill-critical text-critical" />}
                      <p className="truncate font-medium">{cluster.name}</p>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Score {score} · {stkCount} contacts
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
        </Section>

        {/* 2 — How to connect summary */}
        <Section
          title="How to connect"
          subtitle="Summarised strategies for the clusters you've picked."
        >
          {targetIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Select clusters above to see strategies.</p>
          ) : (
            <div className="space-y-3">
              {targetIds.map((id) => {
                const c = getCluster(id);
                if (!c) return null;
                return (
                  <div key={id} className="rounded-2xl border border-border bg-card p-4">
                    <p className="font-display text-lg leading-tight">{c.name}</p>
                    <ul className="mt-2 space-y-1.5 text-sm">
                      {c.howToConnect.slice(0, 2).map((h) => (
                        <li key={h} className="flex gap-2">
                          <span className="text-critical">•</span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* 3 — Events */}
        <Section
          title="Contribution events"
          right={
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setEventDraft({
                  clusterId: targetIds[0] ?? CLUSTERS[0].id,
                  type: "Workshop",
                  date: "",
                  note: "",
                });
                setEventOpen(true);
              }}
              className="h-8 gap-1 text-xs"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          }
        >
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No events planned yet. Add workshops, audits, awareness sessions or contractor meets.
            </p>
          ) : (
            <div className="space-y-2">
              {events.map((e) => {
                const c = getCluster(e.clusterId);
                return (
                  <div
                    key={e.id}
                    className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-card p-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{e.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {c?.name ?? e.clusterId}
                        {e.date ? ` · ${e.date}` : ""}
                      </p>
                      {e.note && <p className="mt-1 text-xs">{e.note}</p>}
                    </div>
                    <button
                      onClick={() => removeEvent(e.id)}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"
                      aria-label="Remove event"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* 4 — Readiness */}
        <Section
          title="Service delivery readiness"
          subtitle="Quick check across your selected clusters. Gaps in red."
        >
          {targetIds.length === 0 ? (
            <p className="text-sm text-muted-foreground">Select clusters above to run the checklist.</p>
          ) : (
            <div className="space-y-3">
              {targetIds.map((id) => {
                const c = getCluster(id);
                if (!c) return null;
                const r = readinessMap[id] ?? {
                  retailers: null,
                  stock: null,
                  painters: null,
                  trained: null,
                };
                return (
                  <div key={id} className="rounded-2xl border border-border bg-card p-4">
                    <p className="mb-3 font-medium">{c.name}</p>
                    <ReadinessRow
                      label="Enough retailers in this cluster?"
                      value={r.retailers}
                      onChange={(v) => setReadiness(id, { retailers: v })}
                    />
                    <ReadinessRow
                      label="Stock availability checked?"
                      value={r.stock}
                      onChange={(v) => setReadiness(id, { stock: v })}
                    />
                    <ReadinessRow
                      label="Enough painters / contractors?"
                      value={r.painters}
                      onChange={(v) => setReadiness(id, { painters: v })}
                    />
                    <ReadinessRow
                      label="Are they trained for this cluster's needs?"
                      value={r.trained}
                      onChange={(v) => setReadiness(id, { trained: v })}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <Dialog open={eventOpen} onOpenChange={setEventOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Add event</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-1">
            <div className="space-y-1.5">
              <Label>Cluster</Label>
              <select
                value={eventDraft.clusterId}
                onChange={(e) => setEventDraft({ ...eventDraft, clusterId: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CLUSTERS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["Workshop", "Audit", "Awareness", "Contractor Meet"] as EventType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setEventDraft({ ...eventDraft, type: t })}
                    className={cn(
                      "rounded-xl border px-3 py-2 text-sm font-medium",
                      eventDraft.type === t
                        ? "border-navy bg-navy text-navy-foreground"
                        : "border-border bg-card",
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-date">Date (optional)</Label>
              <Input
                id="ev-date"
                type="date"
                value={eventDraft.date}
                onChange={(e) => setEventDraft({ ...eventDraft, date: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-note">Note (optional)</Label>
              <Input
                id="ev-note"
                value={eventDraft.note}
                onChange={(e) => setEventDraft({ ...eventDraft, note: e.target.value })}
                placeholder="Venue, focus, expected attendees…"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEventOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                addEvent({
                  clusterId: eventDraft.clusterId,
                  type: eventDraft.type,
                  date: eventDraft.date || undefined,
                  note: eventDraft.note || undefined,
                });
                setEventOpen(false);
              }}
              className="bg-critical text-critical-foreground hover:bg-critical/90"
            >
              Add event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-xl">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </section>
  );
}

function ReadinessRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ReadinessAnswer;
  onChange: (v: ReadinessAnswer) => void;
}) {
  const opts: { v: Exclude<ReadinessAnswer, null>; label: string }[] = [
    { v: "Y", label: "Yes" },
    { v: "P", label: "Partial" },
    { v: "N", label: "No" },
  ];
  const isGap = value === "N" || value === "P";
  return (
    <div className="mb-3 last:mb-0">
      <p className={cn("mb-1.5 text-sm", isGap ? "text-critical" : "text-foreground")}>{label}</p>
      <div className="flex gap-1.5">
        {opts.map((o) => (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium",
              value === o.v
                ? o.v === "Y"
                  ? "border-navy bg-navy text-navy-foreground"
                  : "border-critical bg-critical text-critical-foreground"
                : "border-border bg-card text-muted-foreground",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
