import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight, Home, AlertCircle, TrendingUp, Users } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { BottomNav } from "@/components/app/BottomNav";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CLUSTERS, getCluster, prospectPlural } from "@/data/clusters";
import { getClusterIntel } from "@/lib/clusterScoring";
import { useAppStore, SALES_STAGE_LABEL, type SalesStage } from "@/store/appStore";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "My Dashboard — Demand Discovery Tool" },
      { name: "description", content: "Demand Generator dashboard with profile, market engagement and customer engagement insights." },
    ],
  }),
  component: DashboardPage,
});

/* ----------------------------- Mock data ----------------------------- */
// Month label for current month
const MONTH_LABEL = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });

type EventRow = { name: string; clusterId: string; region: string; date: string; outcome?: string };

const CONTRIBUTION_EVENTS_THIS_MONTH: EventRow[] = [
  { name: "Site engineer workshop on premium finishing", clusterId: "mid-apartments", region: "Kharghar", date: "12 Jun" },
  { name: "Free paint audit drive", clusterId: "redevelopment", region: "Old Panvel", date: "18 Jun" },
  { name: "Contractor meet — finishing schedules", clusterId: "gated-community", region: "Kamothe", date: "24 Jun" },
];

const BRAND_INITIATIVES_THIS_MONTH: EventRow[] = [
  { name: "Waterproofing pre-monsoon awareness", clusterId: "mid-apartments", region: "New Panvel", date: "08 Jun" },
  { name: "Designer wallpaper showcase", clusterId: "gated-community", region: "Kharghar", date: "15 Jun" },
  { name: "Healthy-home low-VOC drive", clusterId: "redevelopment", region: "Kalamboli", date: "22 Jun" },
];

const PAST_EVENTS: EventRow[] = [
  { name: "Painter loyalty meet", clusterId: "mid-apartments", region: "Kharghar", date: "14 May", outcome: "32 painters attended, 18 leads" },
  { name: "Pre-handover paint audit", clusterId: "redevelopment", region: "Old Panvel", date: "06 May", outcome: "4 audits, 2 site conversions" },
  { name: "RWA premium exteriors session", clusterId: "gated-community", region: "Kamothe", date: "22 Apr", outcome: "55 attendees, 9 inquiries" },
  { name: "Hospital hygienic-finish demo", clusterId: "hospitals", region: "New Panvel", date: "12 Apr", outcome: "3 facility managers engaged" },
  { name: "Industrial coatings roadshow", clusterId: "midc", region: "Taloja MIDC", date: "28 Mar", outcome: "12 units visited, 5 quotations" },
];

/* ----------------------------- Helpers ----------------------------- */

function clusterName(id: string): string {
  return getCluster(id)?.name ?? id;
}

const STAGE_PRIORITY: Record<SalesStage, number> = {
  decision: 4,
  closure: 5,
  contacted: 3,
  ongoing: 2,
  prospects: 1,
};

function stuckDaysFor(prospectId: string): number {
  // deterministic pseudo-stuck days from id
  let h = 0;
  for (let i = 0; i < prospectId.length; i++) h = (h * 31 + prospectId.charCodeAt(i)) >>> 0;
  return 5 + (h % 18); // 5..22 days
}

function reasonFor(stage: SalesStage, days: number, name: string): string {
  switch (stage) {
    case "decision":
      return `${name} has been at proposal stage for ${days} days — this is the right time to push for a quote.`;
    case "closure":
      return `${name} is in sales closure for ${days} days — a single follow-up can move it to win.`;
    case "contacted":
      return `${name} was contacted ${days} days ago — re-engage before the lead cools off.`;
    case "ongoing":
      return `${name} has been ongoing for ${days} days — upsell premium SKUs now.`;
    default:
      return `${name} was added ${days} days ago — make the first call today.`;
  }
}

/* ----------------------------- Page ----------------------------- */

