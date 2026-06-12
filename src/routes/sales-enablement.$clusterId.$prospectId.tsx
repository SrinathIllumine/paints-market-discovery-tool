import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import {
  useAppStore,
  SALES_STAGES,
  SALES_STAGE_LABEL,
  EMPTY_ACTIVITY,
  EMPTY_PROSPECTS,
  type SalesStage,
} from "@/store/appStore";
import { getCluster, prospectSingular } from "@/data/clusters";
import {
  getContractorSuggestions,
  CONNECT_STRATEGY_LABEL,
  type ContactEntry,
  type ConnectStrategy,
} from "@/lib/strategyContent";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/sales-enablement/$clusterId/$prospectId")({
  component: ProspectDetailPage,
});

type ClickIn =
  | { kind: "list"; label: string; items: string[] }
  | { kind: "text"; label: string; body: string }
  | { kind: "contacts"; label: string; contacts: ContactEntry[] };

type DoneItem = { label: string; clickIn?: ClickIn };
type NextItem = { key: string; label: string; clickIn?: ClickIn };

function ProspectDetailPage() {
  const { clusterId, prospectId } = Route.useParams();
  const navigate = useNavigate();
  const cluster = getCluster(clusterId);
  const prospects = useAppStore((s) => s.clusters[clusterId]?.prospects ?? EMPTY_PROSPECTS);
  const prospect = useMemo(() => prospects.find((p) => p.id === prospectId), [prospects, prospectId]);
  const currentStage = useAppStore((s) => s.sales.prospectStages[clusterId]?.[prospectId] ?? "prospects");
  const activity = useAppStore((s) => s.sales.prospectActivity[prospectId] ?? EMPTY_ACTIVITY);
  const setStage = useAppStore((s) => s.setProspectStage);
  const recordActivity = useAppStore((s) => s.recordProspectActivity);
  const addOutcome = useAppStore((s) => s.addProspectOutcome);
  const markNotInterested = useAppStore((s) => s.markProspectNotInterested);
  const selectedStrategies = useAppStore((s) => s.plan.selectedStrategiesByCluster);

  const [outcome, setOutcome] = useState("");
  const [openClickIn, setOpenClickIn] = useState<ClickIn | null>(null);
  const [openOutcomes, setOpenOutcomes] = useState(false);

  const stageIdx = useMemo(() => SALES_STAGES.indexOf(currentStage), [currentStage]);
  const nextStage = stageIdx < SALES_STAGES.length - 1 ? SALES_STAGES[stageIdx + 1] : null;

  if (!cluster || !prospect) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Prospect not found.</div>
      </AppShell>
    );
  }

  // ── derive "where are you" (done work) by current + previous stages ─────
  const contactsClickIn: ClickIn = {
    kind: "contacts",
    label: "Decision-maker contacts",
    contacts: getContractorSuggestions(clusterId),
  };
  const outcomesClickIn: ClickIn | undefined =
    activity.outcomes && activity.outcomes.length > 0
      ? { kind: "list", label: "Past discussion outcomes", items: activity.outcomes }
      : undefined;

  const STAGE_DONE: Record<SalesStage, DoneItem[]> = {
    prospects: [{ label: "Prospect identified in cluster" }],
    contacted: [{ label: "Decision-maker contacted", clickIn: contactsClickIn }, { label: "Intro meeting completed" }],
    decision: [
      { label: "Site walkthrough done" },
      { label: "Product discussion shared", clickIn: outcomesClickIn },
      { label: "Decision-maker engaged", clickIn: contactsClickIn },
    ],
    closure: [
      { label: "Proposal accepted" },
      { label: "Supply terms confirmed" },
      { label: "Final discussion summary", clickIn: outcomesClickIn },
    ],
    ongoing: [{ label: "Project handed over" }, { label: "Quality audit scheduled" }],
  };

  // History = strictly previous stages (do NOT show current stage's pending details here)
  const doneAcross: { stage: SalesStage; items: DoneItem[] }[] = SALES_STAGES.slice(0, stageIdx).map((s) => ({
    stage: s,
    items: STAGE_DONE[s],
  }));

  // ── "what to do next" — checkboxes with optional click-ins ──────────────
  const proposalDeck: ClickIn = {
    kind: "text",
    label: "Customized proposal deck",
    body: "12-slide deck: site context, recommended SKU mix, timeline, warranty, commercials, and references from similar clusters.",
  };
  const schemesClickIn: ClickIn = {
    kind: "list",
    label: "Special customized schemes",
    items: [
      "5% volume discount on first order",
      "Free site supervision for first 30 days",
      "Bundled exterior + interior package pricing",
      "Painter loyalty enrollment for the crew",
    ],
  };
  const pamphletsClickIn: ClickIn = {
    kind: "list",
    label: "Pamphlets",
    items: [
      `Cluster-specific awareness pamphlet for ${cluster.name}`,
      "JK Maxx exteriors brochure (English + Marathi)",
      "Warranty & finish guide brochure",
    ],
  };

  const NEXT_BY_STAGE: Record<SalesStage, NextItem[]> = {
    prospects: [
      { key: "identifyDM", label: "Identify the decision maker for this account", clickIn: contactsClickIn },
      { key: "introMeet", label: "Schedule an intro meeting on-site" },
      { key: "sharePamphlet", label: "Share the cluster awareness pamphlet", clickIn: pamphletsClickIn },
    ],
    contacted: [
      { key: "productWalk", label: "Conduct a product walkthrough on-site" },
      { key: "captureScope", label: "Capture surface estimates and scope" },
      { key: "sendProposal", label: "Send across the customized proposal", clickIn: proposalDeck },
    ],
    decision: [
      { key: "customDeck", label: "You can use this customized proposal deck", clickIn: proposalDeck },
      { key: "specialSchemes", label: "Access these special customized schemes for ideas", clickIn: schemesClickIn },
      { key: "demoVisit", label: "Arrange a product demonstration visit" },
      { key: "trustEngage", label: "You can engage with the committee / trust", clickIn: contactsClickIn },
    ],
    closure: [
      { key: "lockSupply", label: "Lock the supply schedule with the customer" },
      { key: "painterBrief", label: "Brief the painter / contractor on-site", clickIn: contactsClickIn },
      { key: "qualityAudit", label: "Plan the post-handover quality audit" },
    ],
    ongoing: [
      { key: "referrals", label: "Capture referral opportunities from the account" },
      { key: "amcOffer", label: "Offer an AMC / refresh proposal" },
      {
        key: "felicitateContractors",
        label: `Felicitate top contractors involved in ${prospect.name}`,
        clickIn: contactsClickIn,
      },
      { key: "prospectTestimonial", label: `Capture a testimonial / case study from ${prospect.name}` },
    ],
  };

  const nextItems = NEXT_BY_STAGE[currentStage];
  const checked = (activity as Record<string, unknown>) ?? {};

  const handleAdvance = () => {
    if (!nextStage) {
      toast.success("Already in Continuous Ongoing Relationship");
      return;
    }
    setStage(clusterId, prospectId, nextStage);
    toast.success(`Moved to ${SALES_STAGE_LABEL[nextStage]}`);
  };

  const handleNotInterested = () => {
    markNotInterested(clusterId, prospectId);
    toast.success(`${prospect.name} moved back to Prospects`, { duration: 2500 });
    setTimeout(() => {
      navigate({ to: "/sales-enablement/$clusterId", params: { clusterId } });
    }, 400);
  };

  const handleSaveOutcome = () => {
    const text = outcome.trim();
    if (!text) return;
    addOutcome(prospectId, text);
    setOutcome("");
    toast.success("Outcome recorded");
  };

  return (
    <AppShell
      bottom={<BottomNav />}
      header={
        <StageHeader
          eyebrow="STAGE 3 OF 3 · SALES ENABLERS"
          title={prospect.name}
          subtitle={prospect.locality}
          backTo={`/sales-enablement/${clusterId}`}
        />
      }
    >
      <div className="space-y-6 px-6 py-8">
        {/* Stage timeline */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <div className="flex items-center gap-1 overflow-x-auto">
            {SALES_STAGES.map((s, i) => {
              const active = i === stageIdx;
              const done = i < stageIdx;
              return (
                <div key={s} className="flex flex-1 items-center gap-1">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold",
                        active
                          ? "border-critical bg-critical text-critical-foreground"
                          : done
                            ? "border-green-600 bg-green-600 text-white"
                            : "border-border bg-card text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </div>
                    <span className={cn("text-[9px] text-center leading-tight", active && "font-semibold")}>
                      {SALES_STAGE_LABEL[s].split(" ")[0]}
                    </span>
                  </div>
                  {i < SALES_STAGES.length - 1 && (
                    <div className={cn("h-0.5 flex-1", done ? "bg-green-600" : "bg-border")} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Where are you */}
        {(() => {
          const STATUS: Record<SalesStage, string> = {
            prospects: "Newly identified — not yet contacted.",
            contacted: "Decision-maker contacted; intro discussion done.",
            decision: "In Solution Proposal stage — customer is awaiting presentation.",
            closure: "Commercials accepted; finalising supply and execution.",
            ongoing: "Project handed over; in continuous relationship.",
          };
          const chosenStrategies = (selectedStrategies[clusterId] ?? []) as ConnectStrategy[];
          return (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="font-display text-lg">Where is the prospect currently?</h3>
              <p className="mt-2 text-sm">{STATUS[currentStage]}</p>
              {chosenStrategies.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground">Connect strategies chosen:</p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {chosenStrategies.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-foreground"
                      >
                        {CONNECT_STRATEGY_LABEL[s]}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {outcomesClickIn && (
                <button
                  type="button"
                  onClick={() => setOpenClickIn(outcomesClickIn)}
                  className="mt-2 text-xs font-semibold text-navy underline-offset-2 hover:underline"
                >
                  View past discussion outcomes →
                </button>
              )}
            </div>
          );
        })()}

        {/* What to do next */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-lg">How to move to the next stage?</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Pick the next-best-actions for <b>{SALES_STAGE_LABEL[currentStage]}</b>.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {nextItems.map((it) => {
              const on = Boolean(checked[it.key]);
              return (
                <li key={it.key} className="flex flex-wrap items-center gap-2">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => recordActivity(prospectId, { [it.key]: !on } as Record<string, unknown>)}
                      className="h-4 w-4 accent-critical"
                    />
                    <span>{it.label}</span>
                  </label>
                  {it.clickIn && <ClickInChip click={it.clickIn} onOpen={setOpenClickIn} />}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Quick record outcome */}
        <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
          <button
            type="button"
            onClick={() => setOpenOutcomes((v) => !v)}
            className="flex w-full items-center justify-between gap-2 text-left text-sm font-semibold"
          >
            Your notes
            <span className="text-xs text-muted-foreground">{openOutcomes ? "Hide" : "Add"}</span>
          </button>
          {openOutcomes && (
            <div className="mt-2">
              <textarea
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                placeholder="e.g. Discussed exterior repaint scope; proposal expected next week."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                rows={3}
              />
              <Button
                type="button"
                size="sm"
                onClick={handleSaveOutcome}
                disabled={outcome.trim().length === 0}
                className="mt-2 bg-navy text-navy-foreground hover:bg-navy/90"
              >
                Save outcome
              </Button>
            </div>
          )}
        </div>

        {(() => {
          const singular = prospectSingular(clusterId);
          const advanceLabel = nextStage ? `Move to ${SALES_STAGE_LABEL[nextStage]}` : "Engagement complete";
          const removeLabel = `Remove ${singular.toLowerCase()} from the list`;
          return (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleAdvance}
                disabled={!nextStage}
                className="h-11 gap-1.5 bg-critical text-critical-foreground hover:bg-critical/90"
              >
                <Check className="h-4 w-4" /> {advanceLabel}
              </Button>
              <Button
                variant="outline"
                onClick={handleNotInterested}
                className="h-11 gap-1.5 border-border text-muted-foreground hover:bg-muted/40"
              >
                <X className="h-4 w-4" /> {removeLabel}
              </Button>
            </div>
          );
        })()}
      </div>

      <ClickInDialog click={openClickIn} onClose={() => setOpenClickIn(null)} />
    </AppShell>
  );
}

function ClickInChip({ click, onOpen }: { click: ClickIn; onOpen: (c: ClickIn) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(click)}
      className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[11px] font-medium text-navy hover:bg-muted/60"
    >
      {click.label}
    </button>
  );
}

function ClickInDialog({ click, onClose }: { click: ClickIn | null; onClose: () => void }) {
  return (
    <Dialog open={click !== null} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{click?.label ?? ""}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          {click?.kind === "list" && (
            <ul className="space-y-2 text-sm">
              {click.items.map((it, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-critical">•</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          )}
          {click?.kind === "text" && <p className="text-sm leading-relaxed">{click.body}</p>}
          {click?.kind === "contacts" && (
            <div className="space-y-2">
              {click.contacts.map((c) => (
                <div key={c.id} className="rounded border border-border bg-card p-2 text-xs">
                  <p className="font-semibold">{c.name}</p>
                  <p className="text-muted-foreground">
                    {c.phone} · {c.area}
                  </p>
                  {c.brandPreference && <p className="text-muted-foreground">Prefers: {c.brandPreference}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
