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
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  FileDown,
  FileText,
  HardHat,
  Info,
  ListChecks,
  MapPin,
  Pencil,
  Plus,
  Star,
  Trash2,
  UserCheck,
  Users,
  X,
  Download,
} from "lucide-react";
import { generateMonthlyEngagementPlanPdf } from "@/lib/monthlyPlanReport";
import { getCustomerGroups, getValuePropsForGroup, getCampIdeas, type ContactEntry } from "@/lib/strategyContent";

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

type Page = "hub" | "groups" | "valueprops" | "actions" | "actionplan";

declare global {
  interface Window {
    google: typeof google;
  }
}

/* ─── Group detail points ─── */
type DetailPoints = { title: string; points: string[] };

function getGroupDetailPoints(clusterId: string, groupId: string, groupLabel: string, pct: number): DetailPoints {
  // Per-cluster, per-group concrete points
  const key = `${clusterId}::${groupId}`;
  const MAP: Record<string, DetailPoints> = {
    "schools::large-private": {
      title: "Large private schools",
      points: [
        `Contribute ~40% of total painting value in this cluster despite being only ${pct}% by count — high per-site spend.`,
        "Key decision maker is the school trustee or management committee. Facility head influences but rarely decides.",
        "Full repaint every 3–5 years, interiors + exteriors. April–June vacation window is the only viable slot.",
        "Compare JK vs Asian Paints on brand perception — warranty documentation and site references matter most.",
      ],
    },
    "schools::small-private": {
      title: "Small private schools",
      points: [
        `Highest volume segment at ${pct}% — individually smaller jobs but collectively the biggest revenue pool.`,
        "Owner-principal is the sole decision maker. Decisions happen fast once value is demonstrated in person.",
        "Repaint classrooms and corridors annually. Budget is tight — cost per sq.ft. is the #1 question.",
        "Bundled exterior + interior offer with a single contractor referral closes faster than multi-step proposals.",
      ],
    },
    "schools::international": {
      title: "International schools",
      points: [
        `Small segment (${pct}%) but highest average ticket size — premium low-VOC and IGBC finishes required.`,
        "Facility manager + procurement committee. Test certificates and global brand compliance are mandatory.",
        "Painting tied to annual AMC cycles. Getting on the approved-spec list is the goal — not individual repaints.",
        "Lead with credentials and a marquee reference project rather than pricing to win specification.",
      ],
    },
    "schools::pre-schools": {
      title: "Pre-schools",
      points: [
        `Growing segment — high churn of centres means frequent repaints to attract new admissions each year.`,
        "Owner-principal decides fast and emotionally — they respond well to colour samples and mural concepts.",
        "Walls, murals and activity zones are the key surfaces. Washable and anti-microbial is the core pitch.",
        "Offering a themed mural concept alongside the repaint quote doubles conversion rate with this segment.",
      ],
    },
    "schools::government": {
      title: "Government schools",
      points: [
        "Large number of schools but L1 tendering means price is the primary selection criterion.",
        "Zilla Parishad or municipal engineer decides. Headmaster has very limited influence on brand choice.",
        "Budget coatings for exteriors and classrooms. Anti-fungal for monsoon resilience is the key spec point.",
        "Empanelment or rate-contract listing is more valuable than individual school-level pitches.",
      ],
    },
    "hospitals::multi-specialty": {
      title: "Multi-specialty hospitals",
      points: [
        `Represent ~${pct}% of cluster but the highest single-order value — large surface areas, strict hygiene specs.`,
        "Facility director or purchase committee decides. Infection-control compliance is a hard requirement.",
        "Anti-microbial, washable finishes for OPD, wards and corridors. Repaints happen during low-occupancy windows.",
        "Test certificates and case studies from other hospitals close faster than price negotiation.",
      ],
    },
    "midc::large-mfg": {
      title: "Large manufacturing units",
      points: [
        `Large units make up ${pct}% of cluster — high surface areas, specialised coatings for industrial environments.`,
        "Plant head / purchase manager decides. Safety audit compliance is a key trigger for repaints.",
        "Epoxy floor coatings, anti-corrosion wall finishes and safety-colour marking are typical requirements.",
        "Long-term AMC contracts are preferred — position JK as a coating-system partner, not a one-time vendor.",
      ],
    },
  };
  if (MAP[key]) return MAP[key];
  // Generic fallback
  return {
    title: groupLabel,
    points: [
      `This segment represents ${pct}% of the ${clusterId.replace(/-/g, " ")} cluster — a key targeting group.`,
      "Decision makers are typically facility managers or business owners. Build rapport through a warm intro.",
      "Repainting cycles and product requirements vary — ask about their last repaint and current brand experience.",
      "Demonstrating finish quality with physical samples converts faster than brochures alone.",
    ],
  };
}

