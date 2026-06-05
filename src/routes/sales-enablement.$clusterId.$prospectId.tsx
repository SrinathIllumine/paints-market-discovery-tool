import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import {
  useAppStore,
  SALES_STAGES,
  SALES_STAGE_LABEL,
  type SalesStage,
} from "@/store/appStore";
import { getCluster } from "@/data/clusters";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/sales-enablement/$clusterId/$prospectId")({
  component: ProspectDetailPage,
});

const WHERE_ARE_YOU: { key: string; label: string }[] = [
  { key: "contactsAccessed", label: "Contacts accessed" },
  { key: "meetingsDone", label: "Meetings completed" },
  { key: "productDiscussion", label: "Product discussions completed" },
  { key: "valuePropShared", label: "Value proposition shared" },
];

const NEXT_ACTIONS: Record<SalesStage, string[]> = {
  prospects: [
    "Identify the decision maker and key contacts",
    "Schedule an introductory site visit",
    "Share the JK cluster proposition deck",
  ],
  contacted: [
    "Conduct a product walkthrough on-site",
    "Capture interior + exterior surface estimates",
    "Send a written proposal within 7 days",
  ],
  decision: [
    "Customized proposal to strengthen decision confidence",
    "Special customized schemes to close the deal",
    "Decision-maker engagement (committee / trust)",
    "Product demonstration opportunity",
  ],
  closure: [
    "Lock supply schedule with retailer",
    "Confirm painter / contractor briefing",
    "Plan post-handover quality audit",
  ],
  ongoing: [
    "Set quarterly check-in cadence",
    "Capture referral opportunities",
    "Offer AMC / refresh proposal at the right cycle",
  ],
};

function ProspectDetailPage() {
  const { clusterId, prospectId } = Route.useParams();
  const navigate = useNavigate();
  const cluster = getCluster(clusterId);
  const prospect = useAppStore((s) =>
    (s.clusters[clusterId]?.prospects ?? []).find((p) => p.id === prospectId),
  );
  const currentStage = useAppStore(
    (s) => s.sales.prospectStages[clusterId]?.[prospectId] ?? "prospects",
  );
  const activity = useAppStore((s) => s.sales.prospectActivity[prospectId] ?? {});
  const setStage = useAppStore((s) => s.setProspectStage);
  const recordActivity = useAppStore((s) => s.recordProspectActivity);
  const addOutcome = useAppStore((s) => s.addProspectOutcome);
  const markNotInterested = useAppStore((s) => s.markProspectNotInterested);

  const [outcome, setOutcome] = useState("");

  const stageIdx = useMemo(() => SALES_STAGES.indexOf(currentStage), [currentStage]);
  const nextStage = stageIdx < SALES_STAGES.length - 1 ? SALES_STAGES[stageIdx + 1] : null;
  const actions = NEXT_ACTIONS[currentStage];

  if (!cluster || !prospect) {
    return (
      <AppShell bottom={<BottomNav />}>
        <div className="p-6 text-center text-muted-foreground">Prospect not found.</div>
      </AppShell>
    );
  }

  const handleAdvance = () => {
    if (!nextStage) {
      toast.success("Already in Continuous Ongoing Relationship");
      return;
    }
    setStage(clusterId, prospectId, nextStage);
    toast.success(`Moved to ${SALES_STAGE_LABEL[nextStage]}`);
  };

  const handleNotInterested = () => {
    markNotInterested(prospectId);
    toast.success("Marked as not interested");
    navigate({ to: "/sales-enablement/$clusterId", params: { clusterId } });
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
          eyebrow={cluster.name}
          title={prospect.name}
          subtitle={prospect.locality}
          backTo={`/sales-enablement/${clusterId}`}
        />
      }
    >
      <div className="space-y-4 px-5 py-5">
        {/* Timeline */}
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
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-lg">Where are you?</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Mark completed work below.</p>
          <div className="mt-3 space-y-2">
            {WHERE_ARE_YOU.map((it) => {
              const v = (activity as Record<string, unknown>)[it.key];
              const checked = Boolean(v);
              return (
                <label key={it.key} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      recordActivity(prospectId, {
                        [it.key]: it.key === "meetingsDone" ? (checked ? 0 : 1) : !checked,
                      } as Record<string, unknown>)
                    }
                    className="h-4 w-4 accent-critical"
                  />
                  <span>{it.label}</span>
                </label>
              );
            })}
          </div>
          {activity.outcomes && activity.outcomes.length > 0 && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Past discussion outcomes
              </p>
              <ul className="mt-1 space-y-1 text-xs">
                {activity.outcomes.map((o, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="text-critical">•</span>
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* What to do next */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-lg">What to do next?</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Next-best-actions for <b>{SALES_STAGE_LABEL[currentStage]}</b>.
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {actions.map((a, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-critical">•</span>
                <span>{a}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Record outcomes */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h3 className="font-display text-lg">Record key discussion outcomes</h3>
          <textarea
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="e.g. Discussed exterior repaint scope, agreed to receive a proposal next week."
            className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
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

        {/* Bottom actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handleAdvance}
            disabled={!nextStage}
            className="h-11 gap-1.5 bg-critical text-critical-foreground hover:bg-critical/90"
          >
            <Check className="h-4 w-4" />
            Mark as completed
          </Button>
          <Button
            variant="outline"
            onClick={handleNotInterested}
            className="h-11 gap-1.5 border-border text-muted-foreground hover:bg-muted/40"
          >
            <X className="h-4 w-4" />
            Not interested
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