function DashboardPage() {
  const stagesAll = useAppStore((s) => s.sales.prospectStages);
  const clustersState = useAppStore((s) => s.clusters);
  const targetClusterIds = useAppStore((s) => s.plan.targetClusterIds);
  const stakeholders = useAppStore((s) => s.stakeholders);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster);

  // attention list
  const attention = useMemo(() => {
    const rows: { prospectId: string; name: string; clusterId: string; stage: SalesStage; days: number; reason: string }[] = [];
    for (const [clusterId, stageMap] of Object.entries(stagesAll)) {
      const prospects = clustersState[clusterId]?.prospects ?? [];
      for (const [pid, stage] of Object.entries(stageMap)) {
        if (stage === "prospects") continue;
        const p = prospects.find((x) => x.id === pid);
        if (!p) continue;
        const days = stuckDaysFor(pid);
        rows.push({ prospectId: pid, name: p.name, clusterId, stage, days, reason: reasonFor(stage, days, p.name) });
      }
    }
    rows.sort((a, b) => {
      const sp = STAGE_PRIORITY[b.stage] - STAGE_PRIORITY[a.stage];
      if (sp !== 0) return sp;
      return b.days - a.days;
    });
    return rows.slice(0, 6);
  }, [stagesAll, clustersState]);

  // untapped opportunity — high potential, low jk penetration, not in targets
  const untapped = useMemo(() => {
    const candidates = CLUSTERS.map((c) => {
      const intel = getClusterIntel(c.id, c.prospectCountEstimate);
      return { cluster: c, intel };
    })
      .filter(
        (x) =>
          x.intel.revenueHML === "H" &&
          x.intel.jkPenetrationLabel !== "strong" &&
          !targetClusterIds.includes(x.cluster.id),
      )
      .sort((a, b) => {
        const pen = (l: string) => (l === "low" ? 2 : l === "moderate" ? 1 : 0);
        return pen(b.intel.jkPenetrationLabel) - pen(a.intel.jkPenetrationLabel);
      });
    return candidates.slice(0, 3);
  }, [targetClusterIds]);

  // network strength per target cluster
  const network = useMemo(() => {
    const list = (targetClusterIds.length ? targetClusterIds : CLUSTERS.slice(0, 4).map((c) => c.id)).slice(0, 6);
    return list.map((cid) => {
      const c = getCluster(cid);
      const intel = getClusterIntel(cid, c?.prospectCountEstimate ?? 20);
      const stakeholderCount = stakeholders[cid]?.length ?? 0;
      const contractorContacts = Object.values(strategyContacts[cid] ?? {}).reduce(
        (sum, arr) => sum + (arr?.length ?? 0),
        0,
      );
      const connected = stakeholderCount + contractorContacts;
      const available = intel.contractorCount + intel.retailerCount;
      const pct = Math.min(100, Math.round((connected / Math.max(1, available)) * 100));
      return { clusterId: cid, name: c?.name ?? cid, connected, available, pct };
    });
  }, [targetClusterIds, stakeholders, strategyContacts]);

  const [pastOpen, setPastOpen] = useState(false);
  const [reasonOpen, setReasonOpen] = useState<{ name: string; reason: string } | null>(null);
  const [networkOpen, setNetworkOpen] = useState<(typeof network)[number] | null>(null);

  return (
    <AppShell bottom={<BottomNav />}>
      {/* Header */}
      <header className="sticky top-0 z-30 bg-navy px-5 pb-5 pt-6 text-navy-foreground md:rounded-t-3xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
              JK Cement · Demand Generator
            </p>
            <h1 className="mt-1 font-display text-2xl leading-tight">My Dashboard</h1>
          </div>
          <Link
            to="/"
            aria-label="Home"
            className="rounded-full p-1.5 text-navy-foreground/80 hover:bg-white/10"
          >
            <Home className="h-5 w-5" />
          </Link>
        </div>
      </header>

      <div className="space-y-3 px-5 py-5">
        {/* Profile card */}
        <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-critical text-lg font-semibold text-white">
              SK
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-lg leading-tight">Sunil Kumar</h3>
              <p className="text-xs text-muted-foreground">Demand Generator · Panvel</p>
              <p className="mt-0.5 text-xs text-muted-foreground">Exp. in JK: 3 years</p>
            </div>
          </div>
        </section>

        {/* My Market Engagement */}
        <SectionCard title="My Market Engagement" defaultOpen>
          <CollapsibleSub title={`Contribution events · ${MONTH_LABEL}`} count={CONTRIBUTION_EVENTS_THIS_MONTH.length}>
            <EventList rows={CONTRIBUTION_EVENTS_THIS_MONTH} />
          </CollapsibleSub>
          <CollapsibleSub title={`Brand awareness initiatives · ${MONTH_LABEL}`} count={BRAND_INITIATIVES_THIS_MONTH.length}>
            <EventList rows={BRAND_INITIATIVES_THIS_MONTH} />
          </CollapsibleSub>
          <button
            type="button"
            onClick={() => setPastOpen(true)}
            className="mt-1 flex w-full items-center justify-between rounded-xl border border-dashed border-border bg-muted/30 px-3 py-2 text-left text-xs font-medium text-navy hover:bg-muted/50"
          >
            <span>Click here to view past events & initiatives</span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </SectionCard>

        {/* My Customer Engagement */}
        <SectionCard title="My Customer Engagement" defaultOpen>
          {/* Who needs my attention */}
          <CollapsibleSub
            title="Who needs my attention today?"
            icon={<AlertCircle className="h-4 w-4 text-critical" />}
            count={attention.length}
          >
            {attention.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                No prospects need attention right now.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {attention.map((a) => (
                  <li key={a.prospectId}>
                    <button
                      type="button"
                      onClick={() => setReasonOpen({ name: a.name, reason: a.reason })}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left hover:bg-muted/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{a.name}</span>
                        <span className="shrink-0 rounded-full bg-critical/10 px-1.5 py-0.5 text-[10px] font-semibold text-critical">
                          {a.days}d stuck
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                        {clusterName(a.clusterId)} · {SALES_STAGE_LABEL[a.stage]}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSub>

          {/* Untapped opportunity */}
          <CollapsibleSub
            title="Where is my biggest untapped opportunity?"
            icon={<TrendingUp className="h-4 w-4 text-critical" />}
            count={untapped.length}
          >
            {untapped.length === 0 ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">
                You've already engaged with all high-potential clusters.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {untapped.map(({ cluster, intel }) => (
                  <li
                    key={cluster.id}
                    className="rounded-lg border border-border bg-background px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{cluster.name}</span>
                      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                        High potential
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      JK penetration: <span className="font-medium capitalize">{intel.jkPenetrationLabel}</span> · Leader: {intel.leadingCompetitor}
                    </p>
                    <Link
                      to="/plan/$clusterId"
                      params={{ clusterId: cluster.id }}
                      className="mt-1 inline-block text-[11px] font-semibold text-critical hover:underline"
                    >
                      Plan engagement →
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CollapsibleSub>

          {/* Network strength */}
          <CollapsibleSub
            title="How strong is my network in each cluster?"
            icon={<Users className="h-4 w-4 text-critical" />}
            count={network.length}
          >
            <ul className="space-y-1.5">
              {network.map((n) => (
                <li key={n.clusterId}>
                  <button
                    type="button"
                    onClick={() => setNetworkOpen(n)}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-left hover:bg-muted/40"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium">{n.name}</span>
                      <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
                        {n.connected}/{n.available}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          n.pct >= 60 ? "bg-emerald-500" : n.pct >= 30 ? "bg-amber-500" : "bg-critical",
                        )}
                        style={{ width: `${Math.max(4, n.pct)}%` }}
                      />
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </CollapsibleSub>
        </SectionCard>
      </div>

      {/* Past events popup */}
      <Dialog open={pastOpen} onOpenChange={setPastOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Past events & initiatives</DialogTitle>
          </DialogHeader>
          <ul className="space-y-2">
            {PAST_EVENTS.map((e, i) => (
              <li key={i} className="rounded-lg border border-border bg-background p-3">
                <p className="text-sm font-medium leading-tight">{e.name}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {clusterName(e.clusterId)} · {e.region} · {e.date}
                </p>
                {e.outcome && (
                  <p className="mt-1 text-xs text-navy">
                    <span className="font-semibold">Outcome:</span> {e.outcome}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>

      {/* Reason popup */}
      <Dialog open={!!reasonOpen} onOpenChange={(o) => !o && setReasonOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{reasonOpen?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{reasonOpen?.reason}</p>
        </DialogContent>
      </Dialog>

      {/* Network detail popup */}
      <Dialog open={!!networkOpen} onOpenChange={(o) => !o && setNetworkOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{networkOpen?.name}</DialogTitle>
          </DialogHeader>
          {networkOpen && (
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Network strength in this cluster across contractors, retailers and key stakeholders.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Stat label="Connected" value={networkOpen.connected} />
                <Stat label="Available" value={networkOpen.available} />
                <Stat label="Coverage" value={`${networkOpen.pct}%`} />
                <Stat label={prospectPlural(networkOpen.clusterId)} value={getCluster(networkOpen.clusterId)?.prospectCountEstimate ?? "—"} />
              </div>
              <Button asChild className="mt-2 w-full" variant="secondary">
                <Link to="/plan/$clusterId" params={{ clusterId: networkOpen.clusterId }}>
                  Open cluster engagement plan
                </Link>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

/* ----------------------------- Sub-components ----------------------------- */

function SectionCard({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-2xl border border-border bg-card shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left">
        <h2 className="font-display text-base">{title}</h2>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 px-4 pb-4">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function CollapsibleSub({
  title,
  icon,
  count,
  children,
}: {
  title: string;
  icon?: ReactNode;
  count?: number;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-xl border border-border bg-background">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left">
        <span className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
          {typeof count === "number" && (
            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {count}
            </span>
          )}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </CollapsibleTrigger>
      <CollapsibleContent className="px-3 pb-3">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function EventList({ rows }: { rows: EventRow[] }) {
  if (rows.length === 0) {
    return <p className="px-1 py-2 text-xs text-muted-foreground">Nothing planned yet.</p>;
  }
  return (
    <ul className="space-y-1.5">
      {rows.map((r, i) => (
        <li key={i} className="rounded-lg border border-border bg-background px-3 py-2">
          <p className="text-sm font-medium leading-tight">{r.name}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {clusterName(r.clusterId)} · {r.region} · {r.date}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold">{value}</p>
    </div>
  );
}