/* ─── Camp-specific enablers ─── */
type EnablerFile = { name: string; size: string };
type Enabler = { label: string; description: string; file: EnablerFile };

const CAMP_ENABLERS: Record<string, Enabler[]> = {
  "principal-meet": [
    {
      label: "Low-VOC TDS",
      description: "Technical data sheet for odourless / low-VOC range with application guide.",
      file: { name: "JK_LowVOC_TDS.pdf", size: "820 KB" },
    },
    {
      label: "Principal deck",
      description: "8-slide deck for principal meetings — health, durability, warranty.",
      file: { name: "Principal_Pitch_v2.pptx", size: "3.1 MB" },
    },
    {
      label: "School case study",
      description: "Before / after case study from a similar school repaint in the region.",
      file: { name: "School_Case_Study.pdf", size: "1.4 MB" },
    },
  ],
  "pta-awareness": [
    {
      label: "PTA pamphlet",
      description: "A5 handout for parents — child-safe paints, warranty and what to ask.",
      file: { name: "PTA_Pamphlet_A5.pdf", size: "540 KB" },
    },
    {
      label: "Lead form",
      description: "Printable form to collect parent and committee contact details.",
      file: { name: "Lead_Capture_Sheet.pdf", size: "140 KB" },
    },
    {
      label: "Range flyer",
      description: "Quick visual of the full JK Maxx range with price-tier guidance.",
      file: { name: "Product_Range_Flyer.pdf", size: "680 KB" },
    },
  ],
  "child-safe-demo": [
    {
      label: "Demo kit list",
      description: "Checklist of samples and tools to carry for the live demo.",
      file: { name: "Demo_Kit_Checklist.pdf", size: "210 KB" },
    },
    {
      label: "Child-safe cert",
      description: "Safety certificate for child-safe and anti-microbial finish range.",
      file: { name: "ChildSafe_Certificate.pdf", size: "340 KB" },
    },
    {
      label: "Lead form",
      description: "Printable form to capture attendee interest at the stall.",
      file: { name: "Lead_Capture_Sheet.pdf", size: "140 KB" },
    },
  ],
  "facility-clinic": [
    {
      label: "Anti-fungal guide",
      description: "Technical guide on anti-fungal exteriors for monsoon resilience.",
      file: { name: "AntiFungal_Guide.pdf", size: "480 KB" },
    },
    {
      label: "Facility deck",
      description: "Short deck for facility managers — maintenance cost, durability.",
      file: { name: "Facility_Manager_Deck.pptx", size: "2.2 MB" },
    },
    {
      label: "Cluster overview",
      description: "Summary of JK's presence and projects in this cluster.",
      file: { name: "Cluster_Overview.pdf", size: "920 KB" },
    },
  ],
  "hygiene-session": [
    {
      label: "Hygiene brochure",
      description: "Anti-microbial and washable finish brochure for healthcare.",
      file: { name: "Healthcare_Brochure.pdf", size: "760 KB" },
    },
    {
      label: "Hospital cases",
      description: "Case studies from hospitals where JK hygiene finishes were applied.",
      file: { name: "Hospital_Case_Studies.pdf", size: "1.8 MB" },
    },
    {
      label: "Compliance sheet",
      description: "Infection-control compliance certificates and test reports.",
      file: { name: "Compliance_Certificates.pdf", size: "540 KB" },
    },
  ],
};

