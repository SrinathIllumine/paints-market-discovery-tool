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
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileDown,
  HardHat,
  ListChecks,
  MapPin,
  Plus,
  Star,
  Trash2,
  UserCheck,
  Users,
} from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import { getCustomerGroups, getValuePropsForGroup, getCampIdeas, type ContactEntry } from "@/lib/strategyContent";

export const Route = createFileRoute("/plan/$clusterId")({
  component: PlanClusterScreen,
});

const CONTRACTOR_BUCKET = "CONTRACTOR" as const;
const RETAILER_BUCKET = "RETAILER" as const;
const STAKEHOLDER_BUCKET = "D2C" as const;

const EMPTY_ARR: string[] = [];
const EMPTY_REC: Record<string, string[]> = {};
const EMPTY_CONTACTS: ContactEntry[] = [];
const EMPTY_SC: Record<string, Partial<Record<string, ContactEntry[]>>> = {};

type Page = "hub" | "groups" | "valueprops" | "camps" | "contractors" | "retailers" | "stakeholders" | "actionplan";

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
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);
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

  const [page, setPage] = useState<Page>("hub");
  const [q3Open, setQ3Open] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const handleGroupToggle = (groupId: string) => {
    const isSelected = customerGroups.includes(groupId);
    toggleCustomerGroup(clusterId, groupId);
    const props = getValuePropsForGroup(clusterId, groupId);
    if (!props[0]) return;
    const firstProp = props[0];
    const currentProps = groupValueProps[groupId] ?? [];
    if (!isSelected && !currentProps.includes(firstProp)) toggleGroupValueProp(clusterId, groupId, firstProp);
    else if (isSelected && currentProps.includes(firstProp)) toggleGroupValueProp(clusterId, groupId, firstProp);
  };

  const handleGenerate = () => {
    generateMonthlyEngagementPlanPdf({
      focusClusterId: clusterId,
      customerGroups: selectedGroupObjs.map((g) => ({
        id: g.id,
        label: g.label,
        pct: g.pct,
        valueProps: groupValueProps[g.id] ?? [],
      })),
      camps: selectedCampObjs.map((c) => ({
        id: c.id,
        label: c.label,
        starred: isStarred(`camp:${c.id}`),
      })),
      contractors: contractors.map((c) => ({ ...c, starred: isStarred("group:contractors") })),
      retailers: retailers.map((c) => ({ ...c, starred: isStarred("group:retailers") })),
      stakeholders: stakeholders.map((c) => ({ ...c, starred: isStarred("group:stakeholders") })),
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
                <p className="text-sm font-medium text-foreground">Who are you targeting?</p>
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
                <p className="text-[11px] text-muted-foreground">One proposition per selected group</p>
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

            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <button
                type="button"
                onClick={() => setQ3Open((o) => !o)}
                className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
              >
                <HubIcon bg="bg-violet-50">
                  <Bolt className="h-4 w-4 text-violet-700" />
                </HubIcon>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">What actions will you take to engage?</p>
                  <p className="text-[11px] text-muted-foreground">Camps, contractors, retailers, stakeholders</p>
                </div>
                {q3Open ? (
                  <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
              </button>
              {q3Open && (
                <div className="divide-y divide-border border-t border-border bg-muted/30">
                  <SubHubRow
                    dot="bg-blue-600"
                    label="Camps & events you are planning"
                    badge={badge(selectedCamps.length)}
                    onClick={() => goTo("camps")}
                  />
                  <SubHubRow
                    dot="bg-green-700"
                    label="Contractors you are going to convert"
                    badge={badge(validContractors.length)}
                    onClick={() => goTo("contractors")}
                  />
                  <SubHubRow
                    dot="bg-amber-700"
                    label={`Retailers who can connect you to ${cluster.name.toLowerCase()}`}
                    badge={badge(validRetailers.length)}
                    onClick={() => goTo("retailers")}
                  />
                  <SubHubRow
                    dot="bg-red-800"
                    label={`Stakeholders of ${cluster.name.toLowerCase()} you will meet directly`}
                    badge={badge(validStakeholders.length)}
                    onClick={() => goTo("stakeholders")}
                  />
                </div>
              )}
            </div>

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
              <FileDown className="h-4 w-4" /> Generate quarterly plan
            </Button>
          </div>
        )}

        {/* ── GROUPS ── */}
        {page === "groups" && (
          <SubPage
            title="Who are you targeting?"
            subtitle={`Select the customer groups within ${cluster.name} you plan to engage this quarter.`}
            onBack={goHub}
          >
            <div className="space-y-3">
              {groups.map((g) => {
                const selected = customerGroups.includes(g.id);
                const places = groupPlaceNames[g.id] ?? [];
                const isLoading = groupPlacesLoading[g.id] ?? false;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGroupToggle(g.id)}
                    className={cn(
                      "w-full rounded-2xl border px-4 py-3 text-left transition-colors",
                      selected ? "border-critical bg-critical/5" : "border-border bg-card",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-serif text-sm text-foreground">{g.label}</span>
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                        {g.pct}%
                      </span>
                    </div>

                    {isLoading && (
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-20 animate-pulse rounded-full bg-muted" />
                        <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
                        <div className="h-5 w-16 animate-pulse rounded-full bg-muted" />
                      </div>
                    )}

                    {!isLoading && places.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {places.slice(0, 3).map((name) => (
                          <span
                            key={name}
                            className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <MapPin className="h-2.5 w-2.5 shrink-0" />
                            {name}
                          </span>
                        ))}
                        {places.length > 3 && (
                          <span className="inline-flex items-center rounded-full border border-border bg-background px-2 py-0.5 text-[10px] text-muted-foreground">
                            +{places.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {!isLoading && places.length === 0 && groupPlaceNames[g.id] !== undefined && (
                      <p className="text-[10px] text-muted-foreground">No results found nearby</p>
                    )}
                  </button>
                );
              })}
            </div>
          </SubPage>
        )}

        {/* ── VALUE PROPS ── */}
        {page === "valueprops" && (
          <SubPage
            title="Your value propositions"
            subtitle="One tailored proposition for each group you selected."
            onBack={goHub}
          >
            {selectedGroupObjs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Go back and select customer groups first.</p>
            ) : (
              <div className="space-y-3">
                {selectedGroupObjs.map((g) => {
                  const prop = (groupValueProps[g.id] ?? [])[0] ?? getValuePropsForGroup(clusterId, g.id)[0] ?? "";
                  return (
                    <div key={g.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-critical" />
                        <p className="font-serif text-sm text-foreground">{g.label}</p>
                      </div>
                      <p className="pl-4 text-sm leading-relaxed text-muted-foreground">{prop}</p>
                    </div>
                  );
                })}
              </div>
            )}
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
            subtitle="Star items or groups to prioritize for this quarter."
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
            {selectedGroupObjs.length === 0 &&
            selectedCampObjs.length === 0 &&
            validContractors.length === 0 &&
            validRetailers.length === 0 &&
            validStakeholders.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Make selections in the other sections to see your action plan here.
              </p>
            ) : (
              <div className="space-y-6">
                {selectedGroupObjs.length > 0 && (
                  <div>
                    <SectionLabel>Customer groups selected</SectionLabel>
                    <div className="space-y-2">
                      {selectedGroupObjs.map((g) => (
                        <div key={g.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                          <p className="font-serif text-sm text-foreground">{g.label}</p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {(groupValueProps[g.id] ?? [])[0] ?? getValuePropsForGroup(clusterId, g.id)[0] ?? ""}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedCampObjs.length > 0 && (
                  <div>
                    <SectionLabel>Camps / events — star each to prioritize</SectionLabel>
                    <div className="space-y-2">
                      {selectedCampObjs.map((c) => (
                        <div
                          key={c.id}
                          className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3"
                        >
                          <div className="flex-1">
                            <p className="font-serif text-sm text-foreground">{c.label}</p>
                            <p className="text-[11px] text-muted-foreground">{c.description}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleStarred(clusterId, `camp:${c.id}`)}
                            className="shrink-0 rounded-lg p-1.5 hover:bg-muted/40"
                            aria-label="Prioritize"
                          >
                            <Star
                              className={cn(
                                "h-4 w-4",
                                isStarred(`camp:${c.id}`) ? "fill-amber-400 text-amber-400" : "text-muted-foreground",
                              )}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <GroupStarBlock
                  heading="Contractors — star group to prioritize"
                  icon={<HardHat className="h-4 w-4 text-green-700" />}
                  iconBg="bg-green-50"
                  label="Contractors to convert"
                  count={validContractors.length}
                  emptyText="No contractors added yet."
                  items={validContractors.map((c) =>
                    [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" · "),
                  )}
                  starred={isStarred("group:contractors")}
                  onToggleStar={() => toggleStarred(clusterId, "group:contractors")}
                />

                <GroupStarBlock
                  heading="Retailers — star group to prioritize"
                  icon={<Building2 className="h-4 w-4 text-amber-700" />}
                  iconBg="bg-amber-50"
                  label="Retailers who can connect"
                  count={validRetailers.length}
                  emptyText="No retailers added yet."
                  items={validRetailers.map((c) =>
                    [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" · "),
                  )}
                  starred={isStarred("group:retailers")}
                  onToggleStar={() => toggleStarred(clusterId, "group:retailers")}
                />

                <GroupStarBlock
                  heading="Stakeholders — star group to prioritize"
                  icon={<UserCheck className="h-4 w-4 text-red-800" />}
                  iconBg="bg-red-50"
                  label="Stakeholders to meet directly"
                  count={validStakeholders.length}
                  emptyText="No stakeholders added yet."
                  items={validStakeholders.map((c) =>
                    [c.name, c.phone, c.area, c.brandPreference].filter(Boolean).join(" · "),
                  )}
                  starred={isStarred("group:stakeholders")}
                  onToggleStar={() => toggleStarred(clusterId, "group:stakeholders")}
                />
              </div>
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

function SubHubRow({
  dot,
  label,
  badge,
  onClick,
}: {
  dot: string;
  label: string;
  badge: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-3 text-left hover:bg-muted/20"
    >
      <div className={cn("h-2 w-2 shrink-0 rounded-full", dot)} />
      <p className="flex-1 text-[12px] font-medium text-foreground">{label}</p>
      {badge}
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
}

function GroupStarBlock({
  heading,
  icon,
  iconBg,
  label,
  count,
  emptyText,
  items,
  starred,
  onToggleStar,
}: {
  heading: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  count: number;
  emptyText: string;
  items: string[];
  starred: boolean;
  onToggleStar: () => void;
}) {
  return (
    <div>
      <SectionLabel>{heading}</SectionLabel>
      {count === 0 ? (
        <p className="text-[11px] text-muted-foreground">{emptyText}</p>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", iconBg)}>{icon}</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground">
                {count} {count === 1 ? "entry" : "entries"}
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleStar}
              className="shrink-0 rounded-lg p-1.5 hover:bg-muted/40"
              aria-label="Prioritize group"
            >
              <Star className={cn("h-5 w-5", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
            </button>
          </div>
          <div className="divide-y divide-border px-4">
            {items.map((item, i) => (
              <p key={i} className="py-2.5 text-sm text-foreground">
                {item}
              </p>
            ))}
          </div>
        </div>
      )}
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
