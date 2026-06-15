import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { StageHeader } from "@/components/app/StageHeader";
import { BottomNav } from "@/components/app/BottomNav";
import { getCluster } from "@/data/clusters";
import { useAppStore, type ReviewEntry } from "@/store/appStore";
import { getCampIdeas, type ContactEntry } from "@/lib/strategyContent";
import {
  Lightbulb,
  ChevronDown,
  ClipboardCheck,
  ArrowLeft,
  CalendarDays,
  HardHat,
  Building2,
  UserCheck,
  Star,
  FileText,
  X,
  Download,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/plan/$clusterId/review")({
  component: ReviewScreen,
});

const CONTRACTOR_BUCKET = "CONTRACTOR" as const;
const RETAILER_BUCKET = "RETAILER" as const;
const STAKEHOLDER_BUCKET = "D2C" as const;

const EMPTY_ARR: string[] = [];
const EMPTY_CONTACTS: ContactEntry[] = [];
const EMPTY_REVIEWS: Record<string, ReviewEntry> = {};

type Question = { id: string; label: string; placeholder?: string; type?: "number" | "text" | "textarea" };
type EnablerFile = { name: string; size: string };
type Enabler = { label: string; description: string; files: EnablerFile[] };

const EVENT_ENABLERS: Enabler[] = [
  {
    label: "Event pamphlets",
    description: "Printable handouts to distribute at the venue.",
    files: [
      { name: "JK_Event_Pamphlet_A5.pdf", size: "1.2 MB" },
      { name: "Product_Range_Flyer.pdf", size: "820 KB" },
    ],
  },
  {
    label: "Pitch deck",
    description: "Short deck to anchor the stage / booth conversation.",
    files: [
      { name: "JK_Cluster_Pitch_v3.pptx", size: "4.6 MB" },
      { name: "Customer_Success_Stories.pdf", size: "2.1 MB" },
    ],
  },
  {
    label: "Workshop materials",
    description: "Demo kit checklist and live-demo script.",
    files: [
      { name: "Demo_Kit_Checklist.pdf", size: "210 KB" },
      { name: "Live_Demo_Script.docx", size: "180 KB" },
    ],
  },
  {
    label: "Lead capture form",
    description: "Printable + digital form to capture attendee interest.",
    files: [
      { name: "Lead_Capture_Sheet.pdf", size: "140 KB" },
      { name: "QR_Digital_Form.png", size: "90 KB" },
    ],
  },
];

const EVENT_QUESTIONS: Question[] = [
  { id: "attended", label: "How many participants attended?", type: "number", placeholder: "e.g. 42" },
  { id: "leads", label: "How many qualified leads did you generate?", type: "number", placeholder: "e.g. 8" },
  { id: "samples", label: "How many product samples / demos given?", type: "number", placeholder: "e.g. 15" },
  { id: "rating", label: "How well did the engagement land (1-10)?", type: "number", placeholder: "e.g. 7" },
  {
    id: "takeaways",
    label: "What worked, what didn't, and what's the next step?",
    type: "textarea",
    placeholder: "Key takeaways and follow-ups",
  },
];

const CONTRACTOR_ENABLERS: Enabler[] = [
  {
    label: "Contractor pamphlet",
    description: "Margin, scheme and on-site support — one page.",
    files: [
      { name: "Contractor_Benefits_Pamphlet.pdf", size: "950 KB" },
      { name: "Loyalty_Scheme_Onepager.pdf", size: "420 KB" },
    ],
  },
  {
    label: "Competitor comparison deck",
    description: "Side-by-side on coverage, finish and TCO vs key brands.",
    files: [
      { name: "JK_vs_Competitors.pptx", size: "3.1 MB" },
      { name: "Coverage_TCO_Calculator.xlsx", size: "260 KB" },
    ],
  },
  {
    label: "Product technical sheets",
    description: "TDS and application guides to share on WhatsApp.",
    files: [
      { name: "TDS_Bundle.pdf", size: "5.4 MB" },
      { name: "Application_Guide.pdf", size: "1.8 MB" },
    ],
  },
  {
    label: "Trial order form",
    description: "Ready-to-fill starter order with pricing.",
    files: [{ name: "Trial_Order_Form.pdf", size: "180 KB" }],
  },
];