function getCampEnablers(campId: string): Enabler[] {
  return (
    CAMP_ENABLERS[campId] ?? [
      {
        label: "Event pamphlet",
        description: "Printable handout to distribute at the venue.",
        file: { name: "JK_Event_Pamphlet.pdf", size: "820 KB" },
      },
      {
        label: "Pitch deck",
        description: "Short deck to anchor the stage / booth conversation.",
        file: { name: "JK_Cluster_Pitch.pptx", size: "4.6 MB" },
      },
      {
        label: "Lead form",
        description: "Form to capture attendee interest at the event.",
        file: { name: "Lead_Capture_Sheet.pdf", size: "140 KB" },
      },
    ]
  );
}

/* ─── Group-level enablers ─── */
const CONTRACTOR_GROUP_ENABLERS: Enabler[] = [
  {
    label: "Benefits sheet",
    description: "Margin, loyalty scheme and on-site support — single A4 handout.",
    file: { name: "Contractor_Benefits.pdf", size: "950 KB" },
  },
  {
    label: "Comparison deck",
    description: "Side-by-side on coverage, finish and TCO vs Asian Paints / Berger.",
    file: { name: "JK_vs_Competitors.pptx", size: "3.1 MB" },
  },
  {
    label: "Trial form",
    description: "Ready-to-fill starter order form with current pricing and scheme.",
    file: { name: "Trial_Order_Form.pdf", size: "180 KB" },
  },
];
const RETAILER_GROUP_ENABLERS: Enabler[] = [
  {
    label: "Scheme sheet",
    description: "Slab-wise margin and quarterly rotation scheme for retailers.",
    file: { name: "Retailer_Scheme_Q.pdf", size: "640 KB" },
  },
  {
    label: "Demand data",
    description: "Contractors and projects in their area currently asking for JK.",
    file: { name: "Catchment_Demand.pdf", size: "720 KB" },
  },
  {
    label: "POSM kit",
    description: "Shop branding, danglers and shelf-talkers for counter activation.",
    file: { name: "POSM_Kit.pdf", size: "2.4 MB" },
  },
];
const STAKEHOLDER_GROUP_ENABLERS: Enabler[] = [
  {
    label: "Credentials deck",
    description: "Institutional deck with credentials, marquee projects and case studies.",
    file: { name: "JK_Institutional_Deck.pptx", size: "6.2 MB" },
  },
  {
    label: "Spec / BOQ kit",
    description: "BOQ-ready specs, test certificates and product approvals.",
    file: { name: "BOQ_Spec_Sheet.pdf", size: "540 KB" },
  },
  {
    label: "Pilot proposal",
    description: "Ready proposal for a pilot application on site.",
    file: { name: "Pilot_Proposal_Template.docx", size: "210 KB" },
  },
];

