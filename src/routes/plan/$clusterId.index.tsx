import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
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
import {
  ArrowLeft,
  BarChart2,
  Bolt,
  Building2,
  ChevronRight,
  ClipboardCheck,
  Download,
  FileDown,
  FileText,
  HardHat,
  Info,
  Lightbulb,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import { getCustomerGroups, getCampIdeas, type ContactEntry } from "@/lib/strategyContent";
import {
  getClusterValueProps,
  getCustomerGroupDetails,
  EVENT_ENABLERS,
  CONTRACTOR_ENABLERS,
  RETAILER_ENABLERS,
  STAKEHOLDER_ENABLERS,
  EVENT_QUESTIONS,
  CONTRACTOR_QUESTIONS,
  RETAILER_QUESTIONS,
  STAKEHOLDER_QUESTIONS,
  type Enabler,
  type Question,
} from "@/lib/engagementContent";

export const Route = createFileRoute("/plan/$clusterId/")({
  component: PlanClusterScreen,
});

const CONTRACTOR_BUCKET = "CONTRACTOR" as const;
const RETAILER_BUCKET = "RETAILER" as const;
const STAKEHOLDER_BUCKET = "D2C" as const;

const EMPTY_ARR: string[] = [];
const EMPTY_REC: Record<string, string[]> = {};
const EMPTY_CONTACTS: ContactEntry[] = [];
const EMPTY_SC: Record<string, Partial<Record<string, ContactEntry[]>>> = {};

type Page = "hub" | "groups" | "valueprops" | "actions" | "camps" | "contractors" | "retailers" | "stakeholders" | "actionplan";

declare global {
  interface Window {
    google: typeof google;
  }
}

function buildGroupQuery(groupLabel: string, clusterPlacesQuery: string): string {
  const words = clusterPlacesQuery.trim().split(/\s+/);
  const area = words.at(-1) ?? "";
  return `${groupLabel} ${area}`.trim();
}

function useGroupPlaces(groups: { id: string; label: string }[], clusterPlacesQuery: string, active: boolean) {
  const [names, setNames] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const fetched = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!active || groups.length === 0) return;

    const run = () => {
      if (!window.google?.maps?.places) return;

      const service = new window.google.maps.places.PlacesService(document.createElement("div"));

      groups.forEach((g) => {
        if (fetched.current.has(g.id)) return;
        fetched.current.add(g.id);
        setLoading((prev) => ({ ...prev, [g.id]: true }));

        service.textSearch({ query: buildGroupQuery(g.label, clusterPlacesQuery) }, (results, status) => {
          const placeNames =
            status === window.google.maps.places.PlacesServiceStatus.OK
              ? (results ?? []).slice(0, 5).map((r) => r.name ?? "")
              : [];
          setNames((prev) => ({ ...prev, [g.id]: placeNames }));
          setLoading((prev) => ({ ...prev, [g.id]: false }));
        });
      });
    };

    if (window.google?.maps?.places) {
      run();
    } else {
      const script = document.querySelector('script[src*="maps.googleapis.com"]');
      script?.addEventListener("load", run);
      return () => script?.removeEventListener("load", run);
    }
  }, [active, groups, clusterPlacesQuery]);

  return { names, loading };
}

function PlanClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();

  const customerGroups = useAppStore((s) => s.plan.customerGroupsByCluster[clusterId] ?? EMPTY_ARR);
  const selectedCamps = useAppStore((s) => s.plan.selectedCampsByCluster[clusterId] ?? EMPTY_ARR);
  const starred = useAppStore((s) => s.plan.starredByCluster[clusterId] ?? EMPTY_ARR);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster ?? EMPTY_SC);
  const customValueProps = useAppStore((s) => s.plan.customValuePropsByCluster?.[clusterId]);
  const reviews = useAppStore((s) => s.plan.reviewsByCluster[clusterId] ?? {});

  const toggleCustomerGroup = useAppStore((s) => s.toggleCustomerGroup);
  const toggleSelectedCamp = useAppStore((s) => s.toggleSelectedCamp);
  const toggleStarred = useAppStore((s) => s.toggleStarred);
  const setStrategyContacts = useAppStore((s) => s.setStrategyContacts);
  const setCustomValueProps = useAppStore((s) => s.setCustomValueProps);
  const setReview = useAppStore((s) => s.setReview);
  const unlockStage = useAppStore((s) => s.unlockStage);
  const setMonthlyFocus = useAppStore((s) => s.setMonthlyFocus);

  const [page, setPage] = useState<Page>("hub");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

  // Inject Google Maps SDK once when this screen mounts
  useEffect(() => {
    if (window.google?.maps?.places) return;
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }, []);

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

  const { names: groupPlaceNames, loading: groupPlacesLoading } = useGroupPlaces(
    groups,
    cluster?.placesQuery ?? "",
    page === "groups",
  );

  const contractors = strategyContacts[clusterId]?.[CONTRACTOR_BUCKET] ?? EMPTY_CONTACTS;
  const retailers = strategyContacts[clusterId]?.[RETAILER_BUCKET] ?? EMPTY_CONTACTS;
  const stakeholders = strategyContacts[clusterId]?.[STAKEHOLDER_BUCKET] ?? EMPTY_CONTACTS;

  const validContractors = contractors.filter((c) => (c.name ?? "").trim());
  const validRetailers = retailers.filter((c) => (c.name ?? "").trim());
  const validStakeholders = stakeholders.filter((c) => (c.name ?? "").trim());
  const selectedCampObjs = camps.filter((c) => selectedCamps.includes(c.id));
  const selectedGroupObjs = groups.filter((g) => customerGroups.includes(g.id));

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

  const valueProps = useMemo(
    () => (customValueProps && customValueProps.length > 0 ? customValueProps : getClusterValueProps(clusterId)),
    [clusterId, customValueProps],
  );

  const handleGroupToggle = (groupId: string) => {
    toggleCustomerGroup(clusterId, groupId);
  };

  const handleGenerate = () => {
    generateMonthlyEngagementPlanPdf({
      focusClusterId: clusterId,
      valueProps,
      customerGroups: selectedGroupObjs.map((g) => ({ id: g.id, label: g.label, pct: g.pct })),
      camps: selectedCampObjs.map((c) => ({
        id: c.id,
        label: c.label,
        starred: isStarred(`camp:${c.id}`),
        review: reviews[`camp:${c.id}`] ?? {},
      })),
      contractors: contractors.map((c) => ({ ...c, starred: isStarred("group:contractors") })),
      retailers: retailers.map((c) => ({ ...c, starred: isStarred("group:retailers") })),
      stakeholders: stakeholders.map((c) => ({ ...c, starred: isStarred("group:stakeholders") })),
      groupReview: {
        contractors: reviews["group:contractors"] ?? {},
        retailers: reviews["group:retailers"] ?? {},
        stakeholders: reviews["group:stakeholders"] ?? {},
      },
    });
    setConfirmOpen(false);
    unlockStage(3);
    setMonthlyFocus(clusterId);
  };

  const goTo = (p: Page) => setPage(p);
  const goHub = () => setPage("hub");

  const badge = (count: number) =>
    count > 0 ? (
      <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-700">
        {count} added
      </span>
    ) : (
      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
        None yet
      </span>
    );

  return (
    <AppShell
      ref={mainRef}
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="CLUSTER ENGAGEMENT PLAN" title="Cluster Engagement Plan" backTo="/plan" />}
    >
      <div className="flex min-h-full flex-col px-4 py-5 pb-24">
        {/* ── HUB ── */}
        {page === "hub" && (
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="font-serif text-xl leading-tight text-foreground">
                Cluster: <span className="text-critical">{cluster.name}</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Tap any question to fill it in.</p>
            </div>

            <HubCard onClick={() => goTo("groups")}>
              <HubIcon bg="bg-red-50">
                <Users className="h-4 w-4 text-critical" />
              </HubIcon>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Which customer groups you want to target?</p>
                <p className="text-[11px] text-muted-foreground">Select your customer groups</p>
              </div>
              {badge(customerGroups.length)}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </HubCard>

            <HubCard onClick={() => goTo("valueprops")}>
              <HubIcon bg="bg-blue-50">
                <BarChart2 className="h-4 w-4 text-blue-700" />
              </HubIcon>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">What is your value proposition?</p>
                <p className="text-[11px] text-muted-foreground">View proposition for each selected group</p>
              </div>
              {customerGroups.length > 0 ? (
                <span className="shrink-0 rounded-full bg-green-50 px-2 py-0.5 text-[9px] font-medium text-green-700">
                  {customerGroups.length} ready
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                  Select groups first
                </span>
              )}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </HubCard>

            <HubCard onClick={() => goTo("actions")}>
              <HubIcon bg="bg-violet-50">
                <Bolt className="h-4 w-4 text-violet-700" />
              </HubIcon>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">
                  What actions will you take to engage with this cluster?
                </p>
                <p className="text-[11px] text-muted-foreground">Camps, contractors, retailers, stakeholders</p>
              </div>
              {badge(selectedCamps.length + validContractors.length + validRetailers.length + validStakeholders.length)}
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </HubCard>

            <HubCard onClick={() => goTo("actionplan")}>
              <HubIcon bg="bg-purple-50">
                <ListChecks className="h-4 w-4 text-purple-700" />
              </HubIcon>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Create your action plan</p>
                <p className="text-[11px] text-muted-foreground">Star your priorities for this quarter</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </HubCard>

            <Button
              onClick={() => setConfirmOpen(true)}
              className="h-12 w-full gap-2 bg-navy font-serif text-base text-navy-foreground hover:bg-navy/90"
            >
              <FileDown className="h-4 w-4" /> Generate quarterly plan for this cluster
            </Button>
          </div>
        )}

        {/* ── GROUPS ── */}
        {page === "groups" && (
          <GroupsPage
            clusterName={cluster.name}
            clusterId={clusterId}
            groups={groups}
            selected={customerGroups}
            onToggle={handleGroupToggle}
            groupPlaceNames={groupPlaceNames}
            groupPlacesLoading={groupPlacesLoading}
            onBack={goHub}
          />
        )}

        {/* ── VALUE PROPS ── */}
        {page === "valueprops" && (
          <ValuePropsPage
            clusterName={cluster.name}
            valueProps={valueProps}
            onSave={(props) => setCustomValueProps(clusterId, props)}
            onBack={goHub}
          />
        )}

        {/* ── ACTIONS HUB (camps/contractors/retailers/stakeholders) ── */}
        {page === "actions" && (
          <SubPage
            title="What actions will you take?"
            subtitle="Tick the engagement levers you'll pull this quarter. Tap one to fill in details."
            onBack={goHub}
          >
            <div className="space-y-2.5">
              <ActionToggleRow
                icon={<CalendarIcon />}
                iconBg="bg-blue-50"
                label="Camps & events you are planning to conduct"
                count={selectedCamps.length}
                onOpen={() => goTo("camps")}
              />
              <ActionToggleRow
                icon={<HardHat className="h-4 w-4 text-green-700" />}
                iconBg="bg-green-50"
                label="Contractors you are going to convert"
                count={validContractors.length}
                onOpen={() => goTo("contractors")}
              />
              <ActionToggleRow
                icon={<Building2 className="h-4 w-4 text-amber-700" />}
                iconBg="bg-amber-50"
                label={`Retailers who can connect you to ${cluster.name.toLowerCase()}`}
                count={validRetailers.length}
                onOpen={() => goTo("retailers")}
              />
              <ActionToggleRow
                icon={<UserCheck className="h-4 w-4 text-red-800" />}
                iconBg="bg-red-50"
                label={`Stakeholders of ${cluster.name.toLowerCase()} you will meet directly`}
                count={validStakeholders.length}
                onOpen={() => goTo("stakeholders")}
              />
            </div>
          </SubPage>
        )}

        {/* ── CAMPS ── */}
        {page === "camps" && (
          <SubPage
            title="Camps & events you are planning"
            subtitle={`Select the camps or events you're conducting with ${cluster.name.toLowerCase()} this quarter.`}
            onBack={goHub}
          >
            <div className="space-y-2.5">
              {camps.map((c) => {
                const on = selectedCamps.includes(c.id);
                return (
                  <label
                    key={c.id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3",
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
                      <span className="mt-0.5 block text-[11px] leading-relaxed text-muted-foreground">
                        {c.description}
                      </span>
                    </span>
                  </label>
                );
              })}
            </div>
          </SubPage>
        )}

        {/* ── CONTRACTORS ── */}
        {page === "contractors" && (
          <SubPage
            title="Contractors you are going to convert"
            subtitle={`List the contractors you'll reach out to for ${cluster.name.toLowerCase()}.`}
            onBack={goHub}
          >
            <ContactTable
              emptyHint="Add contractors you plan to engage."
              contacts={contractors}
              onChange={(list) => setStrategyContacts(clusterId, CONTRACTOR_BUCKET, list)}
            />
          </SubPage>
        )}

        {/* ── RETAILERS ── */}
        {page === "retailers" && (
          <SubPage
            title={`Retailers who can connect you to ${cluster.name.toLowerCase()}`}
            subtitle="List the retailers who can introduce you to decision-makers in this cluster."
            onBack={goHub}
          >
            <ContactTable
              emptyHint="Add retailers who can introduce you to the cluster."
              contacts={retailers}
              onChange={(list) => setStrategyContacts(clusterId, RETAILER_BUCKET, list)}
            />
          </SubPage>
        )}

        {/* ── STAKEHOLDERS ── */}
        {page === "stakeholders" && (
          <SubPage
            title={`Stakeholders of ${cluster.name.toLowerCase()} you will meet directly`}
            subtitle="List the decision-makers you plan to meet directly."
            onBack={goHub}
          >
            <ContactTable
              emptyHint="Add stakeholders / decision-makers you plan to meet."
              contacts={stakeholders}
              onChange={(list) => setStrategyContacts(clusterId, STAKEHOLDER_BUCKET, list)}
            />
          </SubPage>
        )}

        {/* ── ACTION PLAN ── */}
        {page === "actionplan" && (
          <SubPage
            title="Your action plan"
            subtitle="Star priorities. Open enablers to prep. Review once a starred item is done."
            onBack={goHub}
            footer={
              <Button
                onClick={() => setConfirmOpen(true)}
                className="h-12 w-full gap-2 bg-navy font-serif text-base text-navy-foreground hover:bg-navy/90"
              >
                <FileDown className="h-4 w-4" /> Generate quarterly plan
              </Button>
            }
          >
            {selectedCampObjs.length === 0 &&
            validContractors.length === 0 &&
            validRetailers.length === 0 &&
            validStakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Make selections in the other sections to see your action plan here.
              </p>
            ) : (
              <ActionPlanReport
                items={[
                  ...selectedCampObjs.map((c) => ({
                    key: `camp:${c.id}`,
                    section: "Events & camps",
                    title: c.label,
                    subtitle: c.description,
                    enablers: EVENT_ENABLERS,
                    questions: EVENT_QUESTIONS,
                  })),
                  ...(validContractors.length > 0
                    ? [{
                        key: "group:contractors",
                        section: "Contractors",
                        title: `${validContractors.length} contractor${validContractors.length > 1 ? "s" : ""} to convert`,
                        subtitle: validContractors.map((c) => c.name).join(", "),
                        enablers: CONTRACTOR_ENABLERS,
                        questions: CONTRACTOR_QUESTIONS,
                      }]
                    : []),
                  ...(validRetailers.length > 0
                    ? [{
                        key: "group:retailers",
                        section: "Retailers",
                        title: `${validRetailers.length} retailer${validRetailers.length > 1 ? "s" : ""} to engage`,
                        subtitle: validRetailers.map((c) => c.name).join(", "),
                        enablers: RETAILER_ENABLERS,
                        questions: RETAILER_QUESTIONS,
                      }]
                    : []),
                  ...(validStakeholders.length > 0
                    ? [{
                        key: "group:stakeholders",
                        section: "Stakeholders",
                        title: `${validStakeholders.length} stakeholder${validStakeholders.length > 1 ? "s" : ""} to meet`,
                        subtitle: validStakeholders.map((c) => c.name).join(", "),
                        enablers: STAKEHOLDER_ENABLERS,
                        questions: STAKEHOLDER_QUESTIONS,
                      }]
                    : []),
                ]}
                starredKeys={starred}
                reviews={reviews}
                onToggleStar={(key) => toggleStarred(clusterId, key)}
                onReviewChange={(key, fid, v) => setReview(clusterId, key, { [fid]: v })}
              />
            )}
          </SubPage>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Ready to generate?</DialogTitle>
            <DialogDescription>
              The PDF will capture your selected groups, value propositions, camps and contacts for{" "}
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

/* ── Shared primitives ── */

function SubPage({
  title,
  subtitle,
  onBack,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </button>
        <h3 className="font-serif text-lg leading-snug text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <div className="flex-1">{children}</div>
      {footer ? (
        <div className="mt-4">{footer}</div>
      ) : (
        <Button
          onClick={onBack}
          className="h-11 w-full gap-2 bg-navy font-serif text-sm text-navy-foreground hover:bg-navy/90"
        >
          Done
        </Button>
      )}
    </div>
  );
}

function HubCard({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left hover:bg-muted/30"
    >
      {children}
    </button>
  );
}

function HubIcon({ bg, children }: { bg: string; children: React.ReactNode }) {
  return <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", bg)}>{children}</div>;
}

function CalendarIcon() {
  return <Bolt className="h-4 w-4 text-blue-700" />;
}

/* ── Customer Groups page ── */
function GroupsPage({
  clusterName,
  clusterId,
  groups,
  selected,
  onToggle,
  groupPlaceNames,
  groupPlacesLoading,
  onBack,
}: {
  clusterName: string;
  clusterId: string;
  groups: { id: string; label: string; pct: number }[];
  selected: string[];
  onToggle: (id: string) => void;
  groupPlaceNames: Record<string, string[]>;
  groupPlacesLoading: Record<string, boolean>;
  onBack: () => void;
}) {
  const [detailsFor, setDetailsFor] = useState<{ id: string; label: string; pct: number } | null>(null);
  return (
    <SubPage
      title="Which customer groups you want to target?"
      subtitle={`Select the customer groups within ${clusterName} you plan to engage this quarter.`}
      onBack={onBack}
    >
      <div className="space-y-3">
        {groups.map((g) => {
          const isSelected = selected.includes(g.id);
          const places = groupPlaceNames[g.id] ?? [];
          const isLoading = groupPlacesLoading[g.id] ?? false;
          return (
            <div
              key={g.id}
              className={cn(
                "rounded-2xl border px-4 py-3 transition-colors",
                isSelected ? "border-critical bg-critical/5" : "border-border bg-card",
              )}
            >
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggle(g.id)}
                  className="mt-1 h-4 w-4 shrink-0 accent-critical"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-serif text-sm text-foreground">{g.label}</span>
                    <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                      {g.pct}%
                    </span>
                  </div>
                  {isLoading && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                      <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
                    </div>
                  )}
                  {!isLoading && places.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {places.slice(0, 3).map((name) => (
                        <span
                          key={name}
                          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          <MapPin className="h-2.5 w-2.5 shrink-0" />
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setDetailsFor(g)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] font-medium text-navy hover:bg-muted"
                >
                  <Info className="h-3 w-3" /> View details
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={!!detailsFor} onOpenChange={(o) => !o && setDetailsFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">{detailsFor?.label}</DialogTitle>
            <DialogDescription>Why this group matters for {clusterName}.</DialogDescription>
          </DialogHeader>
          {detailsFor && (
            <ul className="mt-1 space-y-2.5">
              {getCustomerGroupDetails(clusterId, detailsFor.id, {
                label: detailsFor.label,
                pct: detailsFor.pct,
              }).map((point, i) => (
                <li key={i} className="flex gap-2 text-sm text-foreground">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-critical" />
                  <span className="leading-snug">{point}</span>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </SubPage>
  );
}

/* ── Value Props page ── */
function ValuePropsPage({
  clusterName,
  valueProps,
  onSave,
  onBack,
}: {
  clusterName: string;
  valueProps: string[];
  onSave: (props: string[]) => void;
  onBack: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<string[]>(valueProps);

  useEffect(() => {
    if (!editing) setDraft(valueProps);
  }, [valueProps, editing]);

  const startEdit = () => {
    setDraft(valueProps);
    setEditing(true);
  };
  const save = () => {
    onSave(draft.map((d) => d.trim()).filter(Boolean));
    setEditing(false);
  };
  const updateAt = (i: number, v: string) => setDraft(draft.map((d, idx) => (idx === i ? v : d)));
  const removeAt = (i: number) => setDraft(draft.filter((_, idx) => idx !== i));
  const addOne = () => setDraft([...draft, ""]);

  return (
    <SubPage
      title="Your value propositions"
      subtitle={`What makes JK the right choice for ${clusterName}.`}
      onBack={onBack}
    >
      <div className="mb-3 flex justify-end">
        {!editing ? (
          <Button size="sm" variant="outline" onClick={startEdit} className="h-8 gap-1.5 rounded-xl text-xs">
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="h-8 rounded-xl text-xs">
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={save}
              className="h-8 rounded-xl bg-navy text-xs text-navy-foreground hover:bg-navy/90"
            >
              Save
            </Button>
          </div>
        )}
      </div>

      {!editing ? (
        <div className="space-y-3">
          {valueProps.map((p, i) => (
            <div key={i} className="rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex gap-2">
                <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-critical" />
                <p className="text-sm leading-relaxed text-foreground">{p}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {draft.map((d, i) => (
            <div key={i} className="flex items-start gap-2 rounded-2xl border border-border bg-card p-2.5">
              <textarea
                value={d}
                onChange={(e) => updateAt(i, e.target.value)}
                rows={2}
                className="flex-1 rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                placeholder="Concrete, user-centric value proposition"
              />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40"
                aria-label="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <Button size="sm" variant="outline" onClick={addOne} className="h-8 gap-1.5 rounded-xl text-xs">
            <Plus className="h-3.5 w-3.5" /> Add value proposition
          </Button>
        </div>
      )}
    </SubPage>
  );
}

/* ── Actions hub row ── */
function ActionToggleRow({
  icon,
  iconBg,
  label,
  count,
  onOpen,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  count: number;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3">
      <input
        type="checkbox"
        checked={count > 0}
        readOnly
        className="h-4 w-4 shrink-0 accent-critical"
      />
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", iconBg)}>{icon}</div>
      <button type="button" onClick={onOpen} className="flex-1 text-left">
        <p className="text-[13px] font-medium text-foreground">{label}</p>
        <p className="text-[10.5px] text-muted-foreground">
          {count > 0 ? `${count} added — tap to edit` : "Tap to add"}
        </p>
      </button>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

/* ── Action Plan report ── */
type PlanRow = {
  key: string;
  section: string;
  title: string;
  subtitle?: string;
  enablers: Enabler[];
  questions: Question[];
};

function ActionPlanReport({
  items,
  starredKeys,
  reviews,
  onToggleStar,
  onReviewChange,
}: {
  items: PlanRow[];
  starredKeys: string[];
  reviews: Record<string, Record<string, string>>;
  onToggleStar: (key: string) => void;
  onReviewChange: (key: string, fieldId: string, value: string) => void;
}) {
  const [enablerFor, setEnablerFor] = useState<{ row: PlanRow } | null>(null);
  const [activeEnabler, setActiveEnabler] = useState<Enabler | null>(null);
  const [reviewFor, setReviewFor] = useState<PlanRow | null>(null);

  // Group rows by section, preserving order
  const sections: { name: string; rows: PlanRow[] }[] = [];
  for (const r of items) {
    let bucket = sections.find((s) => s.name === r.section);
    if (!bucket) {
      bucket = { name: r.section, rows: [] };
      sections.push(bucket);
    }
    bucket.rows.push(r);
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-[28px_1fr_84px_72px] items-center gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[9.5px] font-semibold uppercase tracking-widest text-muted-foreground">
        <span></span>
        <span>Item</span>
        <span className="text-center">Enablers</span>
        <span className="text-center">Review</span>
      </div>
      {sections.map((sec) => (
        <div key={sec.name}>
          <div className="border-t border-border bg-muted/20 px-3 py-1.5 text-[10.5px] font-semibold text-foreground">
            {sec.name}
          </div>
          {sec.rows.map((row) => {
            const isStar = starredKeys.includes(row.key);
            const hasReview = Object.values(reviews[row.key] ?? {}).some((v) => (v ?? "").toString().trim());
            return (
              <div
                key={row.key}
                className="grid grid-cols-[28px_1fr_84px_72px] items-center gap-2 border-t border-border px-3 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => onToggleStar(row.key)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg hover:bg-muted/40"
                  aria-label="Prioritize"
                >
                  <Star
                    className={cn("h-4 w-4", isStar ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                  />
                </button>
                <div className="min-w-0">
                  <p className="truncate text-[12.5px] font-medium text-foreground">{row.title}</p>
                  {row.subtitle && (
                    <p className="truncate text-[10.5px] text-muted-foreground">{row.subtitle}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setEnablerFor({ row })}
                  className="mx-auto inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-800 hover:bg-amber-100"
                >
                  <Lightbulb className="h-3 w-3" /> View
                </button>
                <button
                  type="button"
                  disabled={!isStar}
                  onClick={() => setReviewFor(row)}
                  className={cn(
                    "mx-auto inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-medium",
                    isStar
                      ? hasReview
                        ? "border border-green-200 bg-green-50 text-green-800 hover:bg-green-100"
                        : "border border-border bg-background text-foreground hover:bg-muted"
                      : "cursor-not-allowed border border-dashed border-border text-muted-foreground/60",
                  )}
                >
                  <ClipboardCheck className="h-3 w-3" /> {hasReview ? "Done" : "Open"}
                </button>
              </div>
            );
          })}
        </div>
      ))}

      {/* Enablers list popup */}
      {enablerFor && !activeEnabler && (
        <ModalShell title="Enablers before meeting" subtitle={enablerFor.row.title} onClose={() => setEnablerFor(null)}>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {enablerFor.row.enablers.map((e, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActiveEnabler(e)}
                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-2.5 py-2 text-left hover:bg-amber-50"
              >
                <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                <div className="min-w-0">
                  <p className="text-[11.5px] font-medium leading-tight text-foreground">{e.label}</p>
                  <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">{e.description}</p>
                </div>
              </button>
            ))}
          </div>
        </ModalShell>
      )}

      {activeEnabler && (
        <ModalShell
          title={activeEnabler.label}
          subtitle={activeEnabler.description}
          onClose={() => setActiveEnabler(null)}
        >
          <ul className="divide-y divide-border rounded-xl border border-border">
            {activeEnabler.files.map((f, i) => (
              <li key={i} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                  <div className="min-w-0">
                    <p className="truncate text-[12px] font-medium text-foreground">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground">{f.size}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Demo file: ${f.name}\n(Dummy link — not connected to a real file.)`)}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] hover:bg-muted"
                >
                  <Download className="h-3 w-3" /> Open
                </button>
              </li>
            ))}
          </ul>
        </ModalShell>
      )}

      {/* Review popup */}
      {reviewFor && (
        <ModalShell title="Review post meeting" subtitle={reviewFor.title} onClose={() => setReviewFor(null)}>
          <div className="space-y-2.5">
            {reviewFor.questions.map((q) => (
              <div key={q.id}>
                <label className="mb-1 block text-[11px] font-medium text-foreground/80">{q.label}</label>
                {q.type === "textarea" ? (
                  <textarea
                    value={reviews[reviewFor.key]?.[q.id] ?? ""}
                    onChange={(e) => onReviewChange(reviewFor.key, q.id, e.target.value)}
                    placeholder={q.placeholder}
                    rows={2}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                  />
                ) : (
                  <input
                    type={q.type === "number" ? "number" : "text"}
                    value={reviews[reviewFor.key]?.[q.id] ?? ""}
                    onChange={(e) => onReviewChange(reviewFor.key, q.id, e.target.value)}
                    placeholder={q.placeholder}
                    className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              size="sm"
              onClick={() => setReviewFor(null)}
              className="h-8 rounded-xl bg-navy text-xs text-navy-foreground hover:bg-navy/90"
            >
              Done
            </Button>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="font-serif text-base text-foreground">{title}</p>
            {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

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
    <div className="space-y-2.5">
      {contacts.length === 0 && emptyHint && <p className="text-[11px] text-muted-foreground">{emptyHint}</p>}
      {contacts.map((c, i) => (
        <div
          key={c.id}
          className="grid grid-cols-2 gap-1.5 rounded-2xl border border-border bg-card p-2.5 sm:grid-cols-4"
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
              className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40"
              aria-label="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="outline" onClick={add} className="h-8 gap-1.5 rounded-xl text-xs">
        <Plus className="h-3.5 w-3.5" /> Add
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
      className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
    />
  );
}