const CONTRACTOR_QUESTIONS: Question[] = [
  { id: "metVisited", label: "Contractors met / visited", type: "number", placeholder: "e.g. 12" },
  { id: "interested", label: "Contractors who showed serious interest", type: "number", placeholder: "e.g. 5" },
  { id: "trialOrders", label: "Trial orders booked", type: "number", placeholder: "e.g. 3" },
  { id: "trialVolume", label: "Total trial order volume (bags / units)", type: "number", placeholder: "e.g. 80" },
  { id: "samplesGiven", label: "Samples / demo kits distributed", type: "number", placeholder: "e.g. 15" },
  { id: "blockers", label: "Top objections or blockers raised", type: "textarea" },
];

const RETAILER_ENABLERS: Enabler[] = [
  {
    label: "Retailer scheme sheet",
    description: "Slab-wise margin and rotation scheme for the quarter.",
    files: [
      { name: "Retailer_Scheme_Q.pdf", size: "640 KB" },
      { name: "Display_Norms.pdf", size: "310 KB" },
    ],
  },
  {
    label: "Catchment demand sheet",
    description: "Contractors / projects in their area asking for JK.",
    files: [{ name: "Catchment_Demand_Snapshot.pdf", size: "720 KB" }],
  },
  {
    label: "Branding & POSM kit",
    description: "Shop branding, danglers and shelf-talkers.",
    files: [
      { name: "POSM_Kit_Preview.pdf", size: "2.4 MB" },
      { name: "Shop_Branding_Mockup.png", size: "1.1 MB" },
    ],
  },
  {
    label: "Joint activity ideas",
    description: "Sampling drive / contractor meet at the shop.",
    files: [{ name: "Joint_Activity_Playbook.pdf", size: "880 KB" }],
  },
];

const RETAILER_QUESTIONS: Question[] = [
  { id: "metVisited", label: "Retailers met / visited", type: "number", placeholder: "e.g. 8" },
  { id: "newOnboard", label: "New retailers willing to stock JK", type: "number", placeholder: "e.g. 2" },
  { id: "intros", label: "Contractor / project introductions committed", type: "number", placeholder: "e.g. 6" },
  { id: "shelfShare", label: "Avg. shelf-share commitment (%)", type: "number", placeholder: "e.g. 25" },
  { id: "orderValue", label: "Indicative order value committed (Rs.)", type: "number", placeholder: "e.g. 75000" },
  { id: "feedback", label: "Feedback on pricing, scheme and product fit", type: "textarea" },
];

const STAKEHOLDER_ENABLERS: Enabler[] = [
  {
    label: "Institutional deck",
    description: "Credentials, marquee projects and case studies.",
    files: [
      { name: "JK_Institutional_Deck.pptx", size: "6.2 MB" },
      { name: "Marquee_Projects_Booklet.pdf", size: "3.7 MB" },
    ],
  },
  {
    label: "Spec / approval kit",
    description: "BOQ-ready specs, test certificates and approvals.",
    files: [
      { name: "BOQ_Spec_Sheet.pdf", size: "540 KB" },
      { name: "Test_Certificates_Bundle.pdf", size: "2.9 MB" },
    ],
  },
  {
    label: "Cost / durability calculator",
    description: "Share lifecycle cost vs incumbent brand.",
    files: [{ name: "Lifecycle_Cost_Calculator.xlsx", size: "320 KB" }],
  },
  {
    label: "Site-visit / pilot proposal",
    description: "Ready proposal for a pilot application on site.",
    files: [{ name: "Pilot_Proposal_Template.docx", size: "210 KB" }],
  },
];

