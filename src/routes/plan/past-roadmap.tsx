import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { CLUSTERS } from "@/data/clusters";
import { useAppStore } from "@/store/appStore";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan/past-roadmap")({
  head: () => ({
    meta: [
      { title: "Review Past Market Engagements" },
      { name: "description", content: "Review past contribution events planned across clusters." },
    ],
  }),
  component: PastRoadmapPage,
});

// Past planned events grouped by cluster (representative sample).
const PAST_BY_CLUSTER: Record<string, { id: string; name: string; date: string }[]> = {
  "mid-apartments": [
    { id: "ma-1", name: "Painter loyalty meet", date: "14 May 2026" },
    { id: "ma-2", name: "Waterproofing pre-monsoon awareness drive", date: "02 May 2026" },
  ],
  "gated-community": [
    { id: "gc-1", name: "RWA premium exteriors session", date: "22 Apr 2026" },
    { id: "gc-2", name: "Designer wallpaper showcase", date: "15 Apr 2026" },
  ],
  redevelopment: [
    { id: "rd-1", name: "Pre-handover paint audit", date: "06 May 2026" },
    { id: "rd-2", name: "Healthy-home low-VOC drive", date: "20 Apr 2026" },
  ],
  hospitals: [{ id: "hp-1", name: "Hospital hygienic-finish demo", date: "12 Apr 2026" }],
  midc: [{ id: "mi-1", name: "Industrial coatings roadshow", date: "28 Mar 2026" }],
  schools: [{ id: "sc-1", name: "Vacation repaint contractor meet", date: "10 Mar 2026" }],
};

function PastRoadmapPage() {
  const feedbackAll = useAppStore((s) => s.plan.pastEventFeedbackByCluster);
  const setFeedback = useAppStore((s) => s.setPastEventFeedback);
  const [openCluster, setOpenCluster] = useState<string | null>(null);

  const clusterList = useMemo(() => CLUSTERS.filter((c) => (PAST_BY_CLUSTER[c.id] ?? []).length > 0), []);

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="Planning" title="Review Past Market Engagements" backTo="/plan" />}
    >
      <div className="space-y-3 px-6 py-6">
        <h2 className="font-display text-lg leading-tight">Capture how earlier events went</h2>

        {clusterList.map((c) => {
          const events = PAST_BY_CLUSTER[c.id] ?? [];
          const isOpen = openCluster === c.id;
          const savedCount = events.filter((e) => {
            const fb = feedbackAll[c.id]?.[e.id];
            return fb && (fb.attended != null || fb.leads != null || (fb.challenges && fb.challenges.length > 0));
          }).length;
          return (
            <section key={c.id} className="rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setOpenCluster(isOpen ? null : c.id)}
                className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
              >
                <span className="font-display text-base">{c.name}</span>
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  {savedCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                      <Check className="h-3 w-3" /> {savedCount} saved
                    </span>
                  )}
                  {events.length} events
                  <ChevronDown className={cn("h-4 w-4 transition-transform", isOpen && "rotate-180")} />
                </span>
              </button>

              {isOpen && (
                <div className="space-y-3 border-t border-border p-4">
                  {events.map((e) => {
                    const fb = feedbackAll[c.id]?.[e.id] ?? {};
                    const hasData =
                      fb.attended != null || fb.leads != null || (fb.challenges && fb.challenges.length > 0);
                    return (
                      <div key={e.id} className="rounded-lg border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-tight">{e.name}</p>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{e.date}</p>
                          </div>
                          {hasData && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                              <Check className="h-3 w-3" /> Saved
                            </span>
                          )}
                        </div>
                        <div className="mt-2 grid ">
                          {/*<div className="mt-2 grid grid-cols-2 gap-2">*/}
                          {/*<NumField
                            label="Participants attended"
                            value={fb.attended}
                            onChange={(v) => setFeedback(c.id, e.id, { attended: v })}
                          />*/}
                          <NumField
                            label="Leads generated"
                            value={fb.leads}
                            onChange={(v) => setFeedback(c.id, e.id, { leads: v })}
                          />
                        </div>
                        <label className="mt-2 block">
                          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                            Challenges faced
                          </span>
                          <textarea
                            value={fb.challenges ?? ""}
                            onChange={(ev) => setFeedback(c.id, e.id, { challenges: ev.target.value })}
                            rows={2}
                            placeholder="e.g. Low painter turnout due to monsoon"
                            className="mt-1 w-full rounded border border-border bg-background px-2 py-1.5 text-sm"
                          />
                        </label>
                        <div className="mt-2 flex justify-end">
                          <Button
                            size="sm"
                            onClick={() =>
                              setFeedback(c.id, e.id, {
                                attended: fb.attended,
                                leads: fb.leads,
                                challenges: fb.challenges ?? "",
                              })
                            }
                            className="h-8 gap-1 bg-navy text-xs text-navy-foreground hover:bg-navy/90"
                          >
                            <Check className="h-3.5 w-3.5" /> Save
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}

        {clusterList.length === 0 && <p className="text-sm text-muted-foreground">No past events recorded yet.</p>}
      </div>
    </AppShell>
  );
}

function NumField({
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