/* ─── Places hook ─── */
function buildGroupQuery(groupLabel: string, clusterPlacesQuery: string): string {
  const area = clusterPlacesQuery.trim().split(/\s+/).at(-1) ?? "";
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

/* ════════════════════════════════════════════════════════════
   Main component
════════════════════════════════════════════════════════════ */
function PlanClusterScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();
  const mainRef = useRef<HTMLElement>(null);

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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState<{ id: string; label: string; pct: number } | null>(null);
  const [editVPOpen, setEditVPOpen] = useState(false);
  const [activeEnabler, setActiveEnabler] = useState<Enabler | null>(null);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
  }, [page]);

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
    const currentProps = groupValueProps[groupId] ?? [];
    if (!isSelected && !currentProps.includes(props[0])) toggleGroupValueProp(clusterId, groupId, props[0]);
    else if (isSelected && currentProps.includes(props[0])) toggleGroupValueProp(clusterId, groupId, props[0]);
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
      camps: selectedCampObjs.map((c) => ({ id: c.id, label: c.label, starred: isStarred(`camp:${c.id}`) })),
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

  const actionsBadge =
    selectedCamps.length + validContractors.length + validRetailers.length + validStakeholders.length;

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

            <HubCard onClick={() => goTo("actions")}>
              <HubIcon bg="bg-violet-50">
                <Bolt className="h-4 w-4 text-violet-700" />
              </HubIcon>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">What actions will you take to engage?</p>
                <p className="text-[11px] text-muted-foreground">Camps, contractors, retailers, stakeholders</p>
              </div>
              {badge(actionsBadge)}
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
              <FileDown className="h-4 w-4" /> Generate quarterly plan
            </Button>
          </div>
        )}

        {/* ── GROUPS ── */}
        {page === "groups" && (
          <SubPage
            title="Who are you targeting?"
            subtitle={`Select the customer groups within ${cluster.name} you plan to engage.`}
            onBack={goHub}
          >
            <div className="space-y-2.5">
              {groups.map((g) => {
                const selected = customerGroups.includes(g.id);
                const places = groupPlaceNames[g.id] ?? [];
                const isLoading = groupPlacesLoading[g.id] ?? false;
                return (
                  <div
                    key={g.id}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border px-4 py-3 transition-colors",
                      selected ? "border-critical bg-critical/5" : "border-border bg-card",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => handleGroupToggle(g.id)}
                      className="h-4 w-4 shrink-0 accent-critical"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-serif text-sm text-foreground">{g.label}</span>
                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-medium text-muted-foreground">
                          {g.pct}%
                        </span>
                      </div>
                      {isLoading && (
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-16 animate-pulse rounded-full bg-muted" />
                          <div className="h-4 w-20 animate-pulse rounded-full bg-muted" />
                        </div>
                      )}
                      {!isLoading && places.length > 0 && (
                        <div className="flex flex-wrap gap-1">
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
                    </div>
                    <button
                      type="button"
                      onClick={() => setDetailGroup(g)}
                      className="shrink-0 rounded-lg border border-critical bg-critical/5 px-2.5 py-1 text-[10px] font-medium text-critical hover:bg-critical/10"
                    >
                      View details
                    </button>
                  </div>
                );
              })}
            </div>
          </SubPage>
        )}

        {/* ── VALUE PROPS ── */}
        {page === "valueprops" && (
          <SubPage
            title="Your value propositions"
            subtitle="Tailored propositions for each group you selected."
            onBack={goHub}
            topRight={
              <button
                type="button"
                onClick={() => setEditVPOpen(true)}
                className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-[10px] text-muted-foreground hover:bg-muted/40"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            }
          >
            {selectedGroupObjs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Go back and select customer groups first.</p>
            ) : (
              <div className="space-y-3">
                {selectedGroupObjs.map((g) => {
                  const props = getValuePropsForGroup(clusterId, g.id);
                  return (
                    <div key={g.id} className="rounded-2xl border border-border bg-card px-4 py-3">
                      <div className="mb-2 flex items-center gap-2">
                        <div className="h-2 w-2 shrink-0 rounded-full bg-critical" />
                        <p className="font-serif text-sm text-foreground">{g.label}</p>
                      </div>
                      <ul className="space-y-1.5 pl-4">
                        {props.slice(0, 3).map((p, i) => (
                          <li key={i} className="text-[11px] leading-relaxed text-muted-foreground list-disc">
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </SubPage>
        )}

        {/* ── ACTIONS ── all 4 as checkboxes on one page */}
        {page === "actions" && (
          <SubPage
            title="What actions will you take?"
            subtitle="Check an action to plan it. Tap to fill in details."
            onBack={goHub}
          >
            <div className="space-y-3">
              <ActionRow
                checked={selectedCamps.length > 0}
                icon={<CalendarDays className="h-4 w-4 text-blue-700" />}
                iconBg="bg-blue-50"
                label="Camps & events you are planning"
                sub="What camps or events will you conduct?"
              >
                <div className="space-y-2">
                  {camps.map((c) => {
                    const on = selectedCamps.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5",
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
                          <span className="block text-[11px] text-muted-foreground">{c.description}</span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              </ActionRow>

              <ActionRow
                checked={validContractors.length > 0}
                icon={<HardHat className="h-4 w-4 text-green-700" />}
                iconBg="bg-green-50"
                label="Contractors you are going to convert"
                sub="List contractors to reach out to"
              >
                <ContactTable
                  emptyHint="Add contractors you plan to engage."
                  contacts={contractors}
                  onChange={(list) => setStrategyContacts(clusterId, CONTRACTOR_BUCKET, list)}
                />
              </ActionRow>

              <ActionRow
                checked={validRetailers.length > 0}
                icon={<Building2 className="h-4 w-4 text-amber-700" />}
                iconBg="bg-amber-50"
                label={`Retailers who can connect you to ${cluster.name.toLowerCase()}`}
                sub="List retailers who can introduce you"
              >
                <ContactTable
                  emptyHint="Add retailers who can introduce you to the cluster."
                  contacts={retailers}
                  onChange={(list) => setStrategyContacts(clusterId, RETAILER_BUCKET, list)}
                />
              </ActionRow>

              <ActionRow
                checked={validStakeholders.length > 0}
                icon={<UserCheck className="h-4 w-4 text-red-800" />}
                iconBg="bg-red-50"
                label={`Stakeholders of ${cluster.name.toLowerCase()} you will meet directly`}
                sub="Principals, trustees, facility heads"
              >
                <ContactTable
                  emptyHint="Add stakeholders / decision-makers you plan to meet."
                  contacts={stakeholders}
                  onChange={(list) => setStrategyContacts(clusterId, STAKEHOLDER_BUCKET, list)}
                />
              </ActionRow>
            </div>
          </SubPage>
        )}

        {/* ── ACTION PLAN ── */}
        {page === "actionplan" && (
          <SubPage
            title="Your action plan"
            subtitle="Star to prioritize. Review unlocks once starred."
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
              <div className="space-y-5">
                {selectedCampObjs.length > 0 && (
                  <div>
                    <SectionLabel>Camps / events</SectionLabel>
                    <div className="space-y-2">
                      {selectedCampObjs.map((c) => {
                        const key = `camp:${c.id}`;
                        const enablers = getCampEnablers(c.id);
                        return (
                          <ApRow
                            key={c.id}
                            title={c.label}
                            sub={c.description}
                            starred={isStarred(key)}
                            onToggleStar={() => toggleStarred(clusterId, key)}
                            enablers={enablers}
                            onEnablerClick={setActiveEnabler}
                            onReview={() => navigate({ to: "/plan/$clusterId/review", params: { clusterId } })}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {validContractors.length > 0 && (
                  <div>
                    <SectionLabel>Contractors</SectionLabel>
                    <ApGroupRow
                      title="Contractors to convert"
                      contacts={validContractors}
                      starred={isStarred("group:contractors")}
                      onToggleStar={() => toggleStarred(clusterId, "group:contractors")}
                      enablers={CONTRACTOR_GROUP_ENABLERS}
                      onEnablerClick={setActiveEnabler}
                      onReview={() => navigate({ to: "/plan/$clusterId/review", params: { clusterId } })}
                    />
                  </div>
                )}

                {validRetailers.length > 0 && (
                  <div>
                    <SectionLabel>Retailers</SectionLabel>
                    <ApGroupRow
                      title="Retailers who can connect"
                      contacts={validRetailers}
                      starred={isStarred("group:retailers")}
                      onToggleStar={() => toggleStarred(clusterId, "group:retailers")}
                      enablers={RETAILER_GROUP_ENABLERS}
                      onEnablerClick={setActiveEnabler}
                      onReview={() => navigate({ to: "/plan/$clusterId/review", params: { clusterId } })}
                    />
                  </div>
                )}

                {validStakeholders.length > 0 && (
                  <div>
                    <SectionLabel>Stakeholders</SectionLabel>
                    <ApGroupRow
                      title="Stakeholders to meet directly"
                      contacts={validStakeholders}
                      starred={isStarred("group:stakeholders")}
                      onToggleStar={() => toggleStarred(clusterId, "group:stakeholders")}
                      enablers={STAKEHOLDER_GROUP_ENABLERS}
                      onEnablerClick={setActiveEnabler}
                      onReview={() => navigate({ to: "/plan/$clusterId/review", params: { clusterId } })}
                    />
                  </div>
                )}
              </div>
            )}
          </SubPage>
        )}
      </div>

      {/* ── Group detail popup ── */}
      {detailGroup &&
        (() => {
          const detail = getGroupDetailPoints(clusterId, detailGroup.id, detailGroup.label, detailGroup.pct);
          return (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4"
              onClick={() => setDetailGroup(null)}
            >
              <div
                className="w-full max-w-md overflow-hidden rounded-2xl bg-background"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <p className="font-serif text-base text-foreground">{detail.title}</p>
                  <button type="button" onClick={() => setDetailGroup(null)} className="text-muted-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="divide-y divide-border px-4">
                  {detail.points.map((pt, i) => (
                    <div key={i} className="flex gap-3 py-3">
                      <span className="mt-0.5 text-critical font-semibold text-sm shrink-0">•</span>
                      <p className="text-[12px] leading-relaxed text-foreground">{pt}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

      {/* ── Edit VP modal ── */}
      {editVPOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4"
          onClick={() => setEditVPOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-serif text-base text-foreground">Edit value propositions</p>
              <button type="button" onClick={() => setEditVPOpen(false)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              {selectedGroupObjs.map((g) => {
                const prop = (groupValueProps[g.id] ?? [])[0] ?? getValuePropsForGroup(clusterId, g.id)[0] ?? "";
                return (
                  <div key={g.id}>
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {g.label}
                    </p>
                    <textarea
                      defaultValue={prop}
                      rows={2}
                      className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs"
                    />
                  </div>
                );
              })}
              <Button
                onClick={() => setEditVPOpen(false)}
                className="h-10 w-full bg-navy text-sm text-navy-foreground hover:bg-navy/90"
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Enabler file modal ── */}
      {activeEnabler && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-4 pb-4"
          onClick={() => setActiveEnabler(null)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-background"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="font-serif text-base text-foreground">{activeEnabler.label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{activeEnabler.description}</p>
              </div>
              <button type="button" onClick={() => setActiveEnabler(null)} className="text-muted-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-amber-700" />
                <div>
                  <p className="text-[12px] font-medium text-foreground">{activeEnabler.file.name}</p>
                  <p className="text-[10px] text-muted-foreground">{activeEnabler.file.size}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => alert(`Demo: ${activeEnabler.file.name}`)}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1 text-[11px] text-foreground hover:bg-muted"
              >
                <Download className="h-3 w-3" /> Open
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Generate dialog ── */}
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

/* ════════════════════════════════════════════════════════════
   Action plan row components
════════════════════════════════════════════════════════════ */

function ApRow({
  title,
  sub,
  starred,
  onToggleStar,
  enablers,
  onEnablerClick,
  onReview,
}: {
  title: string;
  sub?: string;
  starred: boolean;
  onToggleStar: () => void;
  enablers: Enabler[];
  onEnablerClick: (e: Enabler) => void;
  onReview: () => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-border bg-card" style={{ minHeight: 64 }}>
      <button
        type="button"
        onClick={onToggleStar}
        className="flex shrink-0 items-center justify-center px-2.5 hover:bg-muted/30"
        aria-label="Star"
      >
        <Star className={cn("h-4 w-4", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center border-x border-border px-3 py-2.5">
        <p className="font-serif text-sm text-foreground">{title}</p>
        {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
      </div>
      <div className="flex shrink-0 flex-col border-r border-border" style={{ width: 108 }}>
        {enablers.map((e, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onEnablerClick(e)}
            className="flex flex-1 items-center justify-center border-b border-white/20 bg-[#185FA5] px-2 text-[8px] font-medium text-white last:border-b-0 hover:bg-[#0C447C]"
            style={{ lineHeight: 1.3 }}
          >
            {e.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={starred ? onReview : undefined}
        className={cn(
          "flex shrink-0 items-center justify-center",
          starred ? "bg-[#185FA5] cursor-pointer hover:bg-[#0C447C]" : "bg-muted cursor-not-allowed",
        )}
        style={{ width: 52 }}
        aria-label="Review"
      >
        <span
          className="text-[10px] font-medium"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: starred ? "#fff" : "var(--muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          Review
        </span>
      </button>
    </div>
  );
}

function ApGroupRow({
  title,
  contacts,
  starred,
  onToggleStar,
  enablers,
  onEnablerClick,
  onReview,
}: {
  title: string;
  contacts: ContactEntry[];
  starred: boolean;
  onToggleStar: () => void;
  enablers: Enabler[];
  onEnablerClick: (e: Enabler) => void;
  onReview: () => void;
}) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-border bg-card" style={{ minHeight: 72 }}>
      <button
        type="button"
        onClick={onToggleStar}
        className="flex shrink-0 items-center justify-center px-2.5 hover:bg-muted/30"
        aria-label="Star"
      >
        <Star className={cn("h-4 w-4", starred ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col justify-center border-x border-border px-3 py-2.5">
        <p className="mb-1 text-sm font-medium text-foreground">{title}</p>
        {contacts.slice(0, 2).map((c, i) => (
          <p key={i} className="truncate text-[10px] text-muted-foreground">
            {[c.name, c.area].filter(Boolean).join(" · ")}
          </p>
        ))}
        {contacts.length > 2 && <p className="text-[10px] text-muted-foreground">+{contacts.length - 2} more</p>}
      </div>
      <div className="flex shrink-0 flex-col border-r border-border" style={{ width: 108 }}>
        {enablers.map((e, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onEnablerClick(e)}
            className="flex flex-1 items-center justify-center border-b border-white/20 bg-[#185FA5] px-2 text-[8px] font-medium text-white last:border-b-0 hover:bg-[#0C447C]"
            style={{ lineHeight: 1.3 }}
          >
            {e.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={starred ? onReview : undefined}
        className={cn(
          "flex shrink-0 items-center justify-center",
          starred ? "bg-[#185FA5] cursor-pointer hover:bg-[#0C447C]" : "bg-muted cursor-not-allowed",
        )}
        style={{ width: 52 }}
        aria-label="Review"
      >
        <span
          className="text-[10px] font-medium"
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            color: starred ? "#fff" : "var(--muted-foreground)",
            letterSpacing: "0.05em",
          }}
        >
          Review
        </span>
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   Shared primitives
════════════════════════════════════════════════════════════ */

function SubPage({
  title,
  subtitle,
  onBack,
  children,
  footer,
  topRight,
}: {
  title: string;
  subtitle: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  topRight?: React.ReactNode;
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg leading-snug text-foreground">{title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
          </div>
          {topRight}
        </div>
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

function ActionRow({
  checked,
  icon,
  iconBg,
  label,
  sub,
  children,
}: {
  checked: boolean;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  sub: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(checked);
  const toggle = () => {
    setOpen((o) => !o);
  };
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={toggle}>
        <input
          type="checkbox"
          checked={open}
          onChange={toggle}
          className="h-4 w-4 shrink-0 accent-critical"
          onClick={(e) => e.stopPropagation()}
        />
        <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", iconBg)}>{icon}</div>
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-[11px] text-muted-foreground">{sub}</p>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </div>
      {open && <div className="border-t border-border bg-muted/20 px-4 py-3">{children}</div>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">{children}</p>;
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