const STAKEHOLDER_QUESTIONS: Question[] = [
  { id: "metVisited", label: "Stakeholders met", type: "number", placeholder: "e.g. 4" },
  { id: "specsInfluenced", label: "Specs / BOQs influenced", type: "number", placeholder: "e.g. 2" },
  { id: "pilotsAgreed", label: "Site visits / pilots agreed", type: "number", placeholder: "e.g. 1" },
  {
    id: "pipelineValue",
    label: "Indicative pipeline value unlocked (Rs.)",
    type: "number",
    placeholder: "e.g. 500000",
  },
  { id: "decision", label: "Key decision / outcome", type: "textarea" },
  { id: "risks", label: "Risks or competing brands in play", type: "textarea" },
];

function ReviewScreen() {
  const { clusterId } = Route.useParams();
  const navigate = useNavigate();

  const cluster = useMemo(() => {
    try {
      return getCluster(clusterId) ?? null;
    } catch {
      return null;
    }
  }, [clusterId]);

  const selectedCamps = useAppStore((s) => s.plan.selectedCampsByCluster[clusterId] ?? EMPTY_ARR);
  const strategyContacts = useAppStore((s) => s.plan.strategyContactsByCluster[clusterId]);
  const starred = useAppStore((s) => s.plan.starredByCluster[clusterId] ?? EMPTY_ARR);
  const reviews = useAppStore((s) => s.plan.reviewsByCluster[clusterId] ?? EMPTY_REVIEWS);
  const setReview = useAppStore((s) => s.setReview);

  const camps = useMemo(() => {
    if (!cluster) return [];
    try {
      return getCampIdeas(clusterId);
    } catch {
      return [];
    }
  }, [clusterId, cluster]);

  const contractors = strategyContacts?.[CONTRACTOR_BUCKET] ?? EMPTY_CONTACTS;
  const retailers = strategyContacts?.[RETAILER_BUCKET] ?? EMPTY_CONTACTS;
  const stakeholders = strategyContacts?.[STAKEHOLDER_BUCKET] ?? EMPTY_CONTACTS;

  const validContractors = contractors.filter((c) => (c.name ?? "").trim());
  const validRetailers = retailers.filter((c) => (c.name ?? "").trim());
  const validStakeholders = stakeholders.filter((c) => (c.name ?? "").trim());
  const selectedCampObjs = camps.filter((c) => selectedCamps.includes(c.id));

  const isStarred = (key: string) => starred.includes(key);
  const prioritize = <T,>(items: T[], keyFn: (item: T) => string): T[] =>
    [...items].sort((a, b) => Number(isStarred(keyFn(b))) - Number(isStarred(keyFn(a))));

  const orderedCamps = prioritize(selectedCampObjs, (c) => `camp:${c.id}`);
  const orderedContractors = prioritize(validContractors, (c) => `contractor:${c.id}`);
  const orderedRetailers = prioritize(validRetailers, (c) => `retailer:${c.id}`);
  const orderedStakeholders = prioritize(validStakeholders, (c) => `stakeholder:${c.id}`);

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

  const update = (key: string, fieldId: string, value: string) => setReview(clusterId, key, { [fieldId]: value });

  const nothingPlanned =
    orderedCamps.length === 0 &&
    orderedContractors.length === 0 &&
    orderedRetailers.length === 0 &&
    orderedStakeholders.length === 0;

  const contactLine = (c: ContactEntry) =>
    [c.role, c.area, c.phone, c.brandPreference ? `Currently: ${c.brandPreference}` : ""].filter(Boolean).join(" · ");

  return (
    <AppShell
      bottom={<BottomNav />}
      header={<StageHeader eyebrow="REVIEW ENGAGEMENT" title="Plan Review" backTo="/plan" />}
    >
      <div className="space-y-5 px-4 py-5 pb-24">
        <div>
          <button
            type="button"
            onClick={() => navigate({ to: "/plan" })}
            className="mb-2 flex items-center gap-1.5 text-[11px] text-muted-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to plans
          </button>
          <h2 className="font-serif text-xl leading-tight text-foreground">
            Cluster: <span className="text-critical">{cluster.name}</span>
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prioritized engagements for this cluster. Prep before each meeting and capture outcomes after.
          </p>
        </div>

        {nothingPlanned && (
          <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nothing planned yet for this cluster. Add events, contractors, retailers or stakeholders first.
          </p>
        )}

        {orderedCamps.length > 0 && (
          <Section icon={<CalendarDays className="h-4 w-4 text-blue-700" />} iconBg="bg-blue-50" title="Events & camps">
            <div className="space-y-3">
              {orderedCamps.map((c) => {
                const key = `camp:${c.id}`;
                return (
                  <ReviewCard
                    key={key}
                    title={c.label}
                    subtitle={c.description}
                    starred={isStarred(key)}
                    enablers={EVENT_ENABLERS}
                    questions={EVENT_QUESTIONS}
                    values={reviews[key] ?? {}}
                    onChange={(fid, v) => update(key, fid, v)}
                  />
                );
              })}
            </div>
          </Section>
        )}

        {orderedContractors.length > 0 && (
          <Section icon={<HardHat className="h-4 w-4 text-green-700" />} iconBg="bg-green-50" title="Contractors">
            <ReviewCard
              title={`${orderedContractors.length} contractor${orderedContractors.length > 1 ? "s" : ""} to engage`}
              subtitle="Consolidated review for all contractors planned this cycle."
              starred={isStarred("group:contractors")}
              contacts={orderedContractors.map((c) => ({
                name: c.name,
                line: contactLine(c),
                starred: isStarred(`contractor:${c.id}`),
              }))}
              enablers={CONTRACTOR_ENABLERS}
              questions={CONTRACTOR_QUESTIONS}
              values={reviews["group:contractors"] ?? {}}
              onChange={(fid, v) => update("group:contractors", fid, v)}
            />
          </Section>
        )}

        {orderedRetailers.length > 0 && (
          <Section icon={<Building2 className="h-4 w-4 text-amber-700" />} iconBg="bg-amber-50" title="Retailers">
            <ReviewCard
              title={`${orderedRetailers.length} retailer${orderedRetailers.length > 1 ? "s" : ""} to engage`}
              subtitle="Consolidated review for all retailers planned this cycle."
              starred={isStarred("group:retailers")}
              contacts={orderedRetailers.map((c) => ({
                name: c.name,
                line: contactLine(c),
                starred: isStarred(`retailer:${c.id}`),
              }))}
              enablers={RETAILER_ENABLERS}
              questions={RETAILER_QUESTIONS}
              values={reviews["group:retailers"] ?? {}}
              onChange={(fid, v) => update("group:retailers", fid, v)}
            />
          </Section>
        )}

        {orderedStakeholders.length > 0 && (
          <Section icon={<UserCheck className="h-4 w-4 text-red-800" />} iconBg="bg-red-50" title="Stakeholders">
            <ReviewCard
              title={`${orderedStakeholders.length} stakeholder${orderedStakeholders.length > 1 ? "s" : ""} to engage`}
              subtitle="Consolidated review for all stakeholders planned this cycle."
              starred={isStarred("group:stakeholders")}
              contacts={orderedStakeholders.map((c) => ({
                name: c.name,
                line: contactLine(c),
                starred: isStarred(`stakeholder:${c.id}`),
              }))}
              enablers={STAKEHOLDER_ENABLERS}
              questions={STAKEHOLDER_QUESTIONS}
              values={reviews["group:stakeholders"] ?? {}}
              onChange={(fid, v) => update("group:stakeholders", fid, v)}
            />
          </Section>
        )}
      </div>
    </AppShell>
  );
}

/* ── Section ── */
function Section({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-center gap-2">
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg", iconBg)}>{icon}</div>
        <h3 className="font-serif text-base text-foreground">{title}</h3>
      </div>
      {children}
    </section>
  );
}

type ContactLine = { name: string; line: string; starred?: boolean };

/* ── ReviewCard ── */
function ReviewCard({
  title,
  subtitle,
  starred,
  enablers,
  questions,
  values,
  onChange,
  contacts,
}: {
  title: string;
  subtitle?: string;
  starred?: boolean;
  enablers: Enabler[];
  questions: Question[];
  values: ReviewEntry;
  onChange: (fieldId: string, value: string) => void;
  contacts?: ContactLine[];
}) {
  const [open, setOpen] = useState(false);
  const [enablersOpen, setEnablersOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [activeEnabler, setActiveEnabler] = useState<Enabler | null>(null);

  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card", starred ? "border-amber-400" : "border-border")}>
      {/* Card header — tap to expand/collapse */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="font-serif text-sm text-foreground">{title}</p>
          {subtitle && <p className="mt-0.5 text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          {starred && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Priority
            </span>
          )}
          <ChevronDown
            className={cn("h-4 w-4 shrink-0 transition-transform text-muted-foreground", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="space-y-0 divide-y divide-border px-4 py-3">
          {/* Contacts list */}
          {contacts && contacts.length > 0 && (
            <div className="pb-3">
              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Planned ({contacts.length})
              </p>
              <ul className="divide-y divide-border rounded-xl border border-border bg-background">
                {contacts.map((c, i) => (
                  <li key={i} className="flex items-start justify-between gap-2 px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[12px] font-medium text-foreground">{c.name}</p>
                      {c.line && <p className="truncate text-[10.5px] text-muted-foreground">{c.line}</p>}
                    </div>
                    {c.starred && <Star className="mt-0.5 h-3 w-3 shrink-0 fill-amber-500 text-amber-500" />}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Enablers — collapsible */}
          <div className="py-3">
            <button
              type="button"
              onClick={() => setEnablersOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5">
                <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-700">
                  Enablers before meeting
                </p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", enablersOpen && "rotate-180")}
              />
            </button>
            {enablersOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2">
                {enablers.map((e, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActiveEnabler(e)}
                    className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-2.5 py-2 text-left transition hover:bg-amber-50"
                  >
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-700" />
                    <div className="min-w-0">
                      <p className="text-[11.5px] font-medium leading-tight text-foreground">{e.label}</p>
                      <p className="mt-0.5 line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                        {e.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Review post meeting — collapsible */}
          <div className="pt-3">
            <button
              type="button"
              onClick={() => setReviewOpen((o) => !o)}
              className="flex w-full items-center justify-between gap-2"
            >
              <div className="flex items-center gap-1.5">
                <ClipboardCheck className="h-3.5 w-3.5 text-green-700" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-green-700">
                  Review post meeting
                </p>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", reviewOpen && "rotate-180")}
              />
            </button>
            {reviewOpen && (
              <div className="mt-2 space-y-2.5">
                {questions.map((q) => (
                  <div key={q.id}>
                    <label className="mb-1 block text-[11px] font-medium text-foreground/80">{q.label}</label>
                    {q.type === "textarea" ? (
                      <textarea
                        value={values[q.id] ?? ""}
                        onChange={(e) => onChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        rows={2}
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                      />
                    ) : (
                      <input
                        type={q.type === "number" ? "number" : "text"}
                        value={values[q.id] ?? ""}
                        onChange={(e) => onChange(q.id, e.target.value)}
                        placeholder={q.placeholder}
                        className="w-full rounded-xl border border-border bg-background px-2.5 py-1.5 text-xs"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeEnabler && <EnablerModal enabler={activeEnabler} onClose={() => setActiveEnabler(null)} />}
    </div>
  );
}

/* ── EnablerModal ── */
function EnablerModal({ enabler, onClose }: { enabler: Enabler; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 sm:items-center" onClick={onClose}>
      <div
        className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <p className="font-serif text-base text-foreground">{enabler.label}</p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">{enabler.description}</p>
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
        <ul className="divide-y divide-border">
          {enabler.files.map((f, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
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
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[11px] text-foreground hover:bg-muted"
              >
                <Download className="h-3 w-3" /> Open
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
